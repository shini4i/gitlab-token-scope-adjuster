.DEFAULT_GOAL := help

.PHONY: help
help: ## Print this help
	@echo "Usage: make [target]"
	@grep -E '^[a-z.A-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST)  | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: run
run: ## run adjust-token-scope script
	@ts-node src/cli.ts -p $(PROJECT_ID)

.PHONY: test
test: ## run all test suites
	@npm test

.PHONY: test-coverage
test-coverage: ## run all test suites and generate coverage report
	@npm run coverage
