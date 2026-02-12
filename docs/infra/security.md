# Security & Environment Management

이 문서는 Web Project 인프라에서 비밀 관리, 4-Tier 아키텍처별 환경변수 정책, 템플릿 관리, Secrets 동기화 워크플로우 및 적용 우선순위에 대해 설명합니다.

**참고 문서:**

- 전반적인 구조: [`architecture.md`](./architecture.md)
- CI/CD 파이프라인: [`pipelines.md`](./pipelines.md)
- 운영 방안: [`operations.md`](./operations.md)
- GitHub Actions 배포: [`pipelines.md`](./pipelines.md)

---

## 1. 보안 원칙

다음 원칙은 전 스택(Infrastructure/Application/Gateway/Monitoring)에서 일관되게 적용됩니다.

- 최소 권한 원칙: 서비스·사용자·토큰에는 필요한 권한만 부여합니다. DB는 앱 전용 계정만 사용하고, 모니터링 계정은 읽기 전용 권한으로 제한합니다.
- 비밀 분리: 비밀은 이미지나 Git에 포함하지 않습니다. `.env.*.prod`는 서버에만 존재하고, 레포에는 `*.example`만 커밋합니다.
- 런타임 주입: 빌드 시 비밀 주입 금지(특히 프론트엔드). 백엔드는 `env_file`로만 주입합니다.
- 네트워크 경계: 외부 네트워크는 하나(`APP_NETWORK_NAME`)로 통합 관리하고, 내부 모니터링 경로는 CIDR 화이트리스트(`NGINX_MONITORING_INTERNAL_CIDR`)를 적용합니다.
- 감사/가시성: Grafana/Prometheus/Alertmanager로 상태와 알림을 중앙화하며, 민감 로그(비밀번호/토큰)는 출력하지 않습니다.
- 키 순환: 운영 비밀은 90일 주기 회전을 권장합니다. 히스토리 노출 시 즉시 폐기·재발급합니다.

---

## 2. 환경 변수 우선순위 및 적용

### 2.1. compose 레이어별 환경 변수 우선순위 (병합 규칙)

1. **루트 `.env.server`**: 전역 기본값 제공
2. **레이어별 `.env`**: 스택 전용 값으로 루트 값을 덮어씀 (스택 > 루트)
3. **쉘 환경변수**: 실행 시점의 쉘 환경이 최우선
4. **컨테이너 환경**: `environment` > `env_file`은 컨테이너 내부 환경에 적용

### 2.2. 빌드 → 런타임 처리

**빌드 시 (CI/CD)**:

- **Frontend**: `VITE_*` 공개값만 번들에 내장 (비밀 금지)
- **Backend**: 멀티스테이지 빌드 (비밀 무주입)
- **Nginx**: conf 템플릿 + 엔트리포인트만 포함, 운영 값은 런타임 주입

**런타임 시 (서버/Compose)**:

- **각 레이어 .env**: 레이어별 환경변수 로드 (태그/이미지/네트워크 등)
- **Backend**: `env_file`/`environment`로 주입 → 앱 시작 시 로드
- **Nginx**: `envsubst`로 템플릿 치환 후 기동
- **MySQL**: `MYSQL_*`로 초기화 (데이터가 비어 있을 때만)
- **Frontend**: `frontend-blue`/`frontend-green` 잡이 이미지의 `/opt/dist` → 공유 볼륨 복사

### 2.3. 변경 사항 반영 시점

| 항목                      | 변경 시 필요 작업                           | 비고                             |
| ------------------------- | ------------------------------------------- | -------------------------------- |
| **Infrastructure `.env`** | `docker compose up -d --force-recreate`     | 네트워크/DB 설정 변경            |
| **Application `.env`**    | `docker compose up -d --force-recreate`     | 이미지 태그, 볼륨 경로 변경      |
| **Frontend 빌드 변수**    | 이미지 재빌드 → 태그 교체 → 추출 job 재실행 | 번들에 고정됨                    |
| **Backend 런타임 변수**   | 컨테이너 재생성/재시작                      | `env_file` 변경                  |
| **Nginx 설정**            | 컨테이너 재생성 권장                        | 엔트리포인트에서 `envsubst` 수행 |
| **MySQL 초기화 변수**     | 볼륨 삭제 후 재생성                         | 초기화 시 1회만 반영             |

---

## 3. 환경 변수 관련 스크립트

### 3.1. compose-with-env

**목적**: 여러 `.env` 파일을 순서대로 병합(후승)하여 하나의 임시 `.env`로 만든 뒤, 해당 파일로 `docker compose`를 실행합니다.

**동작 방식**:

1. `--env <파일>`들을 왼쪽→오른쪽 순서로 읽고 주석/공백을 제거합니다.
2. 동일 키는 마지막 파일의 값이 우선합니다(Last-wins).
3. 임시 디렉터리에 `.env.merged`를 생성하고 `docker compose --env-file .env.merged …`로 실행합니다.

