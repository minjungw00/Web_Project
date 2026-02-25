# Foundation Specification

## Overview

Version: 0.2 (Implementation Baseline)

Status: Primitive / Semantic / Component Layer Defined

이 문서는 현재 프론트엔드 구현(`frontend/src/index.css`, `frontend/src/shared/ui/ui.css`, `frontend/src/features/layout/layout.css`)을 기준으로 작성한다.

## Stability Levels

- Primitive Layer: Stable
- Semantic Layer: Stable
- Component Layer: Stable (확장 중)

변경 정책:

- Primitive 토큰 변경은 시각적 영향 범위가 넓으므로 문서 버전 업데이트를 동반한다.
- Semantic 토큰 변경은 매핑 영향 컴포넌트를 함께 점검한다.
- Component 레벨 클래스(`.ui-*`, `.app-*`) 변경은 페이지 회귀 확인이 필요하다.

## Terminology

### Token

디자인 시스템에서 재사용되는 이름 있는 값.

### Primitive Token

원시 값(색상, 길이, 폰트 크기 등)을 직접 보관하는 토큰.

예시:

- `--color-blue-500: #4b92c4`
- `--space-m: 1rem`
- `--font-size-xl: 1.25rem`

### Semantic Token

UI 의미(역할) 기반 토큰. Primitive를 참조한다.

예시:

- `--color-text-primary: var(--color-gray-900)`
- `--color-status-success: var(--color-green-500)`
- `--spacing-section-md: var(--space-xxl)`

### Component Token

컴포넌트/패턴 단위에서 실제 스타일 조합으로 사용하는 토큰/클래스 계층.

예시:

- `.ui-button` + `.ui-button-dark`
- `.ui-card`
- `.app-footer-icon`

## LLM Usage Enforcement Rules

LLM으로 UI/CSS를 생성할 때 다음을 강제한다.

1. 신규 스타일은 Semantic 토큰 우선 사용.
2. 기존 클래스(`.ui-*`, `.app-*`)가 있으면 재사용 우선.
3. Hex/raw px 하드코딩 금지(브레이크포인트 정의 예외).
4. 토큰 추가는 `:root`에만 수행.
5. 페이지/컴포넌트 CSS에서 임의 토큰 이름 생성 금지.
6. Primitive 직접 사용은 기존 코드 정합성 유지가 필요한 경우에만 허용하며, 신규 코드에는 지양.

# Details

## Breakpoint System

### Breakpoint Strategy

- Mobile-first (`min-width`) 기반.
- 현재 운영 브레이크포인트는 2개(`md`, `lg`)로 단순화.
- 레이아웃과 타이포 스케일은 토큰을 통해 반응형 제어.

### Primitive Tokens

| Token             | Min Width        | 의미/권장 용도                                                 |
| ----------------- | ---------------- | -------------------------------------------------------------- |
| `--breakpoint-md` | `48rem` (768px)  | 모바일 레이아웃에서 태블릿 레이아웃으로 전환되는 최소 기준값   |
| `--breakpoint-lg` | `64rem` (1024px) | 태블릿 레이아웃에서 데스크톱 레이아웃으로 전환되는 최소 기준값 |

### Semantic Layout Breakpoints

| Semantic Token           | References        | 의미/권장 용도                                                                 |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------ |
| `--layout-breakpoint-md` | `--breakpoint-md` | 태블릿 이상 레이아웃 전환 기준(모바일 단일열 → 다열/데스크톱 헤더 구조 분기)   |
| `--layout-breakpoint-lg` | `--breakpoint-lg` | 데스크톱 고정 폭/고밀도 정보 배치 기준(콘텐츠 컬럼 확장, 네비게이션 간격 확대) |

### Container Width (현재 구현)

| Token                         | Value                         |
| ----------------------------- | ----------------------------- |
| `--layout-page-min-width`     | `20rem`                       |
| `--layout-content-max-width`  | `46rem`                       |
| `.app-main-content max-width` | `var(--layout-breakpoint-lg)` |

