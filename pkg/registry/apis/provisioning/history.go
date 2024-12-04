package provisioning

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	provisioning "github.com/grafana/grafana/pkg/apis/provisioning/v0alpha1"
)

type historySubresource struct {
	repoGetter Getter
	logger     *slog.Logger
}

func (h *historySubresource) New() runtime.Object {
	// This is added as the "ResponseType" regardless what ProducesObject() returns
	return &provisioning.HistoryList{}
}

func (h *historySubresource) Destroy() {}

func (h *historySubresource) NamespaceScoped() bool {
	return true
}

func (h *historySubresource) GetSingularName() string {
	return "History"
}

func (h *historySubresource) ProducesMIMETypes(verb string) []string {
	return []string{"application/json"}
}

func (h *historySubresource) ProducesObject(verb string) runtime.Object {
	return &provisioning.HistoryList{}
}

func (h *historySubresource) ConnectMethods() []string {
	return []string{http.MethodGet}
}

func (h *historySubresource) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, true, "" // true adds the {path} component
}

func (h *historySubresource) Connect(ctx context.Context, name string, opts runtime.Object, responder rest.Responder) (http.Handler, error) {
	logger := h.logger.With("repository_name", name)
	repo, err := h.repoGetter.GetRepository(ctx, name)
	if err != nil {
		logger.DebugContext(ctx, "failed to find repository", "error", err)
		return nil, err
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		ref := query.Get("ref")
		logger = logger.With("ref", ref)
		ctx := r.Context()

		var filePath string
		prefix := fmt.Sprintf("/%s/history/", name)
		idx := strings.Index(r.URL.Path, prefix)
		if idx != -1 {
			filePath = r.URL.Path[idx+len(prefix):]
		}

		logger = logger.With("path", filePath)

		commits, err := repo.History(ctx, logger, filePath, ref)
		if err != nil {
			logger.DebugContext(ctx, "failed to get history", "error", err)
			responder.Error(err)
			return
		}

		responder.Object(http.StatusOK, &provisioning.HistoryList{Items: commits})
	}), nil
}