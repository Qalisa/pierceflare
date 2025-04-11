package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/qalisa/pierceflare/cli/internal/api"
	"github.com/qalisa/pierceflare/cli/internal/config"
	"github.com/qalisa/pierceflare/cli/internal/ip"
	"github.com/qalisa/pierceflare/cli/internal/logger"
)

// validateArgs vérifie que les arguments passés sont valides
func validateArgs() {
	if len(os.Args) > 1 {
		validArgs := map[string]bool{
			"--force-ping": true,
		}

		// Vérifier chaque argument
		for i := 1; i < len(os.Args); i++ {
			if !validArgs[os.Args[i]] {
				fmt.Printf("[PierceFlare CLI] - Erreur: Argument non reconnu '%s'\n", os.Args[i])
				fmt.Println("Arguments valides: --force-ping")
				os.Exit(1)
			}
		}
	}
}

func main() {
	// Validation des arguments
	validateArgs()

	// Initialisation de la configuration
	cfg, err := config.New()
	if err != nil {
		fmt.Printf("[PierceFlare CLI] - Erreur: %v\n", err)
		os.Exit(1)
	}

	// Initialisation du logger
	log := logger.New(cfg.LogTimestamp)
	log.LogT("Client en démarrage...")
	log.LogT("URL du serveur: %s", cfg.ServerURL)
	log.LogT("Intervalle de vérification: %s", cfg.CheckInterval)

	// Initialisation du client API
	apiClient := api.NewClient(cfg.APIKey, cfg.ServerURL, log)

	// Vérification de la validité du token
	if err := apiClient.CheckTokenValidity(); err != nil {
		log.LogT("Erreur: %v", err)
		os.Exit(1)
	}

	// Initialisation du récupérateur d'IP
	ipRetriever := ip.NewRetriever(log)

	// Mode d'exécution
	if cfg.OneShotMode || len(os.Args) > 1 && os.Args[1] == "--force-ping" {
		runOneShot(log, apiClient, ipRetriever)
	} else {
		runContinuous(log, apiClient, ipRetriever, cfg.CheckInterval)
	}
}

// runOneShot exécute une seule vérification d'IP et mise à jour
func runOneShot(log *logger.Logger, apiClient *api.Client, ipRetriever *ip.Retriever) {
	log.LogT("Exécution en mode one-shot - envoi immédiat du ping")

	currentIP, err := ipRetriever.GetCurrentIP()
	if err != nil {
		log.LogT("Erreur lors de la récupération de l'adresse IP: %v", err)
		os.Exit(1)
	}

	if err := apiClient.SendIPUpdate(currentIP); err != nil {
		log.LogT("Erreur lors de l'envoi de la mise à jour IP: %v", err)
		os.Exit(1)
	}

	log.LogT("Mise à jour IP effectuée avec succès")
}

// runContinuous exécute une surveillance continue avec des mises à jour périodiques
func runContinuous(log *logger.Logger, apiClient *api.Client, ipRetriever *ip.Retriever, interval time.Duration) {
	log.LogT("Exécution en mode continu")

	// Gestion des signaux pour une terminaison propre
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Canal pour les vérifications périodiques
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Dernière IP envoyée
	var lastSentIP string

	// Vérification initiale
	processIPCheck(log, apiClient, ipRetriever, &lastSentIP)

	// Boucle principale
	for {
		select {
		case <-ticker.C:
			// Vérification périodique
			processIPCheck(log, apiClient, ipRetriever, &lastSentIP)
		case sig := <-sigChan:
			// Terminaison propre
			log.LogT("Signal reçu: %v, arrêt en cours...", sig)
			return
		}
	}
}

// processIPCheck vérifie l'IP actuelle et l'envoie si elle a changé
func processIPCheck(log *logger.Logger, apiClient *api.Client, ipRetriever *ip.Retriever, lastSentIP *string) {
	currentIP, err := ipRetriever.GetCurrentIP()
	if err != nil {
		log.LogT("Erreur lors de la récupération de l'adresse IP: %v", err)
		return
	}

	// Vérification si l'IP a changé
	if currentIP != *lastSentIP {
		if *lastSentIP != "" {
			log.LogT("Adresse IP modifiée: %s -> %s", *lastSentIP, currentIP)
		} else {
			log.LogT("IP initiale détectée: %s", currentIP)
		}

		if err := apiClient.SendIPUpdate(currentIP); err != nil {
			log.LogT("Échec de la mise à jour de l'IP sur le serveur: %v", err)
			return
		}

		*lastSentIP = currentIP
	} else {
		log.LogT("Adresse IP inchangée (%s). Aucune mise à jour nécessaire.", currentIP)
	}
}
