package api

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"

	"github.com/klyro/dns/internal/config"
	"github.com/klyro/dns/internal/models"
)

//go:embed dashboard/*
var dashboardFS embed.FS

type Router struct {
	Store     *models.Store
	ConfigDir string
	Auth      *AuthManager
	Tracker   *models.QueryTracker
}

func NewRouter(store *models.Store, configDir string, auth *AuthManager, tracker *models.QueryTracker) *Router {
	return &Router{
		Store:     store,
		ConfigDir: configDir,
		Auth:      auth,
		Tracker:   tracker,
	}
}

func (r *Router) Setup() http.Handler {
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("POST /api/login", r.handleLogin)
	mux.HandleFunc("POST /api/logout", r.handleLogout)
	mux.HandleFunc("GET /api/auth", r.handleCheckAuth)

	// Protected API routes
	mux.Handle("GET /api/zones", r.Auth.RequireAuth(http.HandlerFunc(r.listZones)))
	mux.Handle("POST /api/zones", r.Auth.RequireAuth(http.HandlerFunc(r.createZone)))
	mux.Handle("DELETE /api/zones/{name}", r.Auth.RequireAuth(http.HandlerFunc(r.deleteZone)))
	mux.Handle("GET /api/zones/{name}/records", r.Auth.RequireAuth(http.HandlerFunc(r.listRecords)))
	mux.Handle("POST /api/zones/{name}/records", r.Auth.RequireAuth(http.HandlerFunc(r.createRecord)))
	mux.Handle("DELETE /api/zones/{name}/records/{record}", r.Auth.RequireAuth(http.HandlerFunc(r.deleteRecord)))

	// Client tracking routes
	mux.Handle("GET /api/clients", r.Auth.RequireAuth(http.HandlerFunc(r.listClients)))
	mux.Handle("GET /api/clients/{ip}", r.Auth.RequireAuth(http.HandlerFunc(r.getClient)))
	mux.Handle("GET /api/queries", r.Auth.RequireAuth(http.HandlerFunc(r.listQueries)))
	mux.Handle("GET /api/stats", r.Auth.RequireAuth(http.HandlerFunc(r.getStats)))

	// Dashboard (static files, no auth required for the HTML itself)
	subFS, _ := fs.Sub(dashboardFS, "dashboard")
	mux.Handle("GET /", http.FileServer(http.FS(subFS)))

	return mux
}

func (r *Router) handleLogin(w http.ResponseWriter, req *http.Request) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(req.Body).Decode(&creds); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if !r.Auth.Login(w, creds.Username, creds.Password) {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (r *Router) handleLogout(w http.ResponseWriter, req *http.Request) {
	r.Auth.Logout(w, req)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (r *Router) handleCheckAuth(w http.ResponseWriter, req *http.Request) {
	if r.Auth.IsAuthenticated(req) {
		json.NewEncoder(w).Encode(map[string]bool{"authenticated": true})
	} else {
		json.NewEncoder(w).Encode(map[string]bool{"authenticated": false})
	}
}

func (r *Router) listClients(w http.ResponseWriter, req *http.Request) {
	clients := r.Tracker.GetClients()
	json.NewEncoder(w).Encode(clients)
}

func (r *Router) getClient(w http.ResponseWriter, req *http.Request) {
	ip := req.PathValue("ip")
	client, ok := r.Tracker.GetClient(ip)
	if !ok {
		http.Error(w, "client not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(client)
}

func (r *Router) listQueries(w http.ResponseWriter, req *http.Request) {
	limit := 100
	if l := req.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	queries := r.Tracker.GetRecentQueries(limit)
	json.NewEncoder(w).Encode(queries)
}

func (r *Router) getStats(w http.ResponseWriter, req *http.Request) {
	stats := r.Tracker.Stats()
	json.NewEncoder(w).Encode(stats)
}

func (r *Router) listZones(w http.ResponseWriter, req *http.Request) {
	zones := r.Store.ListZones()
	type zoneInfo struct {
		Name    string `json:"name"`
		Type    string `json:"type"`
		Enabled bool   `json:"enabled"`
		Records int    `json:"records"`
	}
	var list []zoneInfo
	for _, z := range zones {
		list = append(list, zoneInfo{
			Name:    z.Name,
			Type:    z.Type,
			Enabled: z.Enabled,
			Records: len(z.Records),
		})
	}
	json.NewEncoder(w).Encode(list)
}

func (r *Router) createZone(w http.ResponseWriter, req *http.Request) {
	var zone models.Zone
	if err := json.NewDecoder(req.Body).Decode(&zone); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	zone.Enabled = true
	if zone.Type == "" {
		zone.Type = "primary"
	}

	for i := range zone.Records {
		if err := zone.Records[i].Validate(); err != nil {
			http.Error(w, fmt.Sprintf("record %d: %v", i, err), http.StatusBadRequest)
			return
		}
	}

	if err := r.Store.AddZone(&zone); err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}

	if err := config.SaveZone(r.ConfigDir, &zone); err != nil {
		log.Printf("[API] warning: failed to persist zone: %v", err)
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(zone)
}

func (r *Router) deleteZone(w http.ResponseWriter, req *http.Request) {
	name := req.PathValue("name")
	if !r.Store.DeleteZone(name) {
		http.Error(w, "zone not found", http.StatusNotFound)
		return
	}

	config.DeleteZoneFile(r.ConfigDir, name)
	w.WriteHeader(http.StatusNoContent)
}

func (r *Router) listRecords(w http.ResponseWriter, req *http.Request) {
	name := req.PathValue("name")
	zone, ok := r.Store.GetZone(name)
	if !ok {
		http.Error(w, "zone not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(zone.Records)
}

func (r *Router) createRecord(w http.ResponseWriter, req *http.Request) {
	name := req.PathValue("name")
	zone, ok := r.Store.GetZone(name)
	if !ok {
		http.Error(w, "zone not found", http.StatusNotFound)
		return
	}

	var record models.Record
	if err := json.NewDecoder(req.Body).Decode(&record); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := record.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	zone.AddRecord(record)

	if err := config.SaveZone(r.ConfigDir, zone); err != nil {
		log.Printf("[API] warning: failed to persist zone: %v", err)
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(record)
}

func (r *Router) deleteRecord(w http.ResponseWriter, req *http.Request) {
	zoneName := req.PathValue("name")
	recordID := req.PathValue("record")

	zone, ok := r.Store.GetZone(zoneName)
	if !ok {
		http.Error(w, "zone not found", http.StatusNotFound)
		return
	}

	parsed := parseRecordID(recordID)
	if !zone.DeleteRecord(parsed.name, parsed.rtype) {
		http.Error(w, "record not found", http.StatusNotFound)
		return
	}

	config.SaveZone(r.ConfigDir, zone)
	w.WriteHeader(http.StatusNoContent)
}

type recordRef struct {
	name  string
	rtype string
}

func parseRecordID(id string) recordRef {
	for i := len(id) - 1; i >= 0; i-- {
		if id[i] == ':' {
			return recordRef{name: id[:i], rtype: id[i+1:]}
		}
	}
	return recordRef{name: id, rtype: ""}
}
