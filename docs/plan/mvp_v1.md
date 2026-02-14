# 1차 MVP 정의서

본 문서는 [docs/planning.md](docs/planning.md)의 전체 기획을 기준으로, 현재 프로젝트 상태(Frontend: React/Vite 초기 화면, Backend: Spring Boot + DB 헬스 체크)에서 1차 공개 가능한 MVP 범위를 정의한다. 범위는 Frontend/Backend에 한정하며 Infra 항목은 제외한다.

---

# 1. MVP 범위 요약

## 포함 도메인

- Portfolio
- Blog
- Shared / Core

## 제외 도메인

- CS Docs
- Mini Games

## MVP 목표 정의

- 포트폴리오와 블로그의 핵심 탐색/열람 흐름을 제공한다.
- 공개 가능한 품질의 정보 구조와 UI 레이아웃을 확정한다.
- 도메인 모델과 API 인터페이스를 확정해, 이후 확장이 가능한 기반을 만든다.
- 시스템 완성도가 아니라 "서비스 설득력"을 검증하는 MVP로 설계한다.

## 전략적 아이덴티티

- 일반 블로그가 아닌 "문제-해결 중심의 설계 기록"과 "구조화된 성과 증명"을 전면에 둔다.
- Portfolio는 구조화된 경험/결정/성과 블록으로 설계 사고를 보여 주고, Blog는 자유 서술로 사고 확장을 담는다.
- 최소 페이지 수로도 "구조적 사고 + 실행 결과"를 설득력 있게 증명하는 포트폴리오 완성도를 목표로 한다.

## 완료 정의 (Definition of Done)

- 공통 레이아웃/네비게이션/푸터의 디자인이 확정되고 적용된다.
- Portfolio 목록/상세와 Blog 목록/상세가 동작한다.
- Frontend/Backend 아키텍처와 디렉터리 구조가 확정된다.
- 도메인 모델과 최소 CRUD 읽기 API가 구현되어, 실제 데이터로 화면이 렌더링된다.
- 문서화된 API 명세와 샘플 데이터가 존재한다.
- 최소 2개 이상의 완성된 Portfolio 프로젝트가 게시된다.
- 최소 3개 이상의 Blog 글이 게시된다.
- 각 Portfolio에 정량 지표 1개 이상이 포함된다.
- 페이지별 SEO 메타가 적용된다.

---

# 2. 제외 기능 목록

- CS Docs 최소 포함: 완전 제외 유지
  - 근거: 핵심 차별성은 Portfolio/Blog의 구조화에 있으며, CS Docs는 그래프/관계 설계 없이도 설득력 검증에 직접 기여하지 않음
  - 최소 문서 1개조차 작성 기준/검수 비용이 크고 범위를 분산시킴
- CS Docs 그래프 탐색 UI: 그래프 렌더링/관계 모델링 복잡도 높음, MVP 범위 초과
- Mini Games 플레이 UI 및 게임 로직: 구현 난이도와 QA 비용이 높음, MVP 범위 초과
- 관리자(Admin) 콘텐츠 편집 UI: 공개 MVP에서는 읽기 전용으로 운영
- 인증/권한/댓글/좋아요: 핵심 도메인 구조 노출 우선, 확장 단계로 이관
- 검색/필터 고도화(태그 복합 검색 등): 기본 목록 탐색만 제공
- 다국어/다크모드/테마 커스터마이징: UI 확장 항목으로 이관

---

# 3. 도메인 별 백로그

## Portfolio

### P0 (필수)

- [ ] Task ID: PORT-001
  - 유형: Design
  - 작업 설명: 포트폴리오 목록/상세 페이지 정보 구조 확정(카드 구성 요소 및 상세 섹션 순서 고정)
  - 산출물: 와이어프레임 수준의 페이지 구조 문서, 섹션/필드 목록
  - 선행 조건: 없음

- [ ] Task ID: PORT-002
  - 유형: Domain Model
  - 작업 설명: `PortfolioProject` 모델을 구조화 블록 중심으로 정의
    - 핵심 경험 배열(최소 3개)
    - 경험 블록 구조: 문제/선택지/판단 기준/최종 선택/결과(정량 지표)/배운 점
    - 성과/지표 블록 분리
    - 설계 결정 블록 분리
  - 산출물: 도메인 모델 스키마(필드, 타입, 제약, 최소 개수 규칙)
  - 선행 조건: PORT-001

