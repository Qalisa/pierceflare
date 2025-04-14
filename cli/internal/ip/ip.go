package ip

import (
	"io"
	"net"
	"net/http"
	"time"

	"github.com/qalisa/pierceflare/cli/internal/logger"
)

var ipServices = []string{
	"https://ifconfig.me",
	"https://api.ipify.org",
	"https://icanhazip.com",
}

// Retriever handles the retrieval of external IP addresses
type Retriever struct {
	logger *logger.Logger
	client *http.Client
}

// NewRetriever creates a new instance of Retriever
func NewRetriever(logger *logger.Logger) *Retriever {
	return &Retriever{
		logger: logger,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// IsValidIP checks if a string is a valid IPv4 or IPv6 address
func IsValidIP(ip string) bool {
	return net.ParseIP(ip) != nil
}

// GetCurrentIP attempts to obtain the current external IP address
func (r *Retriever) GetCurrentIP() (string, error) {
	for _, service := range ipServices {
		r.logger.Debug("Attempting to retrieve IP from %s", service)

		resp, err := r.client.Get(service)
		if err != nil {
			r.logger.Debug("Error connecting to %s: %v", service, err)
			continue
		}

		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			r.logger.Debug("Error reading response: %v", err)
			continue
		}

		ip := string(body)
		if IsValidIP(ip) {
			r.logger.Debug("IP retrieved: %s", ip)
			return ip, nil
		}
	}

	r.logger.Error("Failed to retrieve IP from all services")
	return "", ErrNoIPFound
}

// ErrNoIPFound is returned when no valid IP address could be found
var ErrNoIPFound = net.InvalidAddrError("no valid IP address could be found")