**사용 예시**:

- 개발:
  - `scripts/compose-with-env.mjs --env infra/.env.server.dev --env infra/application/.env.application.dev -- docker compose -f infra/application/docker-compose.application.dev.yml up -d`
- 운영(서버 내):
  - `scripts/compose-with-env.sh --env $SERVER_ROOT/.env.server --env $SERVER_ROOT/application/.env.application.prod -- docker compose -f $SERVER_ROOT/application/docker-compose.application.prod.yml up -d`

**안전성**:

- 병합 파일은 OS 임시 디렉토리에 생성되며, 프로세스 종료 시 삭제됩니다(쉘 스크립트는 trap으로 삭제).
- 누락된 파일은 경고 후 건너뜁니다.

### 3.2. detect-docker-cidr

**목적**: Docker 외부 네트워크의 CIDR을 자동으로 탐지하여 `.env` 파일의 특정 변수(기본: `NGINX_MONITORING_INTERNAL_CIDR`)에 기록합니다.

**동작 방식**:

1. `docker network inspect <name> --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'`로 CIDR을 확인합니다.
2. `--env-file`이 지정되면 해당 파일의 `<VAR>=…` 라인을 치환/추가합니다.

**사용 예시**:

- 개발: `node scripts/detect-docker-cidr.mjs --network web_project_webnet-dev`
- 운영(서버 내): `node scripts/detect-docker-cidr.mjs --network web_project_webnet --env-file $SERVER_ROOT/gateway/nginx/.env.production --var NGINX_MONITORING_INTERNAL_CIDR`

**실행 시점**:

- 초기 설치 직후 또는 네트워크 재생성 후 1회 실행합니다.
- `/monitoring/*` Basic Auth 우회를 위한 내부 대역 정책(Nginx) 업데이트 시 재실행합니다.

### 3.3. sync-local-ids

**목적**: 개발 환경에서 Docker 컨테이너 내부 파일의 소유권을 호스트 사용자와 동기화합니다.

**동작 방식**:

1. `.env.application.dev` 파일 존재 여부 확인
2. 파일이 있으면:
   - 기존 내용 읽기
   - `LOCAL_UID=숫자` 패턴을 현재 사용자 UID로 교체
   - `LOCAL_GID=숫자` 패턴을 현재 사용자 GID로 교체
   - **다른 모든 변수는 그대로 보존**
   - 업데이트된 내용 저장
3. 파일이 없으면:
   - 완전한 템플릿 생성 (모든 필수 환경 변수 포함)
   - UID/GID는 현재 사용자 값으로 설정

**실행 시점**:

- `pnpm docker:sync-ids` 명령으로 실행합니다.
- `pnpm docker:application:dev:up` 실행 전 자동 실행합니다. (preup hook)

**Git 추적**: `.env.application.dev`는 자동 생성되므로 Git에 추적되지 않습니다.

---

## 4. Git 추적 및 템플릿 정책

### 4.1. 기본 원칙

- 비밀 파일은 커밋 금지, `*.example` 템플릿만 커밋
- `.gitignore`에서 `.env*`는 무시, `*.example` 허용
- 이미 커밋된 비밀은 즉시 추적 해제/비밀번호 회전

### 4.2. 이미 커밋된 비밀 파일 제거

만약 비밀이 포함된 파일이 이미 Git에 커밋되어 있다면:

```bash
# 1. 추적 해제 (파일은 유지)
git rm --cached backend/.env.development
git rm --cached infra/monitoring/mysqld-exporter/.my.cnf.prod

# 2. .gitignore 확인 (이미 무시 규칙이 있는지)
cat .gitignore

# 3. 커밋
git commit -m "chore: Remove sensitive files from git tracking"

# 4. 비밀번호 회전 (히스토리에 노출되었다면 필수)
# - 데이터베이스 비밀번호 변경
# - API 키 재발급
# - 등등
```

---

## 5. GitHub Secrets 동기화 워크플로우

### 5.1 워크플로우 개요

GitHub Actions `sync-env` 워크플로우는 GitHub Secrets에 저장된 환경변수를 서버의 각 레이어 디렉토리에 안전하게 동기화합니다.

**워크플로우 파일 경로**: `.github/workflows/sync-env.yml`

### 5.2 필수 GitHub Secrets

#### 5.2.1. 배포 서버 접속 정보

| Secret 이름      | 설명        | 예시            |
| ---------------- | ----------- | --------------- |
| `DEPLOY_HOST`    | 서버 호스트 | `example.com`   |
| `DEPLOY_USER`    | SSH 사용자  | `ubuntu`        |
| `DEPLOY_SSH_KEY` | SSH 개인 키 | `-----BEGIN...` |
| `DEPLOY_PORT`    | SSH 포트    | `22`            |

#### 5.2.2. 레이어별 환경 변수 (Base64 인코딩)

