# CI/CD

## 1. 개요

이 문서는 React(Frontend) + Spring Boot(Backend) + MySQL + Nginx 기반 웹 프로젝트의 CI/CD 전략을 정의한다.
목표는 CI에서 불변 이미지를 생성해 GHCR에 저장하고, CD에서 서버에 배포하여 안정성과 재현성을 보장하는 것이다.
또한 헬스체크, 롤백, 무중단 배포(Blue-Green), 모니터링으로 운영 안정성을 강화한다.

핵심 원칙

- FE 빌드 산출물(dist)은 전용 아티팩트 이미지로 분리한다. 서버에서는 일회성 추출(job)로 공유 볼륨에 동기화하고, Nginx가 이를 서빙한다. Nginx 이미지는 conf 변경 시에만 재빌드/재배포한다.
- BE는 멀티스테이지 빌드로 최소 런타임 이미지로 패키징하고, 비밀/환경변수는 런타임에만 주입한다.
- 모든 이미지는 latest와 커밋 기반 태그(sha-<GITHUB_SHA>)를 함께 사용해 추적성과 재현성을 높인다.

---

## 2. 구성요소와 아티팩트 전략

- Frontend
  - CI가 dist를 생성하고 dist를 포함한 전용 이미지(frontend)를 만든다.
  - 런타임에는 이미지를 실행하지 않고, 추출(job) 컨테이너로 dist만 공유 볼륨에 동기화한다.
- Backend
  - 멀티스테이지 빌드로 JAR 빌드 → 경량 런타임 이미지(Distroless/JRE) 구성.
  - 비밀은 이미지에 포함하지 않고 런타임에만 주입한다.
- Nginx
  - 정적 서빙과 리버스 프록시 역할. conf 템플릿과 엔트리포인트만 포함한다.
  - FE dist는 이미지에 포함하지 않는다.
- MySQL
  - 기본적으로 공식 이미지 사용. 필요한 경우에만 커스텀 Dockerfile을 빌드한다.

### 2.1 표준 명세(필수)

- 레지스트리: GHCR(ghcr.io)
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
  - `frontend`, `backend`, `nginx`, `mysql`
- 표준 볼륨 이름(Compose)
  - `frontend-dist`, `mysql-data`, `certbot`(운영 환경에서는 `mysql-data`, `certbot`는 호스트 바인드 필수)
- 표준 네트워크 이름(Compose)
  - `webnet`
- 경로/마운트 정책
  - 컨테이너 내부 표준 경로
    - FE dist(이미지 내부): `/opt/dist`(서버 변수 `FE_DIST_PATH`로 오버라이드 가능, 기본값 `/opt/dist`)
    - Nginx 정적 루트: `/usr/share/nginx/html`
    - Certbot 웹루트: `/var/www/certbot`
    - Let's Encrypt 인증서/키: `/etc/letsencrypt`
  - 운영 마운트 원칙
    - Certbot, MySQL 데이터는 호스트 바인드 마운트 필수(백업/마이그레이션/감사 용이)
    - FE dist는 기본적으로 named volume 사용, `FE_DIST_MOUNT`에 절대 경로를 지정하면 호스트 바인드로 전환된다.
  - 권장 호스트 경로(운영)
    - MySQL 데이터: `${HOME}/srv/web_project/mysql`
    - Certbot 챌린지 웹루트: `${HOME}/srv/web_project/certbot`
    - Let's Encrypt 인증서/키: `${HOME}/srv/web_project/letsencrypt/etc`
    - Let's Encrypt state: `${HOME}/srv/web_project/letsencrypt/lib`
    - Let's Encrypt 로그: `${HOME}/srv/web_project/letsencrypt/log`
    - FE dist(옵션): `${HOME}/srv/web_project/frontend/dist`(호스트 바인드 활성화 시)
    - Nginx/Backend .env 파일은 항상 호스트에 존재(Section 7 참조)
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
      docker-compose.prod.yml
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
  - 선택: 빌더 컨테이너에서 `pnpm build --watch`로 dist를 공유 볼륨에 생성하고, Nginx(dev)가 정적으로 서빙하여 “빌드 산출물 기반” 동작 검증.
