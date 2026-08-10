package config

import (
	"fmt"
	"net"
	"regexp"
	"strings"
)

type FieldError struct {
	Field   string
	Message string
}

func (e FieldError) Error() string {
	return fmt.Sprintf("field '%s': %s", e.Field, e.Message)
}

type ValidationError struct {
	Errors []FieldError
}

func (e *ValidationError) Add(field, msg string) {
	e.Errors = append(e.Errors, FieldError{Field: field, Message: msg})
}

func (e *ValidationError) Error() string {
	msgs := make([]string, len(e.Errors))
	for i, err := range e.Errors {
		msgs[i] = err.Error()
	}
	return fmt.Sprintf("validation failed:\n  - %s", strings.Join(msgs, "\n  - "))
}

func (e *ValidationError) HasErrors() bool {
	return len(e.Errors) > 0
}

var (
	validLogLevels = map[string]bool{
		"debug": true, "info": true, "warn": true, "error": true,
	}
	validZoneTypes = map[string]bool{
		"primary": true, "secondary": true, "stub": true, "forward": true,
	}
	validRecordTypes = map[string]bool{
		"A": true, "AAAA": true, "CNAME": true, "MX": true, "TXT": true,
		"NS": true, "SOA": true, "SRV": true, "PTR": true, "CAA": true,
	}
	addrPattern  = regexp.MustCompile(`^:[0-9]{1,5}$|^([0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{1,5}$`)
	upstreamPattern = regexp.MustCompile(`^[a-zA-Z0-9.-]+:[0-9]+$`)
	zoneNamePattern = regexp.MustCompile(`^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)*[a-zA-Z]{2,}$`)
)

// ValidateServerConfig validates the server configuration file.
func ValidateServerConfig(cfg *ServerConfig) error {
	v := &ValidationError{}

	if cfg.ListenAddr == "" {
		v.Add("listen_addr", "is required")
	} else if !addrPattern.MatchString(cfg.ListenAddr) {
		v.Add("listen_addr", fmt.Sprintf("invalid address format '%s', expected ':port' or 'ip:port'", cfg.ListenAddr))
	}

	if cfg.HTTPAddr == "" {
		v.Add("http_addr", "is required")
	} else if !addrPattern.MatchString(cfg.HTTPAddr) {
		v.Add("http_addr", fmt.Sprintf("invalid address format '%s', expected ':port' or 'ip:port'", cfg.HTTPAddr))
	}

	if len(cfg.Upstreams) == 0 {
		v.Add("upstreams", "at least one upstream DNS server is required")
	}
	for i, u := range cfg.Upstreams {
		u = strings.TrimSpace(u)
		if u == "" {
			v.Add(fmt.Sprintf("upstreams[%d]", i), "cannot be empty")
			continue
		}
		if !upstreamPattern.MatchString(u) {
			v.Add(fmt.Sprintf("upstreams[%d]", i), fmt.Sprintf("invalid upstream format '%s', expected 'host:port'", u))
		}
	}

	if cfg.LogLevel == "" {
		v.Add("log_level", "is required")
	} else if !validLogLevels[strings.ToLower(cfg.LogLevel)] {
		v.Add("log_level", fmt.Sprintf("invalid level '%s', allowed: debug, info, warn, error", cfg.LogLevel))
	}

	if cfg.ConfigDir == "" {
		v.Add("config_dir", "is required")
	}

	if cfg.Username == "" {
		v.Add("username", "is required")
	}

	if cfg.Password == "" {
		v.Add("password", "is required")
	}

	if v.HasErrors() {
		return v
	}
	return nil
}

