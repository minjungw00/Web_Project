# Frontend Architecture

## 1. 목표와 범위

- MVP 핵심 범위는 Portfolio/Blog/Shared(Core)이며, 현재 구현에는 CS Docs/Mini Games 라우트가 샌드박스 성격으로 포함된다.
- 읽기 전용 UI와 목록/상세 탐색이 완성 기준이다.
- FE 디렉터리 구조, 라우팅, 데이터 흐름, SEO 메타 전략을 명시한다.
- 현재 기술 스택: React 19 + Vite + TypeScript + Vitest/RTL, `/api` 프록시 기반 통신.

## 2. 현재 FE 상태 요약 (2026-02-23 기준)

- 엔트리: [frontend/src/main.tsx](frontend/src/main.tsx)
- 루트 컴포넌트: [frontend/src/app/App.tsx](frontend/src/app/App.tsx)
- `/api` 프록시: [frontend/vite.config.ts](frontend/vite.config.ts)
- 라우팅은 `app/routes.tsx` 단일 진입으로 관리되며 Home/Portfolio/Blog/CS Docs/Mini Games를 포함한다.
- `application`/`entities`/`shared/api` 계층이 생성되어 페이지 내 도메인 상수·필터 로직을 분리했다.
- 공통 페이지 스타일은 [frontend/src/shared/styles/page.css](frontend/src/shared/styles/page.css)로 이동했다.
- 테스트 설정: [frontend/src/test/setupTests.ts](frontend/src/test/setupTests.ts)

## 3. 아키텍처 설계 전략

### 3.1 전략 요약

- MVP를 빠르게 완성하되, 확장 시 리팩터링 비용이 적은 구조를 우선한다.
- 도메인(Portfolio/Blog)별로 기능을 분리하고, 공통 요소는 `shared`로 수렴한다.
- 라우팅/SEO/에러 처리/데이터 패칭을 단일 진입점(`app`)에서 일관되게 관리한다.
- 테스트 가능한 단위로 컴포넌트를 분리하고, 외부 의존성은 경계(`shared/api`)로 고정한다.

### 3.2 구조적 리스크 진단 (개정 근거)

- `features/*/usecases.ts`가 유스케이스/오케스트레이션/매핑/뷰모델을 동시에 담당할 가능성이 있다.
- `zod.strict()` 기반의 단일 검증 정책은 BE 필드 추가에도 FE 런타임 실패를 유발한다.

### 3.3 채택한 아키텍처 패턴

- **Feature-First + Layered 구조**를 채택한다.
  - `app` → 전역 설정, 라우팅, Provider, 글로벌 스타일
  - `pages` → 라우트 단위 화면(데이터 조회/조합, 화면 상태 제어)
  - `application` → 유스케이스 오케스트레이션(도메인 중심)
  - `features` → 도메인 기능 UI(표현 계층)
  - `entities` → 도메인 모델/런타임 검증/변환 로직
  - `shared` → UI/유틸/API/설정/스타일(도메인 비의존)

#### 채택 이유

- MVP 범위가 도메인 중심이며(Portfolio/Blog), 기능 단위 개발/테스트가 중요하다.
- 공통 레이아웃/SEO/데이터 패칭을 재사용해야 한다.
- 단일 `App.tsx`에 로직이 집중되는 것을 방지한다.
- `CORE-001`(라우팅 및 구조 확정)과 정합성이 높다.
- 도메인 경계가 명확하여 CS Docs / Mini Games 확장이 가능하다.

### 3.4 계층 경계 및 의존성 규칙 (강제 기준)

#### 허용 의존 방향

`app` → `pages` → (`application`, `features`) → `entities` → `shared`

#### 금지 규칙

- `shared`는 상위 계층을 절대 import 하지 않는다.
- `entities`는 `features`/`pages`/`app`에 의존하지 않는다.
- `features`는 `pages`/`application`을 참조하지 않는다.
- `application`은 `features`/`pages`를 참조하지 않는다.
- `pages`는 `app` 내부 구현을 참조하지 않는다.

