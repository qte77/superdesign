# Superdesign

Fork of `hbmartin/secure-design` (originally `superdesigndev/superdesign`) — AI design agent VS Code extension. TypeScript stack (esbuild, eslint, vscode-test, node:test).

## License

Upstream dual-license: **AGPLv3 + Enterprise Commercial**. See `LICENSE`.

- Most files are AGPLv3.
- Files carrying `/* @license Enterprise */` at the top are commercially licensed and require a Super Design Enterprise subscription for production use.
- **New contributions**: default to AGPLv3. Add `// SPDX-License-Identifier: AGPL-3.0` header to new source files. Do **not** mark files Enterprise without explicit maintainer direction.

## Development

```bash
make validate        # typecheck + lint + compile + test (full gate)
make validate_quick  # typecheck + lint (fast gate for iteration)
make ralph_run ITERATIONS=5       # run ralph TDD loop
```bash

See `AGENTS.md` for agent role boundaries.

## TDD

Strict Red-Green-Refactor enforced per `.claude/rules/tdd-enforcement.md`. Each feature:

1. Write/adapt a failing test in `src/test/` first
2. Implement minimum code to make it pass
3. Refactor while keeping green

Test scripts in `package.json` (`test:llm`, `test:core`, etc.) run with `node:test` via compiled output in `dist-test/`.

## Stack

- **Runtime**: VS Code extension (`^1.90.0`)
- **Language**: TypeScript `^5.8.3`
- **Bundler**: esbuild
- **Tests**: node:test + vscode-test
- **AI providers**: Claude (Anthropic + Claude Code), OpenAI, OpenRouter, Google
- **UI**: React 19 webview with canvas-based design surface

## Agents

This fork maintains CC-native integration. Agent sessions should respect:

- The TDD rule above
- The file-level license split (AGPL vs Enterprise)
- `AGENTS.md` role boundaries when running team mode
