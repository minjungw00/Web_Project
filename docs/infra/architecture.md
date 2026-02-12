# Infrastructure Architecture

이 문서는 Web Project의 인프라 전략과 구성 요소 간 관계, 배포 방식, 환경별 운용 절차를 설명합니다. CI/CD 세부 파이프라인은 `docs/pipelines.md`, 운영 절차는 `docs/operations.md`, 보안 항목은 `docs/security.md`, 모니터링 튜닝은 `docs/monitoring.md`를 참고하세요.

## 1. 시스템 개요

React 기반 Frontend, Spring Boot Backend, MySQL 데이터베이스, Nginx 게이트웨이로 구성된 애플리케이션을 Blue-Green 방식으로 배포합니다. CI에서는 불변 이미지를 빌드하여 GHCR에 저장하고, CD에서는 동일 이미지를 단계적으로 적용해 재현성과 롤백 가능성을 확보합니다. 관찰성 스택(Prometheus/Grafana/Loki)과 헬스체크 자동화로 운영 안정성을 유지합니다.

핵심 원칙

- FE dist는 전용 아티팩트 이미지로 분리하며, 서버에서는 준비(job) 컨테이너가 dist를 공유 볼륨에 동기화합니다. Nginx 이미지는 설정 변경 시에만 재빌드합니다.
- BE 이미지는 멀티스테이지 빌드로 경량화하고, 비밀 값은 런타임 환경 변수로만 주입합니다.
- 모든 이미지는 `latest`와 커밋 기반 태그(`sha-<GITHUB_SHA>`)를 함께 발행하여 추적성과 재현성을 확보합니다.
- 레이어 간 통신은 전용 네트워크(`APP_NETWORK_NAME`, 기본값 `web_project_webnet`)로 통제하며, 개발 환경은 별도 네트워크를 사용합니다.
- Blue-Green 배포는 `prepare` → `gateway` → `finalize` 단계로 진행하며, 실패 시 이전 색상으로 즉시 롤백할 수 있습니다.

---

## 2. 핵심 아키텍처

### 2.1 4-Tier 아키텍처 개요

인프라는 네 개의 레이어로 구성되어 사항별 책임을 분리합니다. 레이어 간 결합을 최소화하면 배포·확장·장애 대응 범위를 명확히 나눌 수 있습니다.

```
┌───────────────────────────────┐
│           Gateway             │ Nginx, SSL/TLS 종료, 외부 → 내부 라우팅
├───────────────────────────────┤
│          Monitoring           │ Prometheus, Grafana, Loki, Alertmanager
├───────────────────────────────┤
│         Application           │ Frontend(Static), Backend(API)
├───────────────────────────────┤
│        Infrastructure         │ MySQL, 공용 네트워크, 초기 스크립트
└───────────────────────────────┘
```

- **Infrastructure Layer** (`infra/infrastructure`)
  - MySQL과 같은 상태 기반 리소스를 관리하고, 초기 스키마/계정 세팅을 제공합니다.
  - 공용 네트워크 및 공유 볼륨을 생성하여 상위 레이어의 기반을 마련합니다.
- **Application Layer** (`infra/application`)
  - Frontend/Backend 애플리케이션을 포함한 비즈니스 로직 영역입니다.
  - FE dist 볼륨과 Backend 환경 설정을 관리하며, Blue-Green 대상이 되는 주요 레이어입니다.
- **Monitoring Layer** (`infra/monitoring`)
  - Prometheus/Grafana/Loki/Alertmanager로 관찰성을 제공합니다.
  - Exporter, 로그 파이프라인을 통해 Application/Infrastructure에서 발생하는 메트릭을 수집합니다.
- **Gateway Layer** (`infra/gateway`)
  - 단일 진입점으로 SSL/TLS 종료와 라우팅 정책을 담당합니다.
  - Application과 Monitoring UI로의 트래픽을 제어하고, FE dist 볼륨을 마운트해 정적 파일을 서빙합니다.

