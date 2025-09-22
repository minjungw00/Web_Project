## Docker Compose UID/GID

도커 컴포즈를 실행하기 전에 아래 환경 변수를 설정하면 컨테이너 내부 사용자 ID가 호스트 사용자와 일치하여 프런트엔드 `dist`, 백엔드 `logs`/`build` 등의 산출물을 현재 사용자가 직접 관리할 수 있습니다.

```bash
export LOCAL_UID=$(id -u)
export LOCAL_GID=$(id -g)
```

필요한 호스트 디렉터리(`~/srv/web_project/...`)는 선행 생성해 두면 권한 충돌 없이 바로 사용할 수 있습니다.

기존에 루트 소유의 `frontend/.pnpm-store` 폴더가 남아 있다면 한 번 삭제하거나 현재 사용자로 소유권을 변경한 뒤 다시 `docker compose`를 실행하세요.

`pnpm-lock.yaml`이 비어 있거나 손상되어 있을 경우 컨테이너에서 의존성 설치가 실패하므로, 빈 파일이 있다면 삭제하거나 로컬에서 `pnpm install --lockfile-only`를 다시 실행해 정상적인 lockfile을 준비한 상태에서 이미지를 빌드하세요.
