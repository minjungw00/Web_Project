# Nginx 구성 가이드

이 문서는 `infra/gateway/nginx` 디렉터리에 포함된 템플릿과 스크립트를 기반으로 운영 Nginx 컨테이너의 동작을 설명합니다. 전체 배포 흐름은 [`../../docs/operations.md`](../../docs/operations.md)를 참고하고, 이 문서는 Nginx 레이어에 특화된 세부 설정을 다룹니다. Nginx 이미지를 빌드하는 Dockerfile은 `../docker/nginx/`에 위치합니다.

---

## 1. 템플릿 구조와 엔트리포인트

- `default.prod.conf` (운영용)
  - 80 포트는 ACME 챌린지를 직접 응답하며, 나머지 경로는 301으로 HTTPS에 리다이렉트합니다.
  - 443 포트는 실 인증서로 TLS 종단을 수행하고, 정적 자산, `/api/` 프록시, 모니터링 서브패스(`/monitoring/...`)를 처리합니다.
- `default.dev.conf` (로컬 개발용)
  - 80 포트에서 HTTP로 정적 파일과 백엔드 프록시, 모니터링 서브패스를 제공합니다.
- `proxy-headers.conf`
  - 백엔드 프록시에 공통으로 적용되는 헤더 설정을 모듈화한 스니펫입니다.
- 엔트리포인트 스크립트
  - 실제 스크립트는 리포지토리의 `infra/gateway/docker/nginx/entrypoint.sh`에 있으며, 컨테이너 이미지 빌드 시 `/docker-entrypoint.d/99-envsubst.sh`로 복사됩니다.
  - 컨테이너 기동 시 `envsubst`로 `/etc/nginx/templates/default.conf.template`를 렌더링하여 `/etc/nginx/conf.d/default.conf`를 생성합니다.
  - 사용 가능한 환경 변수: `NGINX_SERVER_NAME`, `NGINX_CERTBOT_ROOT`, `NGINX_STATIC_ROOT`, `NGINX_STATIC_CACHE_EXPIRES`, `NGINX_STATIC_CACHE_CONTROL`, `NGINX_BACKEND_HOST`, `NGINX_BACKEND_PORT`, `NGINX_SSL_CERT`, `NGINX_SSL_CERT_KEY`, `NGINX_SSL_TRUSTED_CERT`, `GRAFANA_HOST`, `PROMETHEUS_HOST`, `ALERTMANAGER_HOST`, `LOKI_HOST`, `NGINX_MONITORING_AUTH_REALM`, `NGINX_MONITORING_AUTH_FILE`, `NGINX_MONITORING_INTERNAL_CIDR`.

---

## 2. `default.conf` 서버 블록 개요

### 2.1 80 포트 (HTTP)

- `listen 80` / `listen [::]:80`으로 구성됩니다.
- `/.well-known/acme-challenge/` 경로는 `NGINX_CERTBOT_ROOT`를 웹루트로 사용하며, Certbot 인증 파일을 그대로 서빙합니다.
- `/healthz`는 헬스체크용 200 응답을 반환합니다.
- `/nginx_status`는 Prometheus nginx-exporter용 stub_status 엔드포인트입니다. 운영/개발 환경에 맞게 허용 CIDR을 조정하세요.
- 기타 모든 경로는 `return 301 https://$host$request_uri;`로 HTTPS로 리다이렉트합니다.

### 2.2 443 포트 (HTTPS)

- `listen 443 ssl http2` / `listen [::]:443 ssl http2`로 구성되며, `NGINX_SSL_*` 환경 변수로 지정된 인증서를 로드합니다.
- HSTS(`Strict-Transport-Security`)와 TLS 1.2/1.3 강제 등 기본 보안 옵션을 적용합니다.
- 정적 자산은 `NGINX_STATIC_ROOT`에서 제공하며, `NGINX_STATIC_CACHE_EXPIRES`, `NGINX_STATIC_CACHE_CONTROL`로 캐시 정책을 제어합니다.
- `/api/`는 `NGINX_BACKEND_HOST:NGINX_BACKEND_PORT`로 프록시하고, `proxy-headers.conf` 스니펫을 포함합니다.
- `/monitoring/grafana`, `/monitoring/prometheus/`, `/monitoring/alertmanager/`, `/monitoring/loki/`는 각각 모니터링 스택으로 프록시합니다(필요 시 환경 변수로 업스트림 호스트 지정).
- `/nginx_status`와 `/healthz`는 운영 모니터링 및 헬스체크용 엔드포인트를 제공합니다. `/nginx_status` 허용 CIDR도 `NGINX_MONITORING_INTERNAL_CIDR`를 따르므로, 한 곳에서 네트워크 대역을 관리할 수 있습니다.

