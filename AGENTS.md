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
- Infra runbooks and policies: /docs/infra/\*.md.
- Hooks/quality gates: lefthook.yml (pre-commit / pre-push).

## PR/commit hygiene

- Isolate structural tidying from behavior changes and test separately.
- Provide a concise rationale for behavior changes; mention assumptions.
- Use commitlint conventions (enforced by lefthook).

## Directory-Level AGENTS.md Precedence (Mandatory)

When performing any task inside a specific directory (e.g., /frontend, /backend, /infra), you MUST:

1. Locate the nearest AGENTS.md file in the current working directory or its parent directories.
2. Read and apply that AGENTS.md before making any changes.
3. Treat directory-level AGENTS.md as higher priority than the root AGENTS.md for that scope.

Precedence Rules:

- The closest AGENTS.md to the file being modified takes priority.
- If a rule in a stack-level AGENTS.md conflicts with the root AGENTS.md, the stack-level rule overrides for that stack.
- You must not assume global rules apply if a more specific AGENTS.md exists.

Operational Requirement:
Before modifying any file, explicitly verify:

- Which AGENTS.md governs this directory?
- What constraints, commands, and prohibitions are defined there?

Failure to consult the nearest AGENTS.md is considered a policy violation.
