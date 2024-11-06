package remotecache

import (
	"os"
	"testing"

	"github.com/grafana/grafana/pkg/setting"
)

func TestIntegrationMemcachedCacheStorage(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	u, ok := os.LookupEnv("MEMCACHED_HOSTS")
	if !ok || u == "" {
		t.Skip("No Memcached hosts provided")
	}

	opts := &setting.RemoteCacheSettings{Name: memcachedCacheType, ConnStr: u}
	client := createTestClient(t, &setting.Cfg{RemoteCacheOptions: opts}, nil, nil)
	runTestsForClient(t, client)
}
