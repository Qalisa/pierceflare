package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config contient la configuration de l'application
type Config struct {
	APIKey        string
	ServerURL     string
	CheckInterval time.Duration
	OneShotMode   bool
	LogTimestamp  bool
}

// New crée une nouvelle configuration à partir des variables d'environnement
func New() (*Config, error) {
	cfg := &Config{
		APIKey:       os.Getenv("PIERCEFLARE_API_KEY"),
		ServerURL:    os.Getenv("PIERCEFLARE_SERVER_URL"),
		LogTimestamp: true,
		OneShotMode:  os.Getenv("PIERCEFLARE_ONE_SHOT") == "true",
	}

	// Vérification des variables obligatoires
	if cfg.APIKey == "" {
		return nil, fmt.Errorf("la variable d'environnement PIERCEFLARE_API_KEY n'est pas définie")
	}

	if cfg.ServerURL == "" {
		return nil, fmt.Errorf("la variable d'environnement PIERCEFLARE_SERVER_URL n'est pas définie")
	}

	// Lecture de l'intervalle de vérification
	checkIntervalStr := os.Getenv("PIERCEFLARE_CHECK_INTERVAL")
	if checkIntervalStr == "" {
		checkIntervalStr = "300" // Par défaut 5 minutes
	}

	checkIntervalSec, err := strconv.Atoi(checkIntervalStr)
	if err != nil {
		return nil, fmt.Errorf("intervalle de vérification invalide: %w", err)
	}

	cfg.CheckInterval = time.Duration(checkIntervalSec) * time.Second

	return cfg, nil
}
