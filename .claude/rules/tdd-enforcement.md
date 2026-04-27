# TDD Enforcement

Strict Red-Green-Refactor for TypeScript. Applies to all `src/` contributions except pure docs, config, and build-system changes.

## The cycle

### 1. RED — failing test first

- Add or modify a test under `src/test/*.test.ts`
- Run the relevant `npm run test:*` script; confirm it **fails** for the expected reason
- Commit with `[RED] test: <what>` prefix if using ralph, or just `test: <what>` for manual work

### 2. GREEN — minimum implementation

- Implement the smallest change that makes the RED test pass
- Do not add extra features, abstractions, or polish in this step
- Run `make validate_quick` to keep iteration fast
- Commit with `[GREEN] feat: <what>` or `feat: <what>`

### 3. REFACTOR — while green

- Only after the test passes, improve structure (names, decomposition, types)
- Re-run `make validate` — must stay green the entire time
- Commit with `[REFACTOR] <scope>: <what>` or `refactor: <scope>: <what>`

## Rules

- **No implementation without a failing test.** Bug fixes require a regression test first.
- **No test without a concrete assertion.** Smoke tests that only call a function without asserting are insufficient.
- **One feature per cycle.** Don't batch multiple RED tests before going GREEN.
- **Validate before push.** `make validate` must pass on the branch head before `git push`.

## Test stack

- Framework: `node:test` (stdlib) for unit tests; `@vscode/test-electron` for integration tests via `npm run test`
- Location: `src/test/*.test.ts` mirroring the `src/` structure
- Compile: `tsc -p tsconfig.test.json` emits to `dist-test/`
- Run: `node dist-test/test/<name>.test.js` (wired from `package.json` scripts)

## Exceptions

Phase 0 scaffold commits (this PR) are exempt from RED-first since they create the scaffolding itself. All subsequent work is under this rule.
