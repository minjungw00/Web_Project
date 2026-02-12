# CI/CD Pipelines

이 문서는 Web Project의 CI 및 CD 파이프라인을 한 곳에서 정리합니다. 전체 시스템 구조는 `architecture.md`, 운영 절차 및 배포 스크립트는 `operations.md`, 보안 및 환경 변수 정책은 `security.md`에서 보완 정보를 확인할 수 있습니다.

---

## 1. CI 파이프라인

### 1.1 트리거 및 워크플로우

- Frontend (`.github/workflows/frontend.yml`)
  - `/frontend/**` 또는 `infra/application/docker/frontend/**` 변경 시 실행
- Backend (`.github/workflows/backend.yml`)
  - `/backend/**` 또는 `infra/application/docker/backend/**` 변경 시 실행
- Gateway 이미지 (`.github/workflows/nginx.yml`)
  - `infra/gateway/docker/**`, `infra/gateway/nginx/**` 설정 변경 시 실행
- 기타 스크립트/유틸 (`scripts/**`)는 lint/test 워크플로우에서 커버합니다.

각 빌드 워크플로우는 다음 공통 단계를 따릅니다.

1. 레포지토리를 체크아웃하고 필요한 패키지를 설치합니다.
2. 서비스별 Docker 이미지를 빌드합니다.
   - Frontend: dist 산출물을 포함한 아티팩트 이미지 생성.
   - Backend: 멀티스테이지 빌드로 경량 런타임 이미지 구성.
   - Gateway: Nginx 설정 변경 시에만 이미지 재빌드.
3. GHCR에 `latest`와 `sha-<GITHUB_SHA>` 두 가지 태그로 푸시하여 추적성과 롤백 가능성을 확보합니다.

> MySQL은 운영 환경에서 공식 이미지를 사용하고 Compose 파일로 버전을 제어하므로 별도의 빌드 워크플로우가 없습니다.

---

## 2. CD 파이프라인 개요

CD는 GitHub Actions를 통해 서버(기본 경로 `${HOME}/srv/web_project`)에 접근하여 다음 순서로 진행합니다.

1. **환경 파일 동기화**: `sync-env` 워크플로우가 루트 `.env.server.prod`와 레이어별 `.env.*.prod` 파일을 갱신하고 권한을 600으로 설정합니다.
2. **태그 선택**: CI에서 푸시한 `latest` 또는 `sha-<GITHUB_SHA>` 태그가 환경 변수(`FE_TAG`, `BE_TAG`, `NGINX_TAG`, `DB_TAG`)를 통해 주입됩니다. Application 레이어는 공통 입력(`image_tag`) 또는 개별 입력(`fe_tag`, `be_tag`)으로 최신 태그를 지정합니다.
3. **Blue/Green 준비 단계**: `deploy-application.yml`이 `infra/deploy-blue-green.sh --phase prepare`를 실행해 대상 색상을 결정하고 Backend/Frontend 이미지를 풀, 신규 Backend 기동, Frontend dist 동기화(`frontend-dist` 볼륨)를 수행하며 Gateway·Monitoring가 공유하는 Nginx 로그 볼륨(`nginx-logs`)이 존재하지 않으면 생성합니다. 이때 Gateway `.env.production`의 `NGINX_BACKEND_HOST`가 새 색상으로 업데이트됩니다.
4. **Gateway 전환**: `update_gateway`가 true인 경우 동일 워크플로우 안에서 `deploy-gateway.yml`을 호출해 nginx 컨테이너를 재배포하고 헬스 체크(최대 60초)를 통과해야 합니다.
5. **정리 단계**: Gateway가 새 색상을 바라보는 것이 확인되면 `infra/deploy-blue-green.sh --phase finalize`가 이전 색상의 Backend/Frontend를 제거하고 dangling 이미지를 정리합니다. Gateway 전환이 실패하면 finalize 단계도 실패하여 기존 색상을 유지합니다.
6. **기타 레이어**: Infrastructure(MySQL)와 Monitoring 스택은 독립 워크플로우로 필요시에만 갱신합니다.

---

## 3. GitHub Actions 워크플로우 상세

### 3.1 공통 사전 준비

