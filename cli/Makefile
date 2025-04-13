# Makefile pour le CLI PierceFlare

# Variables
APP_NAME = pierceflare-cli
APP_DIR = ./cmd/pierceflare-cli
DOCKER_TAG = pierceflare-cli
BUILD_DIR = ./bin
SERVICE_DIR = ../service
SWAGGER_OUTPUT_DIR = ./internal/gen/api
SWAGGER_SPEC_FILE = $(SWAGGER_OUTPUT_DIR)/swagger.json
SERVICE_PORT = 3000
SERVICE_URL = http://localhost:$(SERVICE_PORT)
OPENAPI_GENERATOR_VERSION = latest

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

# Installation de oapi-codegen
.PHONY: install-oapi-codegen
install-oapi-codegen:
	@echo "Vérification de l'installation de oapi-codegen..."
	@if ! which oapi-codegen > /dev/null; then \
		echo "Installation de oapi-codegen $(OPENAPI_GENERATOR_VERSION)..."; \
		go install github.com/deepmap/oapi-codegen/cmd/oapi-codegen@$(OPENAPI_GENERATOR_VERSION); \
		echo "oapi-codegen installé avec succès"; \
	else \
		echo "oapi-codegen déjà installé"; \
	fi

# Génération des classes Go à partir de la documentation OpenAPI
# https://github.com/oapi-codegen/oapi-codegen?tab=readme-ov-file#for-go-124
.PHONY: gen-api
gen-api: install-oapi-codegen
	@echo "Génération des classes Go à partir de la documentation OpenAPI..."
	@mkdir -p $(SWAGGER_OUTPUT_DIR)
	@cd $(SERVICE_DIR) && pnpm install
	@cd $(SERVICE_DIR) && CANONICAL_URL=$(SERVICE_URL) SERVICE_AUTH_USERNAME=temp SERVICE_AUTH_PASSWORD=temp SERVICE_DATABASE_FILES_PATH=./db pnpm run dev & \
	PID=$$! && \
	echo "Service démarré avec PID: $$PID" && \
	echo "Attente du démarrage du service..." && \
	until curl -s $(SERVICE_URL)/swagger/doc > /dev/null; do sleep 1; done && \
	echo "Service disponible, extraction du document OpenAPI..." && \
	curl -s $(SERVICE_URL)/swagger/doc?pretty > $(SWAGGER_SPEC_FILE) && \
	kill $$PID && \
	echo "Document OpenAPI extrait: $(SWAGGER_SPEC_FILE)"
	@echo "Génération du code Go avec oapi-codegen..."
	@oapi-codegen -package api -generate client,types $(SWAGGER_SPEC_FILE) > $(SWAGGER_OUTPUT_DIR)/api.gen.go
	@echo "Génération des classes Go terminée"

# Nettoyage
.PHONY: clean
clean:
	@echo "Nettoyage des fichiers générés..."
	rm -rf $(BUILD_DIR)
	rm -rf $(SWAGGER_OUTPUT_DIR)
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
	@echo "  make gen-api       - Génère les classes Go à partir de la documentation OpenAPI"
	@echo "  make clean         - Nettoie les fichiers générés"
	@echo "  make help          - Affiche cette aide"