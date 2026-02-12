# Operations & Runbooks

이 문서는 Web Project 운영자가 알아야 할 수동 배포 절차, 롤백 방법, 일상 유지보수, 장애 대응 런북을 제공합니다. 아키텍처 구조, CI/CD 파이프라인, 보안 정책, 모니터링 상세는 각각 `architecture.md`, `pipelines.md`, `security.md`, `monitoring.md`를 참고하세요.

---

## 1. 운영 범위와 핵심 점검 항목

- **운영 대상**: `${HOME}/srv/web_project` 하위의 Application, Gateway, Monitoring, Infrastructure 스택
- **주요 산출물**: Blue-Green 배포 상태(`deploy-state.json`), `.env.*` 환경 파일, GHCR 컨테이너 이미지
- **핵심 체크**
  - `APP_NETWORK_NAME`(기본 `web_project_webnet`) 네트워크가 존재하고 모든 스택이 연결되어 있는가?
  - `.env` 파일이 최신 태그/비밀 값으로 갱신되어 있는가?
  - 관찰성 스택(Grafana/Prometheus/Loki)이 정상 동작하는가?
  - Slack/Email 알림 채널이 활성화되어 있는가?

운영팀은 아래 Runbook을 따라 수동 배포나 장애 대응을 수행하며, 구조나 파이프라인 변경 시 관련 문서를 반드시 함께 업데이트합니다.

---

## 2. 수동 Blue-Green 배포 Runbook

1. **환경 변수 로드**

   ```bash
   cd ~/srv/web_project
   set -a
   [ -f ./.env.server.prod ] && . ./.env.server.prod
   [ -f application/.env.application.prod ] && . application/.env.application.prod
   set +a
   ```

   필요 시 `FE_TAG`, `BE_TAG`, `UPDATE_GATEWAY`, `SERVER_ROOT`를 쉘에서 직접 덮어씁니다.

2. **준비 단계(prepare)**

   ```bash
   ./deploy-blue-green.sh --phase prepare
   ```

   - 새 색상의 Backend 컨테이너를 기동하고 헬스체크를 통과할 때까지 대기
   - Frontend dist를 `frontend-dist` 볼륨에 동기화

- Gateway·Monitoring이 공유하는 Nginx 로그 볼륨(`nginx-logs`)이 없으면 생성 (`NGINX_LOGS_MOUNT` 값이 경로라면 바인드 상태 확인)
- `gateway/nginx/.env.production`의 `NGINX_BACKEND_HOST`를 새 색상으로 갱신
- 이미지 풀을 생략하려면 `--skip-pull`, 특정 색상을 강제로 배포하려면 `--override-color blue|green`

3. **Gateway 적용**
   - 기본: GitHub Actions `deploy-gateway` 워크플로 실행 (입력 `pull_images=false` 가능)
   - 수동: `cd ~/srv/web_project/gateway && docker compose -f docker-compose.gateway.prod.yml --env-file .env.gateway.prod up -d`
   - 검증: `curl -fsSL https://<도메인>/api/actuator/health` 응답이 새 색상 컨테이너 로그에 기록되는지 확인

4. **마무리(finalize)**

   ```bash
   ./deploy-blue-green.sh --phase finalize
   ```

   - 이전 색상의 Backend를 중지/삭제하고, `deploy-state.json` 갱신
   - 실패 시 Gateway가 올바른 색상으로 전환됐는지 확인 후 재실행

5. **전체 자동화**
   ```bash
   ./deploy-blue-green.sh --phase full
   ```
   `UPDATE_GATEWAY=true`가 설정되어 있으면 Gateway 재배포까지 포함합니다.

---

## 3. 롤백 Runbook

### 3.1 현재 색상에서 이전 이미지로 롤백

1. 활성 색상 확인: `jq -r '.activeColor' deploy-state.json`
2. 복구할 태그 선택: GHCR에서 직전 성공 태그(`sha-<commit>`)
3. `.env.server.prod` 또는 `application/.env.application.prod`에 `FE_TAG`, `BE_TAG`를 설정
4. `./deploy-blue-green.sh --phase prepare --override-color <현재색상>` 실행
5. Gateway 변경 없이 `./deploy-blue-green.sh --phase finalize`로 dist/컨테이너만 교체

### 3.2 Gateway를 이전 색상으로 재전환