- Backend
  - `./gradlew bootRun` 또는 dev Dockerfile을 사용.
- MySQL
  - Docker Compose로 구동, 로컬 볼륨 영속화.
- Nginx
  - `default.dev.conf`, 포트 80. `/`는 FE 정적, `/api/`는 BE 프록시.
- 개발 통합
  - `infra/docker/docker-compose.dev.yml`로 FE/BE/DB/Nginx를 통합 구동/중지.
  - compose 실행 시에는 컨테이너 내부 사용자 UID/GID를 호스트 사용자와 일치시켜야 한다. 그렇지 않으면 작업 디렉터리(`frontend`, `backend`)의 소유권이 `ubuntu:lxd` 등으로 변경될 수 있다. 다음과 같이 현재 사용자의 UID/GID를 넘겨 실행한다.

    ```bash
    LOCAL_UID=$(id -u) LOCAL_GID=$(id -g) docker compose -f infra/docker/docker-compose.dev.yml up -d
    ```

    `--env-file infra/docker/.env.dev` 등을 사용하는 경우에도 동일한 값을 선언해 둔다.

### 4.2 배포(운영)

- Frontend
  - CI에서 dist를 포함한 `frontend` 이미지를 빌드/푸시.
  - 서버에서는 추출(job)로 dist를 공유 볼륨(예: frontend-dist)에 동기화하고 Nginx가 서빙.
- Backend
  - JDK 단계에서 빌드 → 경량 런타임 이미지로 실행. 환경변수는 런타임에 주입.
- MySQL
  - Docker Compose로 관리. 데이터는 볼륨으로 영속화.
- Nginx
  - 포트 80/443. certbot 볼륨(`certbot`) 마운트. `default.prod.conf` 사용.
  - FE dist는 전용 볼륨(`frontend-dist`)에서 서빙하며, 해당 볼륨을 `/usr/share/nginx/html`에 마운트한다.
  - 기본 정책: 80 → 443 리다이렉트 수행(ACME 경로 `/.well-known/acme-challenge/`는 예외 처리).
- 운영 통합
  - 서버 루트(`${HOME}/srv/web_project`)의 `docker-compose.prod.yml` 기준으로 `docker compose pull` → `frontend` 실행(1회성 추출) → `docker compose up -d --remove-orphans` 순서로 배포.

---

## 5. CI 파이프라인

### 5.1 빌드 트리거 조건

- `/frontend` 변경 → FE(dist) 빌드
- `/infra/docker/frontend/**` 변경 → FE(dist) 빌드
- `/backend` 변경 → BE 빌드
- `/infra/docker/backend/**` 변경 → BE 빌드
- `/infra/nginx/**` 변경 → Nginx 빌드(conf 변경 시)
- `/infra/docker/mysql/**` 변경 → MySQL 빌드(커스텀 시)

### 5.2 빌드 단계

1. Runner가 레포를 체크아웃한다.
2. 서비스별 Docker 이미지를 빌드한다.
   - Frontend: dist 생성 → dist 포함 아티팩트 이미지를 빌드/푸시
   - Backend: 멀티스테이지 빌드(JAR → 런타임)
   - Nginx: conf 변경 시에만 빌드/푸시(기본적으로 FE dist 미포함)
   - MySQL: 커스텀 Dockerfile이 있을 때만 빌드
3. GHCR에 latest 및 sha-<GITHUB_SHA>로 태깅하여 push한다.

---

## 6. CD 파이프라인

1. 서버에서 필요한 이미지를 `docker compose pull`로 가져온다.
2. FE dist 동기화: `frontend` 이미지를 기반으로 추출(job) 컨테이너(서비스명 `frontend`)를 1회 실행하여 공유 볼륨(`frontend-dist`)에 dist를 동기화한다.

- 동기화 방법: `rsync -a --delete "$FE_DIST_PATH"/ "/dist"/` 세맨틱으로 전체 동기화(컨테이너 내 `FE_DIST_PATH` 기본 `/opt/dist`, 출력 마운트 경로 `/dist`).

