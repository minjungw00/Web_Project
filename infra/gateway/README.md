# Gateway Layer

## 1. 개요

Gateway 레이어는 외부 트래픽을 수용하고 Application·Monitoring 레이어로 라우팅하는 Nginx 기반 진입점입니다. SSL/TLS 종료, 정적 자산 캐싱, 보안 헤더 적용, 관찰성 UI 프록시를 담당하며 Blue-Green 배포 시 `NGINX_BACKEND_HOST` 값을 통해 활성 Backend 색상을 전환합니다.

## 2. 아키텍처

```
인터넷 → Nginx (Gateway) → Backend Blue/Green + Frontend dist 볼륨
                                  ↳ Monitoring 스택 (Grafana / Prometheus / Alertmanager / Loki)
```

주요 책임

- 프론트엔드 정적 파일 서빙 및 `/api` 프록시
- `/monitoring/*` 경로에 대한 Basic Auth + CIDR 화이트리스트 적용
- Certbot 기반 HTTPS 인증서 발급/갱신
- Blue-Green 전환 시 안전한 Backend 스위칭
- Nginx 액세스/에러 로그를 Monitoring 레이어와 공유하는 `nginx-logs` 볼륨에 기록합니다(`NGINX_LOGS_MOUNT`).

## 3. 디렉터리 구조

```
infra/gateway/
├── .env.gateway.example                # Gateway Compose 환경 변수 템플릿
├── docker-compose.gateway.dev.yml      # 개발용 Compose 정의
├── docker-compose.gateway.prod.yml     # 프로덕션 Compose 정의
├── docker/
│   └── nginx/
│       ├── Dockerfile.dev              # 개발용 Nginx 이미지
│       ├── Dockerfile.prod             # 프로덕션 Nginx 이미지
│       └── entrypoint.sh               # envsubst 기반 템플릿 렌더링
└── nginx/
    ├── default.dev.conf                # 개발 Nginx 템플릿
    ├── default.prod.conf               # 프로덕션 템플릿 (서브패스, Basic Auth)
    ├── proxy-headers.conf              # 공통 프록시 헤더 스니펫
    ├── certbot-issue.sh                # 인증서 발급/갱신 스크립트
    ├── .env.development.example        # 개발용 Nginx env 템플릿
    └── .env.production.example         # 프로덕션용 Nginx env 템플릿
```

## 4. 실행 방법

### 4.1. 개발 환경

```bash
pnpm docker:infrastructure:dev:up   # 네트워크 및 DB
pnpm docker:application:dev:up      # Frontend dist 볼륨 채우기
pnpm docker:monitoring:dev:up       # (선택) 관찰성 스택
pnpm docker:gateway:dev:up          # Gateway (포트 8081)
```

- 프론트엔드: `http://localhost:8081`
- Backend API: `http://localhost:8081/api`
- Grafana: `http://localhost:8081/monitoring/grafana/`

중지 시 `pnpm docker:gateway:dev:down` 또는 `pnpm docker:all:dev:down`을 사용합니다.

### 4.2. 프로덕션 환경

GitHub Actions `deploy-application.yml`이 Application 레이어 `prepare` 단계 이후 `deploy-gateway.yml`을 호출하여 Gateway를 전환합니다. 기본 입력값 `update_gateway=true`이며, `nginx_tag` 또는 `.env.gateway.prod`의 `NGINX_TAG`가 사용할 이미지 태그를 결정합니다.

수동 또는 점검 목적 시 서버 `${HOME}/srv/web_project`에서 아래 명령을 실행합니다.

```bash
cd ~/srv/web_project

# Blue-Green 스크립트를 통해 Gateway만 전환
./deploy-blue-green.sh --phase gateway

# 또는 환경 파일을 병합해 Compose 직접 실행
node ./scripts/compose-with-env.mjs \
  --env ./.env.server.prod \
  --env ./gateway/.env.gateway.prod \
  -- docker compose -f gateway/docker-compose.gateway.prod.yml up -d
```

전환 전에는 새 Backend 색상이 Healthy 상태인지, `frontend-dist` 볼륨이 최신 dist로 채워졌는지, `nginx-logs` 볼륨이 정상 마운트되어 있는지 확인하세요. 세부 런북은 [`../../docs/operations.md`](../../docs/operations.md)를 참조합니다.

## 5. 네트워크 구성

- 모든 레이어가 동일한 외부 브리짓 네트워크(`APP_NETWORK_NAME`)를 사용합니다.
- 기본값: 개발 `web_project_webnet-dev`, 프로덕션 `web_project_webnet`
- 정의 위치: `infra/.env.server.*`
- 생성 책임: Infrastructure 레이어 또는 `pnpm docker:network:dev:create`

네트워크가 없으면 Gateway 컨테이너가 기동되지 않습니다.

## 6. 볼륨 관리

