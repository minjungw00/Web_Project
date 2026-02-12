# Frontend AGENTS

## Setup + commands (source: frontend/package.json, root package.json)

- Install (workspace): `pnpm install`
- Dev server: `pnpm --filter ./frontend dev`
- Build: `pnpm --filter ./frontend build`
- Preview: `pnpm --filter ./frontend preview`
- Lint: `pnpm --filter ./frontend lint`
- Lint (fix): `pnpm --filter ./frontend lint:fix`
- Format: `pnpm --filter ./frontend format`
- Typecheck: `pnpm --filter ./frontend typecheck`
- Tests: UNKNOWN (no test script found)
  - Safe discovery: check frontend/package.json scripts, CI workflows, or add a test runner only with explicit approval.

## TDD default policy (non-negotiable)

- Write tests first for new behavior.
- Follow Red → Green → Refactor.
- Do not ship changes without tests unless explicitly exempted.

## Tidy First + Augmented Coding rules

- Separate refactors from behavior changes; keep diffs small.
- Prefer clarity over cleverness; document assumptions.
- Verify by tests and lint/typecheck before handing off.
- Ask for missing info only when blocked; avoid speculative edits.

## Coding standards

- ESLint config is auto-generated; do not edit [frontend/eslint.config.js](frontend/eslint.config.js).
- Prettier is enforced; format with `pnpm --filter ./frontend format`.
- TypeScript strict mode is enabled; respect `@/*` path alias (tsconfig).

## Directory conventions

- Source root: [frontend/src](frontend/src)
- Entry points: [frontend/src/main.tsx](frontend/src/main.tsx), [frontend/src/App.tsx](frontend/src/App.tsx)
- Assets: [frontend/src/assets](frontend/src/assets)

## Architecture constraints

- Backend API is accessed via `/api` (see backend context-path); keep client requests aligned with that prefix.
- No documented state management layer; keep logic lightweight in components unless a shared layer is introduced deliberately.

## Testing policy

- Test tooling is not configured in package scripts.
- If you add tests, define the runner and scripts explicitly and keep them documented here.

## Do not

- Do not bypass lint/typecheck/formatting hooks.
- Do not disable strict TypeScript rules.
- Do not change toolchain versions or eslint/prettier configs without explicit approval.
