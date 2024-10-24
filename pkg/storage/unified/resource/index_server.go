package resource

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"

	"github.com/grafana/grafana/pkg/setting"
	"github.com/prometheus/client_golang/prometheus"
	"google.golang.org/grpc"
)

type IndexServer struct {
	ResourceServer
	s     *server
	index *Index
	ws    *indexWatchServer
	log   *slog.Logger
	cfg   *setting.Cfg
}

func (is *IndexServer) Search(ctx context.Context, req *SearchRequest) (*SearchResponse, error) {
	results, err := is.index.Search(ctx, req.Tenant, req.Query, int(req.Limit), int(req.Offset))
	if err != nil {
		return nil, err
	}
	res := &SearchResponse{}
	for _, r := range results {
		resJsonBytes, err := json.Marshal(r)
		if err != nil {
			return nil, err
		}
		res.Items = append(res.Items, &ResourceWrapper{Value: resJsonBytes})
	}
	return res, nil
}

func (is *IndexServer) History(ctx context.Context, req *HistoryRequest) (*HistoryResponse, error) {
	return nil, nil
}

func (is *IndexServer) Origin(ctx context.Context, req *OriginRequest) (*OriginResponse, error) {
	return nil, nil
}

// Load the index
func (is *IndexServer) Load(ctx context.Context) error {
	is.index = NewIndex(is.s, Opts{}, is.cfg.IndexPath)
	err := is.index.Init(ctx)
	if err != nil {
		return err
	}
	return nil
}

// Watch resources for changes and update the index
func (is *IndexServer) Watch(ctx context.Context) error {
	rtList := fetchResourceTypes()
	for _, rt := range rtList {
		wr := &WatchRequest{
			Options: rt,
		}

		go func() {
			for {
				// blocking call
				err := is.s.Watch(wr, is.ws)
				if err != nil {
					is.log.Error("Error watching resource", "error", err)
				}
				is.log.Debug("Resource watch ended. Restarting watch")
			}
		}()
	}
	return nil
}

// Init sets the resource server on the index server
// so we can call the resource server from the index server
// TODO: a chicken and egg problem - index server needs the resource server but the resource server is created with the index server
func (is *IndexServer) Init(ctx context.Context, rs *server) error {
	is.s = rs
	is.ws = &indexWatchServer{
		is:      is,
		context: ctx,
	}
	return nil
}

func NewResourceIndexServer(cfg *setting.Cfg) ResourceIndexServer {
	logger := slog.Default().With("logger", "index-server")

	indexServer := &IndexServer{
		log: logger,
		cfg: cfg,
	}

	err := prometheus.Register(NewIndexMetrics(cfg.IndexPath, indexServer))
	if err != nil {
		logger.Warn("Failed to register index metrics", "error", err)
	}

	return indexServer
}

type ResourceIndexer interface {
	Index(ctx context.Context) (*Index, error)
}

type indexWatchServer struct {
	grpc.ServerStream
	context context.Context
	is      *IndexServer
}

func (f *indexWatchServer) Send(we *WatchEvent) error {
	if we.Type == WatchEvent_ADDED {
		return f.Add(we)
	}

	if we.Type == WatchEvent_DELETED {
		return f.Delete(we)
	}

	if we.Type == WatchEvent_MODIFIED {
		return f.Update(we)
	}

	return nil
}

func (f *indexWatchServer) RecvMsg(m interface{}) error {
	return nil
}

func (f *indexWatchServer) SendMsg(m interface{}) error {
	return errors.New("not implemented")
}

func (f *indexWatchServer) Context() context.Context {
	if f.context == nil {
		f.context = context.Background()
	}
	return f.context
}

func (f *indexWatchServer) Index() *Index {
	return f.is.index
}

func (f *indexWatchServer) Add(we *WatchEvent) error {
	data, err := getData(we.Resource)
	if err != nil {
		return err
	}
	err = f.Index().Index(f.context, data)
	if err != nil {
		return err
	}
	return nil
}

func (f *indexWatchServer) Delete(we *WatchEvent) error {
	rs, err := resource(we)
	if err != nil {
		return err
	}
	data, err := getData(rs)
	if err != nil {
		return err
	}
	err = f.Index().Delete(f.context, data.Uid, data.Key)
	if err != nil {
		return err
	}
	return nil
}

func (f *indexWatchServer) Update(we *WatchEvent) error {
	rs, err := resource(we)
	if err != nil {
		return err
	}
	data, err := getData(rs)
	if err != nil {
		return err
	}
	err = f.Index().Delete(f.context, data.Uid, data.Key)
	if err != nil {
		return err
	}
	err = f.Index().Index(f.context, data)
	if err != nil {
		return err
	}
	return nil
}

type Data struct {
	Key   *ResourceKey
	Value *ResourceWrapper
	Uid   string
}

func getData(wr *WatchEvent_Resource) (*Data, error) {
	r, err := NewIndexedResource(wr.Value)
	if err != nil {
		return nil, err
	}

	key := &ResourceKey{
		Group:     r.Group,
		Resource:  r.Kind,
		Namespace: r.Namespace,
		Name:      r.Name,
	}

	value := &ResourceWrapper{
		ResourceVersion: wr.Version,
		Value:           wr.Value,
	}
	return &Data{Key: key, Value: value, Uid: r.Uid}, nil
}

func resource(we *WatchEvent) (*WatchEvent_Resource, error) {
	rs := we.Resource
	if rs == nil || len(rs.Value) == 0 {
		// for updates/deletes
		rs = we.Previous
	}
	if rs == nil || len(rs.Value) == 0 {
		return nil, errors.New("resource not found")
	}
	return rs, nil
}