### Usage Rules

1. 미디어 쿼리는 `48rem`, `64rem` 기준만 사용한다.
2. 브레이크포인트는 토큰과 동일한 값으로 유지한다.
3. 페이지 컨테이너는 `layout` 토큰 기준으로 맞춘다.

## Color System

### Structure

Color는 2계층으로 구성된다.

1. Primitive Palette (`--color-*-50..900`)
2. Semantic Role (`--color-text-*`, `--color-bg-*`, `--color-action-*` 등)

### Primitive Tokens (Palette Scale)

#### BlueGray Palette

| Token                  | Hex       | 의미/권장 용도                 |
| ---------------------- | --------- | ------------------------------ |
| `--color-bluegray-50`  | `#f0f3f7` | 매우 연한 배경/서브tle UI 배경 |
| `--color-bluegray-100` | `#d0dae5` | 약한 경계/hover 배경           |
| `--color-bluegray-200` | `#bac9d8` | disabled/뮤트된 배경           |
| `--color-bluegray-300` | `#9ab0c7` | active 눌림 상태 배경          |
| `--color-bluegray-400` | `#86a1bc` | 보조 강조 톤                   |
| `--color-bluegray-500` | `#6889ab` | 브랜드 기준색(Primary 기준점)  |
| `--color-bluegray-600` | `#5f7d9c` | primary hover 기준색           |
| `--color-bluegray-700` | `#4a6179` | primary active 기준색          |
| `--color-bluegray-800` | `#394b5e` | 진한 브랜드 계열 텍스트        |
| `--color-bluegray-900` | `#2c3a48` | 최강조 브랜드 계열 텍스트      |

#### SkyBlue Palette

| Token                 | Hex       | 의미/권장 용도        |
| --------------------- | --------- | --------------------- |
| `--color-skyblue-50`  | `#f4fafd` | 앱 기본 배경 계열     |
| `--color-skyblue-100` | `#def1fa` | 브랜드 subtle 배경    |
| `--color-skyblue-200` | `#cdeaf7` | 배지/태그 경계 보조   |
| `--color-skyblue-300` | `#b7e0f4` | 낮은 단계 강조 배경   |
| `--color-skyblue-400` | `#a9daf1` | 보조 포인트 컬러      |
| `--color-skyblue-500` | `#93d1ee` | secondary 기준색      |
| `--color-skyblue-600` | `#86bed9` | secondary hover       |
| `--color-skyblue-700` | `#6894a9` | secondary active      |
| `--color-skyblue-800` | `#517383` | 짙은 보조 텍스트      |
| `--color-skyblue-900` | `#3e5864` | 매우 강한 보조 텍스트 |

#### Blue Palette

| Token              | Hex       | 의미/권장 용도               |
| ------------------ | --------- | ---------------------------- |
| `--color-blue-50`  | `#edf4f9` | info 상태의 배경             |
| `--color-blue-100` | `#c7dded` | info 상태 경계선             |
| `--color-blue-200` | `#accde4` | info 계열 중간 배경          |
| `--color-blue-300` | `#86b6d7` | info 계열 보조 강조          |
| `--color-blue-400` | `#6fa8d0` | info 계열 강조               |
| `--color-blue-500` | `#4b92c4` | info 상태 기준색/포커스 보조 |
| `--color-blue-600` | `#4485b2` | info hover 계열              |
| `--color-blue-700` | `#35688b` | info 텍스트/active           |
| `--color-blue-800` | `#29506c` | 강한 info 텍스트             |
| `--color-blue-900` | `#203d52` | 최강조 info 텍스트           |

#### Green Palette

