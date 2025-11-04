# Infrastructure Overview

Web Project의 인프라 디렉터리는 Blue-Green 배포 전략을 뒷받침하는 네 개의 Compose 레이어와 배포 스크립트를 제공합니다. 운영 절차와 세부 설정은 아래 문서와 README를 통해 계층별로 분리되어 있습니다.

## 1. 참고 문서 맵

- [`../docs/architecture.md`](../docs/architecture.md): 4-Tier 구조, 네트워크 정책, 배포 흐름
- [`../docs/pipelines.md`](../docs/pipelines.md): GitHub Actions CI/CD 파이프라인과 의존 관계
- [`../docs/operations.md`](../docs/operations.md): Blue-Green 수동 배포, 런북, 유지보수 체크리스트
- [`../docs/security.md`](../docs/security.md): 환경 변수 정책, Secrets 동기화, 권한 관리
- [`../docs/monitoring.md`](../docs/monitoring.md): 관찰성 스택 구성 및 운영 가이드

## 2. 레이어 구성 요약

| 디렉터리          | 역할                                       | 주요 Compose                                   | 비고                               |
| ----------------- | ------------------------------------------ | ---------------------------------------------- | ---------------------------------- |
| `infrastructure/` | MySQL 등 상태 보존 리소스                  | `docker-compose.infrastructure.{dev,prod}.yml` | 최초 기동 후 변경 최소화           |
| `application/`    | Frontend dist 아티팩트, Backend Blue/Green | `docker-compose.application.{dev,prod}.yml`    | `deploy-blue-green.sh`의 핵심 대상 |
| `monitoring/`     | Prometheus/Grafana/Loki/Exporters          | `docker-compose.monitoring.{dev,prod}.yml`     | 독립 워크플로우로 배포             |
| `gateway/`        | Nginx 리버스 프록시, Certbot               | `docker-compose.gateway.{dev,prod}.yml`        | Application 배포 시 함께 전환      |

각 디렉터리의 README는 실행 방법·환경 변수·볼륨 정책을 자세히 설명합니다.

## 3. 핵심 스크립트와 환경 파일

- `deploy-blue-green.sh`: Application/Gateway 레이어를 대상으로 `prepare → gateway → finalize` 단계를 수행합니다. GitHub Actions `deploy-application.yml`과 로컬 `pnpm deploy:application:dev:*` 스크립트가 공통으로 사용합니다.
- `.env.server.*`: 공통 네트워크(`APP_NETWORK_NAME` 기본 `web_project_webnet`), FE dist 볼륨, 이미지 태그 기본값을 관리합니다.
- `scripts/compose-with-env.{mjs,sh}`: 레이어별 `.env`를 순차 병합해 Compose 명령에 전달합니다.
- `scripts/sync-local-ids.{mjs,sh}`: 개발용 `LOCAL_UID/GID`를 자동 동기화합니다.

## 4. 로컬 개발 빠른 시작

```bash
pnpm run setup:dev-env               # UID/GID 동기화
pnpm run docker:all:dev:up           # 네트워크 → 인프라 → 앱 → 모니터링 → 게이트웨이 순 기동
pnpm run docker:all:dev:down         # 역순 종료
```

개별 레이어를 조작하려면 `pnpm docker:<layer>:dev:{up,down}` 스크립트를 사용하세요. 개발 네트워크와 FE dist 볼륨은 스크립트가 필요 시 자동 생성합니다.

## 5. 운영 배포 흐름 요약

- GitHub Actions 워크플로우
  - `sync-env.yml`: Base64 Secrets를 서버 디렉터리 구조에 배포
  - `deploy-application.yml`: `deploy-blue-green.sh`를 호출하여 Blue-Green 배포 수행 (`update_gateway` 선택적으로 Gateway 전환)
  - `deploy-gateway.yml`, `deploy-monitoring.yml`, `deploy-infrastructure.yml`: 레이어별 독립 재배포
- 수동 작업 시 서버 `${HOME}/srv/web_project`에서 동일 스크립트를 실행합니다. 예: `./deploy-blue-green.sh --phase full`

모든 레이어는 동일한 외부 브리짓 네트워크(`APP_NETWORK_NAME`)와 FE dist 볼륨을 공유하므로 환경 파일 변경 시 관련 Compose 정의와 README를 함께 업데이트하십시오.
