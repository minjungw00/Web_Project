# Monitoring Layer

## 1. 개요

Monitoring 레이어는 Prometheus, Alertmanager, Grafana, Loki, Promtail 및 각종 Exporter로 구성되어 애플리케이션/인프라의 메트릭과 로그를 수집/시각화/알림합니다. 본 레이어의 설정과 Compose는 `infra/monitoring/**`에서 관리합니다.

## 2. 아키텍처

```
애플리케이션/인프라 → Exporters/Promtail/Telegraf → Prometheus/Loki → Grafana(UI) → (Nginx 경유 외부 공개)
```

- 메트릭: Prometheus ← node-exporter, cadvisor, nginx-exporter, mysqld-exporter, telegraf, Spring Boot(`/api/actuator/prometheus`), blackbox-exporter
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
├── telegraf/
│   └── telegraf.conf                 # Telegraf 메트릭 수집 설정 (Nginx 로그 파싱)
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

### 8.1. 대시보드 목록

- **node-exporter-full.json**: 시스템 메트릭 (CPU, 메모리, 디스크, 네트워크 등)
- **nginx.json**: Nginx 대시보드 (Telegraf 메트릭 기반)
- **nginx-fixed.json**: 신규 Nginx 대시보드 (Promtail 로그 메트릭 + nginx-exporter 기반)
  - Nginx 기본 메트릭: Active Connections, Connection Rate, Request Rate
  - 상태 코드별 요청: 2XX, 3XX, 4XX, 5XX 응답 추이 및 총합
  - 요청 분석: 인기 엔드포인트 Top 10, 클라이언트 IP Top 10
  - 503 에러 게이지 등 실시간 모니터링
- **mysql-overview.json**: MySQL 메트릭 대시보드
  - 기본 통계: Uptime, QPS, Connections, Buffer Pool 크기
  - InnoDB: Buffer Pool 사용률, I/O 통계, 트랜잭션
  - 프로세스: 활성 프로세스 상태, 쿼리 실행 통계
  - 시스템: CPU/메모리/디스크/네트워크 (Node Exporter 연동)
  - **참고**: Query Cache 관련 패널은 MySQL 8.0+에서 "No data" (정상)

### 8.2. 수집 에이전트 / Exporter 요약

| 도구/컴포넌트          | 수집 범주                    | 대표 메트릭 예시                                                                                             | 스크레이프/출력                    | 비고                      |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------- |
| Prometheus             | 메트릭 수집/저장(집계)       | (자체 지표) prometheus_tsdb_head_series, prometheus_target_interval_length_seconds                           | 9090 /metrics                      | TSDB                      |
| node_exporter          | 호스트 OS/하드웨어           | node_cpu_seconds_total, node_memory_MemTotal_bytes, node_filesystem_avail_bytes                              | 9100 /metrics                      |                           |
| cAdvisor               | 컨테이너 리소스              | container_cpu_usage_seconds_total, container_memory_usage_bytes, container_network_receive_bytes_total       | 8080 /metrics                      |                           |
| nginx_exporter         | Nginx 기본 상태(stub_status) | nginx_connections_active, nginx_connections_accepted, nginx_http_requests_total                              | 9113 /metrics                      | Telegraf와 병행 가능      |
| telegraf (prom client) | Nginx + 시스템 + 로그 파싱   | nginx_accepts, nginx_requests, nginx_active, nginxlog_resp_bytes, cpu_usage_user                             | 9273 /metrics                      | inputs.nginx, inputs.tail |
| mysqld_exporter        | MySQL(Performance Schema)    | mysql_global_status_uptime, mysql_info_schema_processlist_threads, mysql_perf_schema_events_statements_total | 9104 /metrics                      |                           |
| Spring Boot Actuator   | 애플리케이션(Micrometer)     | http_server_requests_seconds_count/sum, jvm_memory_used_bytes, datasource_active_connections                 | 8080 /api/actuator/prometheus      |                           |
| blackbox_exporter      | 외부 가용성/프로브           | probe_success, probe_duration_seconds, probe_http_status_code, probe_ssl_earliest_cert_expiry                | 9115 /probe                        |                           |
| Promtail → Loki        | 로그 수집/저장               | (지표 아님) 로그 라벨 기반 쿼리, promtail 자체 지표는 Prometheus에서 수집 가능                               | Loki 3100, Promtail 9080 (UI 없음) |                           |

