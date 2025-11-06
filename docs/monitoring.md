# Monitoring & Observability Guide

이 문서는 Web Project 인프라에서 사용하는 통합 모니터링·로깅 스택의 구조와 운영 절차를 다룹니다. 스택은 `infra/monitoring` 하위 Docker Compose 구성으로 제공되며, 애플리케이션과 동일한 전용 네트워크(`APP_NETWORK_NAME`, 기본값 `web_project_webnet`)에 연결되어 Blue-Green 배포 시에도 일관된 가시성을 제공합니다.

---

## 1. 목표와 범위

- 애플리케이션, 인프라, 네트워크 계층의 **지표 수집**과 **로그 집계**를 중앙화합니다.
- Grafana 대시보드로 시각화를 제공하고, Prometheus + Alertmanager를 통해 Slack·Email 경보 라우팅을 수행합니다.
- Loki/Promtail로 텍스트 로그를 집계하여 Blue-Green 색상과 무관한 단일 검색창을 제공합니다.
- 모니터링 스택은 애플리케이션 배포 파이프라인과 분리되어 있으며, `deploy-blue-green.sh`가 실행되는 동안에도 독립적으로 유지됩니다.

---

## 2. 구성요소와 책임

| 범주              | 컨테이너/엔드포인트               | 주요 역할                                    | 기본 포트 |
| ----------------- | --------------------------------- | -------------------------------------------- | --------- |
| Metrics 수집      | Prometheus                        | Exporter/서비스의 메트릭 스크레이핑 및 저장  | 9090      |
| 수집 에이전트     | Telegraf                          | 시스템/Nginx/로그 파싱 메트릭 → Prometheus   | 9273      |
| 시스템 지표       | node_exporter                     | 호스트 OS/Hardware 지표 수집                 | 9100      |
| 컨테이너 지표     | cAdvisor                          | Docker 컨테이너 자원 사용량 모니터링         | 8080      |
| 웹 서버 지표      | nginx_exporter                    | Nginx 요청/상태 지표                         | 9113      |
| 애플리케이션 지표 | Spring Boot `actuator/prometheus` | Backend 비즈니스·기술 지표                   | 8080      |
| 데이터베이스 지표 | mysqld_exporter                   | MySQL 상태 및 질의 지표                      | 9104      |
| 외부 가용성       | blackbox_exporter                 | HTTP/TCP/ICMP 헬스체크                       | 9115      |
| 로그 수집         | Promtail                          | 컨테이너/호스트 로그를 Loki로 전달           | 9080      |
| 로그 저장/검색    | Loki                              | 로그 저장 및 Grafana Explore 인터페이스 제공 | 3100      |
| 시각화            | Grafana                           | 대시보드, Explore, Alert Rule 관리           | 3000      |
| 알림              | Alertmanager                      | Slack/Email/Webhook 경보 라우팅              | 9093      |

> Spring Boot Backend는 `/api/actuator/prometheus`를 직접 노출하므로 별도 exporter가 필요 없습니다. Blue/Green 색상 모두 동일 엔드포인트를 제공하므로 Prometheus job에 두 색상의 서비스를 함께 등록합니다.

> 업데이트: 모니터링 스택에 Telegraf가 추가되었습니다. Telegraf는 Nginx stub_status 및 액세스 로그를 파싱해 메트릭을 노출하고(기본 9273/tcp), 일부 시스템 지표(cpu, mem, net 등)도 함께 제공합니다. 기존 nginx_exporter는 유지 가능하나, 대시보드에 따라 Telegraf 메트릭이 기본 소스로 사용됩니다.

---

## 3. 배포 및 구성 전략

### 3.1 레포지토리 구조

```
infra/
  monitoring/
    docker-compose.monitoring.dev.yml
    docker-compose.monitoring.prod.yml
    .env.monitoring.example
    prometheus/
      prometheus.yml
      alert.rules.yml
    alertmanager/
      config.yml
    grafana/
      provisioning/
        datasources/datasource.yml
        dashboards/
          dashboard.yml
          web-project-overview.json
    telegraf/
      telegraf.conf
    loki/config.yml
    promtail/config.yml
    loki/rules/ (옵션)
```

