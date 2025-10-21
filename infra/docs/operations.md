# Operations & Deployment

이 문서는 Web Project의 서버 구성, 배포 자동화, 운영 기법(헬스체크, 무중단 배포, 롤백, 모니터링, 인증서 관리, DNS 대응)을 다룹니다. 전반적인 구조는 `architecture.md`, CI/CD 파이프라인은 `pipelines.md`, 보안 및 환경변수 관리는 `security.md`를 참고하세요.

## 1. 서버 구성

운영 환경에서는 certbot과 MySQL 데이터는 호스트 바인드 마운트를 기본으로 합니다(백업/복구 및 인증서 관리 용이). FE dist는 기본적으로 named volume을 사용하며, 필요 시 호스트 바인드로 전환할 수 있습니다. `.env` 파일들은 항상 호스트에 있어야 합니다. 배포 전략에 따라 `docker-compose.prod.yml`과 `deploy-blue-green.sh`는 서버 루트(`${HOME}/srv/web_project/`)에 위치합니다.

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

## 2. 헬스체크 전략

- **FE(Nginx)**: `/healthz` 정적 200 → `curl -f http://localhost/healthz`
  - 파라미터: `interval: 5s`, `timeout: 2s`, `retries: 3`, `start_period: 5s`
- **BE(Spring Boot)**: Actuator `/actuator/health`
  - 예: `curl -f http://localhost:8080/actuator/health`
  - Actuator 미도입 시 임시 `/api/health` 등 경량 엔드포인트를 사용합니다.
- **MySQL**: `mysqladmin ping -h 127.0.0.1 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD"`
  - 127.0.0.1 권장(DNS 이슈 회피)

Compose에서는 `depends_on: condition: service_healthy`로 기동 순서와 교체 안전성을 확보합니다.

---

## 3. 무중단 배포(Blue-Green)

### 3.1 구성 개념

- 동일한 인프라를 두 개의 색상(Blue/Green) 스택으로 이원화하고, 활성 스택과 대기 스택을 교차시키는 Blue-Green 전략을 사용합니다.
- `infra/docker/docker-compose.prod.yml`은 하나의 Compose 프로젝트 안에 `backend-blue`, `backend-green`, `frontend-blue`, `frontend-green` 서비스를 모두 정의합니다. 두 backend 중 하나만 실행하며, FE dist 동기화는 색상별 job으로 수행합니다.
- `mysql`, `nginx`, `frontend-dist` 볼륨, `certbot` 볼륨은 단일 인스턴스를 공유합니다. 따라서 데이터/인증서는 공용이며, 색상 전환 시 backend 애플리케이션만 교체됩니다.
- Nginx 업스트림은 환경변수(`NGINX_BACKEND_HOST`)로 현재 활성 스택의 backend 서비스명을 참조합니다. 색상 전환 시 해당 값을 `backend-blue` 또는 `backend-green`으로 갱신하고 nginx를 재기동(또는 reload)합니다.

### 3.2 준비 사항

- 서버에는 `~/srv/web_project` 기준으로 Compose 파일(`docker-compose.prod.yml`), `.env`, `backend/.env.production`, `nginx/.env.production`이 존재해야 합니다.
- GitHub Actions가 업로드하는 `infra/deploy-blue-green.sh`를 서버에서 실행 가능하도록 `chmod +x` 권한을 부여합니다. 스크립트는 자동으로 `SERVER_ROOT`를 `~/srv/web_project`로 설정합니다.
- `.env` 파일에 기본 태그(`FE_TAG`, `BE_TAG`, `NGINX_TAG`, `DB_TAG`)가 정의되어야 하며, 배포 시 새 태그를 환경변수로 덮어써서 새로운 이미지를 선택합니다.
- 최초 1회 `docker compose -f docker-compose.prod.yml --env-file .env up -d mysql nginx`를 실행해 데이터베이스와 Nginx 인프라 서비스를 기동합니다. 이후부터는 스크립트가 backend와 frontend dist만 교체합니다.
- 초기 배포 시 `nginx/.env.production`의 `NGINX_BACKEND_HOST`가 `backend-blue`로 설정돼 있어야 하며, 활성 색상을 찾을 수 없을 때 스크립트는 자동으로 blue를 선택합니다.