각 도구의 상세 설정 파일 경로는 본 문서 상단 디렉토리 구조를 참고하세요.

### 8.3. Grafana 대시보드 안내

아래 표는 주로 사용하는 대시보드의 목적, 주요 지표/패널, 사용 팁을 요약합니다.

| 대시보드 이름             | 목적/대상                        | 주요 지표/패널                                                                                | 사용 팁/주의                                                                                                |
| ------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Blackbox Exporter         | 외부/내부 엔드포인트 가용성 점검 | probe_success, probe_duration_seconds, probe_http_status_code, probe_ssl_earliest_cert_expiry | 5xx/타임아웃 증가 시 원인(네트워크/게이트웨이/백엔드) 역추적, 인증서 만료 임계치 알림 설정                  |
| cAdvisor dashboard        | 컨테이너 리소스 모니터링         | 컨테이너 CPU/메모리/네트워크/블록 I/O, Throttling, OOM                                        | 스파이크 컨테이너 식별, 리소스 제한/요청값 조정 근거로 활용                                                 |
| Loki stack monitoring     | 로그 파이프라인 상태             | Loki ingester 요청률/에러율, Promtail 타겟 상태, 큐 적체                                      | 로그 미수집/지연 시 원인 파악, 라벨 폭증(고 카디널리티) 감지                                                |
| MySQL Overview            | DB 상태/성능                     | Uptime, QPS, Connections, Buffer Pool Size/Hit, I/O, Processlist                              | Query Cache 패널은 MySQL 8.0+에서 No data가 정상, 시스템 패널은 Node Exporter/Telegraf와 인스턴스 매핑 유의 |
| Nginx                     | 웹 서버 상태/트래픽              | nginx_accepts/requests/active/reading/writing/waiting, 상태코드 분포, nginxlog_resp_bytes     | instance로 telegraf:9273 선택(Telegraf 기반), 액세스 로그 파싱 메트릭으로 상위 경로/클라이언트 분석         |
| Node Exporter Full        | 호스트 OS 리소스                 | CPU 사용률/부하, 메모리/스왑, 디스크 I/O/용량, 네트워크                                       | CPU iowait, 파일시스템 사용량 임계치로 용량/IO 병목 사전 경보                                               |
| Spring Boot Observability | 애플리케이션 성능                | http*server_requests*(count/sum), jvm\_(memory/threads), hikari/datasource, GC                | 에러율/지연 P95/P99 추적, 엔드포인트별 병목, 커넥션 풀 고갈 탐지                                            |

추가로 홈/폴더 대시보드는 `grafana/provisioning/dashboards`에서 JSON으로 관리되며, 필요 시 편집 후 JSON Export → Git 커밋으로 재현성을 유지합니다.

### 8.4. 지표 해석 가이드 (의미와 활용)

| 범주               | 핵심 지표                                                                                                                           | 의미                                    | 활용/임계값 가이드(예시)                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| 가용성(Blackbox)   | probe_success, probe_duration_seconds, probe_http_status_code, probe_ssl_earliest_cert_expiry                                       | 엔드포인트 가용성/지연/상태/인증서 만료 | success=0 즉시 경보, duration P95 추적, 인증서 만료 14일 전 경보                      |
| Nginx              | nginx_requests, nginx_active/reading/writing/waiting, nginxlog_resp_bytes, 상태코드 분포                                            | 트래픽량/동시 연결/응답 바이트/에러율   | 5xx 비율 > 1% 경보, waiting 급증은 커넥션 풀/백엔드 병목 탐색                         |
| 시스템(Node)       | node_cpu_seconds_total, node_load1, node_memory_MemAvailable_bytes, node_filesystem_avail_bytes, node_disk_io_time_seconds_total    | CPU/Load/메모리/디스크 용량/디스크 I/O  | 메모리 가용 < 10% 경보, 파일시스템 사용률 > 80% 경보, iowait 상승 시 디스크 병목 의심 |
| 컨테이너(cAdvisor) | container_cpu_usage_seconds_total, container_memory_usage_bytes, container_network_receive/transmit_bytes_total, throttling         | 컨테이너별 자원 사용/제한 초과          | 지속적 Throttling 발생 시 리소스 요청/제한 조정, OOM/메모리 스파이크 모니터           |
| MySQL              | mysql_global_status_queries, ...\_threads_connected, ...\_innodb_buffer_pool_size, mysql_perf_schema_events_statements_total        | QPS/연결/버퍼풀 용량/쿼리 실행 통계     | 연결 수 급증은 커넥션 풀 조정, Buffer Pool 적중률 저하는 메모리/쿼리 튜닝 고려        |
| Spring(App)        | http*server_requests_seconds*(count/sum), http_server_requests_seconds_bucket, jvm_memory_used_bytes, datasource_active_connections | API 지연/에러율/메모리/DB 커넥션        | 에러율 > 1% 경보, P95 지연 임계치 설정, 풀 사용률 > 80% 지속 시 용량 확장             |

