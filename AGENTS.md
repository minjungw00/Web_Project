# AGENTS.md (Root)

Global rules for AI agents working in this monorepo.

## Repository Scope

- `/frontend`: React + TypeScript + Vite application
- `/backend`: Spring Boot (Gradle) service
- `/infra`: Docker Compose-based infrastructure and deployment scripts
- `/docs`: human-oriented reference documentation

## Rule Resolution (Mandatory)

Before editing any file, use the nearest `AGENTS.md` in this order:

1. Check the file's directory.
2. Walk up parent directories until the repository root.

Path reference rule:

- When referring to rule files in prompts/agent context, use workspace-relative paths (e.g. `AGENTS.md`, `frontend/AGENTS.md`).
- Avoid leading `/` paths (e.g. `/AGENTS.md`) because some agent runtimes may treat them as special/typed references and fail to resolve context.

Precedence:

- Nearest file wins.
- Stack-level `AGENTS.md` overrides root rules for that stack.
- If no closer file exists, this root file applies.

## Execution Contract

- Use only commands defined in executable sources (`package.json`, Gradle tasks, CI workflows, compose scripts).
- Keep diffs minimal and focused on the requested outcome.
- Separate mechanical tidy-up from behavior changes when possible.
- Never commit secrets, keys, tokens, or production credentials.

## Source of Truth Policy

- Treat `/docs` as reference.
- If `/docs` conflicts with executable config, follow executable config and note the discrepancy.

## Verification

- Validate behavior changes with existing project tooling (tests/build/lint/typecheck) at the smallest useful scope first.

## Test Scope Policy (Agents)

- Default to targeted tests related to changed files; do not run full-suite tests first.
- Use broad test runs only when targeted runs pass and broader confidence is required.
- In VS Code agent runs, prefer targeted execution by specific test name first (more stable than broad run in this workspace).
- If `Cannot find run action!` or file-filter resolution errors occur, do not jump to full-suite; retry with a narrower named test and stack-specific command below.
- When using `runTests(files=...)`, use workspace-relative paths (e.g. `frontend/src/App.test.tsx`, `backend/src/test/...`) instead of absolute paths.
- Preferred commands:
  - Frontend single/related test files: `pnpm run test:frontend:file -- <test-file-or-glob>`
  - Backend single test class/method: `pnpm run test:backend:class -- <ClassName or ClassName.methodName>`
  - Full monorepo tests (last step only): `pnpm run test`
