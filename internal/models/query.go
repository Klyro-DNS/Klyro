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
	Blocked   bool      `json:"blocked"`
	Latency   int64     `json:"latency_ms"`
}

type ClientInfo struct {
	IP           string           `json:"ip"`
	LastSeen     time.Time        `json:"last_seen"`
	TotalQueries int64            `json:"total_queries"`
	Queries      map[string]int64 `json:"queries"`
}

type HourlyStats struct {
	Hour      string `json:"hour"`
	Queries   int64  `json:"queries"`
	Blocked   int64  `json:"blocked"`
	CacheHits int64  `json:"cache_hits"`
}

type DashboardStats struct {
	TotalQueries   int64         `json:"total_queries"`
	TotalBlocked   int64         `json:"total_blocked"`
	TotalCached    int64         `json:"total_cached"`
	CacheHitRate   float64       `json:"cache_hit_rate"`
	BlockedRate    float64       `json:"blocked_rate"`
	AvgLatency     float64       `json:"avg_latency"`
	ActiveClients  int           `json:"active_clients"`
	ActiveZones    int           `json:"active_zones"`
	QPS            float64       `json:"qps"`
	Hourly         []HourlyStats `json:"hourly"`
	QueryTypes     map[string]int64 `json:"query_types"`
	TopDomains     []DomainCount `json:"top_domains"`
	TopClients     []ClientCount `json:"top_clients"`
}

type DomainCount struct {
	Domain string `json:"domain"`
	Count  int64  `json:"count"`
}

type ClientCount struct {
	IP    string `json:"ip"`
	Count int64  `json:"count"`
}

type QueryTracker struct {
	mu         sync.RWMutex
	entries    []QueryEntry
	maxSize    int
	clients    map[string]*ClientInfo
	domains    map[string]int64
	totalHits  int64
	totalBlocked int64
	totalCached  int64
	totalLatency int64
	queryCount  int64
}

func NewQueryTracker(maxSize int) *QueryTracker {
	if maxSize <= 0 {
		maxSize = 50000
	}
	return &QueryTracker{
		entries: make([]QueryEntry, 0, maxSize),
		maxSize: maxSize,
		clients: make(map[string]*ClientInfo),
		domains: make(map[string]int64),
	}
}

func (qt *QueryTracker) Record(entry QueryEntry) {
	qt.mu.Lock()
	defer qt.mu.Unlock()

	qt.entries = append(qt.entries, entry)
	if len(qt.entries) > qt.maxSize {
		qt.entries = qt.entries[len(qt.entries)-qt.maxSize:]
	}

	qt.queryCount++
	qt.totalLatency += entry.Latency
	if entry.CacheHit {
		qt.totalCached++
	}
	if entry.Blocked {
		qt.totalBlocked++
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

	qt.domains[entry.Domain]++
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

func (qt *QueryTracker) GetDashboardStats(activeZones int) DashboardStats {
	qt.mu.RLock()
	defer qt.mu.RUnlock()

	stats := DashboardStats{
		ActiveClients: len(qt.clients),
		ActiveZones:   activeZones,
		QueryTypes:    make(map[string]int64),
	}

	if qt.queryCount > 0 {
		stats.CacheHitRate = float64(qt.totalCached) / float64(qt.queryCount) * 100
		stats.BlockedRate = float64(qt.totalBlocked) / float64(qt.queryCount) * 100
		stats.AvgLatency = float64(qt.totalLatency) / float64(qt.queryCount)
	}

	// Hourly breakdown (last 24h)
	now := time.Now()
	hourly := make(map[int]*HourlyStats)
	for i := 0; i < 24; i++ {
		h := now.Add(-time.Duration(i) * time.Hour)
		key := h.Format("15:00")
		hourly[i] = &HourlyStats{Hour: key}
	}

	for _, e := range qt.entries {
		if now.Sub(e.Timestamp) > 24*time.Hour {
			continue
		}
		hourIndex := int(now.Sub(e.Timestamp).Hours())
		if hourIndex >= 0 && hourIndex < 24 {
			hourly[hourIndex].Queries++
			if e.Blocked {
				hourly[hourIndex].Blocked++
			}
			if e.CacheHit {
				hourly[hourIndex].CacheHits++
			}
		}
	}

	stats.Hourly = make([]HourlyStats, 24)
	for i := 0; i < 24; i++ {
		stats.Hourly[23-i] = *hourly[i]
	}

	// Total stats
	stats.TotalQueries = qt.queryCount
	stats.TotalBlocked = qt.totalBlocked
	stats.TotalCached = qt.totalCached

	// QPS (queries in last minute / 60)
	var recentCount int64
	for i := len(qt.entries) - 1; i >= 0; i-- {
		if now.Sub(qt.entries[i].Timestamp) > time.Minute {
			break
		}
		recentCount++
	}
	stats.QPS = float64(recentCount) / 60.0

	// Query types
	for _, e := range qt.entries {
		stats.QueryTypes[e.Type]++
	}

	// Top domains
	domainCounts := make([]DomainCount, 0, len(qt.domains))
	for d, c := range qt.domains {
		domainCounts = append(domainCounts, DomainCount{Domain: d, Count: c})
	}
	// Simple sort top 10
	for i := 0; i < len(domainCounts) && i < 10; i++ {
		for j := i + 1; j < len(domainCounts); j++ {
			if domainCounts[j].Count > domainCounts[i].Count {
				domainCounts[i], domainCounts[j] = domainCounts[j], domainCounts[i]
			}
		}
	}
	if len(domainCounts) > 10 {
		domainCounts = domainCounts[:10]
	}
	stats.TopDomains = domainCounts

	// Top clients
	clientCounts := make([]ClientCount, 0, len(qt.clients))
	for _, c := range qt.clients {
		clientCounts = append(clientCounts, ClientCount{IP: c.IP, Count: c.TotalQueries})
	}
	for i := 0; i < len(clientCounts) && i < 10; i++ {
		for j := i + 1; j < len(clientCounts); j++ {
			if clientCounts[j].Count > clientCounts[i].Count {
				clientCounts[i], clientCounts[j] = clientCounts[j], clientCounts[i]
			}
		}
	}
	if len(clientCounts) > 10 {
		clientCounts = clientCounts[:10]
	}
	stats.TopClients = clientCounts

	return stats
}
