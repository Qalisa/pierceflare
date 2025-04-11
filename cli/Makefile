# Makefile pour le CLI PierceFlare

# Variables
APP_NAME = pierceflare-cli
APP_DIR = ./cmd/pierceflare-cli
DOCKER_TAG = pierceflare-cli
BUILD_DIR = ./bin

# Compilation locale
.PHONY: build
build:
	@echo "Compilation du CLI..."
	go build -o $(BUILD_DIR)/$(APP_NAME) $(APP_DIR)
	@echo "Compilation terminée : $(BUILD_DIR)/$(APP_NAME)"

# Compilation avec flags de débogage
.PHONY: build-debug
build-debug:
	@echo "Compilation du CLI avec symboles de débogage..."
	go build -gcflags="all=-N -l" -o $(BUILD_DIR)/$(APP_NAME) $(APP_DIR)
	@echo "Compilation terminée : $(BUILD_DIR)/$(APP_NAME)"

# Construction de l'image Docker
.PHONY: docker-build
docker-build:
	@echo "Construction de l'image Docker..."
	docker build -t $(DOCKER_TAG) -f Dockerfile .
	@echo "Image Docker construite : $(DOCKER_TAG)"

# Exécution du CLI en mode one-shot
.PHONY: run-oneshot
run-oneshot: build
	@echo "Exécution du CLI en mode one-shot..."
	$(BUILD_DIR)/$(APP_NAME) --force-ping

# Exécution du CLI en mode continu
.PHONY: run
run: build
	@echo "Exécution du CLI en mode continu..."
	$(BUILD_DIR)/$(APP_NAME)

# Nettoyage
.PHONY: clean
clean:
	@echo "Nettoyage des fichiers générés..."
	rm -rf $(BUILD_DIR)
	@echo "Nettoyage terminé"

# Aide
.PHONY: help
help:
	@echo "Commandes disponibles :"
	@echo "  make build         - Compile le CLI localement"
	@echo "  make build-debug   - Compile le CLI avec symboles de débogage"
	@echo "  make docker-build  - Construit l'image Docker"
	@echo "  make run           - Exécute le CLI en mode continu"
	@echo "  make run-oneshot   - Exécute le CLI en mode one-shot"
	@echo "  make clean         - Nettoie les fichiers générés"
	@echo "  make help          - Affiche cette aide"