| Token               | Hex       | 의미/권장 용도        |
| ------------------- | --------- | --------------------- |
| `--color-green-50`  | `#eef6f0` | success 상태 배경     |
| `--color-green-100` | `#cae3d1` | success 상태 경계선   |
| `--color-green-200` | `#b0d5bb` | success 보조 배경     |
| `--color-green-300` | `#8cc29c` | success 보조 강조     |
| `--color-green-400` | `#76b689` | success 중간 강조     |
| `--color-green-500` | `#54a46b` | success 기준색        |
| `--color-green-600` | `#4c9561` | success hover         |
| `--color-green-700` | `#3c744c` | success 텍스트/active |
| `--color-green-800` | `#2e5a3b` | 강한 success 텍스트   |
| `--color-green-900` | `#23452d` | 최강조 success 텍스트 |

#### Yellow Palette

| Token                | Hex       | 의미/권장 용도        |
| -------------------- | --------- | --------------------- |
| `--color-yellow-50`  | `#fbf4eb` | warning 상태 배경     |
| `--color-yellow-100` | `#f1dec0` | warning 상태 경계선   |
| `--color-yellow-200` | `#eacea1` | warning 보조 배경     |
| `--color-yellow-300` | `#e1b776` | warning 보조 강조     |
| `--color-yellow-400` | `#dba95c` | warning 중간 강조     |
| `--color-yellow-500` | `#d29433` | warning 기준색        |
| `--color-yellow-600` | `#bf872e` | warning hover         |
| `--color-yellow-700` | `#956924` | warning 텍스트/active |
| `--color-yellow-800` | `#74511c` | 강한 warning 텍스트   |
| `--color-yellow-900` | `#583e15` | 최강조 warning 텍스트 |

#### Red Palette

| Token             | Hex       | 의미/권장 용도      |
| ----------------- | --------- | ------------------- |
| `--color-red-50`  | `#feeceb` | error 상태 배경     |
| `--color-red-100` | `#fcc5c1` | error 상태 경계선   |
| `--color-red-200` | `#faa9a3` | error 보조 배경     |
| `--color-red-300` | `#f88178` | error 보조 강조     |
| `--color-red-400` | `#f6695e` | error 중간 강조     |
| `--color-red-500` | `#f44336` | error 기준색        |
| `--color-red-600` | `#de3d31` | error hover         |
| `--color-red-700` | `#ad3026` | error 텍스트/active |
| `--color-red-800` | `#86251e` | 강한 error 텍스트   |
| `--color-red-900` | `#661c17` | 최강조 error 텍스트 |

#### Gray Palette / Base

| Token              | Hex       | 의미/권장 용도           |
| ------------------ | --------- | ------------------------ |
| `--color-gray-50`  | `#f0f1f3` | 매우 연한 중립 배경      |
| `--color-gray-100` | `#d0d5d9` | subtle 경계선            |
| `--color-gray-200` | `#bac0c6` | 기본 경계선              |
| `--color-gray-300` | `#9aa3ac` | 강조 경계선              |
| `--color-gray-400` | `#86919c` | disabled 텍스트          |
| `--color-gray-500` | `#687683` | tertiary 텍스트          |
| `--color-gray-600` | `#5f6b77` | 중간 강조 텍스트         |
| `--color-gray-700` | `#4a545d` | secondary 텍스트         |
| `--color-gray-800` | `#394148` | 강한 텍스트              |
| `--color-gray-900` | `#2c3237` | primary 텍스트/역상 배경 |
| `--color-white`    | `#ffffff` | 표면 배경/역상 텍스트    |
| `--color-black`    | `#000000` | 오버레이/역상 그림자     |

### Semantic Tokens (Current Mapping)

#### Brand / Text / Surface

