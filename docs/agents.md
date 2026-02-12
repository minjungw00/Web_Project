# AGENTS 요약

## 적용 범위
- 전역 규칙: /AGENTS.md
- 프론트엔드: /frontend/AGENTS.md
- 백엔드: /backend/AGENTS.md
- 인프라: /infra/AGENTS.md

스택별 문서가 전역 규칙과 충돌하면 스택별 문서가 우선입니다.

## 전역 (/AGENTS.md)
- 모노레포 구조(Frontend/Backend/Infra/Docs)와 최소 변경 원칙을 강조합니다.
- 비밀/프로덕션 .env 파일은 Git에 커밋하지 않습니다.
- 명령은 root package.json, 각 스택 README, /docs/infra 문서가 기준입니다.
- 리팩터링과 동작 변경을 분리하고 작은 PR로 유지합니다.

## 프론트엔드 (/frontend/AGENTS.md)
- 기본 명령: pnpm 기반(dev/build/lint/format/typecheck) 스크립트 사용.
- TDD 기본: 테스트 먼저, Red → Green → Refactor, 테스트 없이 배포 금지(명시적 예외 제외).
- ESLint/Prettier/TS strict 준수, eslint.config.js는 자동 생성이므로 수정 금지.
- API는 /api 프리픽스 유지. 테스트 러너는 아직 스크립트에 없으므로 필요 시 명시적으로 정의해야 합니다.

## 백엔드 (/backend/AGENTS.md)
- Gradle wrapper로 build/bootRun/test/spotless/checkstyle/spotbugs 실행.
- TDD 기본 정책은 프론트와 동일.
- 컨텍스트 경로는 /api, actuator는 /api/actuator/* 기준.
- 테스트는 Spring Boot + JUnit, H2 인메모리 DB를 사용.
- API 경로 변경 시 게이트웨이/문서 업데이트가 필요합니다.

## 인프라 (/infra/AGENTS.md)
- Docker Compose 기반, dev 스크립트가 기본.
- 운영 작업은 명시적 승인 없이는 금지(특히 apply/삭제/볼륨 초기화).
- 레이어 구조(application/gateway/infrastructure/monitoring)와 서버 경로(${HOME}/srv/web_project) 규칙을 유지합니다.
- Blue-Green 배포는 deploy-blue-green.sh 절차를 따릅니다.