주의: 서버 배치 경로는 아키텍처 문서의 호스트 디렉토리 구조를 따릅니다(`${HOME}/srv/web_project` 하위에 layer별 디렉토리 배치). 일부 가이드의 `$WORKDIR/infra/...` 표기는 본 프로젝트에서는 `$WORKDIR/<layer>/...`로 대응됩니다.

| Secret 이름                             | 대상 파일                                                   |
| --------------------------------------- | ----------------------------------------------------------- |
| `SERVER_ROOT_ENV_BASE64`                | `~/srv/web_project/.env.server.prod`                        |
| `INFRASTRUCTURE_ENV_PRODUCTION_BASE64`  | `~/srv/web_project/infrastructure/.env.infrastructure.prod` |
| `APPLICATION_ENV_PRODUCTION_BASE64`     | `~/srv/web_project/application/.env.application.prod`       |
| `BACKEND_ENV_PRODUCTION_BASE64`         | `~/srv/web_project/application/backend/.env.production`     |
| `GATEWAY_ENV_PRODUCTION_BASE64`         | `~/srv/web_project/gateway/.env.gateway.prod`               |
| `NGINX_ENV_PRODUCTION_BASE64`           | `~/srv/web_project/gateway/nginx/.env.production`           |
| `MONITORING_ENV_PRODUCTION_BASE64`      | `~/srv/web_project/monitoring/.env.monitoring.prod`         |
| `NGINX_MONITORING_HTPASSWD_PROD_BASE64` | `~/srv/web_project/gateway/nginx/monitoring.htpasswd.prod`  |
| `MYSQLD_EXPORTER_MYCNF_PROD_BASE64`     | `~/srv/web_project/monitoring/mysqld-exporter/.my.cnf.prod` |

### 5.2.3. Base64 인코딩 방법

```bash
# Linux/macOS
cat .env.infrastructure.prod | base64 -w 0 > infrastructure_env.base64

# 또는 한 줄로
base64 -w 0 < .env.infrastructure.prod

# macOS (개행 없이)
base64 -i .env.infrastructure.prod | tr -d '\n'
```

### 5.2.4. 워크플로우 동작 방식

1. **SSH로 서버 접속**
2. **디렉토리 생성** (존재하지 않는 경우)
3. **Secrets 디코드 및 파일 생성**
   - Base64 → 원본 텍스트
   - 파일 권한 600 설정 (소유자만 읽기/쓰기)
4. **검증**
   - 파일 존재 여부 확인
   - 파일 크기 확인 (0바이트가 아닌지)

---

## 6. 우선순위 및 반영 시점

- Compose 변수 확장: 쉘 환경변수 > `.env` 파일. 실행 시점에 평가되므로 변경 시 `pull/up` 재실행이 필요합니다.
- 컨테이너 환경: `environment` > `env_file`. 값 변경 시 보통 재생성(`--force-recreate`)이 안전합니다.
- Frontend: 빌드 시 번들 고정. 변경 반영은 이미지 재빌드/재태깅 후 서버에서 태그 교체 및 추출(job) 재실행이 필요합니다.
- Backend: 런타임 주입. 변경 반영은 컨테이너 재생성/재시작이 필요합니다.
- Nginx: 엔트리포인트에서만 `envsubst`를 수행하므로 변경 반영은 재생성을 권장합니다.
- MySQL: `MYSQL_*` 값은 초기화 시 1회만 반영됩니다.

---

## 7. 베스트 프랙티스

### 7.1. 비밀 정보 관리

✅ **DO**:

- `.env.*.prod` 파일은 서버에서만 생성/관리
- 비밀번호는 강력한 값으로 설정 (최소 16자, 특수문자 포함)
- GitHub Secrets에 Base64로 인코딩하여 저장
- 파일 권한은 600 (소유자만 읽기/쓰기)
- 정기적으로 비밀 회전 (90일마다 권장)

❌ **DON'T**:

- `.env.*.prod` 파일을 Git에 커밋
- 비밀을 Dockerfile이나 이미지에 포함
- 로그에 비밀 출력
- 동일한 비밀을 여러 환경에서 재사용

### 7.2. 레이어 독립성

✅ **DO**:

- 각 레이어는 자신의 `.env` 파일만 사용
- 다른 레이어의 리소스는 환경 변수로 참조
- 레이어 간 직접 의존성 최소화
- External 네트워크/볼륨으로 연결

❌ **DON'T**:

- 하드코딩된 서비스 이름 사용
- 레이어를 넘어선 직접 파일 접근
- 환경 변수를 다른 레이어에서 중복 정의

### 7.3. 개발 환경

✅ **DO**:

- `.env.application.dev`는 sync-local-ids.mjs가 관리하도록 둠
- 개발 환경 비밀번호는 단순한 값 사용 가능
- 템플릿 파일(`.example`)은 Git에 커밋
- 로컬에서만 사용하는 설정은 `.env.development`에

❌ **DON'T**:

- `.env.application.dev`를 수동으로 편집 (UID/GID 덮어쓰기 위험)
- 개발 환경 설정을 프로덕션에 사용
- 프로덕션 비밀을 개발 환경에 노출

### 7.4. 문서화

✅ **DO**:

- 각 레이어의 README.md에 환경 변수 설명 추가
- `.example` 파일에 주석으로 설명 작성
- 필수 변수와 선택 변수 구분
- 기본값과 예시 제공

❌ **DON'T**:

- 실제 비밀값을 문서나 주석에 포함
- 오래된 문서 방치
- 환경 변수 변경 시 문서 미업데이트

---

## 8. 트러블슈팅

### 8.1 GitHub Secrets 디코딩 실패

**문제**: sync-env 워크플로우에서 디코딩 실패  
**원인**: Base64 인코딩이 잘못되었거나 개행 문자가 포함됨  
**해결**:

```bash
# 개행 없이 인코딩 (-w 0 옵션)
base64 -w 0 < .env.infrastructure.prod

# macOS
base64 -i .env.infrastructure.prod | tr -d '\n'
```

---

## 9. 스택 별 환경 변수

### 9.1. Infrastructure 환경 변수

#### 9.1.1. MySQL 환경 변수 (`infra/infrastructure/.env.infrastructure.*`)

| 변수                  | 설명                           | 개발 기본값    | 프로덕션                  |
| --------------------- | ------------------------------ | -------------- | ------------------------- |
| `MYSQL_IMAGE`         | MySQL 이미지                   | `mysql`        | `mysql`                   |
| `DB_TAG`              | MySQL 태그                     | `8.4`          | CI/운영 입력              |
| `MYSQL_PORT`          | 호스트 포트                    | `3306`         | `3306`                    |
| `MYSQL_ROOT_PASSWORD` | 루트 비밀번호                  | `rootpassword` | `__REPLACE_ME__` 🔒       |
| `MYSQL_DATABASE`      | 기본 DB 이름                   | `appdb`        | `appdb`                   |
| `MYSQL_USER`          | 앱 계정                        | `app`          | `app`                     |
| `MYSQL_PASSWORD`      | 앱 계정 비밀번호               | `apppassword`  | `__REPLACE_ME__` 🔒       |
| `MYSQL_DATA_MOUNT`    | 데이터 볼륨/바인드 경로        | `mysql-data`   | `/srv/...` 등 바인드 권장 |
| `MYSQL_INIT_MOUNT`    | 초기화 스크립트 경로(읽기전용) | `./mysql/init` | `./mysql/init`            |

초기화 스크립트는 데이터 볼륨이 빈 경우에만 적용됩니다. 모니터링 사용자 초기화 예시는 `infra/infrastructure/mysql/init-templates/01-init-monitoring.sql.example`를 참고하세요.

### 9.2. Application 환경 변수

#### 9.2.1. Frontend 환경 변수 (`frontend/.env.*`)

빌드 전용, 공개값만

| 변수                | 설명           | 예시   |
| ------------------- | -------------- | ------ |
| `VITE_API_BASE_URL` | API 기본 경로  | `/api` |
| 기타 `VITE_*`       | 공개 환경 변수 | -      |

#### 9.2.2. Backend 환경 변수 (`backend/.env.*`)

서버 전용, 비밀 포함 🔒

| 변수                         | 설명             | 예시                                |
| ---------------------------- | ---------------- | ----------------------------------- |
| `SPRING_PROFILES_ACTIVE`     | Spring 프로파일  | `prod`                              |
| `SPRING_DATASOURCE_URL`      | JDBC URL         | `jdbc:mysql://mysql:3306/appdb?...` |
| `SPRING_DATASOURCE_USERNAME` | DB 사용자        | `app`                               |
| `SPRING_DATASOURCE_PASSWORD` | DB 비밀번호      | 🔒                                  |
| `SERVER_PORT`                | 서버 포트        | `8080`                              |
| `APP_CORS_ORIGINS`           | CORS 허용 Origin | `https://example.com`               |

#### 9.2.3. Application Compose 환경 변수 (`infra/application/.env.application.*`)