- **개발 환경 기동**: `pnpm run docker:monitoring:dev:up`
- **개발 환경 종료**: `pnpm run docker:monitoring:dev:down`
- **운영 서버 기동**: `${HOME}/srv/web_project/monitoring`에서 `docker compose -f docker-compose.monitoring.prod.yml --env-file .env.monitoring.prod up -d`
- 모니터링 Compose 파일은 공통 네트워크 환경 변수(`APP_NETWORK_NAME`)를 사용해 애플리케이션 레이어와 통신합니다. 네트워크가 존재하지 않으면 최초 1회 `docker network create web_project_webnet`으로 생성합니다.

### 3.2 GitHub Actions 연동

- 워크플로: `.github/workflows/deploy-monitoring.yml`
- 선행 단계: `sync-env` 워크플로(또는 수동 배포)를 통해 서버에 `.env.monitoring.prod` 배포
- 파라미터
  - `pull_images` (기본 `true`): 최신 이미지를 강제 pull
  - `recreate` (옵션): 설정 변경 시 컨테이너 재생성 여부
- 실행 절차
  1. `infra/monitoring/**`를 서버 `~/srv/web_project/monitoring/`로 동기화
  2. `APP_NETWORK_NAME` 존재 여부 확인 후 없으면 생성
  3. `docker compose ... up -d` 실행 및 상태 확인
  4. 실패 시 GitHub Actions 로그와 서버 측 `.env` 값 검증

### 3.3 선행 구성 체크리스트

1. **MySQL exporter 계정 생성**

   ```sql
   CREATE USER 'monitoring'@'%' IDENTIFIED BY 'change-me';
   GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'monitoring'@'%';
   FLUSH PRIVILEGES;
   ```

`mysqld-exporter/.my.cnf.*` 파일에 모니터링 전용 계정 자격 증명을 저장하고,
필요 시 `.env.monitoring.*`의 `MYSQL_EXPORTER_ADDRESS` 값을 MySQL 호스트:포트로 맞춥니다(기본 `mysql:3306`).

2. **Nginx stub_status 노출 확인**

   `infra/gateway/nginx/default.dev.conf`와 `default.prod.conf`에 다음 location이 포함되어야 합니다. CIDR은 모니터링 네트워크에 맞게 조정합니다.

   ```nginx
   location = /nginx_status {
     stub_status;
     allow 127.0.0.1;
     allow 172.20.0.0/16;
     deny all;
     access_log off;
   }
   ```

3. **Blackbox 타깃 정의**

   `prometheus/prometheus.yml`의 `blackbox` job에 헬스 체크 대상 URL을 추가합니다. 운영 환경에서는 실제 도메인(`https://www.minjungw00.com/healthz`)을 사용하고, 개발 환경에서는 `http://nginx:80/healthz` 등 내부 엔드포인트를 등록합니다.

### 3.4 Prometheus 스크레이프 예시

