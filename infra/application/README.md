# Application Layer

## 1. 개요

Application 레이어는 백엔드(Spring Boot)와 프론트엔드(Vite/React) 애플리케이션의 실행과 배포를 담당합니다. 개발 환경에서는 소스볼륨 마운트 기반의 빠른 피드백 루프를 제공하고, 프로덕션 환경에서는 Blue/Green 백엔드와 프론트엔드 dist 아티팩트 동기화 방식을 사용합니다. 본 레이어의 구성과 Compose 파일은 `infra/application/**`에서 관리합니다.

## 2. 아키텍처

```
개발: FE Dev Server(5173) → Nginx(게이트웨이) → BE(8080)
운영: Nginx(게이트웨이, TLS 종단) → BE Blue/Green(8080, 내부) + FE dist(공유 볼륨)
```

- 백엔드: Spring Boot(8080), `/api/actuator/health`, `/api/actuator/prometheus`
- 프론트엔드: Vite 빌드(dist), 운영 시 Nginx가 정적 자산 서빙
- Blue/Green: `backend-blue`, `backend-green`(동일 이미지/설정)
- FE dist 동기화: FE 아티팩트 이미지 → 공유 볼륨(`frontend-dist`) 복사(one-shot job)

## 3. 디렉토리 구조

```
infra/application/
├── .env.application.example               # 애플리케이션 레이어 공통 env 예시
├── docker-compose.application.dev.yml     # 개발용 Compose
├── docker-compose.application.prod.yml    # 프로덕션용 Compose (Blue/Green + FE dist sync)
├── docker/
│   ├── backend/
│   │   ├── Dockerfile.dev                # BE 개발용 이미지(Gradle 캐시/소스 마운트)
│   │   ├── Dockerfile.prod               # BE 프로덕션 이미지(bootJar)
│   │   ├── entrypoint.sh                 # BE 런타임 엔트리포인트
│   │   └── dev-entrypoint.sh             # BE 개발 엔트리포인트
│   └── frontend/
│       ├── Dockerfile.dev                # FE 개발용 이미지(Dev Server)
│       ├── Dockerfile.prod               # FE dist 아티팩트 이미지(/opt/dist)
│       └── entrypoint.sh                 # (필요 시) FE 런타임 스크립트
└── README.md
```

## 4. 실행 방법

### 4.1. 개발 환경

권장 순서:

```bash
pnpm docker:infrastructure:dev:up
pnpm docker:application:dev:up
pnpm docker:gateway:dev:up
```

접속(개발):

- FE Dev Server: http://localhost:5173
- BE API: http://localhost:8080
- 게이트웨이 경유: http://localhost:8081, http://localhost:8081/api

중지:

```bash
pnpm docker:application:dev:down
# 전체 중지
pnpm docker:all:dev:down
```

### 4.2. 프로덕션 환경

GitHub Actions `deploy-application.yml` 워크플로우가 `infra/deploy-blue-green.sh`를 호출해 Blue-Green 배포를 실행합니다. 워크플로우 입력값 `image_tag`/`fe_tag`/`be_tag`/`update_gateway`는 `.env.server.prod`와 `.env.application.prod`에 기록된 기본값을 덮어씁니다.

수동 배포 혹은 점검이 필요한 경우 서버 `${HOME}/srv/web_project`에서 동일 스크립트를 사용합니다.

```bash
cd ~/srv/web_project

# 전체 절차 수행 (prepare → gateway → finalize)
./deploy-blue-green.sh --phase full

# 또는 단계별 실행
./deploy-blue-green.sh --phase prepare       # 신규 색상 기동 + FE dist 동기화
./deploy-blue-green.sh --phase gateway       # Nginx 전환 (update_gateway=true 또는 강제 호출)
./deploy-blue-green.sh --phase finalize      # 이전 색상 정리 및 상태 파일 갱신
```

- FE dist 동기화: `frontend-blue`/`frontend-green` one-shot job이 아티팩트 이미지에서 `/opt/dist` → 공유 볼륨(`/dist`)으로 복사합니다. 전환 전에 원하는 dist 잡만 실행해도 됩니다.
- BE Blue/Green: 게이트웨이 Nginx의 `.env.production`에서 `NGINX_BACKEND_HOST` 값을 조정하여 트래픽을 전환합니다. 워크플로우 `update_gateway=true`가 자동으로 처리하며, 실패 시 `--force-color` 옵션으로 롤백할 수 있습니다.
- 상태 파일: `deploy-state.json`이 현재 활성 색상을 기록합니다. 자세한 런북은 `../../docs/operations.md`를 참고하세요.