- **Secrets 등록**: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `SERVER_ROOT_ENV_BASE64`, `APPLICATION_ENV_PRODUCTION_BASE64`, `BACKEND_ENV_PRODUCTION_BASE64`, `GATEWAY_ENV_PRODUCTION_BASE64`, `NGINX_ENV_PRODUCTION_BASE64`, `MONITORING_ENV_PRODUCTION_BASE64`, `INFRASTRUCTURE_ENV_PRODUCTION_BASE64`, `MYSQLD_EXPORTER_MYCNF_PROD_BASE64`.
- **서버 디렉터리**: `${HOME}/srv/web_project` 하위에 `application/`, `application/backend/`, `gateway/`, `gateway/nginx/`, `monitoring/`, `infrastructure/`를 만들어 두고, 필요한 볼륨 바인드 경로(예: `application/backend/logs`)도 생성합니다.
- **최초 배포 순서**: Infrastructure layer를 먼저 기동하여 네트워크(`APP_NETWORK_NAME`, 기본 `web_project_webnet`)와 데이터 볼륨을 준비한 뒤 Application → Monitoring → Gateway 순으로 진행합니다.

### 3.2 sync-env.yml

- **목적**: GitHub Secrets에 저장된 Base64 인코딩된 `.env.*.prod` 파일을 서버에 안전하게 디코드합니다.
- **주요 동작**
  - 서버에 필요한 디렉터리를 생성합니다.
  - 파일을 디코드하여 대상 경로에 저장하고 권한을 600으로 설정합니다.
  - 비어 있는 Secret은 스킵하며, 환경 파일이 최신 상태인지 로그로 확인할 수 있습니다.

### 3.3 deploy-application.yml

- **목적**: Frontend/Backend 애플리케이션을 Blue/Green 방식으로 배포합니다.
- **입력 파라미터**
  - `image_tag`: 공통 태그(지정 시 FE/BE에 동시 적용)
  - `fe_tag`, `be_tag`: 개별 이미지 태그(미지정 시 `image_tag` 또는 `latest`)
  - `update_gateway`: Gateway 배포 여부(기본값 true)
  - `nginx_tag`: Gateway 갱신 시 사용할 이미지 태그
- **주요 단계**
  1.  Compose 파일 및 `deploy-blue-green.sh`를 서버에 동기화합니다.
  2.  `prepare` 단계에서 대상 색상을 결정하고 Backend 헬스체크, Frontend dist 동기화, `NGINX_BACKEND_HOST` 업데이트를 수행합니다.
  3.  `update_gateway`가 true이면 `deploy-gateway.yml`을 호출합니다.
  4.  `finalize` 단계가 Gateway 전환 여부를 검증한 뒤 이전 색상 컨테이너와 일시 컨테이너(frontend sync job)를 정리합니다.

> ⚠️ `update_gateway`를 false로 두면 Gateway가 새 색상을 바라보지 않으므로 finalize 단계가 실패합니다. 테스트 목적이 아니면 기본값(true)을 유지하세요.

### 3.4 deploy-gateway.yml

- **목적**: Nginx 리버스 프록시를 독립적으로 배포하거나 Application 워크플로우에서 재사용합니다.
- **입력 파라미터**: `nginx_tag` (기본 `latest`).
- **주요 단계**
  - Gateway Compose 파일과 Nginx 설정(conf, certbot 스크립트)을 서버에 업로드합니다.
  - 루트 `.env.server.prod` + `gateway/.env.gateway.prod`를 병합하여 Compose에 전달합니다.
  - nginx 컨테이너를 업데이트하고 health check가 `healthy` 상태가 될 때까지 (최대 30회/2초) 대기합니다. 실패 시 로그를 출력하고 비정상 종료합니다.

### 3.5 deploy-monitoring.yml

- **목적**: Prometheus, Grafana, Loki, Alertmanager 등 관찰성 스택을 배포합니다.
- **입력 파라미터**
  - `pull_images`: 이미지 pull 수행 여부(기본 true)
  - `recreate`: 강제 재생성 여부(기본 false)
- **주요 단계**
  - 루트/모니터링 `.env`를 병합한 임시 파일로 Compose를 실행합니다.
  - 외부 네트워크(`APP_NETWORK_NAME`)가 없으면 생성합니다.
  - 작업 완료 후 임시 환경 파일을 삭제합니다.

### 3.6 deploy-infrastructure.yml

- **목적**: MySQL 및 기반 인프라 서비스를 초기화/갱신합니다.
- **입력 파라미터**
  - `pull_images`: 이미지 pull 수행 여부(기본 true)
  - `recreate`: `--force-recreate` 적용 여부(기본 false)
