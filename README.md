# Web_Project

## Info

[https://www.minjungw00.com](https://www.minjungw00.com)

개인 포트폴리오 및 블로그를 포스트하는 개인 웹 사이트 서비스

로컬 서버를 직접 구축하면서 웹 서비스 개발의 전반을 학습하고 나아가 실제 서비스를 운영하는 것을 목표로 이 프로젝트를 진행한다.

## Content

- 개인 포트폴리오
- CS 노트
- 기술 블로그
- 웹 게임(Unity WebGL 별도 구축 예정)

## Tech Stack

### Frontend

- Typescript
- React

### Backend

- Java
- Spring

### Infra

- Nginx
- Docker

## Local development helpers

Docker 개발 스택을 사용할 때는 로컬 계정의 UID/GID를 컨테이너에 전달해야 권한 문제가 발생하지 않습니다. 아래 스크립트로 환경 파일을 생성한 뒤 Compose 명령을 실행하세요.

```bash
pnpm run setup:dev-env
pnpm run docker:dev:up
# 작업 종료 시
pnpm run docker:dev:down
```

`setup:dev-env` 스크립트는 `infra/application/.env.local` 파일에 `LOCAL_UID`와 `LOCAL_GID` 값을 기록하며, `docker:dev:up`/`docker:dev:down`은 해당 값을 자동으로 Compose에 넘깁니다.

## Server Spec

- CPU : Intel N100 (4C 4T, 6M cache, 1.0/3.4 GHz)
- RAM : DDR4-3200 8GB
- SSD : M.2 NVMe PCle Gen3 256GB
- Network : 100Mbps
- OS : Ubuntu 24.04
