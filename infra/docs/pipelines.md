# CI/CD Pipelines

이 문서는 Web Project의 CI 및 CD 파이프라인 설계와 GitHub Actions 워크플로우 실행 흐름을 설명합니다. 전체 아키텍처는 `architecture.md`, 운영 및 배포 스크립트 세부사항은 `operations.md`, 보안/환경변수 정책은 `security.md`를 참고하세요.

## 1. CI 파이프라인

### 1.1 빌드 트리거 조건

- `/frontend` 변경 → FE(dist) 빌드
- `/infra/docker/frontend/**` 변경 → FE(dist) 빌드
- `/backend` 변경 → BE 빌드
- `/infra/docker/backend/**` 변경 → BE 빌드
- `/infra/nginx/**` 변경 → Nginx 빌드(conf 변경 시)
- `/infra/docker/mysql/**` 변경 → MySQL 빌드(커스텀 시)

### 1.2 빌드 단계

1. Runner가 레포를 체크아웃합니다.
2. 서비스별 Docker 이미지를 빌드합니다.
   - Frontend: dist 생성 → dist 포함 아티팩트 이미지를 빌드/푸시
   - Backend: 멀티스테이지 빌드(JAR → 런타임)
   - Nginx: conf 변경 시에만 빌드/푸시(기본적으로 FE dist 미포함)
   - MySQL: 커스텀 Dockerfile이 있을 때만 빌드
3. GHCR에 `latest` 및 `sha-<GITHUB_SHA>`로 태깅하여 push합니다.

---

## 2. CD 파이프라인

1. 서버에서 필요한 이미지를 `docker compose pull backend-<색상> frontend-<색상> nginx mysql`로 가져옵니다.
2. FE dist 동기화: `docker compose run --rm frontend-<색상>` 명령으로 dist를 공유 볼륨(`frontend-dist`)에 동기화합니다.
   - 컨테이너 내부에서는 `rsync -a --delete "$FE_DIST_PATH"/ "/dist"/` 패턴으로 전체 동기화가 이뤄집니다(`FE_DIST_PATH` 기본 `/opt/dist`, 출력 마운트 경로 `/dist`).
3. `docker compose up -d backend-<색상>`으로 새 백엔드를 구동하고 헬스체크를 기다립니다. Blue-Green 전환 시에는 `deploy-blue-green.sh`가 활성/대기 색상을 자동으로 판별하고 이를 수행합니다.
4. `docker compose up -d nginx`로 업스트림 전환 후 헬스체크를 통해 트래픽 전환을 검증합니다.
5. 롤백은 서버 `.env`의 태그 변수(`FE_TAG`/`BE_TAG`)를 `sha-<GITHUB_SHA>`로 조정한 뒤 동일 절차(`docker compose pull` → `docker compose run --rm frontend-<색상>` → `docker compose up -d backend-<색상> nginx`)를 수행합니다.
   - 기본 운영은 `latest`, 문제 발생 시 `sha-<GITHUB_SHA>`로 고정합니다.
   - FE/BE는 각각 독립적으로 고정/롤백 가능하도록 `FE_TAG`/`BE_TAG`를 분리 운영합니다.

---

## 3. GitHub Actions 워크플로우

### 3.1 사전 준비(1회)

- GitHub 저장소에 Secrets(`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `ROOT_ENV_BASE64`, `BACKEND_ENV_PRODUCTION_BASE64`, `NGINX_ENV_PRODUCTION_BASE64`)을 등록합니다.
- 서버에서 `${HOME}/srv/web_project`와 하위 디렉터리(`backend`, `nginx`, `mysql`, `mysql/init` 등)를 생성합니다.
- `sync-env` 워크플로우 또는 수동 명령으로 `.env`, `backend/.env.production`, `nginx/.env.production`을 배포하고, 최초 `docker compose -f docker-compose.prod.yml --env-file .env up -d mysql nginx`를 실행합니다.

### 3.2 배포 순서(매 배포 시)

1. **CI: 이미지 빌드/푸시(GHCR)**
   - 트리거: `main`에 push 시 변경 경로에 따라 자동 실행
     - Frontend: `.github/workflows/frontend.yml`
     - Backend: `.github/workflows/backend.yml`
     - Nginx: `.github/workflows/nginx.yml`
     - MySQL(선택): `.github/workflows/mysql.yml`
   - 태그 전략: `latest` + `sha-<GITHUB_SHA>` 동시 태깅
2. **서버 환경 파일 동기화**
   - 실행: `.github/workflows/sync-env.yml`
   - 동작: SSH로 서버 접속 → `${HOME}/srv/web_project/` 아래 파일 갱신(권한 600)
     - `.env`(루트), `backend/.env.production`, `nginx/.env.production`
3. **배포 실행**
   - 실행: `.github/workflows/deploy.yml`
   - 입력값(선택): `image_tag`(공통), `fe_tag`/`be_tag`/`nginx_tag`/`db_tag`(개별)
   - 동작: compose 파일과 `infra/deploy-blue-green.sh` 업로드 → 서버에서 태그 환경변수를 설정 → `infra/deploy-blue-green.sh` 실행으로 자동 색상 전환 → 필요 시 실패 시 알람 → Docker dangling 이미지 정리
4. **헬스 확인(선택)**
   - Nginx: `curl -f http://localhost/healthz`
   - Backend: `curl -f http://localhost:8080/actuator/health`

### 3.3 태그 운용 팁

- 기본은 `latest` 운영, 이슈 발생 시 `sha-<GITHUB_SHA>`로 특정 버전을 고정합니다.
- FE/BE는 각자 태그를 독립적으로 지정할 수 있어 부분 교체가 가능합니다.
