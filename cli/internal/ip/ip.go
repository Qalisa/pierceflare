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

// Retriever gère la récupération des adresses IP externes
type Retriever struct {
	logger *logger.Logger
	client *http.Client
}

// NewRetriever crée une nouvelle instance de Retriever
func NewRetriever(logger *logger.Logger) *Retriever {
	return &Retriever{
		logger: logger,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// IsValidIP vérifie si une chaîne est une adresse IPv4 ou IPv6 valide
func IsValidIP(ip string) bool {
	return net.ParseIP(ip) != nil
}

// GetCurrentIP tente d'obtenir l'adresse IP externe actuelle
func (r *Retriever) GetCurrentIP() (string, error) {
	for _, service := range ipServices {
		r.logger.Debug("Tentative de récupération d'IP depuis %s", service)

		resp, err := r.client.Get(service)
		if err != nil {
			r.logger.Debug("Erreur lors de la connexion à %s: %v", service, err)
			continue
		}

		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			r.logger.Debug("Erreur lors de la lecture de la réponse: %v", err)
			continue
		}

		ip := string(body)
		if IsValidIP(ip) {
			r.logger.Debug("IP récupérée: %s", ip)
			return ip, nil
		}
	}

	r.logger.Error("Échec de la récupération d'IP depuis tous les services")
	return "", ErrNoIPFound
}

// ErrNoIPFound est renvoyé lorsqu'aucune adresse IP valide n'a pu être trouvée
var ErrNoIPFound = net.InvalidAddrError("aucune adresse IP valide n'a pu être trouvée")
