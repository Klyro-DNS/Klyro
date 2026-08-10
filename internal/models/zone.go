package models

import (
	"fmt"
	"net"
	"strings"
	"sync"

	"github.com/miekg/dns"
)

type Zone struct {
	mu      sync.RWMutex
	Name    string   `yaml:"name" json:"name"`
	Type    string   `yaml:"type" json:"type"`
	Enabled bool     `yaml:"enabled" json:"enabled"`
	Records []Record `yaml:"records" json:"records"`
}

type Record struct {
	Name     string `yaml:"name" json:"name"`
	Type     string `yaml:"type" json:"type"`
	TTL      uint32 `yaml:"ttl" json:"ttl"`
	Value    string `yaml:"value" json:"value"`
	Priority uint16 `yaml:"priority,omitempty" json:"priority,omitempty"`
}

func (z *Zone) Lock()   { z.mu.Lock() }
func (z *Zone) Unlock() { z.mu.Unlock() }
func (z *Zone) RLock()  { z.mu.RLock() }
func (z *Zone) RUnlock() { z.mu.RUnlock() }

func (z *Zone) AddRecord(r Record) {
	z.mu.Lock()
	defer z.mu.Unlock()
	z.Records = append(z.Records, r)
}

func (z *Zone) DeleteRecord(name, rtype string) bool {
	z.mu.Lock()
	defer z.mu.Unlock()
	for i, r := range z.Records {
		if strings.EqualFold(r.Name, name) && strings.EqualFold(r.Type, rtype) {
			z.Records = append(z.Records[:i], z.Records[i+1:]...)
			return true
		}
	}
	return false
}

func (z *Zone) FindRecords(name, rtype string) []Record {
	z.mu.RLock()
	defer z.mu.RUnlock()
	var found []Record
	for _, r := range z.Records {
		if (name == "" || strings.EqualFold(r.Name, name)) &&
			(rtype == "" || strings.EqualFold(r.Type, rtype)) {
			found = append(found, r)
		}
	}
	return found
}

func (z *Zone) ToDNSRR(fqdn string) []dns.RR {
	z.mu.RLock()
	defer z.mu.RUnlock()
	var rrs []dns.RR
	for _, r := range z.Records {
		rr := r.ToDNSRR(fqdn)
		if rr != nil {
			rrs = append(rrs, rr)
		}
	}
	return rrs
}

func (r *Record) ToDNSRR(fqdn string) dns.RR {
	name := r.Name + "." + fqdn
	if r.Name == "@" || r.Name == "" {
		name = fqdn
	}

	header := dns.RR_Header{
		Name:   name,
		Class:  dns.ClassINET,
		Ttl:    r.TTL,
		Rrtype: dns.StringToType[strings.ToUpper(r.Type)],
	}

	switch strings.ToUpper(r.Type) {
	case "A":
		ip := net.ParseIP(r.Value)
		if ip == nil || ip.To4() == nil {
			return nil
		}
		return &dns.A{Hdr: header, A: ip.To4()}

	case "AAAA":
		ip := net.ParseIP(r.Value)
		if ip == nil {
			return nil
		}
		return &dns.AAAA{Hdr: header, AAAA: ip}

	case "CNAME":
		target := r.Value
		if !strings.HasSuffix(target, ".") {
			target += "."
		}
		return &dns.CNAME{Hdr: header, Target: target}

	case "MX":
		target := r.Value
		if !strings.HasSuffix(target, ".") {
			target += "."
		}
		return &dns.MX{Hdr: header, Preference: r.Priority, Mx: target}

	case "TXT":
		return &dns.TXT{Hdr: header, Txt: []string{r.Value}}

	case "NS":
		target := r.Value
		if !strings.HasSuffix(target, ".") {
			target += "."
		}
		return &dns.NS{Hdr: header, Ns: target}

	case "SOA":
		parts := strings.Split(r.Value, " ")
		if len(parts) < 2 {
			return nil
		}
		ns := parts[0]
		mbox := parts[1]
		if !strings.HasSuffix(ns, ".") {
			ns += "."
		}
		if !strings.HasSuffix(mbox, ".") {
			mbox += "."
		}
		return &dns.SOA{
			Hdr:     header,
			Ns:      ns,
			Mbox:    mbox,
			Serial:  2024010101,
			Refresh: 3600,
			Retry:   600,
			Expire:  86400,
			Minttl:  300,
		}

	case "SRV":
		parts := strings.SplitN(r.Value, " ", 2)
		if len(parts) < 2 {
			return nil
		}
		target := parts[1]
		if !strings.HasSuffix(target, ".") {
			target += "."
		}
		return &dns.SRV{
			Hdr:      header,
			Priority: r.Priority,
			Weight:   0,
			Port:     53,
			Target:   target,
		}

	case "PTR":
		target := r.Value
		if !strings.HasSuffix(target, ".") {
			target += "."
		}
		return &dns.PTR{Hdr: header, Ptr: target}
	}

	return nil
}

func (r *Record) Validate() error {
	r.Name = strings.TrimSpace(r.Name)
	r.Type = strings.ToUpper(strings.TrimSpace(r.Type))
	r.Value = strings.TrimSpace(r.Value)

	if r.Name == "" {
		r.Name = "@"
	}

	validTypes := map[string]bool{
		"A": true, "AAAA": true, "CNAME": true, "MX": true,
		"TXT": true, "NS": true, "SOA": true, "SRV": true, "PTR": true,
	}
	if !validTypes[r.Type] {
		return fmt.Errorf("unsupported record type: %s", r.Type)
	}

	if r.Value == "" {
		return fmt.Errorf("record value is required")
	}

	switch r.Type {
	case "A":
		if ip := net.ParseIP(r.Value); ip == nil || ip.To4() == nil {
			return fmt.Errorf("invalid IPv4 address: %s", r.Value)
		}
	case "AAAA":
		if ip := net.ParseIP(r.Value); ip == nil || ip.To4() != nil {
			return fmt.Errorf("invalid IPv6 address: %s", r.Value)
		}
	case "MX":
		if r.Priority == 0 {
			r.Priority = 10
		}
	}

	return nil
}