| Semantic Token                   | Primitive Token        | 의미/권장 용도                                            |
| -------------------------------- | ---------------------- | --------------------------------------------------------- |
| `--color-brand-primary`          | `--color-bluegray-500` | 브랜드의 기본 액션/강조 색상(주요 버튼, 활성 상태 포인트) |
| `--color-brand-primary-hover`    | `--color-bluegray-600` | primary 계열 hover 상태                                   |
| `--color-brand-primary-active`   | `--color-bluegray-700` | primary 계열 active/pressed 상태                          |
| `--color-brand-secondary`        | `--color-skyblue-500`  | 보조 액션/링크 계열 기본 색상                             |
| `--color-brand-secondary-hover`  | `--color-skyblue-600`  | secondary 계열 hover 상태                                 |
| `--color-brand-secondary-active` | `--color-skyblue-700`  | secondary 계열 active 상태                                |
| `--color-brand-subtle`           | `--color-skyblue-100`  | 브랜드 톤의 약한 배경 강조(배지/정보 박스 배경)           |
| `--color-brand-muted`            | `--color-bluegray-200` | 비활성/중립 브랜드 톤 배경                                |
| `--color-text-primary`           | `--color-gray-900`     | 본문 핵심 텍스트(제목, 주요 설명)                         |
| `--color-text-secondary`         | `--color-gray-700`     | 보조 텍스트(부연 설명, 메타 정보)                         |
| `--color-text-tertiary`          | `--color-gray-500`     | 저강조 텍스트(캡션, 힌트)                                 |
| `--color-text-disabled`          | `--color-gray-400`     | 비활성 컨트롤/입력 placeholder                            |
| `--color-text-inverse`           | `--color-white`        | 진한 배경 위 텍스트                                       |
| `--color-text-brand-primary`     | `--color-bluegray-900` | 브랜드 컨텍스트의 강한 텍스트(카드 타이틀 등)             |
| `--color-text-brand-secondary`   | `--color-bluegray-700` | 브랜드 컨텍스트의 보조 텍스트                             |
| `--color-bg-default`             | `--color-skyblue-50`   | 앱 전체 기본 배경                                         |
| `--color-bg-surface`             | `--color-white`        | 카드/패널 등 표면 배경                                    |
| `--color-bg-subtle`              | `--color-bluegray-50`  | 약한 분리 배경(입력/아이콘 버튼/칩)                       |
| `--color-bg-elevated`            | `--color-white`        | 상승된 표면 배경(오버레이성 카드)                         |
| `--color-bg-inverse`             | `--color-gray-900`     | 역상 배경(다크 컨텍스트 영역)                             |

#### Border / Status / Action / Shadow

| Semantic Token                    | Primitive Token                  | 의미/권장 용도               |
| --------------------------------- | -------------------------------- | ---------------------------- |
| `--color-border-default`          | `--color-gray-200`               | 기본 외곽선/구분선           |
| `--color-border-subtle`           | `--color-gray-100`               | 약한 구분선(서브 섹션 분리)  |
| `--color-border-strong`           | `--color-gray-300`               | 강조 외곽선/hover 보더       |
| `--color-border-focus`            | `--color-blue-500`               | 포커스 링/접근성 강조 테두리 |
| `--color-status-info`             | `--color-blue-500`               | 정보 상태 강조점(점/아이콘)  |
| `--color-status-info-subtle`      | `--color-blue-50`                | 정보 상태 배경               |
| `--color-status-success`          | `--color-green-500`              | 성공 상태 강조점             |
| `--color-status-success-subtle`   | `--color-green-50`               | 성공 상태 배경               |
| `--color-status-warning`          | `--color-yellow-500`             | 경고 상태 강조점             |
| `--color-status-warning-subtle`   | `--color-yellow-50`              | 경고 상태 배경               |
| `--color-status-error`            | `--color-red-500`                | 오류/위험 상태 강조점        |
| `--color-status-error-subtle`     | `--color-red-50`                 | 오류/위험 상태 배경          |
| `--color-action-primary`          | `--color-brand-primary`          | 주요 CTA 기본 배경           |
| `--color-action-primary-hover`    | `--color-brand-primary-hover`    | 주요 CTA hover               |
| `--color-action-primary-active`   | `--color-brand-primary-active`   | 주요 CTA active              |
| `--color-action-primary-disabled` | `--color-bluegray-200`           | 주요 CTA disabled            |
| `--color-action-secondary`        | `--color-brand-secondary`        | 보조 CTA/링크 기본           |
| `--color-action-secondary-hover`  | `--color-brand-secondary-hover`  | 보조 CTA hover               |
| `--color-action-secondary-active` | `--color-brand-secondary-active` | 보조 CTA active              |
| `--color-overlay-light`           | `--color-white`                  | 밝은 오버레이/레이어         |
| `--color-overlay-dark`            | `--color-black`                  | 어두운 오버레이/마스크       |
| `--color-shadow-base`             | `--color-gray-900`               | 기본 그림자 색상 소스        |
| `--color-shadow-subtle`           | `--color-gray-700`               | 낮은 대비 그림자 보조 소스   |
| `--color-shadow-inverse`          | `--color-black`                  | 역상 컨텍스트 그림자 소스    |