#### 구조적 강제 방식

- 라우트/페이지 경계는 디렉터리로 강제한다. (`pages/*`만 라우트)
- 도메인 모델과 DTO 변환은 `entities/*`에서만 수행한다.
- 상호 참조가 필요한 경우 `shared/lib`에 공통 로직을 이동한다.
- 코드리뷰 체크리스트에 의존성 방향 위반을 포함한다.

#### ESLint 기반 구조 강제 (필수)

`frontend/eslint.config.user.js`에 아래 규칙을 **반드시** 추가한다.

```
{
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'import-x/no-relative-parent-imports': 'error',
    'import-x/no-restricted-paths': [
      'error',
      {
        zones: [
          { target: './src/app', from: ['./src/pages', './src/application', './src/features', './src/entities', './src/shared'] },
          { target: './src/pages', from: ['./src/app'] },
          { target: './src/application', from: ['./src/app', './src/features'] },
          { target: './src/features', from: ['./src/app', './src/application'] },
          { target: './src/entities', from: ['./src/app', './src/pages', './src/application', './src/features'] },
          { target: './src/shared', from: ['./src/app', './src/pages', './src/application', './src/features', './src/entities'] }
        ]
      }
    ]
  }
}
```

#### import 규칙 (필수)

- 모든 import는 `@/` 절대 경로를 사용한다. (`../..` 금지)
- 동일 디렉터리 내부에서는 `./`만 허용한다.
- `@/shared`는 도메인 비의존만 허용한다.

#### alias 전제 조건 (필수)

- `tsconfig.app.json`에 `paths`로 `@/*`가 설정되어 있어야 한다.
- `vite.config.ts`에 `resolve.alias`로 `@`가 `src`를 가리켜야 한다.
- 위 설정이 없으면 import 규칙은 실행 불가로 간주한다.

## 4. 디렉터리 구조 (구현 명세)

> 기준 경로는 `frontend/src`이다.

```
src/
  app/
    App.tsx
    routes.tsx
    providers/
      RouterProvider.tsx
      SeoProvider.tsx
      ErrorBoundary.tsx
    styles/
      global.css
      tokens.css
  pages/
    home/
      HomePage.tsx
      home.css
    portfolio/
      PortfolioListPage.tsx
      PortfolioDetailPage.tsx
    blog/
      BlogListPage.tsx
      BlogDetailPage.tsx
    cs-docs/
      CSDocsPage.tsx
    mini-games/
      MiniGamesPage.tsx
  application/
    home/
      usecases.ts
    portfolio/
      usecases.ts
    blog/
      usecases.ts
  features/
    layout/
      AppLayout.tsx
      Header.tsx
      Footer.tsx
      Navigation.tsx
  entities/
    home/
      types.ts
      mapper.ts
    portfolio/
      types.ts
      mapper.ts
    blog/
      types.ts
      mapper.ts
  shared/
    api/
      home.ts
      portfolio.ts
      blog.ts
    ui/
      Button.tsx
      Card.tsx
      ...
    styles/
      page.css
```

### 구조 규칙

- `pages`는 라우트 단위이며, 필요 시 `features` 또는 `shared/ui`를 조합해 화면을 구성한다.
- `pages`는 데이터 패칭을 시작하고, 결과를 `features` 또는 `shared/ui`에 주입한다.
- `application/*/usecases.ts`는 **유스케이스 오케스트레이션**만 정의한다.
- `application`은 `shared/api/*` 호출과 `entities` 매핑을 조합한다.
- `features`는 UI에만 집중한다. (데이터 패칭/오케스트레이션/매핑 금지)
- 실제 HTTP 호출은 `shared/api/*`에서만 수행한다.
- `entities`는 UI에 의존하지 않는 도메인 타입/검증/변환 로직만 포함한다.
- `shared/ui`는 도메인 의존 없이 재사용 가능한 UI만 포함한다.
- `app/styles/tokens.css`는 디자인 토큰의 유일한 진입점이다.

