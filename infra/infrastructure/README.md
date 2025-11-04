# Infrastructure Layer

## 1. 개요

Infrastructure 레이어는 데이터베이스와 같은 상태를 가진 영속성 서비스를 관리합니다. 해당 스택의 Compose 및 설정은 `infra/infrastructure/**`를 기준으로 관리됩니다.

## 2. 아키텍처

이 레이어의 서비스들은:

- 초기 배포 후 거의 변경되지 않음
- 데이터 영속성이 핵심
- 재시작 시 서비스 중단 발생
- 독립적으로 관리되어야 함

## 3. 디렉토리 구조

```
infra/infrastructure/
├── .env.infrastructure.example              # 공통 환경 변수 예시 파일
├── docker-compose.infrastructure.dev.yml    # 개발용 Compose
├── docker-compose.infrastructure.prod.yml   # 프로덕션용 Compose
├── mysql/
│   ├── my.cnf                               # MySQL 설정
│   └── init-templates/                      # 초기화 SQL 예시(필요 시 복사하여 사용)
└── README.md                                # 이 문서
```

## 4. 실행 방법

### 4.1. 개발 환경

**Infrastructure 시작 (가장 먼저):**

```bash
# Infrastructure 먼저 시작 (네트워크 생성)
pnpm docker:infrastructure:dev:up

# 이후 나머지 레이어 시작
pnpm docker:application:dev:up
pnpm docker:monitoring:dev:up
pnpm docker:gateway:dev:up

# 또는 한 번에 실행
pnpm docker:all:dev:up
```

**Infrastructure 중지:**

```bash
# 한 번에 중지
pnpm docker:all:dev:down

# 또는 실행 순서의 역순으로 중지
pnpm docker:gateway:dev:down
pnpm docker:monitoring:dev:down
pnpm docker:application:dev:down
pnpm docker:infrastructure:dev:down
```

**주의**: Infrastructure를 중지하면 Application이 DB에 연결할 수 없게 됩니다.

### 4.2. 프로덕션 환경

GitHub Actions `deploy-infrastructure.yml` 워크플로우가 `.env.infrastructure.prod`와 루트 `.env.server.prod`를 병합하여 Compose를 실행합니다. 초기 구축 이후에는 변경이 있을 때만 수동 실행이 필요합니다.

**수동 배포 (최초 또는 설정 변경 시):**

```bash
# 서버에서 실행 (프로젝트 루트 기준)
cd ~/srv/web_project

# 환경 변수 설정 (반드시 필요)
# infrastructure/.env.infrastructure.prod 파일에 DB 비밀번호/데이터 경로 등 설정

# Infrastructure 배포 (루트 env와 함께 실행)
node ./scripts/compose-with-env.mjs \
  --env ./.env.server.prod \
  --env ./infrastructure/.env.infrastructure.prod \
  -- docker compose -f infrastructure/docker-compose.infrastructure.prod.yml up -d

# 헬스 체크 확인
docker compose -f infrastructure/docker-compose.infrastructure.prod.yml ps
docker compose -f infrastructure/docker-compose.infrastructure.prod.yml logs mysql
```

**이후에는 건드리지 않음!** Application, Monitoring, Gateway만 배포합니다.

## 5. 네트워크 구성

Infrastructure가 생성하는 외부 브리짓 네트워크는 다른 모든 레이어가 공유합니다.

- **개발 환경**: `web_project_webnet-dev` (기본값)
- **프로덕션 환경**: `web_project_webnet` (기본값)

네트워크 이름은 `infra/.env.server.*`의 `APP_NETWORK_NAME`으로 관리되며, 필요 시 `pnpm docker:network:dev:create` 또는 위 배포 스크립트가 자동 생성합니다.

## 6. 볼륨 관리

### 6.1. 개발 환경

```bash
# 볼륨 확인
docker volume ls | grep mysql

# 볼륨 백업 (선택사항)
docker run --rm \
  -v web_project-dev-mysql-data:/data \
  -v "$(pwd)"/backup:/backup \
  alpine tar czf /backup/mysql-backup.tar.gz -C /data .
```

### 6.2. 프로덕션 환경

**권장**: 호스트 바인드 마운트 사용

`.env.infrastructure.prod` 예시:

```env
MYSQL_DATA_MOUNT=/home/user/srv/web_project/mysql/data
# 선택: 초기화 SQL 디렉터리(없으면 컨테이너 기본값 미사용)
# MYSQL_INIT_MOUNT=/home/user/srv/web_project/mysql/init

# 공개 포트 조정(기본 3306)
# MYSQL_PORT=3306
```

