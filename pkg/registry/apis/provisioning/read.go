package provisioning

import (
	"context"
	"net/http"
	"strings"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	provisioning "github.com/grafana/grafana/pkg/apis/provisioning/v0alpha1"
)

type readConnector struct {
	getter RepoGetter
}

func (*readConnector) New() runtime.Object {
	// This is added as the "ResponseType" regardless what ProducesObject() returns
	return &provisioning.ResourceWrapper{}
}

func (*readConnector) Destroy() {}

func (*readConnector) NamespaceScoped() bool {
	return true
}

func (*readConnector) GetSingularName() string {
	return "Resource"
}

func (*readConnector) ProducesMIMETypes(verb string) []string {
	return []string{"application/json"}
}

func (*readConnector) ProducesObject(verb string) any {
	return &provisioning.ResourceWrapper{}
}

func (*readConnector) ConnectMethods() []string {
	return []string{http.MethodGet}
}

func (*readConnector) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, true, "" // true adds the {path} component
}

func (s *readConnector) Connect(ctx context.Context, name string, opts runtime.Object, responder rest.Responder) (http.Handler, error) {
	repo, err := s.getter.GetRepository(ctx, name)
	if err != nil {
		return nil, err
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idx := strings.Index(r.URL.Path, "/"+name+"/read")
		filePath := strings.TrimLeft(r.URL.Path[idx+len(name+"/read")+2:], "/")
		if filePath == "" {
			responder.Error(errors.NewBadRequest("missing path"))
			return
		}
		commit := r.URL.Query().Get("commit")

		rsp, err := repo.ReadResource(ctx, filePath, commit)
		if err != nil {
			responder.Error(err)
		} else {
			responder.Object(200, rsp)
		}
	}), nil
}

var (
	_ rest.Storage              = (*readConnector)(nil)
	_ rest.Connecter            = (*readConnector)(nil)
	_ rest.Scoper               = (*readConnector)(nil)
	_ rest.SingularNameProvider = (*readConnector)(nil)
	_ rest.StorageMetadata      = (*readConnector)(nil)
)