// ValidateZoneConfig validates a zone YAML structure before record validation.
func ValidateZoneConfig(zoneName string, fields map[string]interface{}) error {
	v := &ValidationError{}

	// name
	name, _ := fields["name"].(string)
	if name == "" {
		v.Add("name", "is required")
	} else if !zoneNamePattern.MatchString(name) {
		v.Add("name", fmt.Sprintf("invalid zone name '%s'", name))
	}

	// type
	zt, _ := fields["type"].(string)
	if zt != "" && !validZoneTypes[strings.ToLower(zt)] {
		v.Add("type", fmt.Sprintf("invalid zone type '%s', allowed: primary, secondary, stub, forward", zt))
	}

	// enabled
	if _, ok := fields["enabled"]; ok {
		if _, ok := fields["enabled"].(bool); !ok {
			v.Add("enabled", "must be a boolean")
		}
	}

	// records
	records, ok := fields["records"].([]interface{})
	if ok {
		for i, r := range records {
			rec, ok := r.(map[string]interface{})
			if !ok {
				v.Add(fmt.Sprintf("records[%d]", i), "must be a map")
				continue
			}
			validateRecordFields(v, fmt.Sprintf("records[%d]", i), rec)
		}
	}

	if v.HasErrors() {
		return v
	}
	return nil
}

func validateRecordFields(v *ValidationError, prefix string, rec map[string]interface{}) {
	// name
	name, _ := rec["name"].(string)
	if name == "" {
		v.Add(prefix+".name", "is required (use '@' for root)")
	}

	// type
	rtype, _ := rec["type"].(string)
	if rtype == "" {
		v.Add(prefix+".type", "is required")
	} else if !validRecordTypes[strings.ToUpper(rtype)] {
		v.Add(prefix+".type", fmt.Sprintf("invalid record type '%s', allowed: A, AAAA, CNAME, MX, TXT, NS, SOA, SRV, PTR, CAA", rtype))
	}

	// ttl
	if ttlRaw, ok := rec["ttl"]; ok {
		switch ttl := ttlRaw.(type) {
		case int:
			if ttl < 0 || ttl > 86400 {
				v.Add(prefix+".ttl", fmt.Sprintf("must be between 0 and 86400, got %d", ttl))
			}
		case int64:
			if ttl < 0 || ttl > 86400 {
				v.Add(prefix+".ttl", fmt.Sprintf("must be between 0 and 86400, got %d", ttl))
			}
		default:
			v.Add(prefix+".ttl", "must be an integer")
		}
	}

	// value
	value, _ := rec["value"].(string)
	if strings.TrimSpace(value) == "" {
		v.Add(prefix+".value", "is required")
	} else {
		validateRecordValue(v, prefix, strings.ToUpper(rtype), value)
	}

	// priority (only for MX, SRV)
	if priRaw, ok := rec["priority"]; ok {
		switch pri := priRaw.(type) {
		case int:
			if pri < 0 || pri > 65535 {
				v.Add(prefix+".priority", fmt.Sprintf("must be between 0 and 65535, got %d", pri))
			}
		case int64:
			if pri < 0 || pri > 65535 {
				v.Add(prefix+".priority", fmt.Sprintf("must be between 0 and 65535, got %d", pri))
			}
		default:
			v.Add(prefix+".priority", "must be an integer")
		}
	}
}

func validateRecordValue(v *ValidationError, prefix, rtype, value string) {
	switch rtype {
	case "A":
		ip := net.ParseIP(value)
		if ip == nil || ip.To4() == nil {
			v.Add(prefix+".value", fmt.Sprintf("invalid IPv4 address '%s'", value))
		}
	case "AAAA":
		ip := net.ParseIP(value)
		if ip == nil || ip.To4() != nil {
			v.Add(prefix+".value", fmt.Sprintf("invalid IPv6 address '%s'", value))
		}
	case "MX":
		if !zoneNamePattern.MatchString(strings.TrimSuffix(value, ".")) {
			v.Add(prefix+".value", fmt.Sprintf("invalid MX target '%s'", value))
		}
	case "CNAME", "NS", "PTR":
		clean := strings.TrimSuffix(value, ".")
		if !zoneNamePattern.MatchString(clean) {
			v.Add(prefix+".value", fmt.Sprintf("invalid domain name '%s'", value))
		}
	case "SOA":
		parts := strings.Split(value, " ")
		if len(parts) < 2 {
			v.Add(prefix+".value", "SOA requires 'ns mbox' format")
		}
	case "SRV":
		parts := strings.SplitN(value, " ", 2)
		if len(parts) < 2 {
			v.Add(prefix+".value", "SRV requires 'target' format")
		}
	}
}
