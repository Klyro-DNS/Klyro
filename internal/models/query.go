package models

import (
	"sync"
	"time"
)

type QueryEntry struct {
	Timestamp time.Time `json:"timestamp"`
	ClientIP  string    `json:"client_ip"`
	Domain    string    `json:"domain"`
	Type      string    `json:"type"`
	Response  string    `json:"response"`
	CacheHit  bool      `json:"cache_hit"`
}

type ClientInfo struct {
	IP           string           `json:"ip"`
	LastSeen     time.Time        `json:"last_seen"`
	TotalQueries int64            `json:"total_queries"`
	Queries      map[string]int64 `json:"queries"`
}

type QueryStats struct {
	TotalClients int              `json:"total_clients"`
	TotalQueries int64            `json:"total_queries"`
	FirstQuery   time.Time        `json:"first_query"`
	LastQuery    time.Time        `json:"last_query"`
	QueryTypes   map[string]int64 `json:"query_types"`
}

type QueryTracker struct {
	mu      sync.RWMutex
	entries []QueryEntry
	maxSize int
	clients map[string]*ClientInfo
}

func NewQueryTracker(maxSize int) *QueryTracker {
	if maxSize <= 0 {
		maxSize = 10000
	}
	return &QueryTracker{
		entries: make([]QueryEntry, 0, maxSize),
		maxSize: maxSize,
		clients: make(map[string]*ClientInfo),
	}
}

func (qt *QueryTracker) Record(entry QueryEntry) {
	qt.mu.Lock()
	defer qt.mu.Unlock()

	qt.entries = append(qt.entries, entry)
	if len(qt.entries) > qt.maxSize {
		qt.entries = qt.entries[len(qt.entries)-qt.maxSize:]
	}

	ci, exists := qt.clients[entry.ClientIP]
	if !exists {
		ci = &ClientInfo{
			IP:      entry.ClientIP,
			Queries: make(map[string]int64),
		}
		qt.clients[entry.ClientIP] = ci
	}
	ci.LastSeen = entry.Timestamp
	ci.TotalQueries++
	ci.Queries[entry.Type]++
}

func (qt *QueryTracker) GetClients() []ClientInfo {
	qt.mu.RLock()
	defer qt.mu.RUnlock()

	clients := make([]ClientInfo, 0, len(qt.clients))
	for _, c := range qt.clients {
		clients = append(clients, *c)
	}
	return clients
}

func (qt *QueryTracker) GetClient(ip string) (*ClientInfo, bool) {
	qt.mu.RLock()
	defer qt.mu.RUnlock()
	c, ok := qt.clients[ip]
	if !ok {
		return nil, false
	}
	copy := *c
	return &copy, true
}

func (qt *QueryTracker) GetRecentQueries(limit int) []QueryEntry {
	qt.mu.RLock()
	defer qt.mu.RUnlock()

	if limit <= 0 || limit > len(qt.entries) {
		limit = len(qt.entries)
	}

	start := len(qt.entries) - limit
	result := make([]QueryEntry, limit)
	copy(result, qt.entries[start:])
	return result
}

func (qt *QueryTracker) GetQueriesByClient(ip string, limit int) []QueryEntry {
	qt.mu.RLock()
	defer qt.mu.RUnlock()

	var result []QueryEntry
	for i := len(qt.entries) - 1; i >= 0 && len(result) < limit; i-- {
		if qt.entries[i].ClientIP == ip {
			result = append(result, qt.entries[i])
		}
	}
	return result
}

func (qt *QueryTracker) Stats() QueryStats {
	qt.mu.RLock()
	defer qt.mu.RUnlock()

	stats := QueryStats{
		TotalClients: len(qt.clients),
		TotalQueries: int64(len(qt.entries)),
	}

	if len(qt.entries) > 0 {
		stats.FirstQuery = qt.entries[0].Timestamp
		stats.LastQuery = qt.entries[len(qt.entries)-1].Timestamp
	}

	typeCount := make(map[string]int64)
	for _, e := range qt.entries {
		typeCount[e.Type]++
	}
	stats.QueryTypes = typeCount

	return stats
}