### pages / application / features 책임 경계

- `pages`: 라우트 파라미터 파싱, 데이터 패칭 트리거, 로딩/에러/빈 상태 분기
- `application`: 유스케이스 오케스트레이션, 다중 API 결합, 도메인 변환 호출
- `features`: 도메인 기능 UI 조립, 사용자 입력 이벤트 처리(읽기 전용 수준)

> `features`가 라우트 파라미터를 직접 읽는 패턴은 금지한다. (pages에서 파싱 후 props 전달)

### application 책임 상한선 (필수)

#### 허용 책임

- 유스케이스 단위 비동기 오케스트레이션
- 엔드포인트별 스키마 선택 및 검증 호출
- 다중 API 응답 결합 (도메인 모델 단위)

#### 금지 책임

- 도메인 비즈니스 규칙 생성/변경 (entities 책임)
- 캐싱 정책/상태 저장 (별도 계층 도입 전까지 금지)
- UI 전용 정렬/필터/뷰모델 가공 (pages 책임)

## 5. 라우팅 설계

### 5.1 라우트 맵

- `/` : Home (요약 소개 + 네비게이션 진입)
- `/portfolio` : Portfolio 목록
- `/portfolio/:id` : Portfolio 상세
- `/blog` : Blog 목록
- `/blog/:id` : Blog 상세
- `/cs-docs` : CS Docs (sandbox)
- `/mini-games` : Mini Games (sandbox)

### 5.2 라우팅 구현 규칙

- 라우팅은 `app/routes.tsx`에 단일 정의한다.
- 라우트 컴포넌트는 `pages/*`에 둔다.
- `AppLayout`은 모든 페이지 공통 레이아웃을 감싼다.
- URL 파라미터는 타입 가드를 거친다. (`shared/lib/assert.ts`)

> 구현 시 `react-router-dom`을 사용한다.

## 6. 데이터 패칭 및 API 규칙

### 6.1 API 클라이언트

- 공통 응답 포맷과 에러 타입은 `shared/api/types.ts`와 `shared/api/errors.ts`에 정의한다.
- 네트워크 호출은 `shared/api/apiClient.ts`로 단일화한다.

#### 공통 응답 형태 (FE 기대 스펙)

```
interface ApiEnvelope<T> {
  data: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    size?: number;
    total?: number;
  };
}

type ApiResult<T> =
  | { ok: true; data: T; meta?: ApiEnvelope<T>["meta"] }
  | { ok: false; error: ApiError };
```

### 6.2 엔드포인트 규칙

- Portfolio 목록: `GET /api/portfolio`
- Portfolio 상세: `GET /api/portfolio/{id}`
- Blog 목록: `GET /api/blog/posts`
- Blog 상세: `GET /api/blog/posts/{id}`

### 6.3 데이터 패칭 패턴

- 페이지 컴포넌트에서 `useFetch`/`useAsync` 훅으로 **application 유스케이스**를 호출한다.
- `application/*/usecases.ts`는 **비동기 유스케이스**이며 `Promise<ApiResult<T>>`를 반환한다.
- DTO → Domain 변환은 `entities/*/mapper.ts` + `entities/*/schema.ts`에서 수행한다.
- 로딩/에러/빈 상태는 `pages`가 해석한다. (UI 상태 관리 전담)
- 재시도 로직은 `shared/api/apiClient.ts`의 공통 정책으로만 허용한다. (페이지별 중복 금지)

### 6.4 에러 분류 및 정책

- `ApiError`는 다음으로 구분한다.
  - `NetworkError`: 네트워크 실패/타임아웃/연결 불가
  - `HttpError`: HTTP 비정상 응답(상태 코드 기반)
  - `DomainError`: API Envelope의 `error` 필드
  - `ParseError`: 런타임 검증 실패(스키마 불일치)
