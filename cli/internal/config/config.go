package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/qalisa/pierceflare/cli/internal/logger"
)

const (
	// MinCheckInterval est l'intervalle minimum de vérification en secondes
	MinCheckInterval = 10
	// DefaultCheckInterval est l'intervalle par défaut de vérification en secondes
	DefaultCheckInterval = 300 // 5 minutes
)

// Config contient la configuration de l'application
type Config struct {
	APIKey        string
	ServerURL     string
	CheckInterval time.Duration
	OneShotMode   bool
	LogTimestamp  bool
	LogLevel      logger.LogLevel
	SuccessPeriod int  // Nombre d'exécutions réussies entre chaque log de succès (0 = log chaque succès)
	DummyUpdates  bool // Envoyer des mises à jour même si l'IP n'a pas changé
}

// New crée une nouvelle configuration à partir des variables d'environnement
func New() (*Config, error) {
	cfg := &Config{
		APIKey:       os.Getenv("PIERCEFLARE_API_KEY"),
		ServerURL:    os.Getenv("PIERCEFLARE_SERVER_URL"),
		LogTimestamp: true,
		OneShotMode:  os.Getenv("PIERCEFLARE_ONE_SHOT") == "true",
		LogLevel:     logger.LogLevelInfo,                              // Par défaut, niveau INFO
		DummyUpdates: os.Getenv("PIERCEFLARE_DUMMY_UPDATES") == "true", // Par défaut désactivé
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
		checkIntervalStr = strconv.Itoa(DefaultCheckInterval) // Par défaut 5 minutes
	}

	checkIntervalSec, err := strconv.Atoi(checkIntervalStr)
	if err != nil {
		return nil, fmt.Errorf("intervalle de vérification invalide: %w", err)
	}

	// Vérification que l'intervalle n'est pas inférieur au minimum requis
	if checkIntervalSec < MinCheckInterval {
		fmt.Printf("[PierceFlare CLI] - Avertissement: Intervalle de vérification (%d s) inférieur au minimum recommandé. Utilisation de %d secondes.\n",
			checkIntervalSec, MinCheckInterval)
		checkIntervalSec = MinCheckInterval
	}

	cfg.CheckInterval = time.Duration(checkIntervalSec) * time.Second

	// Configuration du niveau de log
	logLevelStr := strings.ToLower(os.Getenv("PIERCEFLARE_LOG_LEVEL"))
	switch logLevelStr {
	case "error":
		cfg.LogLevel = logger.LogLevelError
	case "info":
		cfg.LogLevel = logger.LogLevelInfo
	case "debug":
		cfg.LogLevel = logger.LogLevelDebug
	case "":
		// Utilise la valeur par défaut (INFO)
	default:
		return nil, fmt.Errorf("niveau de log invalide: %s (valeurs valides: error, info, debug)", logLevelStr)
	}

	// Configuration de la période des logs de succès
	successPeriodStr := os.Getenv("PIERCEFLARE_SUCCESS_LOG_PERIOD")
	if successPeriodStr == "" {
		cfg.SuccessPeriod = 10 // Par défaut, affiche un message de succès toutes les 10 exécutions réussies
	} else {
		successPeriod, err := strconv.Atoi(successPeriodStr)
		if err != nil {
			return nil, fmt.Errorf("période de logs de succès invalide: %w", err)
		}
		cfg.SuccessPeriod = successPeriod
	}

	return cfg, nil
}
