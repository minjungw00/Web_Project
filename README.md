# Web_Project

## 프로젝트 개요

개인 포트폴리오, 기술 블로그, CS 지식 베이스, 미니 게임을 하나의 서비스로 제공하는 개인 웹 프로젝트입니다. 로컬 서버를 직접 구축하고 Blue-Green 배포와 관찰성까지 포함한 운영 경험을 축적하는 것을 목표로 합니다.

## 배포 링크

https://www.minjungw00.com

## 주요 기능

- 포트폴리오 전시 및 프로젝트 상세 기록
- 기술 블로그와 학습 기록 아카이브
- 그래프 기반 CS Docs 지식 탐색
- 실험적인 미니 게임/구현 결과물 허브

## 기술 스택

- Frontend: TypeScript, React, Vite
- Backend: Java 21, Spring Boot
- Infra: Docker Compose, Nginx, MySQL, Prometheus/Grafana/Loki

## 아키텍처 설명

이 프로젝트는 4-Tier 레이어를 기반으로 구성됩니다.

- Infrastructure: MySQL과 공용 네트워크, 초기 스키마 구성
- Application: Frontend 정적 아티팩트와 Backend API
- Monitoring: Prometheus/Grafana/Loki/Alertmanager 관찰성 스택
- Gateway: Nginx 단일 진입점, SSL/TLS 종료 및 라우팅

배포는 Blue-Green 방식으로 진행되며, `prepare → gateway → finalize` 단계로 안전하게 트래픽을 전환하고 롤백 가능성을 유지합니다. 자세한 내용은 [docs/infra/architecture.md](docs/infra/architecture.md)를 참고하세요.

## 로컬 실행 방법 (간단하게)

### 프론트엔드/백엔드 개별 실행

```bash
pnpm install
pnpm dev:frontend
# 새 터미널에서
pnpm dev:backend
```

### 도커 기반 전체 스택 실행

```bash
pnpm install
pnpm run docker:all:dev:up
# 종료 시
pnpm run docker:all:dev:down
```

## 로컬 서버 스펙

- CPU : Intel N100 (4C 4T, 6M cache, 1.0/3.4 GHz)
- RAM : DDR4-3200 8GB
- SSD : M.2 NVMe PCle Gen3 256GB
- Network : about 100Mbps
- OS : Ubuntu 24.04
