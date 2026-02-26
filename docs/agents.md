# AGENTS Summary

This document is a quick reference for agent rules. The authoritative rules are in:

- `AGENTS.md` (global)
- `frontend/AGENTS.md`
- `backend/AGENTS.md`
- `infra/AGENTS.md`

Use workspace-relative paths when referencing rule files.
Avoid leading `/` paths (for example `/AGENTS.md`) because some agent runtimes can misinterpret them during context/variable parsing.

If rules conflict, the nearest stack-level `AGENTS.md` takes precedence.

## Global

- Follow nearest-file precedence.
- Use only executable source-of-truth commands.
- Keep changes minimal and focused.
- Never commit secrets.
- Run targeted tests first; full-suite test runs are a last step.
- If VS Code test run-action lookup fails, retry with narrower test scope instead of running all tests.
- `runTests(files=...)` 사용 시 절대 경로 대신 워크스페이스 상대 경로를 사용합니다.

## Frontend

- Use existing `pnpm` scripts (`dev`, `build`, `lint`, `typecheck`, `test`).
- Use `pnpm run test:frontend:file -- <test-file-or-glob>` for related test-only verification.
- Prefer TDD with current Vitest setup.
- Keep the existing `src` structure and shared API/UI boundaries.

## Backend

- Use Gradle wrapper tasks (`build`, `test`, `check`, `bootRun`, quality tasks).
- Use `pnpm run test:backend:class -- <ClassName or ClassName.methodName>` for targeted test runs.
- Maintain API base behavior (`/api`, `/api/actuator/*`).
- Use current Spring Boot/JUnit/H2 test stack; avoid framework churn.

## Infra

- Use root `pnpm` compose/deploy scripts for dev operations.
- Require explicit approval for production-impacting or destructive operations.
- Keep env-specific compose files and docs synchronized when flows change.
