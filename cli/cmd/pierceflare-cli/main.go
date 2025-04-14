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

// validateArgs checks that the passed arguments are valid
func validateArgs() {
	if len(os.Args) > 1 {
		validArgs := map[string]bool{
			"--force-ping": true,
		}

		// Check each argument
		for i := 1; i < len(os.Args); i++ {
			if !validArgs[os.Args[i]] {
				fmt.Printf("[PierceFlare CLI] - Error: Unrecognized argument '%s'\n", os.Args[i])
				fmt.Println("Valid arguments: --force-ping")
				os.Exit(1)
			}
		}
	}
}

func main() {
	// Validate arguments
	validateArgs()

	// Initialize configuration
	cfg, err := config.New()
	if err != nil {
		fmt.Printf("[PierceFlare CLI] - Error: %v\n", err)
		os.Exit(1)
	}

	// Initialize logger
	log := logger.New(cfg.LogTimestamp, cfg.LogLevel, cfg.SuccessPeriod)

	// In verbose mode (info or higher), display startup information
	log.Info("Client starting...")
	log.Debug("Server URL: %s", cfg.ServerURL)
	log.Debug("Check interval: %s", cfg.CheckInterval)
	log.Debug("Verbosity level: %d", cfg.LogLevel)
	log.Debug("Success log period: %d executions", cfg.SuccessPeriod)

	// Display a message if dummy updates mode is enabled
	if cfg.DummyUpdates {
		log.Info("Dummy updates mode (PIERCEFLARE_DUMMY_UPDATES) enabled - Updates will be sent to server with no intent to propagate to Cloudflare's API")
	}

	// Initialize API client
	apiClient := api.NewClient(cfg.APIKey, cfg.ServerURL, log)

	// Check token validity
	if err := apiClient.CheckTokenValidity(); err != nil {
		log.Error("Token validation error: %v", err)
		os.Exit(1)
	}

	log.Debug("API token valid")

	// Initialize IP retriever
	ipRetriever := ip.NewRetriever(log)

	// Execution mode
	if cfg.OneShotMode || len(os.Args) > 1 && os.Args[1] == "--force-ping" {
		runOneShot(log, apiClient, ipRetriever)
	} else {
		runContinuous(log, apiClient, ipRetriever, cfg.CheckInterval)
	}
}

// runOneShot executes a single IP check and update
func runOneShot(log *logger.Logger, apiClient *api.Client, ipRetriever *ip.Retriever) {
	log.Info("Running in one-shot mode - sending immediate ping")

	currentIP, err := ipRetriever.GetCurrentIP()
	if err != nil {
		log.Error("Error retrieving IP address: %v", err)
		os.Exit(1)
	}

	log.Debug("Current IP address: %s", currentIP)

	// In force-ping mode, never send a dummy request (always a real update)
	if err := apiClient.SendIPUpdate(currentIP, false); err != nil {
		log.Error("Error sending IP update: %v", err)
		os.Exit(1)
	}

	log.Info("IP update successful")
}

// runContinuous executes continuous monitoring with periodic updates
func runContinuous(log *logger.Logger, apiClient *api.Client, ipRetriever *ip.Retriever, interval time.Duration) {
	log.Info("Running in continuous mode")
	log.Debug("Interval between checks: %s", interval)

	// Signal handling for graceful termination
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Channel for periodic checks
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Last sent IP
	var lastSentIP string

	// Initial check
	processIPCheck(log, apiClient, ipRetriever, &lastSentIP)

	// Main loop
	for {
		select {
		case <-ticker.C:
			// Periodic check
			processIPCheck(log, apiClient, ipRetriever, &lastSentIP)
		case sig := <-sigChan:
			// Graceful termination
			log.Info("Signal received: %v, shutting down...", sig)
			return
		}
	}
}

// processIPCheck checks the current IP and sends it if it has changed or if dummy updates are enabled
func processIPCheck(log *logger.Logger, apiClient *api.Client, ipRetriever *ip.Retriever, lastSentIP *string) {
	currentIP, err := ipRetriever.GetCurrentIP()
	if err != nil {
		log.Error("Error retrieving IP address: %v", err)
		return
	}

	log.Debug("IP check: current=%s, last=%s", currentIP, *lastSentIP)

	// Retrieve configuration to check DummyUpdates option
	cfg, _ := config.New()

	// If DummyUpdates is enabled, always send a dummy update
	if cfg.DummyUpdates {
		log.Info("Sending a test update (PIERCEFLARE_DUMMY_UPDATES mode enabled)")

		// Send a dummy (test) update
		if err := apiClient.SendIPUpdate(currentIP, true); err != nil {
			log.Error("Failed to send test update to server: %v", err)
			return
		}

		log.Info("Test update successful")
		return
	}

	// Check if the IP has changed
	ipChanged := currentIP != *lastSentIP

	if ipChanged {
		if *lastSentIP != "" {
			log.Info("IP address changed: %s -> %s", *lastSentIP, currentIP)
		} else {
			log.Info("Initial IP detected: %s", currentIP)
		}

		// Send a real (not dummy) update
		if err := apiClient.SendIPUpdate(currentIP, false); err != nil {
			log.Error("Failed to update IP on server: %v", err)
			return
		}

		*lastSentIP = currentIP
		log.Info("IP update successful")
	} else {
		// Periodic log to indicate everything is working normally
		log.LogSuccess("IP unchanged (%s) - Connection with PierceFlare server maintained", currentIP)
		log.Debug("IP address unchanged (%s). No update needed.", currentIP)
	}
}
