# Monitoring Stack

이 문서는 Web Project 인프라에 적용할 통합 모니터링/로깅 스택 설계와 운영 절차를 정의합니다. 모든 구성 요소는 개발/운영 환경에서 Docker Compose 기반 컨테이너로 배포하며, Blue-Green 애플리케이션 스택과 독립적으로 동작합니다.

## 1. 목표와 범위

- 애플리케이션, 인프라, 네트워크 계층의 **지표 수집**과 **로그 집계**를 중앙화합니다.
- Grafana 대시보드를 통해 웹 기반 시각화를 제공하며, Prometheus + Alertmanager로 경고 알림을 이메일/Slack으로 전송합니다.
- Loki/Promtail을 사용해 텍스트 로그를 효율적으로 저장하고 질의합니다.
- 모든 모니터링 컴포넌트는 `infra/docker/monitoring` (예정) 하위의 Compose 스택에서 관리합니다.

## 2. 구성 요소

| 계층              | 컨테이너                           | 역할                                        | 주요 포트(기본) |
| ----------------- | ---------------------------------- | ------------------------------------------- | --------------- |
| Metrics 수집      | Prometheus                         | Exporter/서비스의 메트릭 스크레이핑 및 저장 | 9090            |
| 시스템 지표       | node_exporter                      | OS/Hardware 지표 수집                       | 9100            |
| 컨테이너 지표     | cAdvisor                           | Docker 컨테이너 리소스 사용량               | 8080            |
| 웹 서버 지표      | nginx_exporter                     | Nginx 상태/요청 지표                        | 9113            |
| 애플리케이션 지표 | Spring Boot `/actuator/prometheus` | 백엔드 비즈니스 지표                        | 8080 (기존 BE)  |
| 데이터베이스 지표 | mysqld_exporter                    | MySQL 상태, 질의 지표                       | 9104            |
| 외부 가용성       | blackbox_exporter                  | HTTP/TCP/ICMP 헬스 체크                     | 9115            |
| 로그 수집         | Promtail                           | 컨테이너 로그를 Loki로 전달                 | 9080            |
| 로그 저장/검색    | Loki                               | 로그 저장 및 Grafana용 질의 API 제공        | 3100            |
| 시각화            | Grafana                            | 대시보드 및 알림 규칙 정의                  | 3000            |
| 알림              | Alertmanager                       | 이메일/Slack 등 알림 라우팅                 | 9093            |

> Spring Boot 백엔드는 기존 컨테이너의 `/actuator/prometheus` 엔드포인트로 지표를 노출합니다. 별도 exporter가 필요하지 않으며 Prometheus에서 직접 스크레이핑합니다.

## 3. 배포 전략

### 3.1 디렉터리/파일 제안

```
infra/
	docker/
		monitoring/
			docker-compose.monitoring.dev.yml
			docker-compose.monitoring.prod.yml
			prometheus/
				prometheus.yml
				alerts.rules.yml
			alertmanager/
				config.yml
			grafana/
				provisioning/
					datasources/
					dashboards/
			loki/
				config.yml
			promtail/
				config.yml
```

- **개발 환경**: `docker compose -f infra/docker/monitoring/docker-compose.monitoring.dev.yml up -d`
- **운영 환경**: `docker compose -f infra/docker/monitoring/docker-compose.monitoring.prod.yml --env-file ${HOME}/srv/web_project/.env up -d`
- 모니터링 스택은 애플리케이션 Compose와 분리된 네트워크(`monitoring-net`)를 사용하되, 필요한 서비스(`backend-blue`, `backend-green`, `nginx`, `mysql`)는 추가 네트워크로 모니터링 스택에 연결합니다.

### 3.2 Prometheus 스크레이프 설정 예시

```yaml
scrape_configs:
	- job_name: 'node'
		static_configs:
			- targets: ['node-exporter:9100']

	- job_name: 'cadvisor'
		static_configs:
			- targets: ['cadvisor:8080']

	- job_name: 'nginx'
		static_configs:
			- targets: ['nginx-exporter:9113']

	- job_name: 'spring-backend'
		metrics_path: /actuator/prometheus
		static_configs:
			- targets:
					- 'backend-blue:8080'
					- 'backend-green:8080'

	- job_name: 'mysqld'
		static_configs:
			- targets: ['mysqld-exporter:9104']

	- job_name: 'blackbox'
		metrics_path: /probe
		params:
			module: [http_2xx]
		static_configs:
			- targets:
					- 'https://www.minjungw00.com/healthz'
					- 'https://www.minjungw00.com/actuator/health'
		relabel_configs:
			- source_labels: [__address__]
				target_label: __param_target
			- source_labels: [__param_target]
				target_label: instance
			- target_label: __address__
				replacement: blackbox-exporter:9115
```

## 4. 대시보드 및 접근 제어

- Grafana는 Nginx 리버스 프록시를 통해 `/monitoring/grafana` 하위 경로로 노출합니다.
- Loki Explore, Alertmanager UI 등 추가 UI도 `/monitoring/loki`, `/monitoring/alerts` 등 하위 경로로 매핑합니다.
- **보안 권장 사항**
  1.  `/monitoring/*` 경로에 TLS(HTTPS)를 강제하고, 운영용 Nginx에서 Basic Auth 또는 OIDC 기반 SSO를 적용합니다.
  2.  모니터링 대시보드는 사설 네트워크(사내 VPN 또는 특정 IP 화이트리스트)에서만 접근하도록 방화벽/보안 그룹을 설정합니다.
  3.  Grafana 관리자 계정은 강력한 비밀번호와 2FA(가능 시)를 활성화합니다. 서비스 계정은 Viewer 역할만 부여합니다.
  4.  Alertmanager 및 Prometheus는 외부에 직접 노출하지 말고, Grafana/SSH 터널링을 통해 접근하도록 제한합니다.
  5.  Slack Webhook, SMTP 비밀번호 등 비밀 정보는 서버 `.env` 혹은 Secrets Manager에 저장하고 Compose `env_file`로 주입합니다.