3. `docker compose up -d --remove-orphans`로 BE 교체. Nginx는 conf 변경이 없으면 재시작 불필요.
4. `healthcheck`와 `depends_on: condition: service_healthy` 기반으로 안전하게 서비스 교체.
5. 롤백은 서버 `.env`의 태그 변수(`FE_TAG`/`BE_TAG`)를 지정 `sha-<GITHUB_SHA>`로 바꾼 뒤 `docker compose pull` → `frontend` 실행(1회성 추출) → `docker compose up -d` 순으로 수행한다.

- 기본 운영은 `latest`, 문제 발생 시 `sha-<GITHUB_SHA>`로 고정한다.
- FE/BE는 각각 독립적으로 고정/롤백 가능하도록 `FE_TAG`/`BE_TAG`를 분리 운영한다.

---

## 7. 서버 구성(필수 파일/디렉토리)

운영 환경에서는 certbot과 mysql 데이터는 호스트 바인드 마운트를 기본으로 한다(백업/복구 및 인증서 관리 용이). FE dist는 기본적으로 named volume을 사용하며, 필요 시 호스트 바인드로 전환할 수 있다. `.env` 파일들은 항상 호스트에 있어야 한다. 배포 전략에 따라 `docker-compose.prod.yml`과 `deploy-blue-green.sh`는 서버 루트(`${HOME}/srv/web_project/`)에 위치한다.

```
${HOME}/srv/web_project
  docker-compose.prod.yml   # 배포용 Compose 파일
  deploy-blue-green.sh      # Blue/Green 배포 스크립트
  /backend
    .env.production   # 운영 환경변수 (비밀 포함)
  /nginx
    .env.production   # 운영 환경변수 (비밀 금지)
  /mysql              # DB 데이터 볼륨
  /certbot            # ACME 웹루트(인증서 발급용)
  /letsencrypt
    /etc              # 발급된 인증서/체인
    /lib              # certbot state
    /log              # certbot 로그
  .env                # compose용(예: FE_TAG, BE_TAG 등 이미지 태그 고정)
  # (옵션) FE dist를 호스트 바인드로 운영하려면 다음 경로를 사용
  # /frontend/dist     # FE 정적 산출물(바인드 마운트 선택 시)
```

---

## 8. 보안 & 환경변수 관리

### 8.1 원칙 요약

- **이미지에는 비밀을 포함하지 않는다.** 모든 비밀은 런타임에만 주입한다.
- **Frontend 빌드 환경은 공개값만 포함한다.** `frontend/.env.production`은 공개 `VITE_*` 값만 저장하고 서버에는 배포하지 않는다.
- **Backend 운영 환경변수는 Git에 포함하지 않는다.** `backend/.env.production`은 비밀을 담고 서버에만 배치한다.
- **루트 `.env`는 Compose 변수 확장의 단일 진실 원천이다.** `${HOME}/srv/web_project/.env`에서 태그, 이미지, 공용 환경을 관리한다.
- **Nginx 템플릿 파일에는 비밀을 넣지 않는다.** `infra/nginx/.env.production`에는 도메인, 경로 등 공개 정보를 기록하고 `.example` 템플릿만 커밋한다.
- **DB 자격 증명은 Secrets 또는 루트 `.env`에서만 관리한다.** 인증서는 certbot/letsencrypt 볼륨으로 분리 관리한다.

### 8.2 서버에 필요한 .env 파일과 역할

- `${HOME}/srv/web_project/.env` (서버 루트, 필수)
  - 배포 시 `docker compose ... --env-file .env`로 로드되는 공용 환경파일
  - 키(기본값)
    - 태그 고정: `FE_TAG=latest`, `BE_TAG=latest`, `NGINX_TAG=latest`, `DB_TAG=8.4`
    - 이미지명:
      - `FRONTEND_IMAGE=ghcr.io/minjungw00/web-project-frontend`
      - `BACKEND_IMAGE=ghcr.io/minjungw00/web-project-backend`
      - `NGINX_IMAGE=ghcr.io/minjungw00/web-project-nginx`
      - `MYSQL_IMAGE=mysql`
    - 프론트 dist 경로: `FE_DIST_PATH=/opt/dist`
    - 네트워크/볼륨 이름(변경 비권장): `COMPOSE_NETWORK=webnet`
    - DNS 서버(필요 시): `COMPOSE_DNS1=1.1.1.1`, `COMPOSE_DNS2=8.8.8.8`
    - 마운트 소스 (절대 경로 지정 시 bind, 상대/단순 이름은 named volume):
      - `MYSQL_DATA_MOUNT=mysql-data`
      - `CERTBOT_MOUNT=certbot`
      - `FE_DIST_MOUNT=frontend-dist`
      - ※ `.env` 파일에서는 `$HOME` 같은 변수 확장이 일어나지 않으므로, 호스트 경로를 사용할 때는 `/home/ubuntu/...`처럼 절대 경로를 그대로 적어야 한다.