```yaml
scrape_configs:
  - job_name: "spring-backend-bluegreen"
    metrics_path: /api/actuator/prometheus
    static_configs:
      - targets:
          - backend-blue:8080
          - backend-green:8080
    relabel_configs:
      - source_labels: [__address__]
        regex: "backend-(.*):8080"
        target_label: deployment_color
        replacement: "$1"

  - job_name: "nginx"
    static_configs:
      - targets: ["nginx-exporter:9113"]

  - job_name: "mysqld"
    static_configs:
      - targets: ["mysqld-exporter:9104"]

  - job_name: "telegraf"
    metrics_path: /metrics
    static_configs:
      - targets: ["telegraf:9273"]

  - job_name: "blackbox"
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - "https://www.minjungw00.com/healthz"
          - "https://www.minjungw00.com/api/actuator/health"
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### 3.5 환경 변수 참고

| 변수                             | 기본값(예시)                                                 | 필수          | 사용처            | 비고                                                            |
| -------------------------------- | ------------------------------------------------------------ | ------------- | ----------------- | --------------------------------------------------------------- |
| `APP_NETWORK_NAME`               | `web_project_webnet` (prod) / `web_project-dev-webnet` (dev) | 예            | 모든 Compose 파일 | 네트워크 이름이 바뀌면 Application/Gateway와 동일하게 맞춰야 함 |
| `COMPOSE_DNS1` / `COMPOSE_DNS2`  | `1.1.1.1` / `8.8.8.8`                                        | 아니오        | 모든 컨테이너     | 필요 시 내부 DNS로 변경                                         |
| `GRAFANA_ADMIN_USER`             | `admin`                                                      | 아니오        | Grafana           | 운영에서는 전용 계정 사용 권장                                  |
| `GRAFANA_ADMIN_PASSWORD`         | `admin`                                                      | 예            | Grafana           | 강력한 비밀번호로 교체                                          |
| `GRAFANA_ROOT_URL`               | `https://localhost/monitoring/grafana/` (dev)                | 예            | Grafana           | Nginx 서브패스 구조와 일치해야 함                               |
| `ALERTMANAGER_SLACK_WEBHOOK_URL` | (없음)                                                       | Slack 사용 시 | Alertmanager      | Slack 미사용 시 공란 허용                                       |
| `ALERTMANAGER_SLACK_CHANNEL`     | `#web-project-alerts`                                        | 아니오        | Alertmanager      | Slack 채널 지정                                                 |
| `ALERTMANAGER_EMAIL_TO`          | `ops@example.com`                                            | Email 사용 시 | Alertmanager      | 콤마 구분 다중 수신자 가능                                      |
| `ALERTMANAGER_SMTP_HOST`         | `smtp.example.com:587`                                       | Email 사용 시 | Alertmanager      | 포트 포함 입력                                                  |
| `ALERTMANAGER_SMTP_FROM`         | `monitor@web-project.dev`                                    | Email 사용 시 | Alertmanager      | 발신 주소                                                       |
| `ALERTMANAGER_SMTP_USERNAME`     | `monitor`                                                    | Email 사용 시 | Alertmanager      | SMTP 인증 계정                                                  |
| `ALERTMANAGER_SMTP_PASSWORD`     | `change-me`                                                  | Email 사용 시 | Alertmanager      | 비밀번호는 Secrets Manager 또는 서버 `.env`에서 관리            |
| `MYSQL_EXPORTER_ADDRESS`         | `mysql:3306`                                                 | 예            | mysqld-exporter   | 호스트/포트만 환경 변수로 관리, 자격 증명은 .my.cnf.\* 사용     |
| `NGINX_EXPORTER_SCRAPE_URI`      | `http://nginx/nginx_status`                                  | 예            | nginx-exporter    | `stub_status` 위치와 일치                                       |
| `PROMTAIL_POSITIONS_MOUNT`       | `promtail-positions`                                         | 아니오        | Promtail          | 호스트 또는 named volume 경로                                   |

민감한 값은 Git에 커밋하지 말고 서버 `.env.monitoring.prod`에서만 관리하세요.

---

## 4. Grafana·경보·접근 제어

- 운영 환경에서는 Gateway Nginx가 `/monitoring/grafana/` 경로로 Grafana를 노출하며 Basic Auth 또는 OIDC로 접근을 제한합니다.
- Prometheus, Alertmanager, Loki UI는 외부에 노출하지 않고 Docker 네트워크 내부 주소(예: `http://prometheus:9090`)로만 접근합니다. 필요 시 SSH 포트포워딩을 이용해 일시적 접근을 허용합니다.
- Gateway 환경 변수(`NGINX_MONITORING_AUTH_REALM`, `NGINX_MONITORING_AUTH_FILE`, `NGINX_MONITORING_INTERNAL_CIDR`)를 통해 접근 정책을 제어합니다.
- Grafana 프로비저닝
  - `grafana/provisioning/datasources/datasource.yml`에 Prometheus/Loki가 사전 등록됩니다.
  - `grafana/provisioning/dashboards/dashboard.yml`로 자동 로드되는 대시보드를 관리합니다.
  - 새 대시보드를 추가하면 JSON을 Git에 커밋해 재현성을 확보합니다.

### 4.1 Nginx 리버스 프록시 스니펫