### 8.5. Grafana 패널 전체 매핑

- 모든 프로비저닝 대시보드(`blackbox-exporter-http-prober.json`, `cadvisor-dashboard.json`, `loki-stack-monitoring.json`, `mysql-overview.json`, `nginx.json`, `node-exporter-full.json`, `spring-boot-observability.json`)의 패널·PromQL·의미·활용 팁을 표 형식으로 정리했습니다.
- 경로: [`grafana/dashboard-panels.md`](grafana/dashboard-panels.md)
- 대시보드에서 패널을 수정하거나 신규 지표를 추가할 때, 이 문서를 함께 갱신하여 운영팀이 쿼리/해석/알람 기준을 빠르게 따라갈 수 있도록 유지하세요.

## 9. Prometheus 설정 핵심

- 파일: `prometheus/prometheus.yml`
  - `scrape_interval: 15s`, timeout `10s`
  - Alertmanager: `alertmanager:9093`
  - 주요 잡: `prometheus`, `node`, `cadvisor`, `nginx`, `telegraf`, `spring-backend-*`(`/api/actuator/prometheus`), `mysql`(mysqld-exporter), `blackbox-http`
  - **telegraf**: Telegraf (포트 9273) - Nginx stub_status, 로그 파싱 및 시스템 메트릭 수집
  - **mysql**: mysqld-exporter (포트 9104) - Performance Schema 기반 고급 메트릭 수집
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

### 11.1. Nginx 로그 파싱 및 메트릭 생성

Promtail은 Nginx 액세스 로그를 파싱하여 Prometheus 메트릭으로 변환합니다:

- **수집 대상**:
  - 시스템 로그: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
  - Docker 컨테이너: `{compose_service="nginx"}` 라벨을 가진 컨테이너의 stdout 로그

- **생성 메트릭**:
  - `nginxlog_resp_bytes`: 응답 바이트 수 (Counter)
  - `nginxlog_requests_total`: 총 요청 수 (Counter)
- **추출 라벨**:
  - `client_ip`: 클라이언트 IP 주소
  - `method`: HTTP 메서드 (GET, POST 등)
  - `request`: 요청 경로
  - `status`, `resp_code`: HTTP 상태 코드
  - `referer`: HTTP Referer 헤더
  - `agent`: User-Agent

- **정규식 파싱**: Nginx Combined 로그 형식을 파싱하여 필드 추출
  ```
  <IP> - <user> [<timestamp>] "<method> <request> HTTP/<version>" <status> <bytes> "<referer>" "<agent>"
  ```

이 메트릭들은 Grafana 대시보드에서 상태 코드별 요청 수, 인기 엔드포인트, 클라이언트 IP 분석 등에 사용됩니다.

## 11.2. Telegraf를 통한 Nginx 메트릭 수집

Telegraf는 Nginx stub_status 및 액세스 로그를 파싱하여 Prometheus 메트릭으로 변환합니다:

- **수집 대상**:
  - Nginx stub_status: `/nginx_status` 엔드포인트
  - Nginx 액세스 로그: `/var/log/nginx/access.log` (공유 볼륨)
  - 시스템 메트릭: CPU, 메모리, 디스크, 네트워크

- **생성 메트릭**:
  - `nginx_accepts`: 총 수락된 연결 수
  - `nginx_handled`: 총 처리된 연결 수
  - `nginx_requests`: 총 요청 수
  - `nginx_active`: 현재 활성 연결 수
  - `nginx_reading`: 현재 읽기 중인 연결 수
  - `nginx_writing`: 현재 쓰기 중인 연결 수
  - `nginx_waiting`: 현재 대기 중인 연결 수
  - `nginxlog_resp_bytes`: 액세스 로그에서 파싱한 응답 바이트 수
  - CPU, 메모리, 디스크, 네트워크 메트릭