- UI는 `DomainError` 메시지를 1차 표시하고, `HttpError`/`NetworkError`는 사용자 친화 메시지로 매핑한다.
- `ParseError`는 로깅 대상이며 사용자 메시지로 직접 노출하지 않는다.

### 6.5 API 계층 정합성

- **HTTP 호출 책임은 `shared/api`에만 존재**한다.
- `application/*/usecases.ts`는 인프라에 직접 접근하지 않는다. `shared/api/*`의 결과만 사용한다.
- `shared/api/*`는 DTO만 반환한다. 도메인 변환은 `entities`에서 수행한다.

### 6.6 Async 책임 경계 (단일 책임 정의)

- **비동기 제어의 단일 책임 계층은 `application`이다.**
- `pages`는 `application`의 비동기 결과를 UI 상태로 변환만 한다.
- `features`는 비동기를 알지 못한다. (Promise/async 금지)
- `shared/api`는 네트워크 호출만 수행하며 UI 상태를 알지 못한다.

#### useFetch / useAsync 역할

- `useFetch`/`useAsync`는 **application 유스케이스 호출 래퍼**로만 사용한다.
- 내부에서 `fetch`를 직접 호출하지 않는다.
- 훅은 `Promise<ApiResult<T>>`를 받아 로딩/에러/데이터 상태를 표준화한다.

#### Hook 상태 모델 계약 (고정)

```
type AsyncState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: ApiError | ParseError };
```

- `pages`는 `AsyncState<T>`만 해석한다. (ApiResult 직접 해석 금지)
- `application`은 `AsyncState`를 알지 못한다.

## 7. 도메인 모델 (FE 타입 명세)

### 7.1 Portfolio

- `PortfolioProject`
  - `id: string`
  - `title: string`
  - `role: string`
  - `duration: { start: string; end?: string }`
  - `summary: string`
  - `techStack: string[]`
  - `experiences: ExperienceBlock[]`
  - `metrics: Metric[]`
  - `decisions: Decision[]`
  - `seo: SeoMetadata`

- `ExperienceBlock`
  - `problem: string`
  - `options: string[]`
  - `criteria: string[]`
  - `decision: string`
  - `result: string`
  - `learnings: string[]`

- `Metric`
  - `label: string`
  - `value: string`
  - `context?: string`

- `Decision`
  - `title: string`
  - `rationale: string`
  - `impact: string`

### 7.2 Blog

- `BlogPost`
  - `id: string`
  - `title: string`
  - `summary: string`
  - `category: string`
  - `tags: string[]`
  - `publishedAt: string`
  - `contentMarkdown: string`
  - `seo: SeoMetadata`

### 7.3 Shared

- `SeoMetadata`
  - `title: string`
  - `description: string`
  - `canonical?: string`
  - `openGraph?: {
  title: string;
  description: string;
  image?: string;
}`

### 7.4 DTO → Domain 변환 규칙

- `entities/*/schema.ts`는 런타임 검증(필수 필드/타입)을 수행한다.
- `entities/*/mapper.ts`는 검증된 DTO를 도메인 타입으로 변환한다.
- 변환 실패 시 `ParseError`를 발생시켜 상위에서 처리한다.

> 외부 데이터는 반드시 스키마 검증을 거친 후 UI에 전달한다.

### 7.5 런타임 검증 구현 명세 (필수)

- 검증 라이브러리: `zod`
- `schema.ts`는 검증 모드를 명시적으로 구분한다.
- `safeParse` 실패 시 `ParseError`로 변환한다.
- 번들 크기 최적화를 위해 스키마는 도메인 단위로 분리하고, 페이지에서 필요한 스키마만 import 한다.
- DTO는 `unknown`으로 받고, `schema.parse(dto)` 이후에만 타입을 사용한다.

