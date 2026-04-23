# Agent Role Boundaries

Team-mode agent roles for Superdesign contribution sessions. Each role has a scoped mandate; cross-role work requires explicit hand-off.

## Architect

- Owns: `src/types/`, `src/providers/` interfaces, ADR docs under `docs/adr/`
- Writes: type signatures, provider contracts, high-level design notes
- Does not: implement concrete providers or UI
- Hand-off: produces a tracked spec before developer implements

## Developer

- Owns: `src/services/`, `src/providers/` implementations, `src/test/`
- Writes: TDD-cycle code — RED test first, GREEN impl, REFACTOR
- Runs: `make validate` before every commit; no commit without green
- Does not: design new provider interfaces without architect sign-off

## Reviewer

- Owns: PR review comments, `make validate` regression checks, acceptance-criteria verification
- Writes: review feedback, approves/requests-changes
- Runs: `make validate` on PR branch; verifies no new `dist-test/` test failures
- Does not: write feature code in the same session

## Shared rules

- Respect the license split: only maintainers mark files `/* @license Enterprise */`
- No changes to existing `src/` code in Phase 0 scaffold PRs
- All three agents must follow `.claude/rules/tdd-enforcement.md`

## Orchestration

Ralph TDD loop drives the developer role; architect seeds the PRD; reviewer gates merge. See `ralph/docs/prd.md` once the ralph submodule is initialized.
