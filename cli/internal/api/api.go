package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/qalisa/pierceflare/cli/internal/logger"
)

const (
	EndpointPutFlare = "/api/flare"
	EndpointGetInfos = "/api/infos"
)

// Client est un client pour l'API PierceFlare
type Client struct {
	apiKey    string
	serverURL string
	client    *http.Client
	logger    *logger.Logger
}

// Response représente une réponse de l'API
type Response struct {
	StatusCode int
	Body       string
}

// NewClient crée un nouveau client API
func NewClient(apiKey, serverURL string, logger *logger.Logger) *Client {
	return &Client{
		apiKey:    apiKey,
		serverURL: strings.TrimRight(serverURL, "/"),
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
	}
}

// makeRequest effectue une requête HTTP vers l'API
func (c *Client) makeRequest(method, endpoint string, body interface{}) (*Response, error) {
	url := c.serverURL + endpoint
	c.logger.Debug("Préparation de la requête %s vers: %s", method, url)

	var req *http.Request
	var err error

	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("erreur lors de la conversion en JSON: %w", err)
		}

		req, err = http.NewRequest(method, url, bytes.NewBuffer(jsonBody))
		if err != nil {
			return nil, fmt.Errorf("erreur lors de la création de la requête: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, err = http.NewRequest(method, url, nil)
		if err != nil {
			return nil, fmt.Errorf("erreur lors de la création de la requête: %w", err)
		}
	}

	// Ajout de l'en-tête d'autorisation
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	c.logger.Debug("Exécution de la requête...")
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("échec de la requête: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erreur lors de la lecture de la réponse: %w", err)
	}

	c.logger.Debug("Code de réponse HTTP: %d", resp.StatusCode)

	response := &Response{
		StatusCode: resp.StatusCode,
		Body:       string(respBody),
	}

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		c.logger.Debug("Requête réussie (HTTP %d)", resp.StatusCode)
	} else {
		c.logger.Error("Échec de la requête (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	return response, nil
}

// CheckTokenValidity vérifie la validité du token API
func (c *Client) CheckTokenValidity() error {
	c.logger.Debug("Vérification de la validité du token...")

	resp, err := c.makeRequest("GET", EndpointGetInfos, nil)
	if err != nil {
		return err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("impossible de valider le token (HTTP %d): %s", resp.StatusCode, resp.Body)
	}

	c.logger.Debug("Token valide.")
	return nil
}

// IPUpdateRequest représente une demande de mise à jour d'IP
type IPUpdateRequest struct {
	IP    string `json:"ip"`
	Dummy bool   `json:"dummy,omitempty"` // Indique si c'est une requête de test
}

// SendIPUpdate envoie une mise à jour d'adresse IP au serveur
func (c *Client) SendIPUpdate(ipAddress string, isDummy bool) error {
	if isDummy {
		c.logger.Debug("Envoi d'une mise à jour IP de test (dummy): %s", ipAddress)
	} else {
		c.logger.Debug("Envoi de la mise à jour IP: %s", ipAddress)
	}

	req := IPUpdateRequest{
		IP:    ipAddress,
		Dummy: isDummy,
	}

	resp, err := c.makeRequest("PUT", EndpointPutFlare, req)
	if err != nil {
		return err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("échec de la mise à jour (HTTP %d): %s", resp.StatusCode, resp.Body)
	}

	if isDummy {
		c.logger.Debug("Mise à jour de test réussie (HTTP %d): %s", resp.StatusCode, resp.Body)
	} else {
		c.logger.Debug("Mise à jour réussie (HTTP %d): %s", resp.StatusCode, resp.Body)
	}

	return nil
}
