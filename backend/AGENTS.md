# Backend AGENTS

## Setup + commands (source: root package.json, backend/build.gradle, lefthook.yml)

- Build: `cd backend && ./gradlew build`
- Run (dev): `cd backend && ./gradlew bootRun`
- Tests: `cd backend && ./gradlew test`
- Format: `cd backend && ./gradlew spotlessApply`
- Checkstyle: `cd backend && ./gradlew checkstyleMain checkstyleTest`
- SpotBugs: `cd backend && ./gradlew spotbugsMain spotbugsTest`

## TDD default policy (non-negotiable)

- Write tests first for new behavior.
- Follow Red → Green → Refactor.
- Do not ship changes without tests unless explicitly exempted.

## Tidy First + Augmented Coding rules

- Keep refactors separate from behavior changes; small diffs.
- Prefer clarity over cleverness; avoid speculative edits.
- Verify changes with tests and quality checks.

## Architecture constraints

- Spring Boot app with context path `/api` (see application.properties).
- Existing packages:
  - `com.minjungw00.backend.db` (DB health controller)
  - `com.minjungw00.backend.temp` (temporary health controller)
- Keep new controllers under feature packages within `com.minjungw00.backend.*`.
- Avoid bypassing the context path or actuator base path (`/api/actuator/*`).

## DB / config policy

- Production DB credentials must be provided via env vars (no defaults).
- Tests use H2 in-memory DB (see test application.properties).
- If schema changes are needed, document and coordinate with infra runbooks.

## DB migrations policy

- UNKNOWN (no migration tool config found).
- Safe discovery: search the repo for Flyway/Liquibase config or check CI workflows for migration steps.

## Directory conventions

- Main: [backend/src/main/java](backend/src/main/java)
- Tests: [backend/src/test/java](backend/src/test/java)
- Resources: [backend/src/main/resources](backend/src/main/resources)

## Testing policy

- JUnit via Spring Boot test starter.
- Unit tests: isolate pure logic (no Spring context) where possible.
- Integration tests: use Spring Boot test support with H2 in-memory DB (see test application.properties).
- Controller tests: use Spring test utilities from `spring-boot-starter-test` when verifying web layer behavior.
- Determinism: no real network calls; mock external boundaries.
- Data setup: keep fixtures small and explicit; prefer builder helpers over shared mutable state.
- Naming: keep JUnit classes aligned with production class names (e.g., `FooServiceTests`).

## Do not

- Do not change public API paths without updating gateway/proxy configs.
- Do not commit secrets or .env files.
- Do not skip Spotless/Checkstyle/SpotBugs in CI-related changes.
