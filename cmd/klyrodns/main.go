package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/klyro/dns/internal/api"
	"github.com/klyro/dns/internal/config"
	klydns "github.com/klyro/dns/internal/dns"
	"github.com/klyro/dns/internal/models"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	cfgFile := os.Getenv("KLYRO_CONFIG")
	if cfgFile == "" {
		cfgFile = "config.yaml"
	}

	cfg, err := config.Load(cfgFile)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	store, err := config.LoadZones(cfg.ConfigDir)
	if err != nil {
		log.Fatalf("Failed to load zones: %v", err)
	}

	log.Printf("Loaded %d zones", len(store.ListZones()))

	tracker := models.NewQueryTracker(10000)
	handler := klydns.NewHandler(store, cfg.Upstreams, tracker)
	dnsServer := klydns.NewServer(cfg.ListenAddr, handler)
	if err := dnsServer.Start(); err != nil {
		log.Fatalf("Failed to start DNS server: %v", err)
	}

	auth := api.NewAuthManager(cfg.Username, cfg.Password)
	router := api.NewRouter(store, cfg.ConfigDir, auth, tracker)
	httpServer := &http.Server{
		Addr:    cfg.HTTPAddr,
		Handler: router.Setup(),
	}

	go func() {
		log.Printf("Dashboard: http://localhost%s", cfg.HTTPAddr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	log.Println("Shutting down...")
	dnsServer.Shutdown()
	httpServer.Close()
}
