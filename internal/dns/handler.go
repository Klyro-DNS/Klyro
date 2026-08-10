package dns

import (
	"log"
	"net"
	"strings"
	"time"

	"github.com/klyro/dns/internal/models"
	"github.com/miekg/dns"
)

type Handler struct {
	Store     *models.Store
	Upstreams []string
	Tracker   *models.QueryTracker
}

func NewHandler(store *models.Store, upstreams []string, tracker *models.QueryTracker) *Handler {
	return &Handler{
		Store:     store,
		Upstreams: upstreams,
		Tracker:   tracker,
	}
}

func (h *Handler) HandleDNS(w dns.ResponseWriter, req *dns.Msg) {
	resp := new(dns.Msg)
	resp.SetReply(req)
	resp.Authoritative = true

	clientIP := w.RemoteAddr().String()
	if host, _, err := net.SplitHostPort(clientIP); err == nil {
		clientIP = host
	}

	if len(req.Question) == 0 {
		w.WriteMsg(resp)
		return
	}

	q := req.Question[0]
	name := strings.ToLower(q.Name)
	qtype := dns.TypeToString[q.Qtype]

	zone, zoneName := h.Store.FindZoneForName(name)

	entry := models.QueryEntry{
		Timestamp: time.Now(),
		ClientIP:  clientIP,
		Domain:    name,
		Type:      qtype,
	}

	if zone == nil {
		log.Printf("[DNS] %s %s from %s -> forward", name, qtype, clientIP)
		entry.Response = "forward"
		h.Tracker.Record(entry)
		h.forward(w, req)
		return
	}

	subdomain := strings.TrimSuffix(name, "."+zoneName)
	if subdomain == name {
		subdomain = "@"
	}

	records := zone.FindRecords(subdomain, "")
	if len(records) == 0 {
		resp.Rcode = dns.RcodeNameError
		entry.Response = "nxdomain"
		h.Tracker.Record(entry)
		w.WriteMsg(resp)
		return
	}

	for _, r := range records {
		rr := r.ToDNSRR(zoneName + ".")
		if rr != nil {
			resp.Answer = append(resp.Answer, rr)
		}
	}

	if len(resp.Answer) == 0 {
		resp.Rcode = dns.RcodeNameError
		entry.Response = "nxdomain"
	} else {
		entry.Response = "success"
	}

	h.Tracker.Record(entry)
	w.WriteMsg(resp)
}

func (h *Handler) forward(w dns.ResponseWriter, req *dns.Msg) {
	resp := new(dns.Msg)
	resp.SetReply(req)

	for _, upstream := range h.Upstreams {
		client := &dns.Client{
			Timeout: 5 * time.Second,
		}

		result, _, err := client.Exchange(req, upstream)
		if err != nil {
			log.Printf("[DNS] upstream %s failed: %v", upstream, err)
			continue
		}

		w.WriteMsg(result)
		return
	}

	log.Printf("[DNS] all upstreams failed")
	resp.Rcode = dns.RcodeServerFailure
	w.WriteMsg(resp)
}