```nginx
location ^~ /monitoring/grafana/ {
  set $grafana_upstream "http://grafana:3000";
  include /etc/nginx/snippets/proxy-headers.conf;
  proxy_pass $grafana_upstream;
  proxy_redirect off;
  satisfy any;
  allow 127.0.0.1;
  allow ${NGINX_MONITORING_INTERNAL_CIDR};
  deny all;
  auth_basic "${NGINX_MONITORING_AUTH_REALM}";
  auth_basic_user_file ${NGINX_MONITORING_AUTH_FILE};
}
```

---

## 5. 알림 및 리포팅 가이드

- `severity="critical"`: Slack `#web-project-alerts` + On-call 이메일 동시 전송, 1분 간격 반복
- `severity="warning"`: Slack 채널로만 전송, 5분 후 재알림
- 이메일 경보는 `alertmanager/config.yml`의 주석을 해제한 후 SMTP 정보를 `.env.monitoring.prod`에 채웁니다.
- 정기 보고가 필요하면 Grafana Reporting(Enterprise) 또는 `grafana-image-renderer` 컨테이너와 Cron 작업을 결합해 PDF/이미지 리포트를 발송하세요.

---

## 6. Metrics & Logs 체크리스트

| 대상              | Metrics Exporter/엔드포인트 | 주요 지표 예시                                                     | 로그 수집 경로                             | 비고                                             |
| ----------------- | --------------------------- | ------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------ |
| OS/Hardware       | node_exporter               | CPU 사용률, Load Average, Memory/Swap, Disk I/O, 파일시스템 사용률 | Promtail → Loki(`/var/log/syslog` 등)      | 호스트 UID/GID 전달 필요                         |
| Docker/컨테이너   | cAdvisor                    | 컨테이너별 CPU/Memory, Block I/O, Network                          | Docker JSON 로그 → Promtail                | `compose_service` 라벨로 Blue/Green 구분 가능    |
| Nginx             | nginx_exporter              | 요청 수, 상태 코드 비율, upstream 지연                             | `/var/log/nginx/access.log`, `error.log`   | ACME 경로 제외 규칙 유지                         |
| Spring Boot       | `/api/actuator/prometheus`  | 요청 지연, 예외율, Thread pool, DB 커넥션 풀                       | `backend/logs/*.log` → Promtail            | `deployment_color`, `profile` 라벨 추가 권장     |
| MySQL             | mysqld_exporter             | QPS, 커넥션 수, Buffer Pool hit ratio, Replication lag             | `/var/log/mysql/mysql.log`, slow query log | slow log는 별도 볼륨 마운트                      |
| 외부 가용성       | blackbox_exporter           | HTTP Availability, TLS 만료, DNS/연결 지연                         | 대상 없음                                  | `/healthz`, `/api/actuator/health` 모니터링 포함 |
| 애플리케이션 로그 | Loki                        | (지표 없음) Loki Explore에서 서비스별 필터링                       | Promtail 파이프라인(JSON 파싱)             | 보존 기간 기본 30일, 필요 시 Object Storage 검토 |
| 경보 이벤트       | Alertmanager                | Alert firing/resolve 상태                                          | Alertmanager 로그                          | Slack/Email 기록과 함께 보관                     |

---

## 7. 운영 절차 체크리스트

1. **배포 전**: `.env.monitoring.*`에 Slack/Webhook/SMTP 비밀이 채워져 있는지 확인하고 Git에 노출되지 않았는지 점검합니다.
2. **배포 후**: `docker compose ps`로 모든 컨테이너가 Healthy인지 확인하고 Grafana → Datasources에서 Prometheus/Loki 상태를 확인합니다.
3. **권한 관리**: Grafana 역할(`Admin`, `Editor`, `Viewer`)을 분리하고, 운영자 외에는 Viewer 권한만 부여합니다.
4. **백업**: Grafana 대시보드 JSON, Prometheus 룰, Alertmanager 설정 파일을 Git + 원격 스토리지에 보관합니다.
5. **보존 정책**: Loki 30일, Prometheus 15일을 기본으로 시작하며 장기 보관이 필요하면 Thanos/VictoriaMetrics 연계를 검토합니다.
6. **알림 테스트**: 월 1회 이상 Slack/Webhook/Email 경보 테스트와 Blackbox 타깃 장애 시나리오를 수행합니다.
7. **로그 검증**: Loki에서 `compose_service="backend-blue"` 같은 라벨을 질의해 Blue-Green 전환 후에도 로그가 정상 수집되는지 확인합니다.