1. `gateway/nginx/.env.production`의 `NGINX_BACKEND_HOST`를 이전 색상(`backend-blue|green`)으로 수정
2. `docker compose -f gateway/docker-compose.gateway.prod.yml --env-file .env.gateway.prod up -d`
3. 필요 시 `./deploy-blue-green.sh --phase gateway --force-color <이전색상>`으로 즉시 전환
4. 새 색상 컨테이너는 `./deploy-blue-green.sh --phase cancel`로 정리

### 3.3 배포 중단 처리

- `prepare` 단계 실패 → 컨테이너/환경 변수 점검 후 재실행
- `finalize` 단계 실패 → Gateway 설정/헬스체크 확인 후 재실행
- 긴급 중단 → `./deploy-blue-green.sh --phase cancel`로 준비 단계에서 생성된 리소스 정리

---

## 4. 정기 유지보수 일정

| 주기    | 작업              | 세부 설명                                                                   |
| ------- | ----------------- | --------------------------------------------------------------------------- |
| 매일    | 관찰성 확인       | Grafana 홈 대시보드, Alertmanager Pending/Firing 상태, Loki 오류 로그 체크  |
| 주 1회  | Blue-Green 리허설 | `--phase prepare --skip-pull` 실행 후 Gateway 전환 없이 dist/헬스 체크 검증 |
| 주 1회  | 이미지/볼륨 정리  | `docker image prune -f`, `docker volume ls --filter dangling=true` 확인     |
| 월 1회  | Certbot Dry-run   | `gateway/certbot-issue.sh --base-dir ~/srv/web_project --dry-run` 실행      |
| 월 1회  | 알림 채널 점검    | Slack/Webhook/Email 테스트 Alert 발송                                       |
| 분기    | 비밀 회전         | `.env.*` 내 Slack/SMTP/API 토큰 교체, `security.md` 정책 준수               |
| 필요 시 | MySQL 백업        | `mysqldump --single-transaction`으로 백업 후 외부 저장                      |

모든 유지보수 스크립트는 실행 권한을 유지하고, 수행 결과를 운영 로그에 남겨 재현성을 확보합니다.

---

## 5. 장애 대응 런북

### 5.1 Backend 헬스체크 실패

- **징후**: `deploy-blue-green.sh` prepare 단계 타임아웃, Prometheus `spring-backend-bluegreen` 타깃 Down
- **진단**
  - `docker logs backend-<색상>`에서 예외 확인
  - `.env.application.prod`, `backend/.env.production` 변수 검증
  - `docker exec backend-<색상> mysqladmin ping`으로 DB 연결 확인
- **조치**
  1. 환경 변수 수정 후 `docker compose -f application/docker-compose.application.prod.yml up -d backend-<색상>`
  2. 문제 이미지면 이전 태그로 롤백 (3.1 Runbook)
  3. 재시도 전 `deploy-state.json`을 확인하여 상태를 일치시킴

### 5.2 Gateway 502/504 또는 색상 오인식

- **징후**: Gateway 재배포 후에도 이전 버전 노출, 502 오류
- **진단**
  - `gateway/nginx/.env.production`의 `NGINX_BACKEND_HOST` 확인
  - `docker compose logs nginx`에서 upstream 연결 오류 확인
  - Prometheus `nginx` 지표에서 upstream 실패 비율 점검
- **조치**
  1. 올바른 색상으로 `.env.production` 수정 후 Gateway 재기동
  2. 필요 시 `--force-color` 옵션으로 Gateway 즉시 재전환
  3. 백엔드 컨테이너 헬스 상태를 재확인 (5.1 참조)

### 5.3 MySQL 연결 장애

- **징후**: Backend 로그의 `Communications link failure`, mysqld exporter Down
- **진단**
  - `docker compose -f infrastructure/docker-compose.infrastructure.prod.yml ps`
  - `df -h | grep mysql`로 볼륨 용량 확인
  - MySQL 에러 로그: `tail -n 200 ~/srv/web_project/infrastructure/mysql/data/*.err`
- **조치**
  1. MySQL 컨테이너 재기동 및 헬스 확인
  2. 용량 부족 시 불필요한 로그 정리 또는 스토리지 확장
  3. 필요 시 ReadOnly 모드로 전환하고 데이터 복구 절차 수행