| 변수                   | 설명                         | 개발 기본값                        | 프로덕션                          |
| ---------------------- | ---------------------------- | ---------------------------------- | --------------------------------- |
| `LOCAL_UID`            | 호스트 사용자 UID            | 자동 감지                          | N/A (개발 전용)                   |
| `LOCAL_GID`            | 호스트 사용자 GID            | 자동 감지                          | N/A (개발 전용)                   |
| `COMPOSE_PROJECT_NAME` | Compose 프로젝트 이름        | `web_project-dev-application`      | `web_project-application`         |
| `EXTERNAL_NETWORK`     | Infrastructure 네트워크 참조 | `web_project-dev-webnet`           | `web_project_webnet`              |
| `FE_DIST_MOUNT`        | FE 빌드 아티팩트 볼륨/경로   | `web_project-dev-frontend-dist`    | `frontend-dist`                   |
| `FE_DIST_PATH`         | FE 이미지 내 dist 경로       | `/opt/dist`                        | `/opt/dist`                       |
| `CERTBOT_MOUNT`        | 인증서 웹루트 볼륨/경로      | `web_project-dev-certbot-dev`      | `${HOME}/srv/web_project/certbot` |
| `FRONTEND_IMAGE`       | FE 아티팩트 이미지           | `ghcr.io/.../web-project-frontend` | 동일                              |
| `BACKEND_IMAGE`        | BE 런타임 이미지             | `ghcr.io/.../web-project-backend`  | 동일                              |
| `FE_TAG`               | FE 이미지 태그               | `latest`                           | CI 주입                           |
| `BE_TAG`               | BE 이미지 태그               | `latest`                           | CI 주입                           |

### 9.3. Monitoring 환경 변수

#### 9.3.1. mysqld-exporter 환경 변수 (`mysqld-exporter/.my.cnf.*`)

`.my.cnf.dev`(개발) 또는 `.my.cnf.prod`(운영, Git 무시)에 아래 형태로 보관합니다.

```
[client]
user=monitoring
password=__REPLACE_ME__
host=mysql
port=3306
```

운영 파일은 `infra/monitoring/mysqld-exporter/.my.cnf.prod` 경로를 사용하며, `.gitignore`로 추적 제외합니다.

#### 9.3.2. Monitoring Compose 환경 변수 (`infra/monitoring/.env.monitoring.*`)

| 변수                             | 설명                      | 개발 기본값                                 | 프로덕션                  |
| -------------------------------- | ------------------------- | ------------------------------------------- | ------------------------- |
| `COMPOSE_PROJECT_NAME`           | Compose 프로젝트 이름     | `web_project-dev-monitoring`                | `web_project-monitoring`  |
| `APP_NETWORK_NAME`               | 외부 네트워크 이름        | `web_project-dev-webnet`                    | `web_project_webnet`      |
| `COMPOSE_DNS1`                   | DNS 서버 1                | `1.1.1.1`                                   | `1.1.1.1`                 |
| `COMPOSE_DNS2`                   | DNS 서버 2                | `8.8.8.8`                                   | `8.8.8.8`                 |
| `GRAFANA_ADMIN_USER`             | Grafana 관리자 계정       | `admin`                                     | `monitoring-admin`        |
| `GRAFANA_ADMIN_PASSWORD`         | Grafana 관리자 비밀번호   | `admin`                                     | `__REPLACE_ME__` 🔒       |
| `GRAFANA_ROOT_URL`               | Grafana 외부 URL          | `http://localhost:8081/monitoring/grafana/` | `https://.../grafana/`    |
| `MYSQL_EXPORTER_ADDRESS`         | MySQL 접속 주소           | `mysql:3306`                                | `mysql:3306`              |
| `NGINX_EXPORTER_SCRAPE_URI`      | Nginx 메트릭 수집 경로    | `http://nginx/nginx_status`                 | 동일                      |
| `NGINX_LOGS_MOUNT`               | Nginx 로그 공유 볼륨/경로 | `web_project-dev_nginx-logs`                | `web_project_nginx-logs`  |
| `ALERTMANAGER_SLACK_WEBHOOK_URL` | Slack 웹훅 URL            | (빈 값 가능)                                | `__REPLACE_ME__` 🔒       |
| `ALERTMANAGER_SLACK_CHANNEL`     | Slack 채널                | `#web-project-alerts-dev`                   | `#web-project-alerts`     |
| `ALERTMANAGER_EMAIL_TO`          | 알림 받을 이메일          | `dev@example.com`                           | `ops@example.com`         |
| `ALERTMANAGER_SMTP_HOST`         | SMTP 서버                 | `localhost:1025`                            | `smtp.example.com:587`    |
| `ALERTMANAGER_SMTP_FROM`         | 발신 이메일               | `monitor-dev@example.com`                   | `monitor@web-project.dev` |
| `ALERTMANAGER_SMTP_USERNAME`     | SMTP 사용자               | -                                           | `monitoring-notify`       |
| `ALERTMANAGER_SMTP_PASSWORD`     | SMTP 비밀번호             | -                                           | `__REPLACE_ME__` 🔒       |

### 9.4. Gateway 환경 변수

#### 9.4.1. Nginx 환경 변수 (`infra/gateway/nginx/.env.*`)

