# Infrastructure Overview

이 디렉터리는 Web Project의 인프라 구성, 배포 자동화, 보안 정책을 담고 있습니다. 자세한 내용은 하위 문서를 참고하세요.

- [`infra/docs/architecture.md`](docs/architecture.md): 시스템 구성 요소, 아티팩트 전략, 환경별 동작.
- [`infra/docs/pipelines.md`](docs/pipelines.md): CI/CD 파이프라인, GitHub Actions 워크플로우.
- [`infra/docs/operations.md`](docs/operations.md): 서버 레이아웃, 헬스체크, Blue-Green 배포, 인증서 관리.
- [`infra/docs/security.md`](docs/security.md): 비밀 관리, 환경 변수 정책, 템플릿 및 Secrets 동기화.

## 빠른 시작

로컬 개발

```bash
pnpm run setup:dev-env
pnpm run docker:dev:up
pnpm run docker:dev:down # 종료 시
```

빌드 파이프라인과 서버 운영 절차는 위 문서를 순차적으로 확인하세요.
