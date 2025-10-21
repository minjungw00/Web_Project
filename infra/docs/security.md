# Security & Environment Management

이 문서는 Web Project 인프라에서 비밀 관리, 환경변수 정책, 템플릿 관리, Secrets 동기화 워크플로우 및 적용 우선순위에 대해 설명합니다. 인프라 구조는 `architecture.md`, 파이프라인은 `pipelines.md`, 운영 방안은 `operations.md`를 참고하세요.

## 1. 보안 원칙

- **이미지에는 비밀을 포함하지 않습니다.** 모든 비밀은 런타임에만 주입합니다.
- **Frontend 빌드 환경은 공개값만 포함합니다.** `frontend/.env.production`은 공개 `VITE_*` 값만 저장하고 서버에는 배포하지 않습니다.
- **Backend 운영 환경변수는 Git에 포함하지 않습니다.** `backend/.env.production`은 비밀을 담고 서버에만 배치합니다.
- **루트 `.env`는 Compose 변수 확장의 단일 진실 원천입니다.** `${HOME}/srv/web_project/.env`에서 태그, 이미지, 공용 환경을 관리합니다.
- **Nginx 템플릿 파일에는 비밀을 넣지 않습니다.** `infra/nginx/.env.production`에는 도메인, 경로 등 공개 정보를 기록하고 `.example` 템플릿만 커밋합니다.
- **DB 자격 증명은 Secrets 또는 루트 `.env`에서만 관리합니다.** 인증서는 certbot/letsencrypt 볼륨으로 분리 관리합니다.

---

## 2. 서버에 필요한 .env 파일과 역할

- `${HOME}/srv/web_project/.env` (서버 루트, 필수)
  - 배포 시 `docker compose ... --env-file .env`로 로드되는 공용 환경파일입니다.
  - 주요 키(기본값)
    - 태그 고정: `FE_TAG=latest`, `BE_TAG=latest`, `NGINX_TAG=latest`, `DB_TAG=8.4`
    - 이미지명:
      - `FRONTEND_IMAGE=ghcr.io/minjungw00/web-project-frontend`
      - `BACKEND_IMAGE=ghcr.io/minjungw00/web-project-backend`
      - `NGINX_IMAGE=ghcr.io/minjungw00/web-project-nginx`
      - `MYSQL_IMAGE=mysql`
    - 프론트 dist 경로: `FE_DIST_PATH=/opt/dist`
    - 네트워크/볼륨 이름(변경 비권장): `COMPOSE_NETWORK=webnet`
    - DNS 서버(필요 시): `COMPOSE_DNS1=1.1.1.1`, `COMPOSE_DNS2=8.8.8.8`
    - 마운트 소스 (절대 경로 지정 시 bind, 상대/단순 이름은 named volume)
      - `MYSQL_DATA_MOUNT=mysql-data`
      - `CERTBOT_MOUNT=certbot`
      - `FE_DIST_MOUNT=frontend-dist`
    - `.env` 파일에서는 `$HOME` 같은 변수 확장이 일어나지 않으므로, 호스트 경로를 사용할 때는 `/home/ubuntu/...`처럼 절대 경로를 그대로 적어야 합니다.
- `backend/.env.production`(서버에만 존재, Git 미추적, 필수)
  - Compose가 `env_file: ${SERVER_ROOT}/backend/.env.production`로 주입합니다.
  - 최소 키(예)
    - `SPRING_PROFILES_ACTIVE=prod`
    - `SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/<DB_NAME>?useSSL=false&allowPublicKeyRetrieval=true&characterEncoding=UTF-8&serverTimezone=UTC`
    - `SPRING_DATASOURCE_USERNAME=<DB_USER>`
    - `SPRING_DATASOURCE_PASSWORD=<DB_PASSWORD>`
