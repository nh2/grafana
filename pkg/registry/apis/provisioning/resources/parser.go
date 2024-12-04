package resources

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"

	"github.com/grafana/grafana/pkg/apimachinery/apis/common/v0alpha1"
	"github.com/grafana/grafana/pkg/apimachinery/utils"
	provisioning "github.com/grafana/grafana/pkg/apis/provisioning/v0alpha1"
	"github.com/grafana/grafana/pkg/registry/apis/provisioning/lint"
	"github.com/grafana/grafana/pkg/registry/apis/provisioning/repository"
)

var ErrNamespaceMismatch = errors.New("the file namespace does not match target namespace")

type FileParser struct {
	// client helper (for this namespace?)
	client     *DynamicClient
	kinds      KindsLookup
	repository *provisioning.Repository
}

func NewParser(repository *provisioning.Repository, client *DynamicClient, kinds KindsLookup) *FileParser {
	return &FileParser{
		repository: repository,
		client:     client,
		kinds:      kinds,
	}
}

type ParsedFile struct {
	// Original file Info
	Info *repository.FileInfo

	// Check for classic file types (dashboard.json, etc)
	Classic provisioning.ClassicFileType

	// Parsed contents
	Obj *unstructured.Unstructured
	// Metadata accessor for the file object
	Meta utils.GrafanaMetaAccessor

	// The Kind is defined in the file
	GVK *schema.GroupVersionKind
	// The Resource is found by mapping Kind to the right apiserver
	GVR *schema.GroupVersionResource
	// Client that can talk to this resource
	Client dynamic.ResourceInterface

	// The Existing object (same name)
	// ?? do we need/want the whole thing??
	Existing *unstructured.Unstructured

	// Create or Update
	Action provisioning.ResourceAction

	// The results from dry run
	DryRunResponse *unstructured.Unstructured

	// Optional lint issues
	Lint []provisioning.LintIssue

	// If we got some Errors
	Errors []error
}

func (p *FileParser) Parse(ctx context.Context, logger *slog.Logger, info *repository.FileInfo, validate bool) (parsed *ParsedFile, err error) {
	parsed = &ParsedFile{
		Info: info,
	}

	parsed.Obj, parsed.GVK, err = LoadYAMLOrJSON(bytes.NewBuffer(info.Data))
	if err != nil {
		logger.DebugContext(ctx, "failed to find GVK of the input data", "error", err)
		parsed.Obj, parsed.GVK, parsed.Classic, err = ReadClassicResource(ctx, logger, info)
		if err != nil {
			logger.DebugContext(ctx, "also failed to get GVK from fallback loader?", "error", err)
			return parsed, err
		}
	}

	parsed.Meta, err = utils.MetaAccessor(parsed.Obj)
	if err != nil {
		return nil, err
	}
	obj := parsed.Obj

	// Validate the namespace
	if obj.GetNamespace() != "" && obj.GetNamespace() != p.repository.GetNamespace() {
		parsed.Errors = append(parsed.Errors, ErrNamespaceMismatch)
	}

	obj.SetNamespace(p.repository.GetNamespace())
	parsed.Meta.SetRepositoryInfo(&utils.ResourceRepositoryInfo{
		Name:      p.repository.GetName(),
		Path:      joinPathWithRef(info.Path, info.Ref),
		Hash:      info.Hash,
		Timestamp: nil, // ???&info.Modified.Time,
	})

	// When name is missing use the file path as the k8s name
	if obj.GetName() == "" {
		name := filepath.Base(info.Path)
		suffix := filepath.Ext(name)
		if suffix != "" {
			name = strings.TrimSuffix(name, suffix)
		}
		obj.SetName(name)
	}

	// We can not do anything more if no kind is defined
	if parsed.GVK == nil {
		return parsed, nil
	}

	gvr, ok := p.kinds.Resource(*parsed.GVK)
	if !ok {
		return parsed, nil
	}

	parsed.GVR = &gvr
	parsed.Client = p.client.Resource(gvr)
	if !validate {
		return parsed, nil
	}

	if true { // lint
		raw := info.Data
		if parsed.Classic == provisioning.ClassicDashboard {
			raw, err = json.MarshalIndent(parsed.Obj, "", "  ") // indent so it is not all on one line
			if err != nil {
				return parsed, err
			}
		}
		linter := lint.NewDashboardLinter()
		// TODO: pass the config file
		parsed.Lint, err = linter.Lint(ctx, raw)
		if err != nil {
			parsed.Errors = append(parsed.Errors, err)
		}
	}

	if parsed.Client == nil {
		parsed.Errors = append(parsed.Errors, fmt.Errorf("unable to find client"))
		return parsed, nil
	}

	// Dry run CREATE or UPDATE
	parsed.Existing, _ = parsed.Client.Get(ctx, obj.GetName(), metav1.GetOptions{})
	if parsed.Existing == nil {
		parsed.Action = provisioning.ResourceActionCreate
		parsed.DryRunResponse, err = parsed.Client.Create(ctx, obj, metav1.CreateOptions{
			DryRun: []string{"All"},
		})
	} else {
		parsed.Action = provisioning.ResourceActionUpdate
		parsed.DryRunResponse, err = parsed.Client.Update(ctx, obj, metav1.UpdateOptions{
			DryRun: []string{"All"},
		})
	}
	if err != nil {
		parsed.Errors = append(parsed.Errors, err)
	}
	return parsed, nil
}

func (f *ParsedFile) ToSaveBytes() ([]byte, error) {
	// TODO... should use the validated one?
	obj := f.Obj.Object
	delete(obj, "metadata")

	switch filepath.Ext(f.Info.Path) {
	// JSON pretty print
	case ".json":
		return json.MarshalIndent(obj, "", "  ")

	// Write the value as yaml
	case ".yaml", ".yml":
		return yaml.Marshal(obj)

	default:
		return nil, fmt.Errorf("unexpected format")
	}
}

func (f *ParsedFile) AsResourceWrapper() *provisioning.ResourceWrapper {
	info := f.Info
	res := provisioning.ResourceObjects{
		Type: provisioning.ResourceType{
			Classic: f.Classic,
		},
		Action: f.Action,
	}

	if f.GVK != nil {
		res.Type.Group = f.GVK.Group
		res.Type.Version = f.GVK.Version
		res.Type.Kind = f.GVK.Kind
	}

	// The resource (GVR) is derived from the kind (GVK)
	if f.GVR != nil {
		res.Type.Resource = f.GVR.Resource
	}

	if f.Obj != nil {
		res.File = v0alpha1.Unstructured{Object: f.Obj.Object}
	}
	if f.Existing != nil {
		res.Existing = v0alpha1.Unstructured{Object: f.Existing.Object}
	}
	if f.DryRunResponse != nil {
		res.DryRun = v0alpha1.Unstructured{Object: f.DryRunResponse.Object}
	}
	wrap := &provisioning.ResourceWrapper{
		Path:      info.Path,
		Ref:       info.Ref,
		Hash:      info.Hash,
		Timestamp: info.Modified,
		Resource:  res,
		Lint:      f.Lint,
	}
	for _, err := range f.Errors {
		wrap.Errors = append(wrap.Errors, err.Error())
	}
	return wrap
}

// Matches the frontend logic that pulls ref from the path
// public/app/features/dashboard-scene/saving/SaveProvisionedDashboard.tsx#L32
func joinPathWithRef(p, r string) string {
	if r == "" {
		return p
	}
	return fmt.Sprintf("%s#%s", p, r)
}