**기동 순서**: Infrastructure → Application → Monitoring → Gateway. 의존성이 순차적으로 충족되므로 신규 서버 프로비저닝 및 장애 복구 시에도 동일한 순서를 권장합니다.

### 2.2 Blue-Green 배포와 아티팩트 흐름

- `infra/deploy-blue-green.sh`는 `prepare`, `gateway`, `finalize` 세 단계로 나뉩니다.
  - `prepare`: 새 색상(blue 또는 green)과 관련 Compose 서비스를 pull/up하고, FE dist를 전용 볼륨(`frontend-dist`)에 동기화하며 Gateway·Monitoring에서 공유하는 Nginx 로그 볼륨(`nginx-logs`)이 없으면 생성합니다.
  - `gateway`: Nginx 구성 파일을 새 색상으로 전환하며 헬스체크가 통과되지 않으면 즉시 이전 색상으로 롤백합니다.
  - `finalize`: 이전 색상을 정리하고, 상태 파일(`deploy-state.json`)을 최신 값으로 갱신합니다.
- 상태 파일은 `${HOME}/srv/web_project/deploy-state.json`에 저장되어 있어 수동 개입 없이 마지막 색상을 추적할 수 있습니다.
- CI 파이프라인은 Application/Gateway 이미지를 빌드 후 GHCR(`ghcr.io`)에 푸시합니다. Monitoring/Infrastructure 이미지는 필요 시 수동으로 갱신합니다.
- FE dist 추출은 운영 배포 시에만 실행되며, 개발 환경에서는 직접 빌드하거나 HMR을 사용해 빠르게 피드백을 받을 수 있습니다.

### 2.3 표준 명세

- 레지스트리: GHCR(`ghcr.io`)
- 이미지 이름(예시, 소유자 `minjungw00`)
  - Frontend: `ghcr.io/minjungw00/web-project-frontend`
  - Backend: `ghcr.io/minjungw00/web-project-backend`
  - Gateway(Nginx): `ghcr.io/minjungw00/web-project-nginx`
- 태그 전략: `latest` + `sha-<GITHUB_SHA>` 동시 태깅, 필요 시 추가 스테이지 태그(`release-YYYYMMDD`) 허용
- 서비스 이름(Prod Blue/Green): `frontend-blue|green`, `backend-blue|green`, `nginx`, `mysql`
- 볼륨: `frontend-dist`, `mysql-data`, `certbot`, `nginx-logs` 등 (운영 환경에서는 certbot/mysql-data/nginx-logs는 호스트 바인드 검토)
- 네트워크: `web_project_webnet`(운영 기본), `web_project-dev-webnet`(개발)
- 표준 경로
  - 컨테이너: FE dist `/opt/dist`, Nginx 정적 `/usr/share/nginx/html`, Certbot `/var/www/certbot`, LetsEncrypt `/etc/letsencrypt`
  - 호스트: `${HOME}/srv/web_project/application|gateway|infrastructure|monitoring`
- 바인드 제어 변수: `MYSQL_DATA_MOUNT`, `CERTBOT_MOUNT`, `LETSENCRYPT_MOUNT`, `LETSENCRYPT_LOG_MOUNT`, `FE_DIST_MOUNT`, `NGINX_LOGS_MOUNT`

---

## 3. 개발 레포지토리 구조

```
/
  /frontend                                 # React + Vite 프로젝트
  /backend                                  # Spring Boot 프로젝트

  /infra
    /application
      /docker
        /frontend                           # FE dist 전용 아티팩트 Dockerfile
        /backend                            # BE 멀티스테이지 Dockerfile
      docker-compose.application.*.yml
      .env.application.*
    /gateway
      /docker/nginx                         # Nginx 이미지 정의 (dist 미포함)
      /nginx                                # conf, proxy headers, certbot 스크립트
      docker-compose.gateway.*.yml
      .env.gateway.*
    /infrastructure
      /mysql                                # MySQL 설정, 초기 스크립트
      docker-compose.infrastructure.*.yml
      .env.infrastructure.*
    /monitoring
      /prometheus, /grafana, /loki, ...     # 관찰성 도구 설정
      docker-compose.monitoring.*.yml
      .env.monitoring.*

  /docs                                     # 가이드 문서 (본 문서는 architecture.md)
  /scripts                                  # CLI 및 배포 자동화 스크립트
```

