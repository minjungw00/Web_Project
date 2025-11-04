# Monitoring Layer

## 1. 개요

Monitoring 레이어는 Prometheus, Alertmanager, Grafana, Loki, Promtail 및 각종 Exporter로 구성되어 애플리케이션/인프라의 메트릭과 로그를 수집/시각화/알림합니다. 본 레이어의 설정과 Compose는 `infra/monitoring/**`에서 관리합니다.

## 2. 아키텍처

```
애플리케이션/인프라 → Exporters/Promtail → Prometheus/Loki → Grafana(UI) → (Nginx 경유 외부 공개)
```

- 메트릭: Prometheus ← node-exporter, cadvisor, nginx-exporter, mysqld-exporter, Spring Boot(`/api/actuator/prometheus`), blackbox-exporter
- 로그: Promtail → Loki
- 시각화/알림: Grafana(대시보드/Explore), Alertmanager(알림 라우팅)

## 3. 디렉토리 구조

```
infra/monitoring/
├── .env.monitoring.example           # 공통 환경 변수 예시
├── docker-compose.monitoring.dev.yml # 개발용 Compose (호스트 포트 바인딩)
├── docker-compose.monitoring.prod.yml# 프로덕션용 Compose (expose, Nginx 경유)
├── alertmanager/
│   └── config.yml                    # Alertmanager 템플릿 (env 치환)
├── prometheus/
│   ├── prometheus.yml                # Prometheus 메인 설정
│   └── alert.rules.yml               # 경고 룰 파일
├── grafana/
│   └── provisioning/                 # 데이터소스/대시보드 자동 로드
├── loki/
│   └── config.yml                    # Loki 단일 노드 구성
├── promtail/
│   └── config.yml                    # 시스템/컨테이너 로그 수집
├── mysqld-exporter/
│   ├── .my.cnf.dev                   # 개발 자격 증명 예시
│   └── .my.cnf.prod.example          # 운영 자격 증명 예시 (복사해 사용)
└── README.md
```

## 4. 실행 방법

### 4.1. 개발 환경

권장 순서:

```bash
# 인프라/애플리케이션/게이트웨이 이후(네트워크/종속 서비스 준비)
pnpm docker:infrastructure:dev:up
pnpm docker:application:dev:up
pnpm docker:gateway:dev:up

# 모니터링 스택 기동
pnpm docker:monitoring:dev:up

# 한 번에 실행
pnpm docker:all:dev:up
```

접속(개발):

- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093
- Grafana: http://localhost:3000 (Nginx 경유 시 http://localhost:8081/monitoring/grafana/)
- Loki API: http://localhost:3100
- Blackbox exporter: http://localhost:9115

중지:

```bash
pnpm docker:monitoring:dev:down
# 전체 중지
pnpm docker:all:dev:down
```

### 4.2. 프로덕션 환경

GitHub Actions `deploy-monitoring.yml` 워크플로우가 `.env.monitoring.prod`와 루트 `.env.server.prod`를 병합하여 Compose를 실행합니다. 설정 변경 시 수동으로 재실행할 수 있습니다.

수동 배포가 필요하면 프로젝트 루트에서 다음 명령을 실행합니다.

```bash
cd ~/srv/web_project

# 이미지 사전 다운로드(선택)
node ./scripts/compose-with-env.mjs \
  --env ./.env.server.prod \
  --env ./monitoring/.env.monitoring.prod \
  -- docker compose -f monitoring/docker-compose.monitoring.prod.yml pull

# 스택 기동
node ./scripts/compose-with-env.mjs \
  --env ./.env.server.prod \
  --env ./monitoring/.env.monitoring.prod \
  -- docker compose -f monitoring/docker-compose.monitoring.prod.yml up -d

# 상태/로그 확인
docker compose -f monitoring/docker-compose.monitoring.prod.yml ps
docker compose -f monitoring/docker-compose.monitoring.prod.yml logs --tail=50
```

프로덕션에서는 호스트 포트를 바인딩하지 않으며, Grafana만 게이트웨이 Nginx를 통해 외부에 노출됩니다.

## 5. 네트워크 구성

- 모든 모니터링 서비스는 애플리케이션과 동일한 외부 브릿지 네트워크(`APP_NETWORK_NAME`)를 사용합니다.
- 네트워크 이름은 루트 환경 파일(`infra/.env.server.*`)의 `APP_NETWORK_NAME`로 관리합니다.

## 6. 볼륨 관리

다음 데이터 볼륨을 사용합니다.

- `prometheus-data`: Prometheus TSDB
- `grafana-data`: Grafana 데이터/구성
- `loki-data`: Loki 데이터
- `promtail-positions`: Promtail 오프셋 파일
- `alertmanager-data`: Alertmanager 상태

프로덕션에서는 필요 시 스냅샷/백업 정책을 별도 수립하세요.

## 7. 환경 변수 설정

예시 파일을 복사해 사용합니다.

```bash
cp infra/monitoring/.env.monitoring.example infra/monitoring/.env.monitoring.dev
cp infra/monitoring/.env.monitoring.example infra/monitoring/.env.monitoring.prod
```

주요 변수(발췌):

- 공통 DNS: `COMPOSE_DNS1`, `COMPOSE_DNS2`
- 네트워크: `APP_NETWORK_NAME`(미설정 시 기본값 사용)
- Grafana: `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`, `GRAFANA_ROOT_URL`
- Alertmanager: `ALERTMANAGER_SLACK_WEBHOOK_URL`, `ALERTMANAGER_SLACK_CHANNEL`, `ALERTMANAGER_SMTP_*`
- MySQL Exporter: `MYSQL_EXPORTER_ADDRESS`(기본 `mysql:3306`), 자격증명 파일은 `mysqld-exporter/.my.cnf.*`
- Nginx Exporter: `NGINX_EXPORTER_SCRAPE_URI`(기본 `http://nginx/nginx_status`)