- `backend/.env.production`(서버에만 존재, Git 미추적, 필수)
  - Compose가 `env_file: ${SERVER_ROOT}/backend/.env.production`로 주입
  - 최소 키(예)
    - `SPRING_PROFILES_ACTIVE=prod`
    - `SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/<DB_NAME>?useSSL=false&allowPublicKeyRetrieval=true&characterEncoding=UTF-8&serverTimezone=UTC`
    - `SPRING_DATASOURCE_USERNAME=<DB_USER>`
    - `SPRING_DATASOURCE_PASSWORD=<DB_PASSWORD>`

- `nginx/.env.production`(서버에 존재, 비밀 금지, 필수)
  - Compose가 서버 루트 기준 경로로 주입됨(예: `env_file: $SERVER_ROOT/nginx/.env.production`)
  - 최소 키(기본값)
    - `NGINX_SERVER_NAME=example.com`
    - `NGINX_CERTBOT_ROOT=/var/www/certbot`
    - `NGINX_STATIC_ROOT=/usr/share/nginx/html`
    - `NGINX_BACKEND_HOST=backend-blue` (최초 배포 시 기본값, 배포 스크립트가 자동 전환)
    - `NGINX_BACKEND_PORT=8080`
  - `NGINX_SSL_CERT=/etc/letsencrypt/live/<domain>/fullchain.pem`
  - `NGINX_SSL_CERT_KEY=/etc/letsencrypt/live/<domain>/privkey.pem`
  - `NGINX_SSL_TRUSTED_CERT=/etc/letsencrypt/live/<domain>/chain.pem`
    - 선택 캐시: `NGINX_STATIC_CACHE_EXPIRES=1h`, `NGINX_STATIC_CACHE_CONTROL=max-age=3600, public`

- `frontend/.env.production`(빌드 전용, 공개값만, 필수)
  - CI에서 frontend 아티팩트 이미지 빌드 시 사용. 서버에는 필요 없음.
  - 최소 키(예)
    - `VITE_API_BASE_URL=/api`
    - 필요 시 추가 `VITE_*` 공개값들

### 8.3 환경 변수 처리(빌드 → 런타임)

- 빌드(CI)
  - Frontend: `VITE_*` 공개값만 번들에 내장(비밀 금지)
  - Backend: 멀티스테이지 빌드(비밀 무주입)
  - Nginx: conf 템플릿 + 엔트리포인트만 포함, 운영 값은 런타임 주입
- 런타임(서버/Compose)
  - 루트 `.env`로 변수 확장(태그/이미지/DB)
  - Backend: `env_file`/`environment`로 주입 → 앱 시작 시 로드
  - Nginx: `envsubst`로 템플릿 치환 후 기동
  - MySQL: `MYSQL_*`로 초기화(데이터가 비어 있을 때만)
  - Frontend: `frontend` 잡이 이미지의 `/opt/dist`(또는 `FE_DIST_PATH`)→ 공유 볼륨 복사

### 8.4 Git 추적/템플릿 정책

- 비밀이 포함될 수 있는 파일은 실제 파일을 커밋하지 않고 `*.example` 템플릿만 커밋한다.
  - 예: `backend/.env.production.example`, `infra/nginx/.env.production.example`
- `frontend/.env.production`은 공개값만 포함하도록 유지한다.
- 루트 `.gitignore`는 `.env*`를 무시하고 `*.example`은 허용한다.

### 8.5 Secrets → 서버 .env 동기화 워크플로우