### Usage Rules

1. 신규 컴포넌트는 Semantic 토큰을 기본으로 사용한다.
2. Primitive는 토큰 정의 계층과 기존 호환 유지 상황에서만 직접 사용한다.
3. 컴포넌트 파일에 Hex 값 직접 선언 금지.

## Typography System

### Base Settings

- Primary Font: Pretendard Variable
- Fallback: Pretendard, system sans-serif stack
- Root Font Size: `0.875rem` (기본), `1rem` (`min-width: 64rem`)

### Primitive Tokens

#### Font Size

| Token                | rem      | px(16px 기준) | 의미/권장 용도     |
| -------------------- | -------- | ------------- | ------------------ |
| `--font-size-xxxxxl` | 3rem     | 48px          | 히어로급 대제목    |
| `--font-size-xxxxl`  | 2.25rem  | 36px          | 페이지/섹션 대제목 |
| `--font-size-xxxl`   | 1.875rem | 30px          | 중간 레벨 제목     |
| `--font-size-xxl`    | 1.5rem   | 24px          | 카드/블록 제목     |
| `--font-size-xl`     | 1.25rem  | 20px          | 보조 제목          |
| `--font-size-l`      | 1.125rem | 18px          | 강조 본문          |
| `--font-size-m`      | 1rem     | 16px          | 기본 본문          |
| `--font-size-s`      | 0.875rem | 14px          | 보조 본문          |
| `--font-size-xs`     | 0.75rem  | 12px          | 캡션/라벨          |

#### Font Weight / Line Height

- Weight: `400`, `500`, `600`, `700`
- Line-height: `1.25`, `1.3`, `1.35`, `1.4`, `1.5`, `1.6`

### Semantic Tokens

| Semantic Token        | Mapping                                                                  | 의미/권장 용도                       |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| `--text-heading-h1-*` | `--font-size-xxxxxl`, `--font-weight-bold`, `--line-height-tight`        | 페이지 최상위 타이틀/히어로 헤드라인 |
| `--text-heading-h2-*` | `--font-size-xxxxl`, `--font-weight-bold`, `--line-height-heading`       | 섹션 대제목                          |
| `--text-heading-h3-*` | `--font-size-xxxl`, `--font-weight-semibold`, `--line-height-subheading` | 섹션 내 중간 제목                    |
| `--text-heading-h4-*` | `--font-size-xxl`, `--font-weight-semibold`, `--line-height-compact`     | 카드/콘텐츠 블록 제목                |
| `--text-heading-h5-*` | `--font-size-xl`, `--font-weight-semibold`, `--line-height-compact`      | 보조 제목/리스트 아이템 제목         |
| `--text-body-lg-*`    | `--font-size-l`, `--font-weight-medium`, `--line-height-body`            | 강조 본문/리드 문장                  |
| `--text-body-md-*`    | `--font-size-m`, `--font-weight-regular`, `--line-height-body`           | 기본 본문 텍스트                     |
| `--text-body-sm-*`    | `--font-size-s`, `--font-weight-regular`, `--line-height-body`           | 보조 본문/메타 정보                  |
| `--text-caption-*`    | `--font-size-xs`, `--font-weight-medium`, `--line-height-caption`        | 캡션, 라벨, 저강조 정보              |

