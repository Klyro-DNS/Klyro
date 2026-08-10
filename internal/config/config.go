package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/klyro/dns/internal/models"
	"gopkg.in/yaml.v3"
)

type ServerConfig struct {
	ListenAddr string   `yaml:"listen_addr"`
	HTTPAddr   string   `yaml:"http_addr"`
	Upstreams  []string `yaml:"upstreams"`
	LogLevel   string   `yaml:"log_level"`
	ConfigDir  string   `yaml:"config_dir"`
	Username   string   `yaml:"username"`
	Password   string   `yaml:"password"`
}

func DefaultConfig() *ServerConfig {
	return &ServerConfig{
		ListenAddr: ":5353",
		HTTPAddr:   ":8080",
		Upstreams:  []string{"8.8.8.8:53", "1.1.1.1:53"},
		LogLevel:   "info",
		ConfigDir:  "config/zones",
		Username:   "admin",
		Password:   "admin",
	}
}

func Load(path string) (*ServerConfig, error) {
	cfg := DefaultConfig()
	if path == "" {
		return cfg, nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, fmt.Errorf("read config: %w", err)
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	// Environment variable overrides
	if v := os.Getenv("KLYRO_USER"); v != "" {
		cfg.Username = v
	}
	if v := os.Getenv("KLYRO_PASS"); v != "" {
		cfg.Password = v
	}

	if err := ValidateServerConfig(cfg); err != nil {
		return nil, fmt.Errorf("config validation: %w", err)
	}

	return cfg, nil
}

func LoadZones(dir string) (*models.Store, error) {
	store := models.NewStore()

	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return store, nil
		}
		return nil, fmt.Errorf("read zones dir: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".yaml") && !strings.HasSuffix(name, ".yml") {
			continue
		}

		path := filepath.Join(dir, name)
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("read zone file %s: %w", name, err)
		}

		// Phase 1: schema validation on raw YAML
		var raw map[string]interface{}
		if err := yaml.Unmarshal(data, &raw); err != nil {
			return nil, fmt.Errorf("zone file %s: parse error: %w", name, err)
		}
		if err := ValidateZoneConfig(name, raw); err != nil {
			return nil, fmt.Errorf("zone file %s: %w", name, err)
		}

		// Phase 2: unmarshal into typed struct
		var zone models.Zone
		if err := yaml.Unmarshal(data, &zone); err != nil {
			return nil, fmt.Errorf("zone file %s: %w", name, err)
		}

		if zone.Name == "" {
			zone.Name = strings.TrimSuffix(strings.TrimSuffix(name, ".yaml"), ".yml")
		}
		if zone.Type == "" {
			zone.Type = "primary"
		}
		zone.Enabled = true

		for i := range zone.Records {
			if err := zone.Records[i].Validate(); err != nil {
				return nil, fmt.Errorf("zone %s, record %d: %w", zone.Name, i, err)
			}
		}

		if err := store.AddZone(&zone); err != nil {
			return nil, fmt.Errorf("add zone %s: %w", zone.Name, err)
		}
	}

	return store, nil
}

func SaveZone(dir string, zone *models.Zone) error {
	if zone.Name == "" {
		return fmt.Errorf("zone name is required")
	}
	if !validZoneTypes[zone.Type] {
		return fmt.Errorf("invalid zone type: %s", zone.Type)
	}

	for i, r := range zone.Records {
		if err := r.Validate(); err != nil {
			return fmt.Errorf("record %d: %w", i, err)
		}
	}

	data, err := yaml.Marshal(zone)
	if err != nil {
		return fmt.Errorf("marshal zone: %w", err)
	}

	path := filepath.Join(dir, zone.Name+".yaml")
	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("write zone file: %w", err)
	}

	return nil
}

func DeleteZoneFile(dir, name string) error {
	name = strings.TrimSuffix(name, ".yaml")
	name = strings.TrimSuffix(name, ".yml")
	path := filepath.Join(dir, name+".yaml")
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("delete zone file: %w", err)
	}
	return nil
}
