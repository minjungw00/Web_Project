# AGENTS

## Project overview
- Monorepo for a personal web service: React/Vite frontend, Spring Boot backend, Docker-based infra.
- Blue-Green deployment and observability are first-class concerns.
- Docs in /docs define infra architecture, runbooks, and security.

## Monorepo map
- /frontend: React + TypeScript (Vite)
- /backend: Spring Boot (Java 21)
- /infra: Docker Compose layers and deploy scripts
- /docs: architecture/runbooks/security/monitoring

## Global rules
- Keep changes minimal, focused, and reversible; avoid speculative edits.
- Never commit secrets or production .env files; only commit templates/examples.
- Prefer existing scripts and documented procedures; do not invent new workflows.
- Verify changes with the stack-appropriate checks and tests.
- Separate refactors from behavior changes (Tidy First); keep PRs small.
- If a stack-level AGENTS.md conflicts with this file, the stack-level file wins.

## Command discovery (source of truth)
- Root scripts: package.json (pnpm workspace commands).
- Stack docs: /frontend/README.md, /backend/README.md, /infra/README.md.
- Infra runbooks and policies: /docs/infra/*.md.
- Hooks/quality gates: lefthook.yml (pre-commit / pre-push).

## PR/commit hygiene
- Isolate structural tidying from behavior changes and test separately.
- Provide a concise rationale for behavior changes; mention assumptions.
- Use commitlint conventions (enforced by lefthook).
