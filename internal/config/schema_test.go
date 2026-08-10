package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidateServerConfig(t *testing.T) {
	tests := []struct {
		name    string
		cfg     *ServerConfig
		wantErr bool
	}{
		{
			name:    "valid config",
			cfg:     &ServerConfig{ListenAddr: ":5353", HTTPAddr: ":8080", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "info", ConfigDir: "config/zones", Username: "admin", Password: "admin"},
			wantErr: false,
		},
		{
			name:    "empty listen addr",
			cfg:     &ServerConfig{ListenAddr: "", HTTPAddr: ":8080", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "info", ConfigDir: "config/zones", Username: "admin", Password: "admin"},
			wantErr: true,
		},
		{
			name:    "invalid listen addr format",
			cfg:     &ServerConfig{ListenAddr: "5353", HTTPAddr: ":8080", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "info", ConfigDir: "config/zones", Username: "admin", Password: "admin"},
			wantErr: true,
		},
		{
			name:    "empty upstreams",
			cfg:     &ServerConfig{ListenAddr: ":5353", HTTPAddr: ":8080", Upstreams: []string{}, LogLevel: "info", ConfigDir: "config/zones", Username: "admin", Password: "admin"},
			wantErr: true,
		},
		{
			name:    "invalid upstream format",
			cfg:     &ServerConfig{ListenAddr: ":5353", HTTPAddr: ":8080", Upstreams: []string{"8.8.8.8"}, LogLevel: "info", ConfigDir: "config/zones", Username: "admin", Password: "admin"},
			wantErr: true,
		},
		{
			name:    "invalid log level",
			cfg:     &ServerConfig{ListenAddr: ":5353", HTTPAddr: ":8080", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "trace", ConfigDir: "config/zones", Username: "admin", Password: "admin"},
			wantErr: true,
		},
		{
			name:    "empty config dir",
			cfg:     &ServerConfig{ListenAddr: ":5353", HTTPAddr: ":8080", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "info", ConfigDir: "", Username: "admin", Password: "admin"},
			wantErr: true,
		},
		{
			name:    "invalid http addr",
			cfg:     &ServerConfig{ListenAddr: ":5353", HTTPAddr: "http://localhost", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "info", ConfigDir: "config/zones", Username: "admin", Password: "admin"},
			wantErr: true,
		},
		{
			name:    "ip based listen",
			cfg:     &ServerConfig{ListenAddr: "127.0.0.1:5353", HTTPAddr: "0.0.0.0:8080", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "info", ConfigDir: "config/zones", Username: "admin", Password: "admin"},
			wantErr: false,
		},
		{
			name:    "empty username",
			cfg:     &ServerConfig{ListenAddr: ":5353", HTTPAddr: ":8080", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "info", ConfigDir: "config/zones", Username: "", Password: "admin"},
			wantErr: true,
		},
		{
			name:    "empty password",
			cfg:     &ServerConfig{ListenAddr: ":5353", HTTPAddr: ":8080", Upstreams: []string{"8.8.8.8:53"}, LogLevel: "info", ConfigDir: "config/zones", Username: "admin", Password: ""},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateServerConfig(tt.cfg)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateServerConfig() error = %v, wantErr %v", err, tt.wantErr)
				if err != nil {
					t.Error(err)
				}
			}
		})
	}
}