### 3.3 배포 절차

1. **색상 결정**: `deploy-blue-green.sh`가 `nginx/.env.production`의 `NGINX_BACKEND_HOST` 값 또는 현재 실행 중인 컨테이너를 읽어 활성 색상을 판별합니다. 활성 색상이 `blue`면 다음 배포 타깃은 `green`, 반대도 동일합니다.
2. **이미지 준비**: CI가 `latest`와 `sha-<GITHUB_SHA>` 태그를 푸시한 뒤, 스크립트가 자동으로 `docker compose pull backend-<색상> frontend-<색상> nginx mysql`을 호출해 필요한 이미지를 가져옵니다(`--skip-pull`로 생략 가능).
3. **대기 스택 기동**: `docker compose up -d backend-<색상>`으로 새 backend를 띄우고 헬스체크가 통과할 때까지 대기합니다. 헬스체크 실패 시 즉시 배포를 중단합니다.
4. **FE dist 동기화**: `docker compose run --rm frontend-<색상>`으로 FE dist를 공유 볼륨에 덮어씁니다. dist가 없으면 배포가 실패하므로 CI 산출물을 확인합니다.
5. **트래픽 전환**: 스크립트가 `nginx/.env.production`의 `NGINX_BACKEND_HOST`를 새 색상으로 업데이트한 뒤 `docker compose up -d nginx`를 호출해 컨테이너를 재시작합니다.
6. **검증 및 모니터링**: `docker compose exec nginx wget -qO- http://localhost/healthz`를 반복 실행해 헬스 체크가 통과하는지 확인합니다. 실패 시 스크립트가 자동으로 이전 색상으로 롤백하고 종료합니다.
7. **구 스택 정리**: 새 스택이 안정화된 경우에만 `docker compose stop backend-<이전색상>` → `docker compose rm -f backend-<이전색상>`으로 이전 backend를 정리하고 `docker image prune --filter "dangling=true" --force`로 사용하지 않는 이미지를 삭제합니다.

### 3.4 자동화 팁

- `infra/deploy-blue-green.sh` 스크립트는 색상 전환 로직, 헬스 체크, nginx 롤백까지 포함하므로 워크플로우에서는 해당 스크립트만 호출하면 됩니다. 필요 시 `--color blue` 옵션으로 특정 색상 강제 배포가 가능합니다.
- GitHub Actions `deploy.yml` 워크플로는 서버에서 스크립트를 실행하도록 구성되어 있습니다. 활성 색상 탐지가 실패하면 기본값인 `blue`로 초기화하므로 초기 배포 시에도 별도 인자 없이 실행할 수 있습니다.
- DB 마이그레이션이 필요한 경우 스크립트 실행 전에 수행하거나 Liquibase/Flyway를 사용해 양쪽 색상에서 호환되는 스키마를 유지합니다.
- 장기 실행 배치는 색상별 컨테이너에서 중복 실행될 수 있으므로, 배포 전에 종료하거나 스케줄러를 조정해 두 색상 중 하나에서만 실행되도록 합니다.
- DB 스키마 변경은 **Expand → Migrate → Contract** 순서를 따릅니다. 먼저 스키마를 확장(Expand)해 두 색상 모두 동작 가능하게 만들고, 새 코드 배포 후 데이터를 이전(Migrate)한 뒤, 더 이상 사용하지 않는 컬럼/제약을 제거(Contract)합니다.

---

## 4. 롤백 전략

- 모든 이미지에 `latest`와 `sha-<GITHUB_SHA>`를 태깅합니다.
- 문제 발생 시 서버 `.env`의 `FE_TAG`/`BE_TAG`를 해당 `sha-<GITHUB_SHA>`로 조정하고 `docker compose pull backend-<색상> frontend-<색상> nginx mysql` → `docker compose run --rm frontend-<색상>` → `docker compose up -d backend-<색상> nginx` 순으로 실행합니다.
- 필요 시 digest 고정(`@sha256:<digest>`)으로 재현성을 극대화할 수 있습니다.