민감 정보는 Git에 커밋하지 말고 서버 로컬 `.env` 파일로 주입하세요.

## 8. Grafana 설정(프로비저닝)

- 루트 URL: 서브패스 `/monitoring/grafana/` 기준(`GF_SERVER_ROOT_URL`, `GF_SERVER_SERVE_FROM_SUB_PATH=true`)
  - 개발 예시: `http://localhost:8081/monitoring/grafana/`
  - 운영 예시: `https://www.example.com/monitoring/grafana/`
- 데이터소스: Prometheus `http://prometheus:9090`, Loki `http://loki:3100`
- 홈 대시보드: `node-exporter-full.json`
- 프로비저닝 경로: `grafana/provisioning/**`

## 9. Prometheus 설정 핵심

- 파일: `prometheus/prometheus.yml`
  - `scrape_interval: 15s`, timeout `10s`
  - Alertmanager: `alertmanager:9093`
  - 주요 잡: `prometheus`, `node`, `cadvisor`, `nginx`, `spring-backend-*`(`/api/actuator/prometheus`), `mysql`(mysqld-exporter), `blackbox-http`
- 블랙박스 예시:

```yaml
- job_name: blackbox-http
  metrics_path: /probe
  params:
    module: [http_2xx]
  static_configs:
    - targets:
        - https://www.example.com/healthz
        - https://www.example.com/api/actuator/health
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - source_labels: [__param_target]
      target_label: instance
    - target_label: __address__
      replacement: blackbox-exporter:9115
```

- 설정 리로드: `--web.enable-lifecycle` 활성화 → `POST http://<prometheus>:9090/-/reload`
- 룰 파일: `prometheus/alert.rules.yml`

## 10. Alertmanager 템플릿

`alertmanager/config.yml`는 컨테이너 기동 시 env 치환을 수행합니다.

- 필수/중요 변수: `ALERTMANAGER_SLACK_WEBHOOK_URL`, `ALERTMANAGER_SLACK_CHANNEL`, `ALERTMANAGER_SMTP_*`
- 기본 라우팅: `severity="critical"` → critical 수신자, `severity="warning"` → warning 수신자
- Email 경로는 주석 상태이므로 필요 시 SMTP 환경 구성 후 활성화

## 11. Loki / Promtail 파이프라인

- Loki: 단일 노드 파일시스템 저장(`loki/config.yml`), 보존/성능은 `limits_config`, `schema_config`로 제어
- Promtail: 시스템 로그(`/var/log/*.log`)와 도커 컨테이너 로그(`docker_sd_configs`) 수집, `positions` 볼륨으로 오프셋 관리
- Grafana Explore에서 `{compose_service="backend"}` 등으로 조회

## 12. Nginx 리버스 프록시 경로

- 운영 외부 공개 대상: Grafana만 `/monitoring/grafana/`
- Prometheus/Alertmanager/Loki UI는 내부 전용(게이트웨이 미공개)
- 게이트웨이 Nginx 설정 예시는 `infra/gateway/nginx/default.prod.conf`, `infra/gateway/nginx/default.dev.conf` 참고

## 13. 운영 체크리스트(요약)

1. 사전 준비

- 애플리케이션 네트워크 존재 확인: `web_project_webnet`
- MySQL 모니터링 계정 생성 및 `mysqld-exporter/.my.cnf.prod` 준비
- 게이트웨이 Nginx에 `/nginx_status` 설정 확인

2. 환경 변수/자격 증명

- `.env.monitoring.prod` 생성(Grafana 관리자 비밀번호, 루트 URL, Slack/Webhook, SMTP 비밀번호 등 설정)
- `mysqld-exporter/.my.cnf.prod` 생성(권한 600)

3. 배포/검증

- 이미지 pull → up -d → ps/logs 확인
- Grafana 접속/데이터소스 테스트, Prometheus Targets UP 확인, Loki 로그 조회, Alertmanager 동작 확인

4. 보안

- 게이트웨이 접근 제어(Basic Auth, IP 화이트리스트, VPN 중 택일)
- 비밀 파일 권한: `.env.monitoring.prod`, `.my.cnf.prod` → 600
- 민감 파일 Git 미추적 확인

## 14. 트러블슈팅

- Prometheus 타겟 DOWN: 컨테이너 이름/포트, 네트워크 연결, 방화벽 확인
- Grafana 데이터소스 오류: 프로비저닝 URL/이름 확인, 컨테이너 재기동, 로그 확인
- Slack/Email 알림 미수신: Alertmanager env 필수값 확인(운영은 불충분 시 기동 실패)
- Promtail 미수집: 도커 경로/소켓 마운트, 권한 확인
- Nginx Exporter 5xx: `NGINX_EXPORTER_SCRAPE_URI`가 `/nginx_status`와 일치하는지 확인

## 15. 참고

- 전체 가이드: [`../../docs/monitoring.md`](../../docs/monitoring.md)
- 운영/배포: [`../../docs/operations.md`](../../docs/operations.md)
- 게이트웨이 Nginx 설정: `infra/gateway/nginx/default.prod.conf`, `infra/gateway/nginx/default.dev.conf`
- Compose 파일: `infra/monitoring/docker-compose.monitoring.{dev,prod}.yml`