---

## 8. 향후 개선 과제

- Prometheus Remote Write(예: VictoriaMetrics, Thanos)로 장기 보관을 지원합니다.
- Grafana OnCall 또는 Alertmanager Webhook 연동을 통해 On-call 스케줄링을 자동화합니다.
- 비즈니스 메트릭(주문 수, API 호출량 등)을 Backend에 추가하고, 대시보드와 경보 정책을 확장합니다.
- Loki Rule(Recording Rule)을 활용해 로그 기반 지표를 생성하고, 장애 탐지 속도를 향상시킵니다.

---

Blue-Green 배포와 분리된 모니터링 스택을 유지하면 배포 중에도 동일한 데이터 소스에서 상태를 확인할 수 있습니다. 위 가이드를 참고해 `infra/monitoring` 구성을 유지하고, 필요 시 `docs/operations.md`의 Runbook과 함께 사용하세요.

---

## 9. 트러블슈팅 모음집 (통합)

이 섹션은 다음 개별 문서를 통합 요약한 것입니다. 원문은 정리 후 삭제 예정입니다.

- `docs/mysql-monitoring-dashboard-fix.md`
- `docs/mysql-monitoring-fix-summary.md`
- `docs/nginx-monitoring-telegraf-setup.md`

### 9.1 MySQL 대시보드 "No data" 이슈 (Grafana)

증상: MySQL Overview 대시보드의 일부 패널(Buffer Pool Size of Total RAM, System Charts 일체, Process States 등)이 "No data" 표시.

핵심 원인 및 조치:

- instance 레이블 불일치: MySQL 메트릭(`mysqld-exporter:9104`)과 시스템 메트릭(`node-exporter:9100`)이 서로 다른 instance 값을 사용함.
  - 대안 1: 대시보드 변수 `node_instance`를 추가하고, 시스템 메트릭 쿼리에서 `instance="$node_instance"` 사용.
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

### 9.2 MySQL 메트릭 수집 정상화 체크리스트

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

### 9.3 Nginx 대시보드 지표 부재 이슈 → Telegraf 도입

배경: 기존 대시보드가 Telegraf 기반 메트릭(시스템 + Nginx + 로그 파싱)을 기대하는 반면, 수집 도구 부재로 대부분 "No data" 발생.

조치 요약:

- Telegraf 추가(포트 9273): `infra/monitoring/telegraf/telegraf.conf`
  - inputs: `cpu`, `mem`, `disk`, `net`, `nginx`(stub_status), `tail`(access.log Grok 파싱)
  - outputs: `prometheus_client`(9273)
- Docker Compose 갱신: `infra/monitoring/docker-compose.monitoring.(dev|prod).yml`
- Nginx 로그 공유 볼륨: `infra/gateway/docker-compose.gateway.(dev|prod).yml`에 `nginx-logs` 볼륨을 gateway와 monitoring에 공용 마운트
- Prometheus 스크레이프: `telegraf` job 추가(위 3.4 예시 참조)

Grafana 사용 팁:

- Nginx 대시보드 상단 변수에서 instance=`telegraf:9273` 선택
- 기대 메트릭: `nginx_accepts`, `nginx_requests`, `nginx_active`, `nginx_reading/writing/waiting`, `nginxlog_resp_bytes` 등

빠른 점검:

```bash
# Telegraf 헬스
docker logs web_project-monitoring-dev-telegraf-1 --tail=20 | grep -i 'prometheus_client\|listening\|nginx'

# Prometheus 타겟
curl -s http://localhost:9090/api/v1/targets | grep telegraf | tail -1

# 메트릭 스팟 체크
curl -s http://localhost:9273/metrics | grep -E '^(nginx_|nginxlog_|cpu_usage_|mem_)' | head -10
```

---