### 2.3 `/monitoring` 경로 Basic Auth

- 운영/개발 환경 모두 `/monitoring/*` 경로에 Basic Auth를 적용하며, `NGINX_MONITORING_INTERNAL_CIDR`에 포함된 내부 네트워크(예: Docker overlay 네트워크)에서 접근하는 요청은 `allow` 규칙으로 자동 허용합니다. 이를 통해 Prometheus ↔ Alertmanager Webhook, Grafana 알림 등 내부 트래픽은 인증 충돌 없이 통과합니다.
- 인증 프롬프트 메시지는 `NGINX_MONITORING_AUTH_REALM` 값으로 설정되며, 기본값은 `Monitoring Portal`입니다.
- 자격 증명 파일은 `NGINX_MONITORING_AUTH_FILE` 경로(기본 `/etc/nginx/secrets/monitoring.htpasswd`)로 마운트해야 합니다. 파일이 존재하지 않으면 Nginx가 기동하지 않으므로 반드시 배포 전에 생성/업로드하세요.
- `infra/gateway/docker-compose.gateway.*.yml`에서는 `${NGINX_MONITORING_HTPASSWD_FILE}`(기본 `./nginx/monitoring.htpasswd`)을 `/etc/nginx/secrets/monitoring.htpasswd`로 바인드합니다. 운영 서버에서는 `.env.gateway.prod`에 절대 경로를 지정하여 호스트의 보안 위치를 참조하도록 설정하세요.
- 자격 증명 파일 생성 절차 예시:
  1. `cp infra/gateway/nginx/monitoring.htpasswd.example infra/gateway/nginx/monitoring.htpasswd`
  2. `openssl passwd -apr1 '새_비밀번호'`로 해시를 만든 뒤 `monitoring.htpasswd`에 `username:<해시>` 형태로 입력
  3. 운영 환경에서는 `monitoring.htpasswd` 파일을 서버로 옮긴 뒤 `.env.gateway.prod`의 `NGINX_MONITORING_HTPASSWD_FILE` 값을 해당 절대 경로로 지정
- `monitoring.htpasswd` 파일은 `.gitignore`에 등록되어 있으므로 레포지토리에 커밋되지 않습니다. 필요 시 서버의 패스워드 금고나 비밀 관리 시스템과 연동해 자동 배포하세요.

---

## 3. HTTPS 미구성 시 80 포트만으로 서비스하기

초기 배포 또는 인증서 갱신 실패 등으로 HTTPS 인증서가 준비되지 않은 경우, 다음 절차로 HTTP(80 포트)만 사용하는 구성을 유지할 수 있습니다.

1. **임시 자기서명 인증서 생성** (Nginx가 443 구성을 로드할 수 있도록 더미 파일을 마련합니다.)

```bash
DOMAIN=example.com
BASE_DIR=${HOME}/srv/web_project
BASE="${BASE_DIR}/letsencrypt/etc/live/${DOMAIN}"
mkdir -p "${BASE}"
openssl req -x509 -nodes -newkey rsa:2048 \
	 -subj "/CN=${DOMAIN}" \
	 -keyout "${BASE}/privkey.pem" \
	 -out "${BASE}/fullchain.pem" \
	 -days 1
cp "${BASE}/fullchain.pem" "${BASE}/chain.pem"
```

2. `infra/gateway/nginx/.env.production`에 해당 경로를 설정하고 컨테이너를 기동합니다. 이때 80 포트는 정상 동작하며, 443 포트는 임시 인증서로 응답합니다.
3. 실제 인증서를 발급한 후(`certbot-issue.sh` 참고) 파일을 교체하면 즉시 HTTPS 전환이 이뤄집니다.

> 임시 인증서 대신 443 서버 블록을 주석 처리해도 되지만, 템플릿을 수정해야 하므로 가능한 한 위 방법을 권장합니다.

---

## 4. HTTPS 구성 및 443 리다이렉트 동작

실제 인증서가 `/etc/letsencrypt/live/<domain>/` 경로에 배치되면:

- Nginx 컨테이너는 재시작 시 `NGINX_SSL_CERT`, `NGINX_SSL_CERT_KEY`, `NGINX_SSL_TRUSTED_CERT`를 통해 실 인증서를 로드합니다.
- 80 포트는 ACME 챌린지와 헬스체크를 제외한 모든 요청을 443으로 리다이렉트합니다.
- 443 포트는 HTTP/2로 종단하며, 정적 자산과 API 프록시가 모두 TLS 하에서 동작합니다.
- 인증서가 교체되면 `docker compose exec nginx nginx -s reload`로 무중단 적용이 가능합니다.

---

## 5. `certbot-issue.sh`로 인증서 발급/갱신