이렇게 하면:

- 백업 용이
- 마이그레이션 간편
- 볼륨 관리 명확

## 7. 환경 변수 설정

`.env.infrastructure.example`을 복사해 사용하세요:

```bash
cp infra/infrastructure/.env.infrastructure.example infra/infrastructure/.env.infrastructure.prod
```

주요 변수 설명(일부는 기본값 존재):

- MYSQL_ROOT_PASSWORD: 루트 비밀번호 (prod 필수)
- MYSQL_PASSWORD: 애플리케이션용 사용자 비밀번호 (prod 필수)
- MYSQL_DATABASE: 초기 생성 DB명 (기본 appdb)
- MYSQL_USER: 애플리케이션 사용자명 (기본 app)
- MYSQL_DATA_MOUNT: 데이터 디렉터리. 절대 경로로 설정 시 bind mount, 미설정 시 named volume 사용
- MYSQL_INIT_MOUNT: 초기화 SQL 디렉터리 경로. 설정 시 해당 디렉터리의 .sql이 최초 1회 실행됨
- MYSQL_PORT: 호스트 포트 바인딩(기본 3306)
- DB_TAG: MySQL 이미지 태그(기본 8.4)
- APP_NETWORK_NAME: 외부 브릿지 네트워크명 (기본 dev/prod에 맞게 자동 값)

## 8. MySQL 설정

### 8.1. 초기화 스크립트

컨테이너의 `/docker-entrypoint-initdb.d`에 마운트된 디렉터리 내 `.sql` 파일은 최초 실행 시 자동으로 실행됩니다. 기본값은 `${MYSQL_INIT_MOUNT:-./mysql/init}`이며, 예시 템플릿은 `infra/infrastructure/mysql/init-templates/`에 제공됩니다. 필요 시 복사하여 경로에 배치하세요.

```sql
-- init/01-schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL
);

-- init/02-data.sql
INSERT INTO users (username) VALUES ('admin');
```

## 9. 백업 및 복구

### 9.1. 백업

```bash
# 자동 백업 스크립트 (서버에서 실행)
docker compose -f docker-compose.infrastructure.prod.yml exec mysql \
  sh -lc 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases' \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

### 9.2. 복구

```bash
# 백업에서 복구 (서버에서 실행)
docker compose -f docker-compose.infrastructure.prod.yml exec -T mysql \
  sh -lc 'mysql -u root -p"$MYSQL_ROOT_PASSWORD"' \
  < backup-20250127-120000.sql
```

## 10. 업그레이드

DB 버전 업그레이드가 필요한 경우 (매우 드묾):

```bash
# 1. 백업
docker compose -f docker-compose.infrastructure.prod.yml exec mysql \
  mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases > backup.sql

# 2. .env에서 DB_TAG 변경
# DB_TAG=8.4 → DB_TAG=9.0

# 3. 이미지 pull
docker compose -f docker-compose.infrastructure.prod.yml pull

# 4. 재시작 (다운타임 발생!)
docker compose -f docker-compose.infrastructure.prod.yml up -d

# 5. 로그 확인
docker compose -f docker-compose.infrastructure.prod.yml logs -f mysql
```

## 11. 트러블슈팅

### 11.1. MySQL 연결 안 됨

```bash
# 헬스 체크 확인
docker compose -f docker-compose.infrastructure.prod.yml ps

# 로그 확인
docker compose -f docker-compose.infrastructure.prod.yml logs mysql

# 네트워크 확인
docker network inspect web_project_webnet
```

### 11.2. 데이터 초기화 (주의!)

```bash
# 개발 환경에서만!
docker compose -f docker-compose.infrastructure.dev.yml down -v
docker volume rm web_project-dev-mysql-data
docker compose -f docker-compose.infrastructure.dev.yml up -d
```

**프로덕션에서는 절대 하지 마세요!**

## 12. 모니터링

Prometheus/Grafana에서 MySQL 메트릭 수집:

- 연결 수
- 쿼리 성능
- 디스크 사용량
- 복제 상태 (향후)

자세한 내용은 [`../monitoring/README.md`](../monitoring/README.md) 참고.

## 13. 참고

- [Architecture](../../docs/architecture.md)
- [Operations](../../docs/operations.md)
- [MySQL 공식 문서](https://dev.mysql.com/doc/)