## 5. 네트워크 구성

게이트웨이/모니터링과 동일한 외부 브릿지 네트워크(`APP_NETWORK_NAME`)를 사용합니다. 네트워크 이름은 루트 환경 파일(`infra/.env.server.*`)의 `APP_NETWORK_NAME`에서 관리합니다.

## 6. 볼륨 관리

주요 볼륨:

- 개발
  - `frontend-node-modules`: FE 의존성 캐시
  - `frontend-pnpm-store`: FE pnpm 스토어
  - `gradle-cache`: BE Gradle 캐시
  - `frontend-dist`: FE 빌드 산출물(선택, dev에서 watcher로 채움)
- 운영
  - `frontend-dist`: FE 정적 자산 공유 볼륨(Nginx가 읽기 전용 마운트)
  - BE 런타임 디렉터리: `${SERVER_ROOT}/application/backend/logs`, `${SERVER_ROOT}/application/backend/config` (호스트 바인드)

## 7. 환경 변수 설정

예시 파일을 참고해 환경 변수 파일을 준비합니다.

```bash
cp infra/application/.env.application.example infra/application/.env.application.dev
# 서버: ${SERVER_ROOT}/application/.env.application.prod 로 관리(Secrets 동기화 워크플로우 대상)
pnpm run setup:dev-env  # 개발 환경에서 LOCAL_UID/GID 자동 동기화
```

주요 변수(발췌):

- 이미지/태그
  - `FRONTEND_IMAGE`, `FE_TAG`: FE 아티팩트 이미지/태그
  - `BACKEND_IMAGE`, `BE_TAG`: BE 런타임 이미지/태그
- 프론트엔드 dist
  - `FE_DIST_MOUNT`: FE dist 볼륨명(dev 기본: `web_project-dev-frontend-dist`, prod 기본: `frontend-dist`)
  - `FE_DIST_PATH`: 아티팩트 이미지 내 dist 경로(기본 `/opt/dist`)
- 공통
  - `APP_NETWORK_NAME`: 외부 브릿지 네트워크명(미설정 시 기본값)
  - `SERVER_ROOT`: 서버 루트(기본 `$HOME/srv/web_project`), BE 로그/설정 바인드 경로에 사용

`LOCAL_UID`와 `LOCAL_GID`는 `scripts/sync-local-ids.mjs`가 자동으로 갱신하므로 수동 편집을 피하세요. 서버 환경에서는 해당 키가 필요하지 않습니다.

백엔드 서비스 자체 환경 변수는 애플리케이션 리포지토리의 `.env.development`/`.env.production`에서 관리합니다.

## 8. 세부 설정

### 8.1 백엔드(Spring Boot)

- 포트: 8080
- 헬스체크: `/api/actuator/health`
- 메트릭: `/api/actuator/prometheus`
- 운영 마운트: `${SERVER_ROOT}/application/backend/logs:/app/logs`, `${SERVER_ROOT}/application/backend/config:/app/config:ro`
- 재시작 정책: `unless-stopped`, 헬스체크 실패 시 재시도

### 8.2 프론트엔드(Vite)

- 개발: Dev Server(5173) 사용, 게이트웨이를 통한 프록시 접근 가능(`/api` → backend)
- 운영: dist 아티팩트 이미지에서 `/opt/dist`를 공유 볼륨으로 복사 → 게이트웨이 Nginx가 `/usr/share/nginx/html`에서 서빙

### 8.3 Blue/Green 전략

- `backend-blue`, `backend-green` 동일 설정/이미지로 기동
- 게이트웨이 Nginx의 `.env.production`에서 `NGINX_BACKEND_HOST=backend-blue|backend-green`으로 전환
- FE dist는 `frontend-blue|frontend-green` 중 원하는 아티팩트를 우선 실행하여 볼륨을 채우는 방식으로 릴리스 가능

## 9. 참고

- 게이트웨이 레이어: [`../gateway/README.md`](../gateway/README.md)
- 인프라 레이어: [`../infrastructure/README.md`](../infrastructure/README.md)
- 모니터링 레이어: [`../monitoring/README.md`](../monitoring/README.md)
- 전반적인 아키텍처/운영: [`../../docs/architecture.md`](../../docs/architecture.md), [`../../docs/operations.md`](../../docs/operations.md)
- Compose 파일: [`docker-compose.application.dev.yml`](docker-compose.application.dev.yml), [`docker-compose.application.prod.yml`](docker-compose.application.prod.yml)
- 백엔드/프론트엔드 Dockerfile: [`docker/backend/`](docker/backend/), [`docker/frontend/`](docker/frontend/)
