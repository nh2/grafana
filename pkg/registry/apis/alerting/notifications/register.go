package notifications

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/authorization/authorizer"
	"k8s.io/apiserver/pkg/registry/rest"
	genericapiserver "k8s.io/apiserver/pkg/server"
	"k8s.io/kube-openapi/pkg/common"
	"k8s.io/kube-openapi/pkg/spec3"

	notificationsModels "github.com/grafana/grafana/pkg/apis/alerting_notifications/v0alpha1"
	receiver "github.com/grafana/grafana/pkg/registry/apis/alerting/notifications/receiver"
	"github.com/grafana/grafana/pkg/registry/apis/alerting/notifications/routing_tree"
	"github.com/grafana/grafana/pkg/registry/apis/alerting/notifications/template_group"
	timeInterval "github.com/grafana/grafana/pkg/registry/apis/alerting/notifications/timeinterval"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/apiserver/builder"
	"github.com/grafana/grafana/pkg/services/apiserver/endpoints/request"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/ngalert"
	ac "github.com/grafana/grafana/pkg/services/ngalert/accesscontrol"
	ngmodels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/setting"
)

var _ builder.APIGroupBuilder = (*NotificationsAPIBuilder)(nil)

// This is used just so wire has something unique to return
type NotificationsAPIBuilder struct {
	authz        accesscontrol.AccessControl
	receiverAuth receiver.AccessControlService
	ng           *ngalert.AlertNG
	namespacer   request.NamespaceMapper
	gv           schema.GroupVersion
}

func RegisterAPIService(
	features featuremgmt.FeatureToggles,
	apiregistration builder.APIRegistrar,
	cfg *setting.Cfg,
	ng *ngalert.AlertNG,
) *NotificationsAPIBuilder {
	if ng.IsDisabled() || !features.IsEnabledGlobally(featuremgmt.FlagAlertingApiServer) {
		return nil
	}
	builder := &NotificationsAPIBuilder{
		ng:           ng,
		namespacer:   request.GetNamespaceMapper(cfg),
		gv:           notificationsModels.SchemeGroupVersion,
		authz:        ng.Api.AccessControl,
		receiverAuth: ac.NewReceiverAccess[*ngmodels.Receiver](ng.Api.AccessControl, false),
	}
	apiregistration.RegisterAPI(builder)
	return builder
}

func (t *NotificationsAPIBuilder) GetGroupVersion() schema.GroupVersion {
	return t.gv
}

func (t *NotificationsAPIBuilder) InstallSchema(scheme *runtime.Scheme) error {
	err := notificationsModels.AddToScheme(scheme)
	if err != nil {
		return err
	}
	return scheme.SetVersionPriority(notificationsModels.SchemeGroupVersion)
}

func (t *NotificationsAPIBuilder) UpdateAPIGroupInfo(apiGroupInfo *genericapiserver.APIGroupInfo, opts builder.APIGroupOptions) error {
	addStorage := func(gvr schema.GroupVersionResource, s rest.Storage) {
		v, ok := apiGroupInfo.VersionedResourcesStorageMap[gvr.Version]
		if !ok {
			v = map[string]rest.Storage{}
			apiGroupInfo.VersionedResourcesStorageMap[gvr.Version] = v
		}
		v[gvr.Resource] = s
	}
	scheme := opts.Scheme
	optsGetter := opts.OptsGetter
	dualWriteBuilder := opts.DualWriteBuilder

	intervals, err := timeInterval.NewStorage(t.ng.Api.MuteTimings, t.namespacer, scheme, optsGetter, dualWriteBuilder)
	if err != nil {
		return fmt.Errorf("failed to initialize time-interval storage: %w", err)
	}
	addStorage(notificationsModels.TimeIntervalResourceInfo.GroupVersionResource(), intervals)

	recvStorage, err := receiver.NewStorage(t.ng.Api.ReceiverService, t.namespacer, scheme, optsGetter, dualWriteBuilder, t.ng.Api.ReceiverService)
	if err != nil {
		return fmt.Errorf("failed to initialize receiver storage: %w", err)
	}
	addStorage(notificationsModels.ReceiverResourceInfo.GroupVersionResource(), recvStorage)

	templ, err := template_group.NewStorage(t.ng.Api.Templates, t.namespacer, opts)
	if err != nil {
		return fmt.Errorf("failed to initialize templates group storage: %w", err)
	}
	addStorage(template_group.ResourceInfo.GroupVersionResource(), templ)

	routeStorage, err := routing_tree.NewStorage(t.ng.Api.Policies, t.namespacer)
	if err != nil {
		return fmt.Errorf("failed to initialize route storage: %w", err)
	}
	addStorage(notificationsModels.RouteResourceInfo.GroupVersionResource(), routeStorage)

	return nil
}

func (t *NotificationsAPIBuilder) GetOpenAPIDefinitions() common.GetOpenAPIDefinitions {
	return func(c common.ReferenceCallback) map[string]common.OpenAPIDefinition {
		result := make(map[string]common.OpenAPIDefinition)
		for s, definition := range template_group.GetOpenAPIDefinitions(c) {
			result[s] = definition
		}
		for s, definition := range notificationsModels.GetOpenAPIDefinitions(c) {
			result[s] = definition
		}
		return result
	}
}

func (t *NotificationsAPIBuilder) GetAPIRoutes() *builder.APIRoutes {
	return nil
}

// PostProcessOpenAPI is a hook to alter OpenAPI3 specification of the API server.
func (t *NotificationsAPIBuilder) PostProcessOpenAPI(oas *spec3.OpenAPI) (*spec3.OpenAPI, error) {
	// The plugin description
	oas.Info.Description = "Grafana Alerting Notification resources"

	// The root api URL
	root := "/apis/" + t.GetGroupVersion().String() + "/"

	// Hide the ability to list or watch across all tenants
	delete(oas.Paths.Paths, root+notificationsModels.ReceiverResourceInfo.GroupResource().Resource)
	delete(oas.Paths.Paths, root+notificationsModels.TimeIntervalResourceInfo.GroupResource().Resource)
	delete(oas.Paths.Paths, root+template_group.ResourceInfo.GroupResource().Resource)
	delete(oas.Paths.Paths, root+notificationsModels.RouteResourceInfo.GroupResource().Resource)

	// The root API discovery list
	sub := oas.Paths.Paths[root]
	if sub != nil && sub.Get != nil {
		sub.Get.Tags = []string{"API Discovery"} // sorts first in the list
	}
	return oas, nil
}

func (t *NotificationsAPIBuilder) GetAuthorizer() authorizer.Authorizer {
	return authorizer.AuthorizerFunc(
		func(ctx context.Context, a authorizer.Attributes) (authorizer.Decision, string, error) {
			switch a.GetResource() {
			case template_group.ResourceInfo.GroupResource().Resource:
				return template_group.Authorize(ctx, t.authz, a)
			case notificationsModels.TimeIntervalResourceInfo.GroupResource().Resource:
				return timeInterval.Authorize(ctx, t.authz, a)
			case notificationsModels.ReceiverResourceInfo.GroupResource().Resource:
				return receiver.Authorize(ctx, t.receiverAuth, a)
			case notificationsModels.RouteResourceInfo.GroupResource().Resource:
				return routing_tree.Authorize(ctx, t.authz, a)
			}
			return authorizer.DecisionNoOpinion, "", nil
		})
}