### Usage Rules

1. 타이포는 `text-*` semantic 토큰 사용.
2. 컴포넌트 개별 폰트 스케일 임의 확장 금지.
3. 반응형 글자 크기 조정은 루트 스케일 전략으로 처리.

## Spacing System

### Primitive Tokens

| Token           | rem      | px   | 의미/권장 용도                   |
| --------------- | -------- | ---- | -------------------------------- |
| `--space-xxxs`  | 0.125rem | 2px  | 미세 보정(아이콘-텍스트 정렬 등) |
| `--space-xxs`   | 0.25rem  | 4px  | 매우 작은 간격/경량 UI           |
| `--space-xs`    | 0.5rem   | 8px  | 작은 요소 간 기본 간격           |
| `--space-s`     | 0.75rem  | 12px | 소형 컴포넌트 내부/외부 간격     |
| `--space-m`     | 1rem     | 16px | 기본 컨텐츠 간격 기준            |
| `--space-l`     | 1.25rem  | 20px | 중간 레벨 블록 간격              |
| `--space-xl`    | 1.5rem   | 24px | 섹션 내 큰 간격                  |
| `--space-xxl`   | 2rem     | 32px | 섹션 간 기본 간격                |
| `--space-xxxl`  | 2.5rem   | 40px | 큰 섹션 분리 간격                |
| `--space-xxxxl` | 3rem     | 48px | 최대 섹션 분리/히어로 패딩       |

### Semantic Tokens

| Semantic Token                   | References             | 의미/권장 용도                                          |
| -------------------------------- | ---------------------- | ------------------------------------------------------- |
| `--spacing-stack-xs/sm/md/lg/xl` | `--space-xs/s/m/l/xl`  | 세로 스택 간격(텍스트 블록, 카드 내부 요소 간격)        |
| `--spacing-inline-xs/sm/md/lg`   | `--space-xs/m/l/xl`    | 가로 배치 간격(버튼 그룹, 배지 목록, 네비게이션 아이템) |
| `--spacing-inset-sm/md/lg`       | `--space-xs/m/xl`      | 컴포넌트 내부 패딩(버튼, 입력, 카드)                    |
| `--spacing-section-sm/md/lg`     | `--space-xl/xxl/xxxxl` | 페이지 섹션 간 큰 간격(블록 단위 분리)                  |

### Usage Rules

1. 섹션 간격은 `spacing-section-*`를 사용한다.
2. 컴포넌트 내부 패딩은 `spacing-inset-*`를 우선한다.
3. 새 spacing 토큰 추가 전 기존 scale 재사용 가능성부터 검토한다.

## Size System

### Primitive Tokens (요약)

- 아이콘/컨트롤: `--size-icon-sm`, `--size-control-sm/md/lg`
- 미디어/레이아웃: `--size-8xl`, `--size-12xl`, `--size-16xl`, `--size-20xl`, `--size-46xl`
- 입력/검색: `--size-input-icon-leading`, `--size-searchbar-max-md/lg`

Primitive 크기 토큰 의미:

- `--size-icon-sm`, `--size-control-*`: 클릭 가능한 컨트롤 및 아이콘의 물리 크기 기준.
- `--size-8xl`~`--size-46xl`: 그리드/컬럼/콘텐츠 최대 폭 같은 레이아웃 고정값 기준.
- `--size-input-icon-leading`: 검색 아이콘이 있는 입력창의 좌측 패딩 보정 기준.
- `--size-searchbar-max-*`: 검색 영역의 반응형 최대 폭 기준.

### Semantic Tokens