- GitHub Actions `sync-env` 워크플로우 파일 경로: `.github/workflows/sync-env.yml`
  - SSH로 서버 접속, `${HOME}/srv/web_project/.env`, `backend/.env.production`, `nginx/.env.production`를 갱신
  - Secrets에 base64로 저장 → 워크플로우에서 디코드 → 파일 권한 600으로 기록
  - 요구 Secrets(고정 키 이름)
    - `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PORT`
    - `ROOT_ENV_BASE64`, `BACKEND_ENV_PRODUCTION_BASE64`, `NGINX_ENV_PRODUCTION_BASE64`
  - 사용 순서: ① sync-env 최신화 → ② 배포(pull → frontend(추출) → up -d) → ③ compose config/헬스체크 확인

### 8.6 우선순위/반영 시점 요약

- Compose 변수 확장: 쉘 환경변수 > `.env` 파일. 실행 시점에 평가되므로 변경 시 `pull/up` 재실행 필요.
- 컨테이너 환경: `environment` > `env_file`. 값 변경 시 보통 재생성(`--force-recreate`)이 안전.
- Frontend: 빌드 시 번들 고정. 변경 반영은 이미지 재빌드/재태깅, 서버에선 태그 교체 후 추출(job) 재실행.
- Backend: 런타임 주입. 변경 반영은 재생성/재시작.
- Nginx: 엔트리포인트에서만 `envsubst` 수행 → 변경 반영은 재생성 권장.
- MySQL: `MYSQL_*`은 초기화 시 1회만 반영.

---

## 9. 운영 기법

### 9.1 헬스체크

- FE(Nginx): `/healthz` 정적 200 → `curl -f http://localhost/healthz` (Nginx `location = /healthz` 블록이 `return 200 'ok'`로 즉시 응답하며, HTTP/HTTPS 모두 동일 동작)
  - 파라미터: `interval: 5s`, `timeout: 2s`, `retries: 3`, `start_period: 5s`
- BE(Spring Boot): Actuator `/actuator/health`
  - 예: `curl -f http://localhost:8080/actuator/health`
  - Actuator 미도입 시 임시 `/api/health` 등 경량 엔드포인트
- MySQL: `mysqladmin ping -h 127.0.0.1 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD"`
  - 127.0.0.1 권장(DNS 이슈 회피)

Compose에서는 `depends_on: condition: service_healthy`로 기동 순서/교체 안전성을 확보한다.

### 9.2 무중단 배포(Blue-Green)

#### 9.2.1 구성 개념

- 무중단 배포는 동일한 인프라를 두 개의 색상(Blue/Green) 스택으로 이원화하고, 활성 스택과 대기 스택을 교차시키는 Blue-Green 전략을 사용한다.
- `infra/docker/docker-compose.prod.yml`은 하나의 Compose 프로젝트 안에 `backend-blue`, `backend-green`, `frontend-blue`, `frontend-green` 서비스를 모두 정의한다. 두 backend 중 하나만 실행하며, FE dist 동기화는 색상별 job으로 수행한다.
- `mysql`, `nginx`, `frontend-dist` 볼륨, `certbot` 볼륨은 단일 인스턴스를 공유한다. 따라서 데이터/인증서는 공용이며, 색상 전환 시 backend 애플리케이션만 교체된다.
- Nginx 업스트림은 환경변수(`NGINX_BACKEND_HOST`)로 현재 활성 스택의 backend 서비스명을 참조한다. 색상 전환 시 해당 값을 `backend-blue` 또는 `backend-green`으로 갱신하고 nginx를 재기동(또는 reload)한다.

#### 9.2.2 준비 사항

- 서버에는 `~/srv/web_project` 기준으로 Compose 파일(`docker-compose.prod.yml`), `.env`, `backend/.env.production`, `nginx/.env.production`이 존재해야 한다.
- GitHub Actions가 업로드하는 `infra/deploy-blue-green.sh`를 서버에서 실행 가능하도록 `chmod +x` 권한을 부여한다. 스크립트는 자동으로 `SERVER_ROOT`를 `~/srv/web_project`로 설정한다.
- `.env` 파일에 기본 태그(`FE_TAG`, `BE_TAG`, `NGINX_TAG`, `DB_TAG`)가 정의되어야 하며, 배포 시 새 태그를 환경변수로 덮어써서 새로운 이미지를 선택한다.
- 최초 1회 `docker compose -f docker-compose.prod.yml --env-file .env up -d mysql nginx`를 실행해 데이터베이스와 Nginx 인프라 서비스를 기동한다. 이후부터는 스크립트가 backend와 frontend dist만 교체한다.
- 초기 배포 시 `nginx/.env.production`의 `NGINX_BACKEND_HOST`가 `backend-blue`로 설정돼 있어야 하며, 활성 색상을 찾을 수 없을 때 스크립트는 자동으로 blue를 선택한다.