| 변수                             | 설명             | 예시                                      |
| -------------------------------- | ---------------- | ----------------------------------------- |
| `NGINX_SERVER_NAME`              | 서버 도메인      | `example.com`                             |
| `NGINX_CERTBOT_ROOT`             | Certbot 웹루트   | `/var/www/certbot`                        |
| `NGINX_STATIC_ROOT`              | 정적 파일 루트   | `/usr/share/nginx/html`                   |
| `NGINX_BACKEND_HOST`             | 백엔드 호스트    | `backend-blue`                            |
| `NGINX_BACKEND_PORT`             | 백엔드 포트      | `8080`                                    |
| `NGINX_SSL_CERT`                 | SSL 인증서 경로  | `/etc/letsencrypt/live/.../fullchain.pem` |
| `NGINX_SSL_CERT_KEY`             | SSL 키 경로      | `/etc/letsencrypt/live/.../privkey.pem`   |
| `NGINX_SSL_TRUSTED_CERT`         | SSL 체인 경로    | `/etc/letsencrypt/live/.../chain.pem`     |
| `NGINX_STATIC_CACHE_EXPIRES`     | 캐시 만료 시간   | `1h`                                      |
| `NGINX_STATIC_CACHE_CONTROL`     | 캐시 제어 헤더   | `max-age=3600, public`                    |
| `GRAFANA_HOST`                   | Grafana 업스트림 | `grafana`                                 |
| `PROMETHEUS_HOST`                | Prometheus       | `prometheus`                              |
| `ALERTMANAGER_HOST`              | Alertmanager     | `alertmanager`                            |
| `LOKI_HOST`                      | Loki             | `loki`                                    |
| `NGINX_MONITORING_AUTH_REALM`    | Basic Auth Realm | `Monitoring Portal`                       |
| `NGINX_MONITORING_AUTH_FILE`     | htpasswd 경로    | `/etc/nginx/secrets/monitoring.htpasswd`  |
| `NGINX_MONITORING_INTERNAL_CIDR` | 내부 허용 CIDR   | `172.20.0.0/16`                           |

## 9.5. docker compose 환경 변수

### 9.5.1. 공통 환경 변수 (`infra/.env.server.*`)

| 변수               | 설명                              | 기본값                       |
| ------------------ | --------------------------------- | ---------------------------- |
| `SERVER_ROOT`      | 서버 배포 루트 경로               | `${HOME}/srv/web_project`    |
| `COMPOSE_DNS1`     | DNS 서버 1                        | `1.1.1.1`                    |
| `COMPOSE_DNS2`     | DNS 서버 2                        | `8.8.8.8`                    |
| `APP_NETWORK_NAME` | 외부 네트워크 이름                | `web_project_webnet`         |
| `FE_DIST_MOUNT`    | FE dist 공유 볼륨/경로            | `frontend-dist`              |
| `FE_DIST_PATH`     | FE 이미지 내부 dist 경로          | `/opt/dist`                  |
| `NGINX_LOGS_MOUNT` | Nginx 로그 공유 볼륨/경로         | `nginx-logs`                 |
| `MYSQL_DATA_MOUNT` | (선택) DB 데이터 볼륨/바인드 경로 | 빈 값(스택 파일 기본값 사용) |

### 9.5.2. Infrastructure Layer (`infra/infrastructure/.env.infrastructure.*`)

| 변수                  | 설명                           | 개발 기본값    | 프로덕션                  |
| --------------------- | ------------------------------ | -------------- | ------------------------- |
| `MYSQL_IMAGE`         | MySQL 이미지                   | `mysql`        | `mysql`                   |
| `DB_TAG`              | MySQL 태그                     | `8.4`          | CI/운영 입력              |
| `MYSQL_PORT`          | 호스트 포트                    | `3306`         | `3306`                    |
| `MYSQL_ROOT_PASSWORD` | 루트 비밀번호                  | `rootpassword` | `__REPLACE_ME__` 🔒       |
| `MYSQL_DATABASE`      | 기본 DB 이름                   | `appdb`        | `appdb`                   |
| `MYSQL_USER`          | 앱 계정                        | `app`          | `app`                     |
| `MYSQL_PASSWORD`      | 앱 계정 비밀번호               | `apppassword`  | `__REPLACE_ME__` 🔒       |
| `MYSQL_DATA_MOUNT`    | 데이터 볼륨/바인드 경로        | `mysql-data`   | `/srv/...` 등 바인드 권장 |
| `MYSQL_INIT_MOUNT`    | 초기화 스크립트 경로(읽기전용) | `./mysql/init` | `./mysql/init`            |

### 9.5.3. Application Layer (`infra/application/.env.application.*`)

