package provisioning

import (
	"context"
	"log/slog"
	"net/http"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	"k8s.io/apiserver/pkg/endpoints/request"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	provisioning "github.com/grafana/grafana/pkg/apis/provisioning/v0alpha1"
	"github.com/grafana/grafana/pkg/registry/apis/provisioning/auth"
	"github.com/grafana/grafana/pkg/registry/apis/provisioning/resources"
)

// This only works for github right now
type webhookConnector struct {
	client         auth.BackgroundIdentityService
	getter         Getter
	logger         *slog.Logger
	resourceClient *resources.ClientFactory
}

func (*webhookConnector) New() runtime.Object {
	// This is added as the "ResponseType" regardless what ProducesObject() returns
	return &provisioning.WebhookResponse{}
}

func (*webhookConnector) Destroy() {}

func (*webhookConnector) NamespaceScoped() bool {
	return true
}

func (*webhookConnector) GetSingularName() string {
	return "WebhookResponse"
}

func (*webhookConnector) ProducesMIMETypes(verb string) []string {
	return []string{"application/json"}
}

func (*webhookConnector) ProducesObject(verb string) any {
	return &provisioning.WebhookResponse{}
}

func (*webhookConnector) ConnectMethods() []string {
	return []string{
		http.MethodPost,
		http.MethodGet, // only useful for browser testing, should be removed
	}
}

func (*webhookConnector) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}

func (c *webhookConnector) Connect(ctx context.Context, name string, opts runtime.Object, responder rest.Responder) (http.Handler, error) {
	namespace := request.NamespaceValue(ctx)
	id, err := c.client.WorkerIdentity(ctx, namespace)
	if err != nil {
		return nil, err
	}

	// Get the webhook with the worker identity (since the request user is likely anonymous)
	hook, err := c.getter.GetWebhook(identity.WithRequester(ctx, id), name)
	if err != nil {
		return nil, err
	}

	logger := c.logger.With("namespace", namespace, "name", name)

	return hook.Handle(ctx, logger, responder), nil
}

var (
	_ rest.Storage              = (*webhookConnector)(nil)
	_ rest.Connecter            = (*webhookConnector)(nil)
	_ rest.Scoper               = (*webhookConnector)(nil)
	_ rest.SingularNameProvider = (*webhookConnector)(nil)
	_ rest.StorageMetadata      = (*webhookConnector)(nil)
)