- [ ] Task ID: PORT-003
  - 유형: API
  - 작업 설명: Portfolio 목록/상세 조회 API 설계 및 명세 작성(구조화 블록 포함)
  - 산출물: API 스펙(엔드포인트, 요청/응답 스키마, 예시)
  - 선행 조건: PORT-002

- [ ] Task ID: PORT-004
  - 유형: UI Component
  - 작업 설명: Portfolio 카드/상세 섹션 컴포넌트 설계 및 구현
  - 산출물: `PortfolioCard`, `ProjectOverview`, `ProjectExperienceList` 컴포넌트
  - 선행 조건: PORT-001

### P1 (있으면 좋음)

- [ ] Task ID: PORT-101
  - 유형: API
  - 작업 설명: 태그 기반 기본 필터(1개 태그) 조회 API
  - 산출물: `/api/portfolio?tag=...` 응답 스펙
  - 선행 조건: PORT-003

### P2 (확장 영역)

- [ ] Task ID: PORT-201
  - 유형: UI Component
  - 작업 설명: 성과 수치 시각화(간단한 지표 카드/바 차트)
  - 산출물: `MetricCard`, `MetricBar` 컴포넌트
  - 선행 조건: PORT-004

## Blog

### P0 (필수)

- [ ] Task ID: BLOG-001
  - 유형: Design
  - 작업 설명: 블로그 목록/상세 페이지 구조 확정(카테고리/태그 표기 규칙 포함)
  - 산출물: 페이지 섹션 정의, 목록 카드/상세 템플릿
  - 선행 조건: 없음

- [ ] Task ID: BLOG-002
  - 유형: Domain Model
  - 작업 설명: `BlogPost`, `BlogCategory`, `BlogTag` 모델 정의(마크다운 본문 중심)
  - 산출물: 도메인 모델 스키마 및 관계 정의
  - 선행 조건: BLOG-001

- [ ] Task ID: BLOG-003
  - 유형: API
  - 작업 설명: Blog 목록/상세 조회 API 설계 및 명세 작성
  - 산출물: `/api/blog/posts`, `/api/blog/posts/{id}` 스펙
  - 선행 조건: BLOG-002

- [ ] Task ID: BLOG-004
  - 유형: UI Component
  - 작업 설명: Blog 카드/상세 본문 렌더러(마크다운 기반) 구현
  - 산출물: `BlogCard`, `MarkdownRenderer` 컴포넌트
  - 선행 조건: BLOG-001

### P1 (있으면 좋음)

- [ ] Task ID: BLOG-101
  - 유형: API
  - 작업 설명: 카테고리 단일 필터 조회 API
  - 산출물: `/api/blog/posts?category=...` 스펙
  - 선행 조건: BLOG-003

### P2 (확장 영역)

- [ ] Task ID: BLOG-201
  - 유형: Design
  - 작업 설명: 글 시리즈/연재 개념 도입(묶음 탐색 UX)
  - 산출물: 시리즈 메타데이터 설계 문서
  - 선행 조건: BLOG-001

## Shared / Core

### P0 (필수)

- [ ] Task ID: CORE-001
  - 유형: FE Architecture
  - 작업 설명: Frontend 디렉터리 구조 확정 및 라우팅 설계
  - 산출물: 라우팅 맵, `features/`, `shared/`, `pages/` 구조 정의
  - 선행 조건: 없음

- [ ] Task ID: CORE-002
  - 유형: BE Architecture
  - 작업 설명: Backend 계층 구조 및 패키지 규칙 확정(Controller/Service/Repository)
  - 산출물: 패키지 구조 문서, 기본 템플릿 코드
  - 선행 조건: 없음

- [ ] Task ID: CORE-003
  - 유형: API
  - 작업 설명: 공통 응답 포맷(에러/페이지네이션 포함) 정의
  - 산출물: API 응답 규격 문서, 예시 JSON
  - 선행 조건: CORE-002

- [ ] Task ID: CORE-004
  - 유형: Domain Model
  - 작업 설명: 공통 메타데이터 모델 정의(SEO, 작성/수정 시간)
  - 산출물: `SeoMetadata`, `AuditInfo` 모델 스키마
  - 선행 조건: 없음

