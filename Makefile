.PHONY: helm-docs
helm-docs: ## Generate Helm chart documentation
	docker run --rm --volume "$(PWD):/helm-docs" -u $(shell id -u) jnorwood/helm-docs:latest