### 7.6 검증 모드 정책 (FE-BE 결합 완화)

- `strip`: 알 수 없는 필드는 제거한다. (기본 모드)
- `strict`: 알 수 없는 필드를 허용하지 않는다. (내부 설정/FE 전용 데이터만 사용)
- `partial`: 선택 필드를 허용한다. (SEO/옵션 메타)

#### 적용 기준

- 목록 API: `strip` + 필수 최소 필드만 요구
- 상세 API: `strip` + 핵심 필드만 필수로 요구
- SEO/메타: `partial` + 기본값 폴백
- FE 내부 설정: `strict`

> BE 필드 추가는 FE 런타임 실패를 유발하지 않는다. (알 수 없는 필드는 제거)

### 7.7 Schema Mode Contract (코드 레벨 계약)

#### entities/schema.ts export 규칙

- 각 도메인 스키마는 **모드별 export**를 제공한다.
- export 이름은 고정한다. (예: `portfolioListSchema`, `portfolioDetailSchema`, `seoSchema`)

```
export const portfolioListSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string()
}).strip();

export const portfolioDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  experiences: z.array(experienceSchema)
}).strip();

export const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional()
}).partial();
```

#### 모드 선택 책임

- **모드 선택은 `application`에서만 수행한다.**
- `application/*/usecases.ts`는 엔드포인트별 스키마를 명시적으로 사용한다.
- `mapper.ts`는 스키마를 선택하지 않는다. (검증된 DTO → Domain 변환만 수행)

#### ParseError 조건

- `schema.safeParse(dto)`가 실패하면 `ParseError`로 분류한다.
- `strip` 모드는 알 수 없는 필드 제거만 수행하며 실패 조건이 아니다.

## 8. UI/스타일 설계 규칙

### 8.1 토큰 기반 스타일

- 토큰 시스템은 [docs/frontend/foundation.md](docs/frontend/foundation.md) 기준을 따른다.
- 컴포넌트 CSS에는 hex 값을 직접 쓰지 않는다.
- hex 값은 `app/styles/tokens.css`에서만 허용한다.
- px 값은 breakpoint 정의와 레이아웃 기준 값에 한해 허용한다.
- **현재는 Semantic Token이 계획 단계**이므로, UI 구현 전에 `app/styles/tokens.css`에 semantic 토큰을 정의하고, `foundation.md`에 매핑을 기록한다.

### 8.2 CSS 정책

- 전역 스타일은 `app/styles/global.css`에 한정한다.
- 컴포넌트는 CSS Modules (`*.module.css`)를 기본으로 사용한다.
- 폰트/타이포/레이아웃 유틸은 `shared/styles`로 분리한다.

### 8.3 현실적인 토큰 적용 범위

- 기존 전역 CSS에는 hex 값이 존재하므로, 신규 컴포넌트부터 토큰 규칙을 적용한다.
- 전역 스타일 리팩터링은 별도 작업으로 분리한다.

## 9. SEO 메타 전략

- CSR 기반이므로 검색 엔진 인덱싱 성과는 제한적이다. (MVP에서는 메타 표현 품질을 우선)
- 페이지 단위로 `SeoMeta` 컴포넌트를 렌더링한다.
- 기본 메타는 `SeoProvider`에서 제공한다.
- 구현 시 `react-helmet-async`를 사용한다.
- `SeoMetadata`는 백엔드 응답 또는 페이지 상수로부터 생성한다.
- 향후 SSR/SSG 도입 시 `SeoMeta` 인터페이스는 변경 없이 유지한다.

## 10. 에러 전파 흐름 (계층별 책임)

