package provisioning

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/registry/apis/provisioning/auth"
	"github.com/grafana/grafana/pkg/registry/apis/provisioning/repository"
	"github.com/grafana/grafana/pkg/services/rendering"
	"github.com/grafana/grafana/pkg/storage/unified/blob"
)

// Render utility -- used by webhook service to create preview images
type renderer struct {
	render     rendering.Service
	blobstore  blob.PublicBlobStore
	identities auth.BackgroundIdentityService
}

func (r *renderer) IsAvailable(ctx context.Context) bool {
	return r.render != nil && r.render.IsAvailable(ctx) && r.blobstore.IsAvailable()
}

func (r *renderer) RenderDashboardPreview(ctx context.Context, repo repository.Repository, path string, ref string) (string, error) {
	cfg := repo.Config()

	// Get a worker identity
	id, err := r.identities.WorkerIdentity(ctx, cfg.Namespace)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("admin/provisioning/%s/dashboard/preview/%s?kiosk&ref=%s", cfg.Name, path, ref)
	// fmt.Printf("RENDER: http://localhost:3000/render/%s\n", url)

	renderContext := identity.WithRequester(context.Background(), id)
	result, err := r.render.Render(renderContext, rendering.RenderPNG, rendering.Opts{
		CommonOpts: rendering.CommonOpts{
			Path: url,
			AuthOpts: rendering.AuthOpts{
				OrgID:   1, // TODO!!!, use the worker identity
				UserID:  1,
				OrgRole: identity.RoleAdmin,
			},
			TimeoutOpts: rendering.TimeoutOpts{
				Timeout: time.Second * 30,
			},
		},
		Theme:  models.ThemeDark, // from config?
		Width:  1024,
		Height: -1, // full page height
	}, nil)
	if err != nil {
		return "", err
	}

	ext := filepath.Ext(result.FilePath)
	body, err := os.ReadFile(result.FilePath)
	if err != nil {
		return "", err
	}

	return r.blobstore.SaveBlob(ctx, cfg.Namespace, ext, body, map[string]string{
		"repo": cfg.Name,
		"path": path, // only used when saving in GCS/S3++
		"ref":  ref,
	})
}