- **로그 파싱**:
  - Grok 패턴을 사용하여 Nginx Combined 로그 형식 파싱
  - 추출 라벨: `client_ip`, `verb` (HTTP 메서드), `request` (경로), `resp_code` (상태 코드), `resp_bytes`, `referrer`, `agent`

- **볼륨 공유**:
  - Gateway와 Monitoring 레이어 간 `nginx-logs` 볼륨 공유
  - 개발: `web_project-dev_nginx-logs`
  - 프로덕션: `web_project_nginx-logs`

- **엔드포인트**:
  - Prometheus 메트릭 노출: `http://telegraf:9273/metrics`

이 메트릭들은 기존 Nginx 대시보드(`nginx.json`)에서 사용됩니다.

## 11.3. MySQL 메트릭 수집

mysqld_exporter는 MySQL Performance Schema를 통해 고급 메트릭을 수집합니다:

- **활성화된 컬렉터**:
  - `global_status`, `global_variables`: 기본 상태 및 설정값
  - `info_schema.innodb_metrics`: InnoDB 버퍼 풀, I/O, 락 통계
  - `info_schema.processlist`: 활성 프로세스 상태
  - `info_schema.tables`, `info_schema.tablestats`: 테이블 통계
  - `perf_schema.*`: 쿼리 실행, I/O, 락 대기 상세 정보

- **필수 사전 설정**:
  1. MySQL Performance Schema 활성화 (`infra/infrastructure/mysql/my.cnf`):
     ```ini
     performance_schema = ON
     performance_schema_instrument = '%=ON'
     innodb_monitor_enable = all
     ```
  2. 모니터링 계정 생성 (`infra/infrastructure/mysql/init/01-init-monitoring.sql`):
     ```sql
     CREATE USER 'monitoring'@'%' IDENTIFIED BY 'password';
     GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'monitoring'@'%';
     ```

- **주요 메트릭**:
  - `mysql_global_status_uptime`: MySQL 가동 시간
  - `mysql_global_status_queries`: 총 쿼리 수
  - `mysql_global_status_threads_connected`: 현재 연결 수
  - `mysql_global_variables_innodb_buffer_pool_size`: 버퍼 풀 크기
  - `mysql_perf_schema_events_statements_total`: 쿼리 실행 통계
  - `mysql_perf_schema_file_events_total`: 파일 I/O 통계
  - `mysql_perf_schema_table_io_waits_total`: 테이블 I/O 대기

- **MySQL 8.0+ 호환성**:
  - Query Cache는 MySQL 8.0부터 제거되어 관련 메트릭은 수집 불가 (정상)
  - Performance Schema가 대체 기능 제공

- **상세 가이드**:
  - Performance Schema 설정: [`../../docs/mysql-monitoring-fix-summary.md`](../../docs/mysql-monitoring-fix-summary.md)
  - Grafana 대시보드 수정: [`../../docs/mysql-monitoring-dashboard-fix.md`](../../docs/mysql-monitoring-dashboard-fix.md)

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

## 14. 트러블슈팅 모음집 (통합)

이 섹션은 기존 분산 문서의 트러블슈팅을 통합했습니다. 원문은 정리 후 삭제 예정입니다.

- `docs/mysql-monitoring-dashboard-fix.md`
- `docs/mysql-monitoring-fix-summary.md`
- `docs/nginx-monitoring-telegraf-setup.md`

### 14.1 MySQL 대시보드 "No data" 이슈 (Grafana)

증상: MySQL Overview 대시보드의 일부 패널(Buffer Pool Size of Total RAM, System Charts, Process States 등)이 "No data" 표시.

핵심 원인 및 조치:

- instance 레이블 불일치: MySQL 메트릭(`mysqld-exporter:9104`)과 시스템 메트릭(`node-exporter:9100`)이 서로 다른 instance 값을 사용.
  - 대안 1: 대시보드 변수 `node_instance`를 추가하고 시스템 메트릭 쿼리에서 `instance="$node_instance"` 사용.
  - 대안 2: 조인 실패를 피하기 위해 `scalar()` 또는 `ignoring(instance)`/`group_left()` 사용.
- 메트릭 이름 차이: `mysql_info_schema_threads` → `mysql_info_schema_processlist_threads`로 수정.
- Query Cache 패널: MySQL 8.0+에서 제거된 기능이므로 "No data"가 정상.

권장 쿼리 예시:

```promql
(mysql_global_variables_innodb_buffer_pool_size{instance="$host"} * 100)
  / scalar(node_memory_MemTotal_bytes{instance="$node_instance"})
```

자동화: `scripts/fix-mysql-dashboard.py`를 통해 변수 추가 및 쿼리 일괄 치환을 지원합니다.

검증 체크:

- Prometheus에서 `mysql_up`, `node_memory_MemTotal_bytes` 조회
- Grafana 변수 드롭다운에서 Host=`mysqld-exporter:9104`, Node Instance=`node-exporter:9100` 선택

### 14.2 MySQL 메트릭 수집 정상화 체크리스트

구성 변경:

- Performance Schema 활성화: `infra/infrastructure/mysql/my.cnf`
  - `performance_schema = ON`, `innodb_monitor_enable = all` 등
- mysqld_exporter 컬렉터 확장: `infra/monitoring/docker-compose.monitoring.(dev|prod).yml`
  - `--collect.perf_schema.*`, `--collect.info_schema.*`, `--collect.global_*` 플래그 활성화

확인 방법:

- 컨테이너 재시작 후 `curl http://localhost:9104/metrics | grep mysql_perf_schema`
- Prometheus UI에서 다음 쿼리 테스트
  - `mysql_info_schema_processlist_threads`
  - `mysql_perf_schema_events_statements_total`
  - `mysql_global_variables_innodb_buffer_pool_size`

알려진 제한사항:

- Query Cache 관련 패널은 MySQL 8.0+에서 항상 "No data"

### 14.3 Nginx 대시보드 지표 부재 → Telegraf 도입

배경: 기존 대시보드가 Telegraf 기반 메트릭(시스템 + Nginx + 로그 파싱)을 기대하는 반면, 수집 도구 부재로 대부분 "No data" 발생.

조치 요약:

- Telegraf 추가(포트 9273): `infra/monitoring/telegraf/telegraf.conf`
  - inputs: `cpu`, `mem`, `disk`, `net`, `nginx`(stub_status), `tail`(access.log Grok 파싱)
  - outputs: `prometheus_client`(9273)
- Docker Compose 갱신: `infra/monitoring/docker-compose.monitoring.(dev|prod).yml`
- Nginx 로그 공유 볼륨: `infra/gateway/docker-compose.gateway.(dev|prod).yml`에 `nginx-logs` 볼륨 공용 마운트
- Prometheus 스크레이프: `telegraf` job 추가(상단 9장 참고)

Grafana 사용 팁:

- Nginx 대시보드에서 instance=`telegraf:9273` 선택
- 기대 메트릭: `nginx_accepts`, `nginx_requests`, `nginx_active`, `nginx_reading/writing/waiting`, `nginxlog_resp_bytes`

빠른 점검:

```bash
# Telegraf 헬스
docker logs web_project-monitoring-dev-telegraf-1 --tail=20 | grep -i 'prometheus_client\|listening\|nginx'

# Prometheus 타겟
curl -s http://localhost:9090/api/v1/targets | grep telegraf | tail -1

# 메트릭 스팟 체크
curl -s http://localhost:9273/metrics | grep -E '^(nginx_|nginxlog_|cpu_usage_|mem_)' | head -10
```

### 14.4 일반 이슈 체크리스트

- Prometheus 타겟 DOWN: 컨테이너 이름/포트, 네트워크 연결, 방화벽 확인
- Grafana 데이터소스 오류: 프로비저닝 URL/이름 확인, 컨테이너 재기동, 로그 확인
- Slack/Email 알림 미수신: Alertmanager env 필수값 확인(운영은 불충분 시 기동 실패)
- Promtail 미수집: 도커 경로/소켓 마운트, 권한 확인
- Nginx Exporter 5xx: `NGINX_EXPORTER_SCRAPE_URI`가 `/nginx_status`와 일치하는지 확인
- Node exporter 패널 공백: 호스트 `/run/systemd`, `/var/run/dbus/system_bus_socket` 확인 및 필요한 capability 부여

## 15. 참고

- 전체 가이드: [`../../docs/monitoring.md`](../../docs/monitoring.md)
- 운영/배포: [`../../docs/operations.md`](../../docs/operations.md)
- 게이트웨이 Nginx 설정: `infra/gateway/nginx/default.prod.conf`, `infra/gateway/nginx/default.dev.conf`
- Compose 파일: `infra/monitoring/docker-compose.monitoring.{dev,prod}.yml`