| Semantic Token                       | References                                                              | 의미/권장 용도                                         |
| ------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `--size-icon-glyph-xs/sm/menu/md/lg` | `--size-text-sm`, `--size-xl`, `--size-icon-sm`, `--size-control-sm/md` | 아이콘 실제 glyph 크기 계층(컨텍스트별 시각 무게 조절) |
| `--size-icon-button-md/lg`           | `--size-2xl`, `--size-control-lg`                                       | 아이콘 버튼 터치/클릭 영역 크기                        |
| `--size-indicator-dot-sm/md`         | `--size-xs`, `--size-sm`                                                | 상태 점/알림 인디케이터 크기                           |
| `--size-media-min-height-sm`         | `--size-3xl`                                                            | 미디어 블록 최소 높이 보장                             |
| `--size-media-height-project-md`     | `--size-14xl`                                                           | 프로젝트 썸네일 고정 높이                              |
| `--size-line-height-tight-fixed`     | `--size-xl`                                                             | 캡션류 고정 라인 높이 보정 값                          |

## Radius System

### Primitive Tokens

| Token           | Value      | 의미/권장 용도           |
| --------------- | ---------- | ------------------------ |
| `--radius-none` | `0rem`     | 모서리 없음(직선형 요소) |
| `--radius-xs`   | `0.125rem` | 매우 작은 rounding       |
| `--radius-sm`   | `0.25rem`  | 소형 컨트롤 rounding     |
| `--radius-md`   | `0.5rem`   | 기본 컨트롤 rounding     |
| `--radius-lg`   | `0.75rem`  | 카드/표면 기본 rounding  |
| `--radius-xl`   | `1rem`     | 강조 표면 rounding       |
| `--radius-full` | `9999px`   | pill/원형 처리 전용      |

### Semantic Tokens

| Semantic Token               | References      | 의미/권장 용도                |
| ---------------------------- | --------------- | ----------------------------- |
| `--radius-control-default`   | `--radius-md`   | 기본 컨트롤(버튼/입력) 모서리 |
| `--radius-control-small`     | `--radius-sm`   | 밀도 높은 소형 컨트롤 모서리  |
| `--radius-control-pill`      | `--radius-full` | 칩/배지/필 형태               |
| `--radius-surface-default`   | `--radius-lg`   | 카드/패널 기본 모서리         |
| `--radius-surface-subtle`    | `--radius-md`   | 약한 강조 표면/아이콘 박스    |
| `--radius-surface-prominent` | `--radius-xl`   | 강조 표면(프로젝트 카드 등)   |
| `--radius-media-default`     | `--radius-lg`   | 이미지/미디어 기본 모서리     |
| `--radius-media-thumbnail`   | `--radius-md`   | 썸네일/보조 미디어 모서리     |
| `--radius-media-circle`      | `--radius-full` | 아바타/원형 미디어            |

## Border System

### Primitive Tokens

| Token                   | Value             | 의미/권장 용도       |
| ----------------------- | ----------------- | -------------------- |
| `--border-width-none`   | `0rem`            | 보더 없음            |
| `--border-width-thin`   | `0.0625rem` (1px) | 기본 경계선          |
| `--border-width-medium` | `0.125rem` (2px)  | 강조/포커스 보더     |
| `--border-width-thick`  | `0.25rem` (4px)   | 특수 하이라이트 보더 |

### Semantic Tokens

| Semantic Token      | References              | 의미/권장 용도                 |
| ------------------- | ----------------------- | ------------------------------ |
| `--border-default`  | `--border-width-thin`   | 일반 컴포넌트 외곽선/구분선    |
| `--border-strong`   | `--border-width-medium` | 강조된 구분선/선택 상태        |
| `--border-focus`    | `--border-width-medium` | 키보드 포커스 시각 강조        |
| `--border-emphasis` | `--border-width-thick`  | 강한 강조 블록/특수 하이라이트 |

### Usage Rules

1. 기본 외곽선은 `border-default` + `color-border-*` 조합.
2. 포커스는 `border-focus` 또는 focus ring(box-shadow) 사용.
3. 버튼/입력/배지는 기존 `ui.css` 조합을 우선 재사용.

## Elevation System

### Primitive Tokens