- **주요 단계**
  - `infra/infrastructure/**`를 서버에 업로드하고 루트/레이어 `.env`를 병합합니다.
  - 외부 네트워크 존재 여부를 확인하고 없으면 생성합니다.
  - `mysql/init` 디렉터리가 비어 있으면 템플릿을 복사해 초기 스크립트를 준비합니다.
  - Compose로 MySQL을 기동합니다.

---

## 4. 배포 시나리오

### 4.1 일반 애플리케이션 배포

```
1. GitHub Actions → deploy-application 실행
2. 입력: update_gateway=true(기본), 필요 시 이미지 태그 지정
```

결과: 신규 Backend/Frontend가 준비되고 Gateway가 재배포된 뒤 이전 색상이 정리됩니다.

### 4.2 애플리케이션 + Gateway 설정 변경

```
1. deploy-application 실행
2. 입력: update_gateway=true, nginx_tag=<새 태그>
```

결과: Application과 Gateway가 함께 갱신되며 무중단으로 전환됩니다.

### 4.3 Gateway만 변경

```
1. deploy-gateway 실행
2. 입력: nginx_tag=<원하는 태그>
```

결과: Gateway만 재배포되고 Application은 영향받지 않습니다.

### 4.4 모니터링 스택 갱신

```
1. deploy-monitoring 실행
2. 입력: pull_images=true, recreate=false (기본값)
```

결과: 관찰성 스택만 재배포됩니다.

### 4.5 인프라(초기 구축/변경)

```
1. deploy-infrastructure 실행
2. 입력: pull_images=true, recreate=<필요 시 true>
```

결과: MySQL 및 기반 인프라만 독립적으로 배포/갱신됩니다.

---

## 5. 워크플로우 의존성

```
deploy-application (prepare)
      ↓ (조건부: update_gateway=true)
deploy-gateway
      ↓
deploy-application (finalize)

deploy-monitoring (독립적)

deploy-gateway (독립적)

deploy-infrastructure (독립적, 초기 1회 권장)
```

---

## 6. 운영 가이드라인

### ✅ 권장 사항

- 애플리케이션 배포 시 `update_gateway=true`로 Gateway 전환까지 함께 수행합니다.
- 레이어별 워크플로우를 분리 실행하여 영향 범위를 최소화합니다.
- Gateway 전환이 완료된 것을 확인한 뒤 finalize 단계에서 이전 색상을 정리합니다.
- 태그는 `latest`를 기본으로 사용하되, 문제 발생 시 `sha-<GITHUB_SHA>`로 고정하여 재현성을 확보합니다.

### ❌ 주의 사항

- Gateway가 새 색상을 바라보기 전에 finalize 단계를 수동 실행하지 마세요.
- Application과 Monitoring을 동시에 배포하지 말고 순차 실행하세요.
- Gateway를 Application 준비 이전에 배포하지 마세요.

---

## 7. 롤백 및 트러블슈팅

### 7.1 애플리케이션 롤백

1. `.env.server.prod` 혹은 `application/.env.application.prod`에서 `FE_TAG`/`BE_TAG`를 원하는 `sha-<GITHUB_SHA>`로 수정합니다.
2. `deploy-application`을 다시 실행합니다. 준비/게이트웨이/정리 단계가 이전 태그로 전환합니다.

### 7.2 Gateway 롤백

1. `NGINX_TAG`를 이전 태그로 설정합니다.
2. `deploy-gateway` 워크플로우를 실행합니다.

### 7.3 Monitoring 롤백

`deploy-monitoring`을 `recreate=true`로 실행하여 이전 버전을 다시 기동합니다. Grafana 대시보드나 Alert 규칙을 Git으로 되돌린 뒤 실행하면 됩니다.

### 7.4 Gateway 헬스체크 실패 시

```bash
ssh <user>@<host>
cd ~/srv/web_project/gateway
docker compose -f docker-compose.gateway.prod.yml logs nginx
docker compose -f docker-compose.gateway.prod.yml restart nginx
```

헬스체크 통과 후 finalize 단계를 수동으로 재실행할 수 있습니다.

### 7.5 Application 배포 실패 시 Gateway

- prepare 단계에서 실패하면 Gateway는 전환되지 않습니다.
- finalize 단계에서 Gateway 전환을 확인하지 못하면 이전 색상을 유지한 채 종료합니다.

---

## 8. 참고 문서

- `docs/architecture.md`
- `docs/operations.md`
- `docs/security.md`
- `gateway/README.md`
