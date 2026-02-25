# AGENTS.md (Backend)

## Scope

Applies to `/backend/**`.

## Baseline Stack Facts

- Build tool: Gradle wrapper (`./gradlew`)
- Java toolchain: 21
- Framework: Spring Boot 3.x
- Servlet context path: `/api` (`server.servlet.context-path=/api`)
- Actuator base path: `/actuator` (effective endpoint prefix: `/api/actuator/*`)

## Standard Commands

Run from `/backend` unless noted.

- Build: `./gradlew build`
- Run app: `./gradlew bootRun`
- Test: `./gradlew test`
- Test (single class/method): `./gradlew test --tests <ClassName or ClassName.methodName>`
- Full checks: `./gradlew check`
- Formatting: `./gradlew spotlessApply`
- Formatting check: `./gradlew spotlessCheck`
- Checkstyle: `./gradlew checkstyleMain checkstyleTest`
- SpotBugs: `./gradlew spotbugsMain spotbugsTest`

From repo root, equivalent shortcuts exist in `package.json` (for example `pnpm run build:backend`).

## Working Rules

- Prefer TDD for behavior changes (Red → Green → Refactor).
- Keep tests deterministic and scoped to the smallest effective level.
- Run targeted `--tests` first; run full `./gradlew test` only when broader confidence is required.
- Use existing test setup (`spring-boot-starter-test`, JUnit Platform, H2 for tests); do not introduce a new test framework.
- Keep public API contracts stable unless explicit approval is given.
- Keep refactors and behavior changes separate when practical.

## Database and Migration Policy

- No migration tool configuration (Flyway/Liquibase) is currently defined in backend build/config.
- Do not introduce or replace DB migration tooling without explicit approval.
- Do not perform schema-breaking changes without approval and impact notes.

## Do Not

- Do not bypass `check`/tests to make builds pass.
- Do not commit secrets or environment credentials.
