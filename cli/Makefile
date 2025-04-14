# Makefile for PierceFlare CLI

# Variables
APP_NAME = pierceflare-cli
APP_DIR = ./cmd/pierceflare-cli
DOCKER_TAG = pierceflare-cli
BUILD_DIR = ./bin
SERVICE_DIR = ../service
SWAGGER_OUTPUT_DIR = $(realpath .)/internal/gen/api
SWAGGER_SPEC_FILE = $(SWAGGER_OUTPUT_DIR)/swagger.json
SERVICE_PORT = 3000
SERVICE_URL = http://localhost:$(SERVICE_PORT)
OPENAPI_GENERATOR_VERSION = latest
OPENAPI_VERSION = $(shell yq e '.appVersion' ../.helm/service/Chart.yaml)

# Local compilation
.PHONY: build
build:
	@echo "Building CLI..."
	go build -o $(BUILD_DIR)/$(APP_NAME) $(APP_DIR)
	@echo "Build completed: $(BUILD_DIR)/$(APP_NAME)"

# Compilation with debug flags
.PHONY: build-debug
build-debug:
	@echo "Building CLI with debug symbols..."
	go build -gcflags="all=-N -l" -o $(BUILD_DIR)/$(APP_NAME) $(APP_DIR)
	@echo "Build completed: $(BUILD_DIR)/$(APP_NAME)"

# Docker image build
.PHONY: docker-build
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_TAG) -f Dockerfile .
	@echo "Docker image built: $(DOCKER_TAG)"

# Running CLI in one-shot mode
.PHONY: run-oneshot
run-oneshot: build
	@echo "Running CLI in one-shot mode..."
	$(BUILD_DIR)/$(APP_NAME) --force-ping

# Running CLI in continuous mode
.PHONY: run
run: build
	@echo "Running CLI in continuous mode..."
	$(BUILD_DIR)/$(APP_NAME)

# Installing oapi-codegen
.PHONY: install-oapi-codegen
install-oapi-codegen:
	@echo "Checking oapi-codegen installation..."
	@if ! which oapi-codegen > /dev/null; then \
		echo "Installing oapi-codegen $(OPENAPI_GENERATOR_VERSION)..."; \
		go install github.com/deepmap/oapi-codegen/cmd/oapi-codegen@$(OPENAPI_GENERATOR_VERSION); \
		echo "oapi-codegen successfully installed"; \
	else \
		echo "oapi-codegen already installed"; \
	fi

# Generating Go classes from OpenAPI documentation
# https://github.com/oapi-codegen/oapi-codegen?tab=readme-ov-file#for-go-124
.PHONY: gen-api
gen-api: install-oapi-codegen
	@echo "Generating Go classes from OpenAPI documentation..."
	@mkdir -p $(SWAGGER_OUTPUT_DIR)
	@echo "Retrieving service dependencies..."
	@cd $(SERVICE_DIR) && pnpm install --silent
	@echo "Running gen:openapi and retrieving OpenAPI document..."
	@cd $(SERVICE_DIR) && OPENAPI_VERSION=${OPENAPI_VERSION} pnpm run --silent gen:openapi > $(SWAGGER_SPEC_FILE)
	@echo "OpenAPI document generated: $(SWAGGER_SPEC_FILE)"
	@echo "Generating Go code with oapi-codegen..."
	@oapi-codegen -package api -generate client,types $(SWAGGER_SPEC_FILE) > $(SWAGGER_OUTPUT_DIR)/api.gen.go
	@echo "Go classes generation completed"

# Cleanup
.PHONY: clean
clean:
	@echo "Cleaning generated files..."
	rm -rf $(BUILD_DIR)
	rm -rf $(SWAGGER_OUTPUT_DIR)
	@echo "Cleanup completed"

# Help
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build         - Compile the CLI locally"
	@echo "  make build-debug   - Compile the CLI with debug symbols"
	@echo "  make docker-build  - Build the Docker image"
	@echo "  make run           - Run the CLI in continuous mode"
	@echo "  make run-oneshot   - Run the CLI in one-shot mode"
	@echo "  make gen-api       - Generate Go classes from OpenAPI documentation"
	@echo "  make clean         - Clean generated files"
	@echo "  make help          - Display this help"