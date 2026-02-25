# AGENTS.md (Frontend)

## Scope

Applies to `/frontend/**`.

## Standard Commands

Run from `/frontend` unless noted.

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Lint (fix): `pnpm lint:fix`
- Format: `pnpm format`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`
- Test (CI): `pnpm test:ci`
- Test (single/related files): `pnpm test:file -- <test-file-or-glob>`

From repo root, equivalents exist (for example `pnpm --filter ./frontend build` or `pnpm run build:frontend`).

## Working Rules

- Prefer TDD for behavior changes (Red → Green → Refactor) using existing Vitest setup.
- Run only impacted test files first; avoid `pnpm test:ci` full runs unless needed for broader validation.
- Keep changes localized and avoid introducing new frameworks or toolchain replacements.
- Do not weaken ESLint/TypeScript rules to make checks pass.
- Keep refactors and behavior changes separated when practical.

## Current Structure Conventions

- App bootstrap and routing live in `src/app`.
- Domain/use-case logic is organized under `src/application`.
- Shared API modules live in `src/shared/api`.
- Reusable UI and styling primitives live in `src/shared/ui` and `src/shared/styles`.
- Keep using existing top-level structure (`app`, `application`, `entities`, `features`, `pages`, `shared`).

## Do Not

- Do not replace `vite`, `vitest`, `eslint`, or `typescript` tooling without explicit approval.
- Do not introduce breaking route/API contract changes without documenting impact.
- Do not commit secrets or environment credentials.
