# AGENTS.md (Infra)

## Scope

Applies to `/infra/**` and root infra-related scripts in `package.json`.

## Baseline Stack Facts

- Deployment model: Docker Compose layers (`infrastructure`, `application`, `monitoring`, `gateway`)
- Main helper script: `infra/deploy-blue-green.sh`
- Env merge helper: `scripts/compose-with-env.mjs`
- Primary local environment: `dev` (`infra/.env.server.dev` + layer-specific `.env` files)

## Standard Commands (from repository root)

- Start all dev layers: `pnpm run docker:all:dev:up`
- Stop all dev layers: `pnpm run docker:all:dev:down`
- Start one layer: `pnpm run docker:<layer>:dev:up`
- Stop one layer: `pnpm run docker:<layer>:dev:down`
- Prepare blue-green deploy: `pnpm run deploy:application:dev:prepare`
- Finalize blue-green deploy: `pnpm run deploy:application:dev:finalize`
- Full blue-green deploy: `pnpm run deploy:application:dev:full`

Available layer keys: `infrastructure`, `application`, `monitoring`, `gateway`.

## Safety Rules

- Default to read-only review when scope is unclear.
- Explicit approval is required before any production-impacting operation.
- Treat volume removal, data reset, and network teardown as destructive operations.
- Never commit real secrets; only use example or template env files in git.

## Working Rules

- Keep Compose changes environment-specific (`*.dev.yml` vs `*.prod.yml`) and avoid cross-environment drift.
- Keep deployment script changes backward-compatible with existing CI and manual run flow.
- Update related `infra/**/README.md` when command flows or required env keys change.

## Do Not

- Do not change prod defaults, host paths, or TLS behavior without explicit approval.
- Do not hardcode machine-specific absolute paths into Compose or scripts.