- `scripts/compose-with-env.*`는 공통 `.env.server`를 읽어 Docker Compose 명령을 실행하는 헬퍼입니다.
- `infra/deploy-blue-green.sh`는 운영 서버에서 사용하며, 개발 환경에서는 `pnpm run deploy:application:dev:*` 스크립트로 동일한 흐름을 테스트할 수 있습니다.

---

## 4. 호스트 서버 디렉토리 구조(운영)

```
${HOME}/srv/web_project
  .env.server.prod                          # 루트 공통값(네트워크, DNS, TAG 기본값 등)
  deploy-blue-green.sh                      # Blue-Green 배포 스크립트
  deploy-state.json                         # 최근 배포 색상/상태

  /application
    .env.application.prod
    docker-compose.application.prod.yml
    /backend
      .env.production                       # Backend 운영 환경 변수(비밀 포함, git 제외)
      /logs
      /config
    /frontend/dist                          # FE dist 호스트 바인드(옵션)

  /gateway
    .env.gateway.prod
    docker-compose.gateway.prod.yml
    /nginx
      .env.production
    /certbot
    /letsencrypt/{etc,lib,log}

  /infrastructure
    .env.infrastructure.prod
    docker-compose.infrastructure.prod.yml
    /mysql
      /data
      /init

  /monitoring
    .env.monitoring.prod
    docker-compose.monitoring.prod.yml
    /prometheus, /grafana, /loki, ...
```

---

## 5. 환경별 동작

### 5.1 개발(로컬)

- `pnpm run docker:all:dev:up` / `pnpm run docker:all:dev:down`으로 전체 스택을 일괄 기동·종료할 수 있습니다.
- 최초 실행 시 `docker network create web_project-dev-webnet`으로 개발 네트워크를 만들어 두세요.

#### Application

- Frontend
  - 기본적으로 `pnpm run dev`를 사용해 Vite HMR을 이용합니다.
  - Blue-Green 흐름을 검증하려면 `pnpm run deploy:application:dev:prepare` → `pnpm run deploy:application:dev:finalize`를 사용해 dist 동기화와 컨테이너 기동을 확인합니다.
- Backend
  - `./gradlew bootRun` 또는 `pnpm run docker:application:dev:up`으로 도커 환경을 기동합니다.
  - 프로파일 별 설정은 `backend/src/main/resources/application-*.yml`과 `.env.application.dev`를 통해 주입합니다.

#### Infrastructure

- MySQL은 `pnpm run docker:infrastructure:dev:up`으로 기동하며, 데이터는 로컬 볼륨으로 영속화됩니다.
- `infra/infrastructure/mysql/init` 폴더에 배치된 SQL 스크립트가 최초 기동 시 실행됩니다.

#### Monitoring

- `pnpm run docker:monitoring:dev:up`으로 전체 관찰성 스택을 기동합니다.
- Prometheus는 Application/Infrastructure의 타깃을 자동 감지하며, Grafana는 기본 대시보드를 로드합니다.
- Loki + Promtail 조합을 사용해 Backend/Nginx 로그를 수집할 수 있으며, 필요 시 `.env.monitoring.dev`에서 로그 경로를 조정합니다.

#### Gateway

- `pnpm run docker:gateway:dev:up`으로 Gateway만 별도로 기동할 수 있습니다.
- `default.dev.conf`가 적용되며 포트 80에서 동작합니다. `/` → FE 정적 파일, `/api/` → Backend 프록시, `/monitoring/` → Grafana로 라우팅됩니다.
- HTTPS가 필요한 경우 self-signed 인증서를 `CERTBOT_MOUNT` 경로에 바인드하여 테스트할 수 있습니다.

