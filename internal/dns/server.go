package dns

import (
	"log"

	"github.com/miekg/dns"
)

type Server struct {
	udpServer *dns.Server
	tcpServer *dns.Server
	handler   *Handler
}

func NewServer(addr string, handler *Handler) *Server {
	s := &Server{
		handler: handler,
	}

	s.udpServer = &dns.Server{
		Addr:    addr,
		Net:     "udp",
		Handler: dns.HandlerFunc(handler.HandleDNS),
	}

	s.tcpServer = &dns.Server{
		Addr:    addr,
		Net:     "tcp",
		Handler: dns.HandlerFunc(handler.HandleDNS),
	}

	return s
}

func (s *Server) Start() error {
	go func() {
		log.Printf("[DNS] UDP server listening on %s", s.udpServer.Addr)
		if err := s.udpServer.ListenAndServe(); err != nil {
			log.Fatalf("[DNS] UDP failed: %v", err)
		}
	}()

	go func() {
		log.Printf("[DNS] TCP server listening on %s", s.tcpServer.Addr)
		if err := s.tcpServer.ListenAndServe(); err != nil {
			log.Fatalf("[DNS] TCP failed: %v", err)
		}
	}()

	return nil
}

func (s *Server) Shutdown() {
	s.udpServer.Shutdown()
	s.tcpServer.Shutdown()
}