- Opacity: `--shadow-opacity-low(0.04)`, `medium(0.12)`, `high(0.22)`, `strong(0.35)`
- Blur: `--shadow-blur-xs/sm/md/lg/xl`
- Offset: `--shadow-offset-xs/sm/md/lg/xl`
- Spread: `--shadow-spread-none: 0`

Primitive 그림자 토큰 의미:

- Opacity: 그림자 대비 강도 단계(낮음 → 강함) 정의.
- Blur: 그림자 퍼짐 반경 단계 정의.
- Offset: 그림자의 수직 이동량 단계 정의.
- Spread: 현재 시스템은 0으로 고정해 시각적 일관성을 유지.

### Semantic Tokens

| Semantic Token     | Composition                      | 의미/권장 용도                       |
| ------------------ | -------------------------------- | ------------------------------------ |
| `--elevation-none` | `none`                           | 배경과 동일 평면(기본 레이아웃)      |
| `--elevation-xs`   | offset-xs + blur-xs + 4% shadow  | 미세한 hover/경계 보조               |
| `--elevation-sm`   | offset-sm + blur-sm + 4% shadow  | 낮은 깊이의 카드/버튼                |
| `--elevation-md`   | offset-md + blur-md + 12% shadow | 기본 카드/패널 레벨                  |
| `--elevation-lg`   | offset-lg + blur-lg + 22% shadow | 강조 패널/떠있는 요소                |
| `--elevation-xl`   | offset-xl + blur-xl + 35% shadow | 가장 높은 강조(hover된 핵심 카드 등) |

구현은 `color-mix(in srgb, var(--color-shadow-base) X%, transparent)`를 사용한다.

### Usage Rules

1. 카드/패널/아티클은 `elevation-md` 이상 재사용.
2. hover는 상위 elevation으로 상승, active는 하향 또는 제거.
3. disabled 상태에는 그림자 제거.

## Icon System

### Icon Size Tokens

| Token                    | Value      |
| ------------------------ | ---------- |
| `--size-icon-glyph-xs`   | `0.875rem` |
| `--size-icon-glyph-sm`   | `1rem`     |
| `--size-icon-glyph-menu` | `1.125rem` |
| `--size-icon-glyph-md`   | `1.25rem`  |
| `--size-icon-glyph-lg`   | `1.5rem`   |
| `--size-icon-button-md`  | `2.5rem`   |
| `--size-icon-button-lg`  | `2.25rem`  |

### Usage Rules

1. 아이콘 래퍼는 버튼/배지/브랜드 영역의 radius 토큰을 따른다.
2. 실제 glyph 크기는 `size-icon-glyph-*` 계열만 사용한다.
3. 아이콘 색상은 상태별 semantic color를 따른다.

## Component Layer Baseline

현재 컴포넌트 계층은 다음 클래스군으로 운영한다.

- `ui-*`: 공용 UI 프리미티브 (`ui-button`, `ui-card`, `ui-badge`, `ui-search-input` 등)
- `app-*`: 앱 레이아웃/네비게이션 (`app-header`, `app-nav`, `app-footer` 등)
- `page-*`: 페이지 공통 레이아웃 패턴 (`page-stack`, `page-card-grid` 등)

컴포넌트 스타일 규칙:

1. 공용 컴포넌트는 `shared/ui/ui.css`에 우선 배치.
2. 레이아웃 전용 스타일은 `features/layout/layout.css`에서 관리.
3. 페이지 공통 패턴은 `shared/styles/page.css`로 유지.

## Dark Mode Baseline Strategy

현재 다크 모드는 미구현이며, 기본 `color-scheme: light`로 고정되어 있다.

다크 모드 도입 시 최소 요건:

1. Semantic color 토큰만 전환 대상으로 사용.
2. Elevation 대비(명암) 재검증.
3. Text/Border 대비 WCAG 기준 확인.
4. 컴포넌트 레벨 예외값(primitive 직접 사용 구간) 우선 정리.
