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
	log := logger.New(cfg.LogTimestamp, cfg.LogLevel, cfg.SuccessPeriod)

	// En mode verbose (info ou plus), on affiche les informations de démarrage
	log.Info("Client en démarrage...")
	log.Debug("URL du serveur: %s", cfg.ServerURL)
	log.Debug("Intervalle de vérification: %s", cfg.CheckInterval)
	log.Debug("Niveau de verbosité: %d", cfg.LogLevel)
	log.Debug("Période des logs de succès: %d exécutions", cfg.SuccessPeriod)

	// Affichage d'un message si le mode de mises à jour factices est activé
	if cfg.DummyUpdates {
		log.Info("Mode de mises à jour factices (PIERCEFLARE_DUMMY_UPDATES) activé - Des mises à jour seront envoyées même si l'IP ne change pas")
	}

	// Initialisation du client API
	apiClient := api.NewClient(cfg.APIKey, cfg.ServerURL, log)

	// Vérification de la validité du token
	if err := apiClient.CheckTokenValidity(); err != nil {
		log.Error("Erreur de validation du token: %v", err)
		os.Exit(1)
	}

	log.Debug("Token API valide")

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
	log.Info("Exécution en mode one-shot - envoi immédiat du ping")

	currentIP, err := ipRetriever.GetCurrentIP()
	if err != nil {
		log.Error("Erreur lors de la récupération de l'adresse IP: %v", err)
		os.Exit(1)
	}

	log.Debug("Adresse IP actuelle: %s", currentIP)

	// En mode force-ping, on n'envoie jamais de requête dummy (toujours une mise à jour réelle)
	if err := apiClient.SendIPUpdate(currentIP, false); err != nil {
		log.Error("Erreur lors de l'envoi de la mise à jour IP: %v", err)
		os.Exit(1)
	}

	log.Info("Mise à jour IP effectuée avec succès")
}

// runContinuous exécute une surveillance continue avec des mises à jour périodiques
func runContinuous(log *logger.Logger, apiClient *api.Client, ipRetriever *ip.Retriever, interval time.Duration) {
	log.Info("Exécution en mode continu")
	log.Debug("Intervalle entre vérifications: %s", interval)

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
			log.Info("Signal reçu: %v, arrêt en cours...", sig)
			return
		}
	}
}

// processIPCheck vérifie l'IP actuelle et l'envoie si elle a changé ou si les mises à jour factices sont activées
func processIPCheck(log *logger.Logger, apiClient *api.Client, ipRetriever *ip.Retriever, lastSentIP *string) {
	currentIP, err := ipRetriever.GetCurrentIP()
	if err != nil {
		log.Error("Erreur lors de la récupération de l'adresse IP: %v", err)
		return
	}

	log.Debug("Vérification de l'IP: actuelle=%s, dernière=%s", currentIP, *lastSentIP)

	// Vérification si l'IP a changé ou si le mode de mises à jour factices est activé
	cfg, _ := config.New() // Récupérer la configuration pour vérifier l'option DummyUpdates
	ipChanged := currentIP != *lastSentIP

	// Si l'IP a changé, on envoie toujours une vraie mise à jour
	// Si l'IP n'a pas changé mais que DummyUpdates est activé, on envoie une mise à jour factice (dummy=true)
	if ipChanged {
		if *lastSentIP != "" {
			log.Info("Adresse IP modifiée: %s -> %s", *lastSentIP, currentIP)
		} else {
			log.Info("IP initiale détectée: %s", currentIP)
		}

		// Envoi d'une mise à jour réelle (not dummy)
		if err := apiClient.SendIPUpdate(currentIP, false); err != nil {
			log.Error("Échec de la mise à jour de l'IP sur le serveur: %v", err)
			return
		}

		*lastSentIP = currentIP
		log.Info("Mise à jour IP effectuée avec succès")
	} else if cfg.DummyUpdates {
		log.Info("Envoi d'une mise à jour de test (mode PIERCEFLARE_DUMMY_UPDATES activé)")

		// Envoi d'une mise à jour dummy (test)
		if err := apiClient.SendIPUpdate(currentIP, true); err != nil {
			log.Error("Échec de la mise à jour de test sur le serveur: %v", err)
			return
		}

		log.Info("Mise à jour de test effectuée avec succès")
	} else {
		// Log périodique pour indiquer que tout fonctionne normalement
		log.LogSuccess("IP inchangée (%s) - Connexion avec le serveur PierceFlare maintenue", currentIP)
		log.Debug("Adresse IP inchangée (%s). Aucune mise à jour nécessaire.", currentIP)
	}
}