#### 9.2.3 배포 절차

1. **색상 결정**: `deploy-blue-green.sh`가 `nginx/.env.production`의 `NGINX_BACKEND_HOST` 값 또는 현재 실행 중인 컨테이너를 읽어 활성 색상을 판별한다. 활성 색상이 `blue`면 다음 배포 타깃은 `green`, 반대도 동일하다.
2. **이미지 준비**: CI가 `latest`와 `sha-<GITHUB_SHA>` 태그를 푸시한 뒤, 스크립트가 자동으로 `docker compose pull backend-<색상> frontend-<색상> nginx mysql`을 호출해 필요한 이미지를 가져온다(옵션 `--skip-pull`로 생략 가능).
3. **대기 스택 기동**: `docker compose up -d backend-<색상>`으로 새 backend를 띄우고 헬스체크가 통과할 때까지 대기한다. 헬스체크 실패 시 즉시 배포를 중단한다.
4. **FE dist 동기화**: `docker compose run --rm frontend-<색상>`으로 FE dist를 공유 볼륨에 덮어쓴다. dist가 없으면 배포가 실패하므로 CI 산출물을 확인한다.
5. **트래픽 전환**: 스크립트가 `nginx/.env.production`의 `NGINX_BACKEND_HOST`를 새 색상으로 업데이트한 뒤 `docker compose up -d nginx`를 호출해 컨테이너를 재시작한다.
6. **검증 및 모니터링**: `docker compose exec nginx wget -qO- http://localhost/healthz`를 반복 실행해 헬스 체크가 통과하는지 확인한다. 실패 시 스크립트가 자동으로 이전 색상으로 롤백하고 종료한다.
7. **구 스택 정리**: 새 스택이 안정화된 경우에만 `docker compose stop backend-<이전색상>` → `docker compose rm -f backend-<이전색상>`으로 이전 backend를 정리하고 `docker image prune --filter "dangling=true" --force`로 사용하지 않는 이미지를 삭제한다.

#### 9.2.4 자동화 팁

- `infra/deploy-blue-green.sh` 스크립트는 색상 전환 로직, 헬스 체크, nginx 롤백까지 포함하므로 워크플로우에서는 해당 스크립트만 호출하면 된다. 필요 시 `--color blue` 옵션으로 특정 색상 강제 배포가 가능하다.
- GitHub Actions `deploy.yml` 워크플로는 서버에서 스크립트를 실행하도록 구성되어 있다. 활성 색상 탐지가 실패하면 기본값인 `blue`로 초기화하므로, 초기 배포 시에도 별도 인자 없이 실행할 수 있다.
- DB 마이그레이션이 필요한 경우 스크립트 실행 전에 수행하거나 Liquibase/Flyway를 사용해 양쪽 색상에서 호환되는 스키마를 유지한다.
- 장기 실행 배치는 색상별 컨테이너에서 중복 실행될 수 있으므로, 배포 전에 종료하거나 스케줄러를 조정해 두 색상 중 하나에서만 실행되도록 한다.
- DB 스키마 변경은 **Expand → Migrate → Contract** 순서를 따른다. 먼저 스키마를 확장(Expand)해 두 색상 모두 동작 가능하게 만들고, 새 코드 배포 후 데이터를 이전(Migrate)한 뒤, 더 이상 사용하지 않는 컬럼/제약을 제거(Contract)한다.

위 전략을 통해 배포 시점에 Nginx가 바라보는 backend 대상만 전환하므로 외부 트래픽은 끊기지 않으며, 문제가 발생하면 스크립트가 즉시 이전 색상으로 롤백한다.

### 9.3 롤백