---

## 5. 모니터링 및 로깅

- 로그 로테이션: `json-file` 드라이버에 `max-size`, `max-file` 적용(예: `max-size: "10m"`, `max-file: "3"`).
- 필요 시 Loki/ELK, Prometheus/Grafana, Sentry 등을 연계합니다.

---

## 6. Certbot 인증서 발급/갱신

1. DNS가 운영 도메인을 가리키는지 확인합니다(A/AAAA 레코드).
2. 서버에 `infra/nginx/certbot-issue.sh`를 업로드하고 실행 권한을 부여합니다(`chmod +x certbot-issue.sh`). 스크립트는 전달된 `--base-dir` 또는 자신의 디렉터리를 기준으로 동작합니다.
3. 최초 발급은 아래와 같이 수행합니다(`${HOME}/srv/web_project`를 Certbot 데이터 경로로 사용하는 경우 예시).

   ```bash
   ./certbot-issue.sh \
     --base-dir ${HOME}/srv/web_project \
     -d example.com -d www.example.com \
     -e admin@example.com
   ```

   - 스크립트는 `certbot/certbot` 이미지를 사용하여 웹루트(`<base-dir>/certbot`)를 통해 챌린지를 처리하고,
     인증서/키는 `<base-dir>/letsencrypt/etc` 이하에 저장합니다.
   - `--base-dir`을 생략하면 스크립트가 위치한 디렉터리를 자동으로 사용합니다.
   - `--staging` 또는 `--dry-run` 옵션으로 사전 검증이 가능합니다.

   > 중요: 서버 루트 `.env`에서 `CERTBOT_MOUNT`, `LETSENCRYPT_MOUNT`, `LETSENCRYPT_LOG_MOUNT` 값을 반드시 호스트 절대 경로로 설정해 bind mount 하세요. 예) `${HOME}/srv/web_project/certbot`, `${HOME}/srv/web_project/letsencrypt/etc`, `${HOME}/srv/web_project/letsencrypt/log`. Named volume를 사용할 경우 Certbot이 생성한 인증서를 Nginx가 읽지 못해 기동에 실패할 수 있습니다.

4. 발급 후 `docker compose -f docker-compose.prod.yml up -d nginx`를 재실행하거나 `docker compose exec nginx nginx -s reload`로 설정을 재적용합니다.
5. 정기 갱신은 동일 스크립트를 실행하거나, 크론으로 `certbot-issue.sh --base-dir ${HOME}/srv/web_project --dry-run`을 주기적으로 실행해 상태를 확인합니다.

---

## 7. DNS 문제 대응

- Docker 데몬 로그에 `No non-localhost DNS nameservers are left in resolv.conf`가 반복되면 호스트의 `/etc/resolv.conf`가 `127.0.0.1` 같은 루프백 주소만 포함하고 있을 가능성이 높습니다. 컨테이너는 해당 주소에 접근할 수 없으므로 Docker가 외부 기본 DNS(8.8.8.8 등)로 대체하며, 방화벽 정책에 따라 네임 해석이 실패할 수 있습니다.
- 해결 방법
  - (권장) 호스트의 DNS 설정을 점검하여 `/run/systemd/resolve/resolv.conf` 등 실제 업스트림 네임 서버 목록을 노출하도록 조정합니다.
  - 또는 Compose 파일에서 제공하는 `COMPOSE_DNS1`, `COMPOSE_DNS2` 환경변수를 사용하여 컨테이너가 직접 사용할 DNS를 지정합니다. 값 변경 후 `docker compose up -d`로 컨테이너를 재기동하면 설정이 반영됩니다.
  - 기업 네트워크처럼 사설 DNS가 필요한 경우 방화벽에서 허용된 주소를 지정해야 합니다.
