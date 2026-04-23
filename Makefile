.PHONY: help validate validate_quick ralph_run ralph_run_worktree

.DEFAULT_GOAL := help

help:  ## Show available recipes
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

validate:  ## Full gate — typecheck + lint + compile + test
	npm run check-types
	npm run lint
	npm run compile
	npm run test

validate_quick:  ## Fast gate — typecheck + lint only
	npm run check-types
	npm run lint

ralph_run:  ## Run ralph TDD loop (override: ITERATIONS=N)
	cd ralph && ./scripts/ralph.sh $(ITERATIONS)

ralph_run_worktree:  ## Run ralph in worktree (override: BRANCH=name)
	cd ralph && ./scripts/ralph-in-worktree.sh $(BRANCH)