| 변수                   | 설명                              | 개발 기본값                               | 프로덕션                          |
| ---------------------- | --------------------------------- | ----------------------------------------- | --------------------------------- |
| `LOCAL_UID`            | 호스트 사용자 UID                 | 자동 감지                                 | N/A (개발 전용)                   |
| `LOCAL_GID`            | 호스트 사용자 GID                 | 자동 감지                                 | N/A (개발 전용)                   |
| `COMPOSE_PROJECT_NAME` | Docker Compose 프로젝트 이름      | `web_project-dev-application`             | `web_project-application`         |
| `EXTERNAL_NETWORK`     | Infrastructure 네트워크 참조      | `web_project-dev-webnet`                  | `web_project_webnet`              |
| `MYSQL_HOST`           | DB 호스트 (Infrastructure 레이어) | `mysql`                                   | `mysql`                           |
| `MYSQL_PORT`           | DB 포트                           | `3306`                                    | `3306`                            |
| `MYSQL_DATABASE`       | DB 이름                           | `appdb`                                   | `appdb`                           |
| `MYSQL_USER`           | DB 사용자                         | `app`                                     | `app`                             |
| `MYSQL_PASSWORD`       | DB 비밀번호                       | `apppassword`                             | `__REPLACE_ME__` 🔒               |
| `FE_DIST_MOUNT`        | Frontend 빌드 볼륨                | `web_project-dev-frontend-dist`           | `frontend-dist`                   |
| `CERTBOT_MOUNT`        | SSL 인증서 볼륨                   | `web_project-dev-certbot-dev`             | `${HOME}/srv/web_project/certbot` |
| `FE_DIST_PATH`         | 이미지 내 dist 경로               | `/opt/dist`                               | `/opt/dist`                       |
| `FRONTEND_IMAGE`       | Frontend 이미지                   | `ghcr.io/minjungw00/web-project-frontend` | 동일                              |
| `BACKEND_IMAGE`        | Backend 이미지                    | `ghcr.io/minjungw00/web-project-backend`  | 동일                              |
| `FE_TAG`               | Frontend 이미지 태그              | `latest`                                  | CI에서 주입                       |
| `BE_TAG`               | Backend 이미지 태그               | `latest`                                  | CI에서 주입                       |

**특별 처리 - sync-local-ids.mjs**:

- `.env.application.dev`의 `LOCAL_UID`와 `LOCAL_GID`만 자동 업데이트
- 다른 변수는 모두 보존
- 파일이 없으면 완전한 템플릿으로 생성

### 9.5.4. Monitoring Layer (`infra/monitoring/`)

| 변수                             | 설명                         | 개발 기본값                                 | 프로덕션                  |
| -------------------------------- | ---------------------------- | ------------------------------------------- | ------------------------- |
| `COMPOSE_PROJECT_NAME`           | Docker Compose 프로젝트 이름 | `web_project-dev-monitoring`                | `web_project-monitoring`  |
| `EXTERNAL_NETWORK`               | Infrastructure 네트워크 참조 | `web_project-dev-webnet`                    | `web_project_webnet`      |
| `APP_NETWORK_NAME`               | 애플리케이션 네트워크 이름   | `web_project-dev-webnet`                    | `web_project_webnet`      |
| `COMPOSE_DNS1`                   | DNS 서버 1                   | `1.1.1.1`                                   | `1.1.1.1`                 |
| `COMPOSE_DNS2`                   | DNS 서버 2                   | `8.8.8.8`                                   | `8.8.8.8`                 |
| `GRAFANA_ADMIN_USER`             | Grafana 관리자 계정          | `admin`                                     | `monitoring-admin`        |
| `GRAFANA_ADMIN_PASSWORD`         | Grafana 관리자 비밀번호      | `admin`                                     | `__REPLACE_ME__` 🔒       |
| `GRAFANA_ROOT_URL`               | Grafana 외부 URL             | `http://localhost:8081/monitoring/grafana/` | `https://...`             |
| `MYSQL_EXPORTER_ADDRESS`         | MySQL 접속 주소              | `mysql:3306`                                | `mysql:3306`              |
| `MYSQL_HOST`                     | MySQL 호스트                 | `mysql`                                     | `mysql`                   |
| `MYSQL_PORT`                     | MySQL 포트                   | `3306`                                      | `3306`                    |
| `NGINX_EXPORTER_SCRAPE_URI`      | Nginx 메트릭 수집 경로       | `http://nginx/nginx_status`                 | 동일                      |
| `NGINX_LOGS_MOUNT`               | Nginx 로그 공유 볼륨/경로    | `web_project-dev_nginx-logs`                | `web_project_nginx-logs`  |
| `ALERTMANAGER_SLACK_WEBHOOK_URL` | Slack 웹훅 URL               | (개발용)                                    | `__REPLACE_ME__` 🔒       |
| `ALERTMANAGER_SLACK_CHANNEL`     | Slack 채널                   | `#web-project-alerts-dev`                   | `#web-project-alerts`     |
| `ALERTMANAGER_EMAIL_TO`          | 알림 받을 이메일             | `dev@example.com`                           | `ops@example.com`         |
| `ALERTMANAGER_SMTP_HOST`         | SMTP 서버                    | `localhost:1025`                            | `smtp.example.com:587`    |
| `ALERTMANAGER_SMTP_FROM`         | 발신 이메일                  | `monitor-dev@example.com`                   | `monitor@web-project.dev` |
| `ALERTMANAGER_SMTP_USERNAME`     | SMTP 사용자                  | -                                           | `monitoring-notify`       |
| `ALERTMANAGER_SMTP_PASSWORD`     | SMTP 비밀번호                | -                                           | `__REPLACE_ME__` 🔒       |