- 모든 이미지에 `latest`와 `sha-<GITHUB_SHA>`를 태깅한다.
- 문제 발생 시 서버 `.env`의 `FE_TAG`/`BE_TAG`를 해당 `sha-<GITHUB_SHA>`로 바꾸고 `docker compose pull` → `frontend` 실행(추출) → `docker compose up -d`
- 필요 시 digest 고정(`@sha256:<digest>`)으로 재현성 극대화 가능(권장 옵션)

### 9.4 모니터링/로깅

- 로그 로테이션: `json-file` 드라이버에 `max-size`, `max-file` 적용(예: `max-size: "10m"`, `max-file: "3"`)
- 필요 시 Loki/ELK, Prometheus/Grafana, Sentry 등을 연계

### 9.5 Certbot 인증서 발급/갱신

1. DNS가 운영 도메인을 가리키는지 확인한다(A/AAAA 레코드).
2. 서버에 `infra/nginx/certbot-issue.sh`를 업로드하고 실행 권한을 부여한다(`chmod +x certbot-issue.sh`). 스크립트는 전달된 `--base-dir` 또는 자신의 디렉터리를 기준으로 동작한다.
3. 최초 발급은 아래와 같이 수행한다(
   `${HOME}/srv/web_project`를 Certbot 데이터 경로로 사용하는 경우 예시):

   ```bash
   ./certbot-issue.sh \
     --base-dir ${HOME}/srv/web_project \
     -d example.com -d www.example.com \
     -e admin@example.com
   ```

   - 스크립트는 `certbot/certbot` 이미지를 사용하여 웹루트(`<base-dir>/certbot`)를 통해 챌린지를 처리하고,
     인증서/키는 `<base-dir>/letsencrypt/etc` 이하에 저장한다.
   - `--base-dir`을 생략하면 스크립트가 위치한 디렉터리를 자동으로 사용한다.
   - `--staging` 또는 `--dry-run` 옵션으로 사전 검증이 가능하다.

> **중요**: 서버 루트 `.env`에서 `CERTBOT_MOUNT`, `LETSENCRYPT_MOUNT`, `LETSENCRYPT_LOG_MOUNT` 값을 반드시 호스트 절대 경로로 설정해 bind mount 하세요. 예) `${HOME}/srv/web_project/certbot`, `${HOME}/srv/web_project/letsencrypt/etc`, `${HOME}/srv/web_project/letsencrypt/log`. Named volume를 사용할 경우 Certbot이 생성한 인증서를 Nginx가 읽지 못해 기동에 실패합니다.

4. 발급 후 `docker compose -f docker-compose.prod.yml up -d nginx`를 재실행하거나
   `docker compose exec nginx nginx -s reload`로 설정을 재적용한다.
5. 정기 갱신은 동일 스크립트를 실행하거나, 크론으로 `certbot-issue.sh --base-dir ${HOME}/srv/web_project --dry-run`을 주기적으로 실행해 상태를 확인한다.

### 9.6 DNS 문제 대응

- Docker 데몬 로그에 `No non-localhost DNS nameservers are left in resolv.conf`가 반복되면 호스트의 `/etc/resolv.conf`가 `127.0.0.1` 같은 루프백 주소만 포함하고 있을 가능성이 높다. 컨테이너는 해당 주소에 접근할 수 없으므로 Docker가 외부 기본 DNS(8.8.8.8 등)로 대체하며, 방화벽 정책에 따라 네임 해석이 실패할 수 있다.
- 해결 방법
  - (권장) 호스트의 DNS 설정을 점검하여 `/run/systemd/resolve/resolv.conf` 등 실제 업스트림 네임 서버 목록을 노출하도록 조정한다.
  - 또는 이 레포의 Compose 파일에서 제공하는 `COMPOSE_DNS1`, `COMPOSE_DNS2` 환경변수를 사용하여 컨테이너가 직접 사용할 DNS를 지정한다. 값 변경 후 `docker compose up -d`로 컨테이너를 재기동하면 설정이 반영된다.
  - 기업 네트워크처럼 사설 DNS가 필요한 경우 방화벽에서 허용된 주소를 지정해야 한다.

---

## 10. 배포 실행 흐름(워크플로우 순서)