- `nginx/.env.production`(서버에 존재, 비밀 금지, 필수)
  - Compose가 서버 루트 기준 경로로 주입됩니다(예: `env_file: $SERVER_ROOT/nginx/.env.production`).
  - 최소 키(기본값)
    - `NGINX_SERVER_NAME=example.com`
    - `NGINX_CERTBOT_ROOT=/var/www/certbot`
    - `NGINX_STATIC_ROOT=/usr/share/nginx/html`
    - `NGINX_BACKEND_HOST=backend-blue`
    - `NGINX_BACKEND_PORT=8080`
    - `NGINX_SSL_CERT=/etc/letsencrypt/live/<domain>/fullchain.pem`
    - `NGINX_SSL_CERT_KEY=/etc/letsencrypt/live/<domain>/privkey.pem`
    - `NGINX_SSL_TRUSTED_CERT=/etc/letsencrypt/live/<domain>/chain.pem`
    - (선택) `NGINX_STATIC_CACHE_EXPIRES=1h`, `NGINX_STATIC_CACHE_CONTROL=max-age=3600, public`
- `frontend/.env.production`(빌드 전용, 공개값만, 필수)
  - CI에서 frontend 아티팩트 이미지 빌드 시 사용하며 서버에는 필요 없습니다.
  - 최소 키(예)
    - `VITE_API_BASE_URL=/api`
    - 기타 `VITE_*` 공개값

---

## 3. 환경 변수 처리(빌드 → 런타임)

- **빌드(CI)**
  - Frontend: `VITE_*` 공개값만 번들에 내장(비밀 금지)
  - Backend: 멀티스테이지 빌드(비밀 무주입)
  - Nginx: conf 템플릿 + 엔트리포인트만 포함, 운영 값은 런타임 주입
- **런타임(서버/Compose)**
  - 루트 `.env`로 변수 확장(태그/이미지/DB)
  - Backend: `env_file`/`environment`로 주입 → 앱 시작 시 로드
  - Nginx: `envsubst`로 템플릿 치환 후 기동
  - MySQL: `MYSQL_*`로 초기화(데이터가 비어 있을 때만)
  - Frontend: `frontend-blue`/`frontend-green` 잡이 이미지의 `/opt/dist`(또는 `FE_DIST_PATH`)→ 공유 볼륨 복사

---

## 4. Git 추적/템플릿 정책

- 비밀이 포함될 수 있는 파일은 실제 파일을 커밋하지 않고 `*.example` 템플릿만 커밋합니다.
  - 예: `backend/.env.production.example`, `infra/nginx/.env.production.example`
- `frontend/.env.production`은 공개값만 포함하도록 유지합니다.
- 루트 `.gitignore`는 `.env*`를 무시하고 `*.example`은 허용합니다.

---

## 5. Secrets → 서버 .env 동기화 워크플로우

- GitHub Actions `sync-env` 워크플로우 파일 경로: `.github/workflows/sync-env.yml`
  - SSH로 서버 접속하여 `${HOME}/srv/web_project/.env`, `backend/.env.production`, `nginx/.env.production`를 갱신합니다.
  - Secrets에 base64로 저장 → 워크플로우에서 디코드 → 파일 권한 600으로 기록합니다.
  - 요구 Secrets(고정 키 이름)
    - `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PORT`
    - `ROOT_ENV_BASE64`, `BACKEND_ENV_PRODUCTION_BASE64`, `NGINX_ENV_PRODUCTION_BASE64`
  - 사용 순서
    1. 환경 파일 동기화(`sync-env`)
    2. 배포(`docker compose pull` → frontend 추출 → `docker compose up -d`)
    3. Compose config/헬스체크 확인

---

## 6. 우선순위 및 반영 시점

- Compose 변수 확장: 쉘 환경변수 > `.env` 파일. 실행 시점에 평가되므로 변경 시 `pull/up` 재실행이 필요합니다.
- 컨테이너 환경: `environment` > `env_file`. 값 변경 시 보통 재생성(`--force-recreate`)이 안전합니다.
- Frontend: 빌드 시 번들 고정. 변경 반영은 이미지 재빌드/재태깅 후 서버에서 태그 교체 및 추출(job) 재실행이 필요합니다.
- Backend: 런타임 주입. 변경 반영은 컨테이너 재생성/재시작이 필요합니다.
- Nginx: 엔트리포인트에서만 `envsubst`를 수행하므로 변경 반영은 재생성을 권장합니다.
- MySQL: `MYSQL_*` 값은 초기화 시 1회만 반영됩니다.
