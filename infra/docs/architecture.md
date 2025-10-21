# Infrastructure Architecture

이 문서는 Web Project 인프라의 전반적인 구조와 아티팩트 전략을 설명합니다. CI/CD, 운영, 보안 세부 흐름은 각각 `pipelines.md`, `operations.md`, `security.md`를 참고하세요.

## 1. 시스템 개요

React(Frontend) + Spring Boot(Backend) + MySQL + Nginx 기반 웹 프로젝트의 목표는 CI에서 불변 이미지를 생성해 GHCR에 저장하고, CD에서 서버에 배포하여 안정성과 재현성을 보장하는 것입니다. 헬스체크, 롤백, 무중단 배포(Blue-Green), 모니터링으로 운영 안정성을 강화합니다.

핵심 원칙

- FE 빌드 산출물(dist)은 전용 아티팩트 이미지로 분리합니다. 서버에서는 일회성 추출(job)로 공유 볼륨에 동기화하고, Nginx가 이를 서빙합니다. Nginx 이미지는 conf 변경 시에만 재빌드/재배포합니다.
- BE는 멀티스테이지 빌드로 최소 런타임 이미지로 패키징하고, 비밀/환경변수는 런타임에만 주입합니다.
- 모든 이미지는 `latest`와 커밋 기반 태그(`sha-<GITHUB_SHA>`)를 함께 사용해 추적성과 재현성을 높입니다.

---

## 2. 구성요소와 아티팩트 전략

- Frontend
  - CI가 dist를 생성하고 dist를 포함한 전용 이미지(frontend)를 만듭니다.
  - 런타임에는 이미지를 실행하지 않고, 추출(job) 컨테이너로 dist만 공유 볼륨에 동기화합니다.
- Backend
  - 멀티스테이지 빌드로 JAR 빌드 → 경량 런타임 이미지(Distroless/JRE) 구성합니다.
  - 비밀은 이미지에 포함하지 않고 런타임에만 주입합니다.
- Nginx
  - 정적 서빙과 리버스 프록시 역할을 담당합니다. conf 템플릿과 엔트리포인트만 포함합니다.
  - FE dist는 이미지에 포함하지 않습니다.
- MySQL
  - 기본적으로 공식 이미지를 사용하고, 필요한 경우에만 커스텀 Dockerfile을 빌드합니다.

### 2.1 표준 명세(필수)

- 레지스트리: GHCR(`ghcr.io`)
- 프로젝트 슬러그: `web-project`(이미지 이름 규칙: 소문자-하이픈)
- 표준 이미지 이름(리포지토리 소유자: `minjungw00`)
  - Frontend: `ghcr.io/minjungw00/web-project-frontend`
  - Backend: `ghcr.io/minjungw00/web-project-backend`
  - Nginx: `ghcr.io/minjungw00/web-project-nginx`
  - MySQL: `mysql:8.4`
- 표준 태그 전략(반드시 동시 사용)
  - 기본 태그: `latest`
  - 커밋 태그: `sha-<GITHUB_SHA>`
- 표준 서비스 이름(Compose)
  - 개발(Dev): `frontend`, `backend`, `mysql`, `nginx`
  - 운영(Prod, Blue-Green): `frontend-blue`, `frontend-green`, `backend-blue`, `backend-green`, `mysql`, `nginx`
- 표준 볼륨 이름(Compose)
  - `frontend-dist`, `mysql-data`, `certbot`(운영 환경에서는 `mysql-data`, `certbot`는 호스트 바인드 필수)
- 표준 네트워크 이름(Compose): `webnet`
- 경로/마운트 정책
  - 컨테이너 내부 표준 경로
    - FE dist(이미지 내부): `/opt/dist`(서버 변수 `FE_DIST_PATH`로 오버라이드 가능, 기본값 `/opt/dist`)
    - Nginx 정적 루트: `/usr/share/nginx/html`
    - Certbot 웹루트: `/var/www/certbot`
    - Let's Encrypt 인증서/키: `/etc/letsencrypt`
  - 운영 마운트 원칙
    - Certbot, MySQL 데이터는 호스트 바인드 마운트 필수(백업/마이그레이션/감사 용이)
    - FE dist는 기본적으로 named volume 사용, `FE_DIST_MOUNT`에 절대 경로를 지정하면 호스트 바인드로 전환됩니다.
  - 권장 호스트 경로(운영)
    - MySQL 데이터: `${HOME}/srv/web_project/mysql`
    - Certbot 챌린지 웹루트: `${HOME}/srv/web_project/certbot`
    - Let's Encrypt 인증서/키: `${HOME}/srv/web_project/letsencrypt/etc`
    - Let's Encrypt state: `${HOME}/srv/web_project/letsencrypt/lib`
    - Let's Encrypt 로그: `${HOME}/srv/web_project/letsencrypt/log`
    - FE dist(옵션): `${HOME}/srv/web_project/frontend/dist`(호스트 바인드 활성화 시)
    - Nginx/Backend `.env` 파일은 항상 호스트에 존재(자세한 보안 지침은 `security.md` 참고)
  - 호스트 바인드 제어 변수(운영)
    - `MYSQL_DATA_MOUNT`: 기본값은 `mysql-data`(named volume). 절대 경로로 설정하면 호스트 바인드.
    - `CERTBOT_MOUNT`: 기본값은 `certbot`(named volume). 절대 경로로 설정하면 호스트 바인드.
    - `LETSENCRYPT_MOUNT`: 기본값은 `letsencrypt`(named volume). 절대 경로로 설정하면 호스트 바인드.
    - `LETSENCRYPT_LOG_MOUNT`: 기본값은 `letsencrypt-log`(named volume). 절대 경로로 설정하면 호스트 바인드.
    - `FE_DIST_MOUNT`: 기본값은 `frontend-dist`(named volume). 절대 경로로 설정하면 호스트 바인드.