`infra/gateway/nginx/certbot-issue.sh`는 `certbot/certbot` 이미지를 활용해 웹루트 방식으로 인증서를 발급/갱신합니다. 스크립트는 `~/srv/web_project`(예: `scp` 또는 `sync-env`로 업로드) 아래에 위치한다고 가정하며, `--base-dir` 인자 또는 `CERTBOT_BASE_DIR` 환경 변수로 Certbot 데이터 루트를 지정합니다. 인자를 생략하면 스크립트가 존재하는 디렉터리를 기준으로 동작합니다.

### 5.1 준비 사항

1. DNS A/AAAA 레코드가 대상 서버를 가리키는지 확인합니다.
2. 운영 게이트웨이 Compose(`infra/gateway/docker-compose.gateway.prod.yml`)에서 Nginx 서비스의 볼륨이 Certbot/Let’s Encrypt 경로와 공유되어야 합니다.

- 배포 환경 변수에서 `CERTBOT_MOUNT`, `LETSENCRYPT_MOUNT`, `LETSENCRYPT_LOG_MOUNT` 값을 **절대 경로**로 지정하면 bind mount가 사용됩니다.
- 예시: `${HOME}/srv/web_project/certbot`, `${HOME}/srv/web_project/letsencrypt/etc`, `${HOME}/srv/web_project/letsencrypt/log`
- 기본값(named volume)도 동작하지만, 독립 실행형 Certbot 컨테이너와의 경로 일치를 위해 bind mount 사용을 권장합니다.

3. Nginx 컨테이너가 80 포트에서 `/.well-known/acme-challenge/`를 서빙 중인지 확인합니다(임시 인증서 또는 HTTP-only 구성이 필요).

### 5.2 실행 예시

```bash
cd ~/srv/web_project
./certbot-issue.sh \
  --base-dir ${HOME}/srv/web_project \
  -d example.com -d www.example.com \
  -e admin@example.com
```

- `--base-dir`: Certbot 데이터가 저장될 베이스 디렉터리(예: `${HOME}/srv/web_project`). 생략 시 스크립트가 위치한 경로를 사용합니다.
- `--staging`: Let’s Encrypt 스테이징 엔드포인트를 사용해 사전 검증할 때 지정합니다.
- `--dry-run`: 이미 발급된 인증서를 갱신 테스트할 때 사용합니다.
- 스크립트 실행 후 `<base-dir>/letsencrypt/etc/live/<domain>/` 이하에 실 인증서가 생성되고, Nginx 재기동/리로드만으로 HTTPS가 활성화됩니다.

### 5.3 정기 갱신

- 운영 서버에서 크론 등으로 `./certbot-issue.sh --base-dir ${HOME}/srv/web_project -d <domain> -e <email>`을 주기적으로 실행하면 자동 갱신이 가능합니다.
- 최소 월 1회 `--dry-run`을 실행해 인증서 만료를 사전에 감지하는 것을 권장합니다.

---

## 6. 트러블슈팅

- **Nginx가 기동 직후 종료되는 경우**: `NGINX_SSL_CERT*` 경로에 파일이 존재하는지 확인하세요. 임시 인증서를 생성하거나 HTTPS 서버 블록을 일시적으로 제거해야 합니다.
- **ACME 챌린지 실패**: `/.well-known/acme-challenge/`가 200으로 응답하는지, 방화벽/보안 그룹이 80 포트를 허용하는지 확인합니다.
- **인증서 교체 후에도 구버전이 응답**: `docker compose exec nginx nginx -s reload` 또는 컨테이너 재시작이 필요할 수 있습니다.
- **stub_status 접근 거부**: `/nginx_status` 허용 CIDR이 배포 네트워크 대역과 일치하는지 확인하세요.
- **/monitoring Basic Auth 401**: `monitoring.htpasswd` 파일 경로가 올바른지, 사용자 해시가 `username:$apr1$...` 형태로 저장됐는지 확인하세요. 내부 서비스가 인증 없이 접근해야 한다면 `NGINX_MONITORING_INTERNAL_CIDR`에 해당 네트워크가 포함되어 있는지도 점검합니다.
  - 네트워크 대역 확인: `docker network inspect <network> --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'`
  - 예시: `docker network inspect web_project_webnet-dev --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'`

---

## 7. 참고 자료

- 전체 인프라 아키텍처 및 배포 절차: [`../../docs/operations.md`](../../docs/operations.md)
- 게이트웨이 Docker Compose(운영/개발): `infra/gateway/docker-compose.gateway.prod.yml`, `infra/gateway/docker-compose.gateway.dev.yml`
- Nginx Dockerfile: `infra/gateway/docker/nginx/`
- Certbot 호스트 경로 정책: [`../../docs/operations.md`](../../docs/operations.md)의 "Certbot 인증서 발급/갱신" 섹션