1. `shared/api/apiClient.ts`는 네트워크/HTTP/Envelope 오류를 `ApiError`로 반환한다.
2. `shared/api/*`는 DTO를 반환하거나 `ApiError`를 그대로 전달한다.
3. `entities/*/schema.ts`는 DTO를 검증하고 실패 시 `ParseError`를 발생시킨다.
4. `application/*/usecases.ts`는 `ApiResult`로 성공/실패를 반환한다. (예외 던지지 않음)
5. `pages`는 `ApiResult`를 해석하여 UI 상태(로딩/에러/빈)로 변환한다.
6. `ErrorBoundary`는 렌더링 예외만 처리한다. (비즈니스/네트워크 에러 처리 금지)

### 10.1 ParseError 처리 규칙 (장애 방지)

- 목록 API: 항목 단위로 검증 실패 시 해당 항목만 제외하고 리스트를 렌더링한다.
- 상세 API: 검증 실패 시 에러 상태로 전환하고 재시도 UI를 제공한다.
- SEO/메타: 검증 실패 시 기본 메타로 폴백한다.
- 모든 `ParseError`는 `shared/lib/guard.ts`로 로깅한다.

## 11. 테스트 전략

- 컴포넌트 테스트: `features/*`와 `shared/ui/*`에 `*.test.tsx`로 co-locate
- 페이지 테스트: 라우트 단위로 렌더링 + API 모킹
- API 테스트: `shared/api`는 `fetch`를 모킹해 요청/응답을 검증
- 테스트 유틸: `src/test/setupTests.ts`만 사용

### 11.1 MVP 필수 계약 테스트

- 라우팅 계약: 주요 라우트가 의도한 페이지를 렌더링하는지 검증
- API 계약: `apiClient`가 `ApiError`를 올바르게 분류하는지 검증
- 매핑 계약: `entities/*/schema.ts`가 모드 정책에 맞게 허용/거부하는지 검증
- 화면 상태 계약: 로딩/에러/빈 상태가 분기되는지 검증

### 11.2 아키텍처 보호 테스트 (필수)

- import 규칙 테스트: `import-x/no-relative-parent-imports` 위반 시 CI 실패
- 경계 테스트: `no-restricted-paths` 위반 시 CI 실패
- 라우팅 확장 테스트: 신규 도메인 라우트가 `routes.ts`에 등록되지 않으면 실패

## 12. 확장 전략 (CS Docs / Mini Games 추가)

### 13.1 도메인 추가 절차

1. `entities/<domain>`: `types.ts`, `schema.ts`, `mapper.ts` 생성
2. `shared/api/<domain>.ts`: DTO 요청/응답 함수 추가
3. `application/<domain>/usecases.ts`: 도메인 유스케이스 추가
4. `pages/<domain>`: 목록/상세 페이지 생성
5. `app/routes.tsx`: 라우트 등록
6. `shared/config/routes.ts`: 네비게이션 항목 등록
7. 테스트 추가: 라우팅/매핑/에러 분기 계약 테스트

### 13.2 네비게이션 확장 규칙

- 네비게이션은 `shared/config/routes.ts` 단일 소스에서만 정의한다.
- `features/layout/Navigation.tsx`는 해당 설정만 렌더링한다.

## 13. 구현 체크리스트 (MVP)

- `CORE-001`: 디렉터리 구조 생성 및 라우팅 적용
- `CORE-005`: `AppLayout`, `Header`, `Footer`, `Typography`
- `CORE-006`: SEO 메타 전략 적용
- `PORT-004`: Portfolio 카드/상세 컴포넌트 구현
- `BLOG-004`: Blog 카드/마크다운 렌더러 구현
- `CORE-101`: `apiClient`, `useAsync` 구축

## 14. 구현 시 추가해야 할 패키지

- `react-router-dom`
- `react-helmet-async`
- `zod`
- (선택) `marked` 또는 `react-markdown` (MarkdownRenderer 구현)

## 15. 규칙 위반 금지

- `/api` 프리픽스 우회 금지 (프록시 규칙 준수)
- `eslint.config.js` 직접 수정 금지
- 토큰 규칙 위반 금지 (컴포넌트에서 hex 사용 금지, px는 breakpoint/레이아웃 한정)