### 5.4 모니터링 스택 다운

- **징후**: Grafana 접속 불가, Alertmanager 미작동, Prometheus Target 일괄 Down
- **진단**
  - `docker compose -f monitoring/docker-compose.monitoring.prod.yml ps`
  - Grafana/Prometheus/Alertmanager 로그 확인
  - `APP_NETWORK_NAME` 값이 애플리케이션과 일치하는지 검증
- **조치**
  1. `.env.monitoring.prod` 변수 확인 후 스택 재기동
  2. 저장소 용량 문제 해결 (Loki/Prometheus 데이터 경로 정리)
  3. 임시로 SSH 포트포워딩을 사용해 내부 대시보드를 직접 확인

### 5.5 인증서 만료 경보

- **징후**: Alertmanager Slack 알림 `Certificate expiring soon`
- **진단**
  - `openssl x509 -in gateway/letsencrypt/etc/live/<도메인>/cert.pem -noout -enddate`
  - `gateway/letsencrypt/log/letsencrypt.log` 확인
- **조치**
  1. `gateway/certbot-issue.sh --base-dir ~/srv/web_project -d <도메인> -e <이메일>` 실행
  2. 완료 후 Nginx 재기동 (`docker compose ... up -d`)
  3. Alertmanager에서 경보 해제 여부 확인

---

## 6. 환경 및 구성 관리

- **환경 파일 위치**
  - `.env.server.prod`: 공통 네트워크, 이미지 태그, Gateway 업데이트 플래그
  - `application/.env.application.prod`: Application 레이어 공통 설정
  - `application/backend/.env.production`: Backend 비밀/런타임 설정
  - `gateway/.env.gateway.prod`, `gateway/nginx/.env.production`: Nginx 라우팅/인증 설정
  - `monitoring/.env.monitoring.prod`: Slack/SMTP/Exporter 자격 증명
- **변경 절차**
  1. 변경 사항은 로컬에서 `diff` 확인 후 Secrets 저장소 또는 암호화 저장소에 기록
  2. 서버 반영 전 `deploy-blue-green.sh --phase prepare --skip-pull`로 사전 검증
  3. 네트워크 이름을 수정한 경우 모든 Compose/스크립트를 동기화한 뒤 네트워크 재생성
- **태그 관리**
  - GHCR에서 `latest`, `sha-<commit>` 태그가 모두 존재하는지 확인
  - 롤백 대비를 위해 최소 3개 버전의 태그를 유지합니다.

---

## 7. 배포 전·후 체크리스트

### 7.1 배포 전

- [ ] `.env.server.prod`에 적용할 이미지 태그 및 `UPDATE_GATEWAY` 값이 올바른가?
- [ ] `deploy-state.json`의 `activeColor`가 예상과 일치하는가?
- [ ] MySQL exporter 계정, Nginx `stub_status`, 슬랙/SMTP 비밀이 유효한가?
- [ ] Grafana에서 준비된 대시보드/알림이 비활성화되지 않았는가?

### 7.2 배포 후

- [ ] Grafana 대시보드에서 새 버전 지표가 정상 표기되는가?
- [ ] Prometheus `spring-backend-bluegreen` 타깃이 대기색 제외 `up` 상태인가?
- [ ] Alertmanager에 새로운 Firing 경보가 없는가?
- [ ] Gateway Access 로그에 새 색상 서비스 이름(`compose_service`)이 기록되는가?
- [ ] `./deploy-blue-green.sh --phase finalize`가 성공적으로 완료되었는가?

---

## 8. 추가 참고 자료

- Blue-Green 스크립트 상세 옵션: `infra/deploy-blue-green.sh --help`
- 파이프라인 입력값과 실패 시 재시도 정책: `docs/pipelines.md`
- 비밀 관리 및 권한 정책: `docs/security.md`
- 관찰성 구성 및 대시보드 관리: `docs/monitoring.md`
- 인프라 구조 및 네트워크 설계: `docs/architecture.md`

운영 과정에서 새 시나리오가 발견되면 본 문서에 런북을 추가하여 지식 베이스를 최신 상태로 유지하세요.

- DB 마이그레이션이 필요한 경우 스크립트 실행 전에 수행하거나 Liquibase/Flyway를 사용해 양쪽 색상에서 호환되는 스키마를 유지합니다.