- [ ] Task ID: CORE-005
  - 유형: UI Component
  - 작업 설명: 공통 레이아웃/네비게이션/푸터/타이포 시스템 구축
  - 산출물: `AppLayout`, `Header`, `Footer`, `Typography` 컴포넌트
  - 선행 조건: CORE-001

- [ ] Task ID: CORE-006
  - 유형: FE Architecture
  - 작업 설명: SEO 메타 전략 적용(페이지별 메타, OpenGraph 기본 구조, canonical 정책)
  - 산출물: 메타 전략 문서, 메타 적용 가이드
  - 선행 조건: CORE-001

### P1 (있으면 좋음)

- [ ] Task ID: CORE-101
  - 유형: FE Architecture
  - 작업 설명: 공통 데이터 페칭 유틸(에러 핸들링/로딩 상태 표준화)
  - 산출물: `apiClient`, `useAsync` 훅
  - 선행 조건: CORE-001

### P2 (확장 영역)

- [ ] Task ID: CORE-201
  - 유형: UI Component
  - 작업 설명: 접근성 강화(키보드 포커스, 스킵 링크, ARIA)
  - 산출물: 접근성 체크리스트 및 적용 내역
  - 선행 조건: CORE-005

---

# 4. 공통 아키텍처 결정

## Frontend 구조 개요

- 기술: React + TypeScript + Vite
- 구조: `pages/`, `features/`, `shared/`, `assets/` 중심의 feature-first
- 라우팅: `react-router` 기반, 도메인 별 라우트 그룹화
- 스타일: 도메인 별 레이아웃 컴포넌트로 일관성 확보

## Backend 구조 개요

- 기술: Spring Boot + JDBC/JPA + MySQL
- 계층: Controller → Service → Repository
- API prefix: `/api`
- 읽기 전용 API 우선(작성 기능은 확장 단계)

## 데이터 흐름 개요

- FE: 페이지 진입 → API 호출 → 도메인 모델 매핑 → UI 렌더링
- BE: 요청 수신 → 서비스에서 조회 → DTO 변환 → JSON 응답

## 상태 관리 전략

- 전역 상태 라이브러리 없이 로컬 상태와 Context 최소 사용
- 서버 상태는 단순 fetch 래퍼로 관리, 캐싱은 P1에서 고려

## 공통 컴포넌트 전략

- 레이아웃/타이포/카드/버튼은 `shared/ui`로 분리
- 도메인 전용 컴포넌트는 `features/{domain}`에 위치

## SEO 전략

- 페이지별 메타: 목록은 도메인 요약 중심, 상세는 콘텐츠 요약 + 핵심 키워드
- OpenGraph 기본 구조: title/description/image/type/url 고정 템플릿
- canonical 정책: 동일 콘텐츠는 단일 canonical URL로 고정
- sitemap은 MVP 범위에서 제외 가능

---

# 5. 리스크 및 단순화 전략

## 복잡도 제거 전략

- 읽기 전용 MVP로 범위를 고정하여 관리자/편집 기능 제외
- 도메인별 최소 페이지(목록/상세)만 제공
- CS Docs/미니게임은 구조 설계만 남기고 구현 제외

## 기술적 리스크

- DB 스키마 변경 시 도메인 모델/DTO 동기화 필요
- 마크다운 렌더링 시 XSS/보안 처리 필요

## 설계 상 타협 지점

- 검색/필터 고도화는 P1 이후로 미룸
- 그래프 기반 CS Docs는 MVP 범위에서 제외
- 데이터 캐싱/페이징 고도화는 P1에서 검토

---

# 부록: MVP API 인터페이스 (초안)

## Portfolio

- GET /api/portfolio
  - 설명: 포트폴리오 목록 조회
  - 응답: `PortfolioSummary[]`

- GET /api/portfolio/{id}
  - 설명: 포트폴리오 상세 조회
  - 응답: `PortfolioDetail` (experiences[], metrics[], designDecisions[] 포함)

## Blog

- GET /api/blog/posts
  - 설명: 블로그 글 목록 조회
  - 응답: `BlogPostSummary[]`

- GET /api/blog/posts/{id}
  - 설명: 블로그 글 상세 조회
  - 응답: `BlogPostDetail` (markdown 본문 포함)

## 공통 응답

- 성공: `{ "data": ..., "meta": { "requestId": "..." } }`
- 실패: `{ "error": { "code": "...", "message": "..." } }`
