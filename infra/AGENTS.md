# Infra AGENTS

## Setup + commands (source: root package.json, infra docs)
- Dev up (all layers): `pnpm run docker:all:dev:up`
- Dev down (all layers): `pnpm run docker:all:dev:down`
- Layer-specific dev up/down:
  - Infrastructure: `pnpm run docker:infrastructure:dev:up|down`
  - Application: `pnpm run docker:application:dev:up|down`
  - Monitoring: `pnpm run docker:monitoring:dev:up|down`
  - Gateway: `pnpm run docker:gateway:dev:up|down`
- Blue-Green (dev): `pnpm run deploy:application:dev:prepare|finalize|full`
- Local UID/GID sync: `pnpm run setup:dev-env`

## IaC toolchain
- Docker Compose is the primary tool.
- Plan/validate/apply: UNKNOWN (no Terraform/Helm/Kustomize found).
  - Safe discovery: search for `*.tf`, `helm`, or `kustomize` in the repo and check infra docs.

## Safety policy
- Default to dev scripts; do not run production commands without explicit approval.
- Never run destructive operations (volume deletes, prod DB resets) without approval.
- Keep secrets out of git; use server-side .env files and Secrets sync.

## Environment boundaries
- Dev vs prod compose files are separate in each layer.
- Production is managed under `${HOME}/srv/web_project` with layer-specific .env files.

## Directory conventions
- [infra/application](infra/application): FE dist + BE services (Blue-Green)
- [infra/gateway](infra/gateway): Nginx gateway + Certbot
- [infra/infrastructure](infra/infrastructure): MySQL and base network
- [infra/monitoring](infra/monitoring): Prometheus/Grafana/Loki/Alertmanager

## CI/CD interplay
- GitHub Actions workflows deploy each layer independently.
- Application deploys use `infra/deploy-blue-green.sh` (prepare → gateway → finalize).

## Do not
- Do not apply production changes without a plan and explicit approval.
- Do not edit .env.prod files in git.
- Do not change network/volume names without updating all layers and docs.