| 볼륨                                              | 환경          | 용도                  | 비고                                                          |
| ------------------------------------------------- | ------------- | --------------------- | ------------------------------------------------------------- |
| `web_project-dev_frontend-dist` / `frontend-dist` | 공통          | 프론트 dist 공유 볼륨 | Application 레이어가 dist를 채우고 Gateway가 읽기 전용 마운트 |
| `web_project-dev_nginx-logs` / `nginx-logs`       | 공통          | Nginx 접근/에러 로그  | Monitoring 레이어(Telegraf/Promtail)가 읽기 전용 마운트       |
| `web_project-dev_certbot-dev` / `certbot`         | 개발/프로덕션 | ACME 챌린지 웹루트    | 프로덕션에서는 절대 경로 바인드 가능                          |
| `letsencrypt`, `letsencrypt-log`                  | 프로덕션      | 인증서 및 로그 보관   | `${HOME}/srv/web_project/gateway` 하위 경로 바인드 권장       |

개발 볼륨은 `pnpm docker:volume:fe-dist:dev:create`가 자동 생성합니다.

## 7. 환경 변수 설정

### 7.1. Gateway Compose (`.env.gateway.*`)

```bash
cp infra/gateway/.env.gateway.example infra/gateway/.env.gateway.dev
```

- 운영 파일은 Secrets(`GATEWAY_ENV_PRODUCTION_BASE64`)을 통해 서버 `${HOME}/srv/web_project/gateway/.env.gateway.prod`에 배포됩니다.
- 핵심 변수: `NGINX_IMAGE`, `NGINX_TAG`, `APP_NETWORK_NAME`, `FE_DIST_MOUNT`, `NGINX_LOGS_MOUNT`, `CERTBOT_MOUNT`, `LETSENCRYPT_MOUNT`, `LETSENCRYPT_LOG_MOUNT`.

### 7.2. Nginx 환경 (`nginx/.env.*`)

- 개발: `infra/gateway/nginx/.env.development`
- 운영: `${HOME}/srv/web_project/gateway/nginx/.env.production` (Secrets `NGINX_ENV_PRODUCTION_BASE64`)
- 주요 변수: `NGINX_BACKEND_HOST`, `NGINX_SERVER_NAME`, `NGINX_MONITORING_AUTH_*`, `GRAFANA_HOST`, `PROMETHEUS_HOST` 등.

## 8. SSL 인증서 설정

```bash
cd ~/srv/web_project
./gateway/nginx/certbot-issue.sh \
  --base-dir ${HOME}/srv/web_project \
  -d example.com -e admin@example.com
```

- 80 포트가 열려 있고 `/.well-known/acme-challenge/`를 Gateway가 서빙해야 합니다.
- 발급 후 `docker compose -f gateway/docker-compose.gateway.prod.yml up -d`로 Nginx를 재기동합니다.

## 9. 트러블슈팅

| 증상                      | 점검 항목                                               | 조치                                                   |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| 컨테이너 기동 실패        | `docker network ls`에서 `APP_NETWORK_NAME` 확인         | 네트워크 생성 후 재기동                                |
| 502/504 오류              | Backend 컨테이너 상태, `NGINX_BACKEND_HOST` 값          | Blue-Green 스크립트 재실행 또는 `--force-color`로 롤백 |
| 모니터링 페이지 인증 실패 | `monitoring.htpasswd`, `NGINX_MONITORING_INTERNAL_CIDR` | Secrets 재배포 후 Nginx 재시작                         |
| 인증서 갱신 실패          | `certbot`/`letsencrypt` 볼륨 권한, 80 포트 접근성       | 스크립트 로그 확인 후 재시도                           |

추가 시나리오는 [`../../docs/operations.md`](../../docs/operations.md)의 Gateway 런북에 기록하세요.

## 10. CI/CD

- 이미지 빌드: `.github/workflows/nginx.yml`이 `infra/gateway/docker/**`와 `infra/gateway/nginx/**` 변경 시 실행되어 `ghcr.io/minjungw00/web-project-nginx`에 `latest`·`sha-<commit>` 태그를 발행합니다.
- 배포: `deploy-application.yml`이 기본적으로 Gateway를 전환하며, 독립 업데이트가 필요할 때 `deploy-gateway.yml`을 수동 실행합니다.
- 환경 파일: `sync-env.yml`이 `.env.gateway.prod`, `nginx/.env.production`, `monitoring.htpasswd.prod`를 서버에 동기화합니다.

## 11. 참고

- Application 레이어: [`../application/README.md`](../application/README.md)
- 인프라 레이어: [`../infrastructure/README.md`](../infrastructure/README.md)
- 모니터링 레이어: [`../monitoring/README.md`](../monitoring/README.md)
- 아키텍처/운영/보안: [`../../docs/architecture.md`](../../docs/architecture.md), [`../../docs/operations.md`](../../docs/operations.md), [`../../docs/security.md`](../../docs/security.md), [`../../docs/monitoring.md`](../../docs/monitoring.md)
- Compose 파일: [`docker-compose.gateway.dev.yml`](docker-compose.gateway.dev.yml), [`docker-compose.gateway.prod.yml`](docker-compose.gateway.prod.yml)