func TestValidateZoneConfig(t *testing.T) {
	tests := []struct {
		name    string
		zone    map[string]interface{}
		wantErr bool
	}{
		{
			name: "valid zone",
			zone: map[string]interface{}{
				"name":    "example.com",
				"type":    "primary",
				"enabled": true,
				"records": []interface{}{
					map[string]interface{}{
						"name":  "@",
						"type":  "A",
						"ttl":   3600,
						"value": "192.168.1.1",
					},
				},
			},
			wantErr: false,
		},
		{
			name: "missing zone name",
			zone: map[string]interface{}{
				"type": "primary",
			},
			wantErr: true,
		},
		{
			name: "invalid zone type",
			zone: map[string]interface{}{
				"name": "example.com",
				"type": "invalid",
			},
			wantErr: true,
		},
		{
			name: "invalid record type",
			zone: map[string]interface{}{
				"name": "example.com",
				"type": "primary",
				"records": []interface{}{
					map[string]interface{}{
						"name":  "@",
						"type":  "INVALID",
						"ttl":   3600,
						"value": "192.168.1.1",
					},
				},
			},
			wantErr: true,
		},
		{
			name: "invalid ttl too high",
			zone: map[string]interface{}{
				"name": "example.com",
				"type": "primary",
				"records": []interface{}{
					map[string]interface{}{
						"name":  "@",
						"type":  "A",
						"ttl":   999999,
						"value": "192.168.1.1",
					},
				},
			},
			wantErr: true,
		},
		{
			name: "invalid A record value",
			zone: map[string]interface{}{
				"name": "example.com",
				"type": "primary",
				"records": []interface{}{
					map[string]interface{}{
						"name":  "@",
						"type":  "A",
						"ttl":   3600,
						"value": "not-an-ip",
					},
				},
			},
			wantErr: true,
		},
		{
			name: "invalid AAAA record value",
			zone: map[string]interface{}{
				"name": "example.com",
				"type": "primary",
				"records": []interface{}{
					map[string]interface{}{
						"name":  "@",
						"type":  "AAAA",
						"ttl":   3600,
						"value": "192.168.1.1",
					},
				},
			},
			wantErr: true,
		},
		{
			name: "empty record value",
			zone: map[string]interface{}{
				"name": "example.com",
				"type": "primary",
				"records": []interface{}{
					map[string]interface{}{
						"name":  "@",
						"type":  "A",
						"ttl":   3600,
						"value": "",
					},
				},
			},
			wantErr: true,
		},
		{
			name: "valid AAAA record",
			zone: map[string]interface{}{
				"name": "example.com",
				"type": "primary",
				"records": []interface{}{
					map[string]interface{}{
						"name":  "@",
						"type":  "AAAA",
						"ttl":   3600,
						"value": "2001:db8::1",
					},
				},
			},
			wantErr: false,
		},
		{
			name: "invalid enabled type",
			zone: map[string]interface{}{
				"name":    "example.com",
				"type":    "primary",
				"enabled": "yes",
			},
			wantErr: true,
		},
		{
			name: "invalid priority range",
			zone: map[string]interface{}{
				"name": "example.com",
				"type": "primary",
				"records": []interface{}{
					map[string]interface{}{
						"name":     "@",
						"type":     "MX",
						"ttl":      3600,
						"value":    "mail.example.com",
						"priority": 999999,
					},
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateZoneConfig("test.yaml", tt.zone)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateZoneConfig() error = %v, wantErr %v", err, tt.wantErr)
				if err != nil {
					t.Error(err)
				}
			}
		})
	}
}

func TestLoadInvalidConfig(t *testing.T) {
	dir := t.TempDir()

	// Write invalid config
	cfgPath := filepath.Join(dir, "bad.yaml")
	os.WriteFile(cfgPath, []byte(`
listen_addr: "invalid"
http_addr: "also-invalid"
upstreams: []
log_level: "trace"
config_dir: ""
username: ""
password: ""
`), 0644)

	_, err := Load(cfgPath)
	if err == nil {
		t.Fatal("expected error for invalid config, got nil")
	}
	t.Logf("got expected error: %v", err)
}

func TestLoadInvalidZone(t *testing.T) {
	dir := t.TempDir()

	// Write invalid zone
	zonePath := filepath.Join(dir, "bad.yaml")
	os.WriteFile(zonePath, []byte(`
name: ""
type: invalid
records:
  - name: "@"
    type: FAKE
    ttl: 999999
    value: ""
`), 0644)

	_, err := LoadZones(dir)
	if err == nil {
		t.Fatal("expected error for invalid zone, got nil")
	}
	t.Logf("got expected error: %v", err)
}
