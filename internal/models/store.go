package models

import (
	"fmt"
	"strings"
	"sync"
)

type Store struct {
	mu    sync.RWMutex
	zones map[string]*Zone
}

func NewStore() *Store {
	return &Store{
		zones: make(map[string]*Zone),
	}
}

func (s *Store) AddZone(z *Zone) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	name := strings.ToLower(strings.TrimSuffix(z.Name, "."))
	if _, exists := s.zones[name]; exists {
		return fmt.Errorf("zone %s already exists", name)
	}
	z.Name = name
	s.zones[name] = z
	return nil
}

func (s *Store) GetZone(name string) (*Zone, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	name = strings.ToLower(strings.TrimSuffix(name, "."))
	z, ok := s.zones[name]
	return z, ok
}

func (s *Store) ListZones() []*Zone {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var list []*Zone
	for _, z := range s.zones {
		list = append(list, z)
	}
	return list
}

func (s *Store) DeleteZone(name string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	name = strings.ToLower(strings.TrimSuffix(name, "."))
	if _, exists := s.zones[name]; !exists {
		return false
	}
	delete(s.zones, name)
	return true
}

func (s *Store) FindZoneForName(fqdn string) (*Zone, string) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	fqdn = strings.ToLower(strings.TrimSuffix(fqdn, "."))
	parts := strings.Split(fqdn, ".")
	for i := 0; i < len(parts); i++ {
		candidate := strings.Join(parts[i:], ".")
		if z, ok := s.zones[candidate]; ok && z.Enabled {
			return z, candidate
		}
	}
	return nil, ""
}