### 5.2 배포(운영)

- Infrastructure 레이어(`docker-compose.infrastructure.prod.yml`)를 먼저 기동해 데이터베이스와 공용 네트워크를 준비합니다.
- Application 레이어는 `deploy-blue-green.sh`를 통해 배포합니다.
  - `deploy-blue-green.sh --phase prepare`는 신규 색상을 pull/up하고 FE dist를 동기화합니다.
  - 헬스체크가 통과되면 스크립트가 자동으로 Gateway를 새 색상으로 전환합니다.
  - `deploy-blue-green.sh --phase finalize`는 이전 색상을 정리하고 상태 파일을 갱신합니다.
  - 전체 플로우를 한 번에 실행하려면 `deploy-blue-green.sh --phase full`을 사용합니다. 개발 환경에서는 `pnpm run deploy:application:dev:full`로 동일한 시나리오를 검증할 수 있습니다.
- Gateway 전환은 Nginx 서비스를 재기동하여 새로운 Backend 엔드포인트를 참조하게 하며, 실패 시 기존 색상으로 즉시 롤백합니다.
- 배포 전 운영 네트워크가 존재해야 하므로 최초 한 번 `docker network create web_project_webnet`을 실행하거나 `.env.server.prod`에 맞춰 이름을 조정합니다.

#### Application

- Frontend 이미지는 CI에서 dist를 포함해 빌드되며, `prepare` 단계에서 전용 잡 컨테이너가 dist를 `frontend-dist` 볼륨에 추출합니다.
- Backend는 경량 런타임 이미지로 기동하고, 비밀 키는 `.env.application.prod`와 Backend 전용 `.env.production`에서 주입합니다.

#### Infrastructure

- MySQL 데이터는 호스트 바인드(`MYSQL_DATA_MOUNT`)로 영속화하며, 스키마 변경은 별도 배치 또는 마이그레이션 도구를 사용합니다.

#### Monitoring

- Monitoring 스택은 Blue-Green 대상이 아니므로 필요할 때 수동으로 `docker compose -f monitoring/docker-compose.monitoring.prod.yml up -d`를 실행합니다.
- Telegraf/Promtail은 게이트웨이에서 공유하는 `nginx-logs` 볼륨을 통해 접근 로그를 수집하므로, 환경 변수 `NGINX_LOGS_MOUNT`가 경로인지(named volume인지) 서버 정책에 맞게 설정돼 있어야 합니다.
- Prometheus 타깃은 서비스 이름 기준으로 정의되어 있어 색상 전환과 무관하게 지표 수집이 유지됩니다.

#### Gateway

- Nginx는 포트 80/443으로 동작하며 Certbot 볼륨을 마운트합니다.
- `deploy-blue-green.sh`가 Gateway Compose 서비스를 재기동해 설정을 적용하고, 필요 시 `--skip-pull` 옵션으로 이미지 풀 단계를 건너뛸 수 있습니다.

---

## 6. 롤백 및 장애 대응 개요

- Blue-Green `prepare` 단계에서 실패하면 스크립트가 즉시 중단하고 기존 색상은 유지됩니다.
- `finalize` 실행 전에 문제가 발생한 경우 `deploy-blue-green.sh --phase gateway --force-color <기존색상>`을 사용해 트래픽을 원래 색상으로 되돌릴 수 있습니다.
- `deploy-state.json`이 손상되었을 때는 현재 실행 중인 색상을 확인한 후 수동으로 값을 수정하거나 `--override-current` 옵션을 사용해 초기화합니다.
- 관찰성 스택에서 이상 징후를 감지하면 `docs/monitoring.md`와 `docs/operations.md`에 정의된 Runbook을 따라 대응합니다.