---

## 3. 레포지토리 구조

```
/
  /frontend
    .env.development      # FE 개발 환경 변수 (공개값)
    .env.production       # FE 프로덕션 환경 변수 (공개값, 번들에 노출됨)
  /backend
    .env.development      # BE 개발 환경 변수 (비밀 포함, Git 미추적 권장)
  /infra
    /docker
      /frontend
        Dockerfile.dev    # FE 개발용
        Dockerfile.prod   # FE 빌드용 (dist 생성 → frontend 아티팩트 이미지)
      /backend
        Dockerfile.dev    # BE 개발용
        Dockerfile.prod   # BE 프로덕션용 (멀티스테이지 빌드)
      /mysql
        Dockerfile        # 필요 시 커스텀, 없으면 공식 이미지 사용
      /nginx
        Dockerfile.dev    # 개발용 템플릿 기반 Nginx
        Dockerfile.prod   # 프로덕션용 Nginx(정적 서빙 + conf). FE dist는 이미지에 포함하지 않음
      docker-compose.dev.yml
      docker-compose.prod.yml
      .env.local          # `pnpm run setup:dev-env`가 생성하는 UID/GID 매핑 파일(커밋 금지)
    /nginx
      .env.development
      .env.production
      default.dev.conf    # 개발용 Nginx conf
      default.prod.conf   # 프로덕션용 Nginx conf
      proxy-headers.conf
```

---

## 4. 환경별 동작

### 4.1 개발(로컬)

- Frontend
  - 일반적으로 `pnpm run dev`로 Vite dev 서버(HMR) 사용.
  - 선택: 빌더 컨테이너에서 `pnpm build --watch`로 dist를 공유 볼륨에 생성하고, Nginx(dev)가 정적으로 서빙하여 “빌드 산출물 기반” 동작을 검증합니다.
- Backend
  - `./gradlew bootRun` 또는 dev Dockerfile을 사용합니다.
- MySQL
  - Docker Compose로 구동하며 로컬 볼륨을 영속화합니다.
- Nginx
  - `default.dev.conf`, 포트 80. `/`는 FE 정적, `/api/`는 BE 프록시입니다.
- 개발 통합
  - `pnpm run setup:dev-env`로 `infra/docker/.env.local`에 현재 사용자 UID/GID를 기록합니다.
  - `pnpm run docker:dev:up`으로 `infra/docker/docker-compose.dev.yml`을 기반으로 FE/BE/DB/Nginx를 구동하고, `pnpm run docker:dev:down`으로 종료합니다.
  - 수동으로 Compose를 실행해야 할 경우에는 `LOCAL_UID=$(id -u) LOCAL_GID=$(id -g) docker compose -f infra/docker/docker-compose.dev.yml up -d`처럼 UID/GID를 직접 넘겨 소유권 문제를 예방합니다. `--env-file infra/docker/.env.local` 등의 커스텀 파일을 사용할 때도 동일한 값을 선언해 둡니다.

### 4.2 배포(운영)

- Frontend
  - CI에서 dist를 포함한 `frontend` 이미지를 빌드/푸시합니다.
  - 서버에서는 Blue-Green 배포 대상(`frontend-blue` 또는 `frontend-green`) 잡을 실행해 dist를 공유 볼륨(예: `frontend-dist`)에 동기화하고 Nginx가 서빙합니다.
- Backend
  - JDK 단계에서 빌드 → 경량 런타임 이미지로 실행하며 환경변수는 런타임에 주입합니다.
- MySQL
  - Docker Compose로 관리하고 데이터는 볼륨으로 영속화합니다.
- Nginx
  - 포트 80/443으로 동작하며 certbot 볼륨(`certbot`)을 마운트합니다. `default.prod.conf`를 사용합니다.
  - FE dist는 전용 볼륨(`frontend-dist`)에서 서빙하여 `/usr/share/nginx/html`에 마운트합니다.
  - 기본 정책: 80 → 443 리다이렉트 수행(ACME 경로 `/.well-known/acme-challenge/`는 예외 처리).
- 운영 통합
  - 서버 루트(`${HOME}/srv/web_project`)의 `docker-compose.prod.yml`과 `deploy-blue-green.sh` 스크립트를 사용해 `docker compose pull backend-<색상> frontend-<색상> nginx mysql` → `docker compose run --rm frontend-<색상>` → `docker compose up -d backend-<색상>` → `docker compose up -d nginx` 순으로 배포합니다.