본 레포는 GitHub Actions를 사용해 CI(이미지 빌드)와 CD(서버 배포)를 수행한다. 서버에는 레포 전체를 클론할 필요가 없으며, 배포 워크플로우가 `docker-compose.prod.yml`을 서버 루트(`${HOME}/srv/web_project`)에 업로드하고 실행한다.

### 10.1 사전 준비(1회)

- 빠른 순서 요약
  1. GitHub 저장소에 Secrets(`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `ROOT_ENV_BASE64` 등)을 등록한다.
  2. 서버에서 `${HOME}/srv/web_project`와 하위 디렉터리(`backend`, `nginx`, `mysql`, `mysql/init`)를 생성한다.
  3. `sync-env` 워크플로우 또는 수동 명령으로 `.env`, `backend/.env.production`, `nginx/.env.production`을 배포하고, 최초 `docker compose -f docker-compose.prod.yml --env-file .env up -d mysql nginx`를 실행한다.

- GitHub Secrets 설정
  - `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`(PEM)
  - `ROOT_ENV_BASE64`, `BACKEND_ENV_PRODUCTION_BASE64`, `NGINX_ENV_PRODUCTION_BASE64`
- 서버 디렉터리(배포 워크플로우가 자동 생성)
  - `${HOME}/srv/web_project`
  - `${HOME}/srv/web_project/backend`
  - `${HOME}/srv/web_project/nginx`
  - `${HOME}/srv/web_project/mysql`(필요 시 init 스크립트 배치)
  - `${HOME}/srv/web_project/mysql/init`(초기 SQL이 없더라도 빈 디렉터리를 미리 생성)

### 10.2 배포 순서(매 배포 시)

1. CI: 이미지 빌드/푸시(GHCR)

- 트리거: `main`에 push 시 변경 경로에 따라 자동 실행
  - FE: `.github/workflows/frontend.yml`
  - BE: `.github/workflows/backend.yml`
  - Nginx: `.github/workflows/nginx.yml`
  - MySQL(선택): `.github/workflows/mysql.yml`
- 태그 전략: `latest` + `sha-<GITHUB_SHA>` 동시 태깅

2. 서버 환경 파일 동기화

- 실행: `.github/workflows/sync-env.yml`
- 동작: SSH로 서버 접속 → `${HOME}/srv/web_project/` 아래 파일 갱신(권한 600)
  - `.env`(루트), `backend/.env.production`, `nginx/.env.production`

3. 배포 실행

- 실행: `.github/workflows/deploy.yml`
- 입력값(선택): `image_tag`(공통), `fe_tag`/`be_tag`/`nginx_tag`/`db_tag`(개별)
- 동작: compose 파일과 `infra/deploy-blue-green.sh` 업로드 → 서버에서 태그 환경변수를 설정 → `infra/deploy-blue-green.sh` 실행으로 자동 색상 전환 → 필요 시 실패 시 알람 → Docker dangling 이미지 정리

4. 헬스 확인(선택)

- Nginx: `curl -f http://localhost/healthz`
- Backend: `curl -f http://localhost:8080/actuator/health`

### 10.3 태그 운용 팁

- 기본은 `latest` 운영, 이슈 시 `sha-<GITHUB_SHA>`로 특정 버전 고정.
- FE/BE는 각자 태그를 독립적으로 지정 가능(부분 교체).

---

## 11. 요약

- CI: 서비스별 Docker 이미지 빌드 → GHCR push(latest + SHA). FE는 frontend 아티팩트 이미지, BE/Nginx는 독립 관리
- CD: compose pull → FE 추출(job)로 dist 동기화 → BE 교체(up -d) → 헬스체크로 안전 교체
- FE: 공개 환경값만 사용. dist는 이미지→볼륨 추출 후 Nginx가 서빙(Nginx는 conf 변경 시에만 재배포)
- BE: 비밀은 런타임에만 주입. `backend/.env.production`은 Git 미추적
- MySQL/인증서: 서버 로컬 볼륨 관리
- 운영 안정성: 헬스체크, 롤백, 무중단 배포, 모니터링으로 보완

참고: compose에서는 개별 태그 변수를 사용한다(예: `FE_TAG`, `BE_TAG`, `NGINX_TAG`, `DB_TAG`).