### 4.1 Nginx 리버스 프록시 예시(`/infra/nginx/default.prod.conf` 확장)

```nginx
location /monitoring/grafana/ {
	proxy_pass http://grafana:3000/;
	include /etc/nginx/snippets/proxy-headers.conf;
	auth_basic "Monitoring";
	auth_basic_user_file /etc/nginx/secrets/monitoring.htpasswd;
}

location /monitoring/alerts/ {
	proxy_pass http://alertmanager:9093/;
	include /etc/nginx/snippets/proxy-headers.conf;
	auth_basic "Alertmanager";
	auth_basic_user_file /etc/nginx/secrets/monitoring.htpasswd;
	allow 10.0.0.0/24; # 운영망 화이트리스트 예시
	deny all;
}
```

## 5. 알림 및 일일 리포트

- Alertmanager에서 Email(예: SMTP)과 Slack(예: Incoming Webhook)을 동시에 구성합니다.
- 예시 라우팅 정책
  - `severity="critical"`: Slack `#web-project-alerts` 채널과 On-call 이메일로 즉시 전송
  - `severity="warning"`: Slack 채널로만 전송, 5분 반복
  - 일일 통계: Grafana Reporting(Enterprise) 또는 `grafana-image-renderer` + Cron을 사용해 대시보드 스냅샷을 이메일로 발송
- Prometheus `recording rules`를 이용해 Daily Aggregation(평균 응답 시간, 에러율, DB 커넥션 수 등)을 계산하고 Grafana에서 Email 스케줄을 설정합니다.

## 6. Metrics & Logs 체크리스트

| 대상                    | Metrics Exporter/엔드포인트 | 주요 지표 예시                                                                       | 로그 수집 경로                                          | 비고                                 |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------ |
| OS/Hardware             | node_exporter               | CPU 사용률, Load Average, Memory/Swap, Disk I/O, 파일시스템 사용률                   | Promtail → Loki(`/var/log/syslog`, `/var/log/dmesg`)    | 호스트 UID/GID 전달 필요             |
| Docker/컨테이너         | cAdvisor                    | 컨테이너별 CPU/Memory, Block I/O, 네트워크 트래픽                                    | Docker JSON 로그 → Promtail                             | blue/green 스택 레이블링 필수        |
| Nginx                   | nginx_exporter              | 요청 수, 상태 코드 비율, 응답 시간, upstream 지연                                    | `/var/log/nginx/access.log`, `/var/log/nginx/error.log` | certbot 경로 제외 규칙 추가          |
| Spring Boot             | `/actuator/prometheus`      | 요청 지연(`http_server_requests_seconds`), 예외 카운트, 스레드 풀 상태, DB 커넥션 풀 | `backend/logs/*.log` → Promtail                         | 프로파일별 Tag(`activeProfile`) 추가 |
| MySQL                   | mysqld_exporter             | QPS, 커넥션 수, 복제 지연, Buffer Pool hit ratio                                     | `/var/log/mysql/mysql.log`, slow query log              | slow log는 별도 볼륨 마운트          |
| Nginx 프록시 대상(외부) | blackbox_exporter           | HTTP/SSL 가용성, 인증서 만료, DNS 지연                                               | 대상 로그 없음                                          | `/healthz`, `/api/health` 포함       |
| 애플리케이션 로그       | Loki(멀티 테넌트)           | N/A (로그 메트릭 변환 가능)                                                          | Promtail 파이프라인에서 파싱(JSON → Labels)             | 로그 데이터 보존 기간 정책 필요      |
| 알림 이벤트             | Alertmanager                | Alert firing/resolve 상태                                                            | Alertmanager 자체 로그                                  | Slack/Email history와 함께 보관      |

## 7. 운영 체크리스트

1. **배포 전**: Prometheus/Loki/Alertmanager 설정 파일에 민감 정보가 없는지 확인하고, 서버 `.env`에 SMTP/Slack 토큰을 추가합니다.
2. **배포 후**: `docker compose ps`로 컨테이너 상태를 확인하고, Grafana에서 Datasource(Prometheus, Loki)가 `Healthy` 상태인지 검사합니다.
3. **권한 관리**: Grafana 조직을 `Admin`, `Editor`, `Viewer` 역할로 분리하고, 운영자 외에는 편집 권한을 최소화합니다.
4. **백업**: Grafana 대시보드 JSON, Prometheus 룰, Alertmanager 설정 파일을 Git 및 원격 백업에 저장합니다.
5. **보존 정책**: Loki 저장소는 30일, Prometheus는 15일 보존을 기준으로 시작하고, 필요 시 Thanos 혹은 Object Storage 연계를 검토합니다.
6. **테스트**: 월 1회 이상 Slack/Webhook 알림 테스트와 Blackbox 타깃 장애 시나리오를 시뮬레이션합니다.

## 8. 향후 과제

- Prometheus Remote Write(예: VictoriaMetrics, Thanos) 연계로 장기 보관을 지원합니다.
- Grafana OnCall 또는 Alertmanager Webhook을 통한 자동화된 On-call 스케줄링을 검토합니다.
- 사용자 정의 Biz 메트릭(주문 수, API 사용량 등)을 Spring Boot 애플리케이션에 추가하고, 대시보드에 반영합니다.

위 설계를 기반으로 `infra/docker/monitoring` 구성 파일을 작성하고, CI/CD 파이프라인에서 모니터링 스택 배포 옵션을 추가하면 운영 환경에서 일관된 관찰 가능성을 확보할 수 있습니다.