### 9.5.5 Gateway Layer (`infra/gateway/`)

| 변수                   | 설명                             | 개발 기본값                     | 프로덕션                               |
| ---------------------- | -------------------------------- | ------------------------------- | -------------------------------------- |
| `COMPOSE_PROJECT_NAME` | Docker Compose 프로젝트 이름     | `web_project-dev-gateway`       | `web_project-gateway`                  |
| `EXTERNAL_NETWORK`     | Infrastructure 네트워크 참조     | `web_project-dev-webnet`        | `web_project_webnet`                   |
| `FE_DIST_MOUNT`        | Frontend 빌드 볼륨 (Application) | `web_project-dev-frontend-dist` | `frontend-dist`                        |
| `CERTBOT_MOUNT`        | SSL 인증서 볼륨 (Application)    | `web_project-dev-certbot-dev`   | `${HOME}/srv/web_project/certbot`      |
| `NGINX_LOGS_MOUNT`     | Nginx 로그 공유 볼륨/경로        | `web_project-dev_nginx-logs`    | `web_project_nginx-logs`               |
| `NGINX_IMAGE`          | Nginx 이미지                     | `nginx`                         | `ghcr.io/minjungw00/web-project-nginx` |
| `NGINX_TAG`            | Nginx 이미지 태그                | `latest`                        | `latest`                               |
| `NGINX_HTTP_PORT`      | HTTP 포트                        | `80`                            | `80`                                   |
| `NGINX_HTTPS_PORT`     | HTTPS 포트                       | `443`                           | `443`                                  |
| `APP_NETWORK_NAME`     | 애플리케이션 네트워크 이름       | `web_project-dev-webnet`        | `web_project_webnet`                   |

---

## 10. 자격 증명 및 초기화 가이드

### 10.1 MySQL 계정/권한 초기화(증명)

- 루트 계정: `MYSQL_ROOT_PASSWORD`로 초기화됩니다(운영 필수). 루트 비밀번호는 서버 `.env` 또는 인프라 `.env.infrastructure.prod`에서만 관리합니다.
- 앱 계정: `MYSQL_USER`/`MYSQL_PASSWORD`로 자동 생성됩니다. 애플리케이션은 이 계정만 사용해야 합니다.
- 모니터링 계정: 템플릿 `infra/infrastructure/mysql/init-templates/01-init-monitoring.sql.example`를 `infra/infrastructure/mysql/init`에 배치하면 최초 기동 시 아래 최소 권한으로 생성됩니다.

```
CREATE USER IF NOT EXISTS 'monitor'@'%' IDENTIFIED BY '__REPLACE_ME__';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'monitor'@'%';
FLUSH PRIVILEGES;
```

초기화 스크립트는 데이터가 비어 있을 때만 실행됩니다. 이미 운영 중인 DB에 적용할 경우 수동으로 실행하세요.

### 10.2 Grafana 관리자 로그인(증명)

- 최초 관리자 계정은 `GRAFANA_ADMIN_USER`/`GRAFANA_ADMIN_PASSWORD`로 설정됩니다(운영 Compose에서 필수). 로그인 후 팀·사용자별 권한을 분리하고, 기본 관리자 비밀은 즉시 변경/보관하세요.
- 외부 URL은 `GRAFANA_ROOT_URL`을 사용하며, 게이트웨이에서 `/monitoring/grafana/` 서브패스로 프록시됩니다.

### 10.3 Nginx Basic Auth(증명)

- `/monitoring/*` 경로에 Basic Auth가 적용됩니다. 내부 트래픽(프로메테우스/알림 등)은 `NGINX_MONITORING_INTERNAL_CIDR`로 화이트리스트 처리합니다.
- 자격 증명 파일 생성:
  1.  `cp infra/gateway/nginx/monitoring.htpasswd.example infra/gateway/nginx/monitoring.htpasswd`
  2.  `openssl passwd -apr1 '비밀번호'` 출력값을 `username:<해시>`로 저장
  3.  운영에서는 파일을 서버 안전한 경로로 업로드하고 `infra/gateway/.env.gateway.prod`의 `NGINX_MONITORING_HTPASSWD_FILE`로 절대 경로를 지정
- 게이트웨이 Nginx 런타임은 `infra/gateway/nginx/.env.production`의 `NGINX_MONITORING_AUTH_*`/`NGINX_MONITORING_INTERNAL_CIDR`를 사용합니다.

### 10.4 mysqld-exporter 자격 증명(증명)

- 운영 환경에서 `infra/monitoring/mysqld-exporter/.my.cnf.prod` 파일에 접속 정보를 저장합니다(템플릿: `.my.cnf.prod.example`). 해당 파일은 `.gitignore`에 의해 커밋되지 않습니다.

---
