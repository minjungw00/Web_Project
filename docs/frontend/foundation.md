# Foundation Specification

## Overview

Version: 0.1 (Pre-Design Stage)

Status: Primitive Layer Defined / Semantic Layer Planned

## Stability Levels

- Primitive Layer: Stable
- Semantic Layer: Experimental
- Component Layer: Not Defined

Changes to Primitive Layer require version increment.

Semantic Layer may evolve during UI exploration.

## Terminology

### Token

A named value used consistently across the system.

All tokens fall into one of the following categories.

### Primitive Token

A token that directly stores a raw value.

Examples:

- blue-500 → `#4b92c4`
- spacing-m → 1rem
- font-size-xl → 1.25rem

Primitive tokens represent scale values.

They do not express UI meaning.

### Semantic Token (Planned)

A role-based abstraction that maps to primitive tokens.

Examples:

- color.text.primary → gray-900
- color.status.success → green-500
- color.bg.surface → gray-50

Semantic tokens are used in UI and production code.

They must not contain raw values directly.

### Component Token (Future)

Component-scoped tokens.

Example:

- `button.primary.bg`

## LLM Usage Enforcement Rules

When generating UI or code via LLM:

1. Primitive tokens must never be used directly.
2. Hex values must not appear in output.
3. px values must not appear except inside breakpoint definitions.
4. Semantic tokens must be used exclusively.
5. Do not invent new tokens.
6. Do not override token values inline.

# Details

## Breakpoint System

Breakpoints define responsive layout boundaries.

They are treated as primitive tokens and must be referenced consistently in layout logic.

### Breakpoint Strategy

- Mobile-first layout foundation
- Desktop baseline design
- Responsive scaling via min-width media queries

All breakpoints are defined in pixels.

### Primitive Tokens

| Token          | Min Width |
| -------------- | --------- |
| breakpoint-xs  | 0px       |
| breakpoint-sm  | 480px     |
| breakpoint-md  | 768px     |
| breakpoint-lg  | 1024px    |
| breakpoint-xl  | 1280px    |
| breakpoint-2xl | 1440px    |

### Semantic Layout Breakpoints

Semantic breakpoints provide meaning-based abstraction.

| Semantic Token | References    |
| -------------- | ------------- |
| layout.mobile  | breakpoint-xs |
| layout.tablet  | breakpoint-md |
| layout.desktop | breakpoint-lg |
| layout.wide    | breakpoint-xl |

### Usage Rules

1. Media queries must reference breakpoint tokens only.
2. Hard-coded px values in layout logic are prohibited.
3. Typography scaling must occur via root adjustments per breakpoint.
4. Layout container widths must align with breakpoint tiers.
5. Component logic must not define new breakpoints.

### Container Width (Recommended Baseline)

| Layout Tier | Max Width |
| ----------- | --------- |
| mobile      | 100%      |
| tablet      | 720px     |
| desktop     | 960px     |
| wide        | 1200px    |

### Future Expansion

- Fluid breakpoints
- Container queries
- Density modes
- Reduced-motion responsive adjustments

## Color System

### Structure

Color system is structured in two layers:

1. Primitive Tokens (Palette Scale: 50–900)
2. Semantic Tokens (Role-based abstraction – categorized)

Primitive tokens are the source of truth.

Semantic tokens map to primitive tokens.

### Primitive Tokens (Palette Scale)

- Each palette supports 10-step scale: 50–900
- Primary intensity: 500
- Contrast ratios documented (AA / AAA)

#### BlueGray Palette

| Token        | Hex       | RGB              |
| ------------ | --------- | ---------------- |
| bluegray-50  | `#f0f3f7` | rgb(240,243,247) |
| bluegray-100 | `#d0dae5` | rgb(208,218,229) |
| bluegray-200 | `#bac9d8` | rgb(186,201,216) |
| bluegray-300 | `#9ab0c7` | rgb(154,176,199) |
| bluegray-400 | `#86a1bc` | rgb(134,161,188) |
| bluegray-500 | `#6889ab` | rgb(104,137,171) |
| bluegray-600 | `#5f7d9c` | rgb(95,125,156)  |
| bluegray-700 | `#4a6179` | rgb(74,97,121)   |
| bluegray-800 | `#394b5e` | rgb(57,75,94)    |
| bluegray-900 | `#2c3a48` | rgb(44,58,72)    |

#### SkyBlue Palette

| Token       | Hex       | RGB              |
| ----------- | --------- | ---------------- |
| skyblue-50  | `#f4fafd` | rgb(244,250,253) |
| skyblue-100 | `#def1fa` | rgb(222,241,250) |
| skyblue-200 | `#cdeaf7` | rgb(205,234,247) |
| skyblue-300 | `#b7e0f4` | rgb(183,224,244) |
| skyblue-400 | `#a9daf1` | rgb(169,218,241) |
| skyblue-500 | `#93d1ee` | rgb(147,209,238) |
| skyblue-600 | `#86bed9` | rgb(134,190,217) |
| skyblue-700 | `#6894a9` | rgb(104,148,169) |
| skyblue-800 | `#517383` | rgb(81,115,131)  |
| skyblue-900 | `#3e5864` | rgb(62,88,100)   |

#### Blue Palette

| Token    | Hex       | RGB              |
| -------- | --------- | ---------------- |
| blue-50  | `#edf4f9` | rgb(237,244,249) |
| blue-100 | `#c7dded` | rgb(199,221,237) |
| blue-200 | `#accde4` | rgb(172,205,228) |
| blue-300 | `#86b6d7` | rgb(134,182,215) |
| blue-400 | `#6fa8d0` | rgb(111,168,208) |
| blue-500 | `#4b92c4` | rgb(75,146,196)  |
| blue-600 | `#4485b2` | rgb(68,133,178)  |
| blue-700 | `#35688b` | rgb(53,104,139)  |
| blue-800 | `#29506c` | rgb(41,80,108)   |
| blue-900 | `#203d52` | rgb(32,61,82)    |

#### Green Palette

| Token     | Hex       | RGB              |
| --------- | --------- | ---------------- |
| green-50  | `#eef6f0` | rgb(238,246,240) |
| green-100 | `#cae3d1` | rgb(202,227,209) |
| green-200 | `#b0d5bb` | rgb(176,213,187) |
| green-300 | `#8cc29c` | rgb(140,194,156) |
| green-400 | `#76b689` | rgb(118,182,137) |
| green-500 | `#54a46b` | rgb(84,164,107)  |
| green-600 | `#4c9561` | rgb(76,149,97)   |
| green-700 | `#3c744c` | rgb(60,116,76)   |
| green-800 | `#2e5a3b` | rgb(46,90,59)    |
| green-900 | `#23452d` | rgb(35,69,45)    |

#### Yellow Palette

| Token      | Hex       | RGB              |
| ---------- | --------- | ---------------- |
| yellow-50  | `#fbf4eb` | rgb(251,244,235) |
| yellow-100 | `#f1dec0` | rgb(241,222,192) |
| yellow-200 | `#eacea1` | rgb(234,206,161) |
| yellow-300 | `#e1b776` | rgb(225,183,118) |
| yellow-400 | `#dba95c` | rgb(219,169,92)  |
| yellow-500 | `#d29433` | rgb(210,148,51)  |
| yellow-600 | `#bf872e` | rgb(191,135,46)  |
| yellow-700 | `#956924` | rgb(149,105,36)  |
| yellow-800 | `#74511c` | rgb(116,81,28)   |
| yellow-900 | `#583e15` | rgb(88,62,21)    |

#### Red Palette

| Token   | Hex       | RGB              |
| ------- | --------- | ---------------- |
| red-50  | `#feeceb` | rgb(254,236,235) |
| red-100 | `#fcc5c1` | rgb(252,197,193) |
| red-200 | `#faa9a3` | rgb(250,169,163) |
| red-300 | `#f88178` | rgb(248,129,120) |
| red-400 | `#f6695e` | rgb(246,105,94)  |
| red-500 | `#f44336` | rgb(244,67,54)   |
| red-600 | `#de3d31` | rgb(222,61,49)   |
| red-700 | `#ad3026` | rgb(173,48,38)   |
| red-800 | `#86251e` | rgb(134,37,30)   |
| red-900 | `#661c17` | rgb(102,28,23)   |

#### Gray Palette

| Token    | Hex       | RGB              |
| -------- | --------- | ---------------- |
| gray-50  | `#f0f1f3` | rgb(240,241,243) |
| gray-100 | `#d0d5d9` | rgb(208,213,217) |
| gray-200 | `#bac0c6` | rgb(186,192,198) |
| gray-300 | `#9aa3ac` | rgb(154,163,172) |
| gray-400 | `#86919c` | rgb(134,145,156) |
| gray-500 | `#687683` | rgb(104,118,131) |
| gray-600 | `#5f6b77` | rgb(95,107,119)  |
| gray-700 | `#4a545d` | rgb(74,84,93)    |
| gray-800 | `#394148` | rgb(57,65,72)    |
| gray-900 | `#2c3237` | rgb(44,50,55)    |

#### Black & White

| Token | Hex       | RGB              |
| ----- | --------- | ---------------- |
| white | `#ffffff` | rgb(255,255,255) |
| black | `#000000` | rgb(0,0,0)       |

### Semantic Tokens (Categorized – To Be Mapped)

- Semantic tokens are grouped by role.
- Mappings to primitive tokens will be defined during UI design phase.

#### Brand / Accent

| Semantic Token               | Primitive Token |
| ---------------------------- | --------------- |
| color.brand.primary          | bluegray-500    |
| color.brand.primary.hover    |                 |
| color.brand.primary.active   |                 |
| color.brand.secondary        | skyblue-500     |
| color.brand.secondary.hover  |                 |
| color.brand.secondary.active |                 |
| color.brand.subtle           |                 |
| color.brand.muted            |                 |

#### Text

| Semantic Token       | Primitive Token |
| -------------------- | --------------- |
| color.text.primary   | gray-900        |
| color.text.secondary | gray-700        |
| color.text.tertiary  | gray-500        |
| color.text.disabled  | gray-400        |
| color.text.inverse   | white           |

#### Background

| Semantic Token    | Primitive Token |
| ----------------- | --------------- |
| color.bg.default  |                 |
| color.bg.surface  |                 |
| color.bg.subtle   |                 |
| color.bg.elevated |                 |
| color.bg.inverse  |                 |

#### Border / Divider

| Semantic Token       | Primitive Token |
| -------------------- | --------------- |
| color.border.default |                 |
| color.border.subtle  |                 |
| color.border.strong  |                 |
| color.border.focus   |                 |

#### Status / Feedback

| Semantic Token              | Primitive Token |
| --------------------------- | --------------- |
| color.status.info           | blue-500        |
| color.status.info.subtle    | blue-50         |
| color.status.success        | green-500       |
| color.status.success.subtle | green-50        |
| color.status.warning        | yellow-500      |
| color.status.warning.subtle | yellow-50       |
| color.status.error          | red-500         |
| color.status.error.subtle   | red-50          |

#### Interactive States

| Semantic Token                | Primitive Token |
| ----------------------------- | --------------- |
| color.action.primary          |                 |
| color.action.primary.hover    |                 |
| color.action.primary.active   |                 |
| color.action.primary.disabled |                 |
| color.action.secondary        |                 |
| color.action.secondary.hover  |                 |
| color.action.secondary.active |                 |

#### Overlay

| Semantic Token      | Primitive Token |
| ------------------- | --------------- |
| color.overlay.light |                 |
| color.overlay.dark  |                 |

### Usage Rules

1. Production code must not directly reference primitive tokens.
2. All UI elements must consume semantic tokens.
3. Primitive tokens may only be referenced inside token mapping layer.
4. Hex values must never appear in component code.

## Typography System

### Base Settings

- Primary Font: Pretendard
- Fallback: system-ui
- Supported Languages: KR / EN
- Root Font Size: 16px (1rem)
- Responsive scaling handled at root level

### Responsive Root Scaling Strategy

Root font size adjustments per breakpoint:

| Breakpoint     | Root Font Size |
| -------------- | -------------- |
| layout.mobile  | 14px           |
| layout.tablet  | 14px           |
| layout.desktop | 16px           |
| layout.wide    | 16px           |

Rules:

1. Root scaling must not exceed ±2px from baseline.
2. Individual font-size tokens must not be overridden per breakpoint.
3. Use clamp() only if root-level scaling proves insufficient.

### Primitive Tokens

#### Font Family

| Token               | Value                 |
| ------------------- | --------------------- |
| font-family-primary | Pretendard, system-ui |

#### Font Size Scale

| Token            | rem      | px   |
| ---------------- | -------- | ---- |
| font-size-xxxxxl | 3.00rem  | 48px |
| font-size-xxxxl  | 2.25rem  | 36px |
| font-size-xxxl   | 1.875rem | 30px |
| font-size-xxl    | 1.50rem  | 24px |
| font-size-xl     | 1.25rem  | 20px |
| font-size-l      | 1.125rem | 18px |
| font-size-m      | 1.00rem  | 16px |
| font-size-s      | 0.875rem | 14px |
| font-size-xs     | 0.75rem  | 12px |

#### Font Weight

| Token                | Weight |
| -------------------- | ------ |
| font-weight-bold     | 700    |
| font-weight-semibold | 600    |
| font-weight-medium   | 500    |
| font-weight-regular  | 400    |

#### Line Height

Line height values are defined as unitless ratios.

| Token                  | Value |
| ---------------------- | ----- |
| line-height-tight      | 1.25  |
| line-height-heading    | 1.3   |
| line-height-subheading | 1.35  |
| line-height-compact    | 1.4   |
| line-height-body       | 1.6   |
| line-height-caption    | 1.5   |

### Semantic Tokens

#### Headings

| Semantic Token  | Font Size        | Weight               | Line Height            |
| --------------- | ---------------- | -------------------- | ---------------------- |
| text.heading.h1 | font-size-xxxxxl | font-weight-bold     | line-height-tight      |
| text.heading.h2 | font-size-xxxxl  | font-weight-bold     | line-height-heading    |
| text.heading.h3 | font-size-xxxl   | font-weight-semibold | line-height-subheading |
| text.heading.h4 | font-size-xxl    | font-weight-semibold | line-height-compact    |
| text.heading.h5 | font-size-xl     | font-weight-semibold | line-height-compact    |

#### Body Text

| Semantic Token | Font Size   | Weight              | Line Height      |
| -------------- | ----------- | ------------------- | ---------------- |
| text.body.lg   | font-size-l | font-weight-medium  | line-height-body |
| text.body.md   | font-size-m | font-weight-regular | line-height-body |
| text.body.sm   | font-size-s | font-weight-regular | line-height-body |

#### Caption

| Semantic Token | Font Size    | Weight             | Line Height         |
| -------------- | ------------ | ------------------ | ------------------- |
| text.caption   | font-size-xs | font-weight-medium | line-height-caption |

### Usage Rules

1. UI must consume semantic tokens only.
2. Primitive font-size tokens must not be used directly in production components.
3. Line height must remain unitless.
4. Mixing font-size tokens within a single semantic role is prohibited.
5. Responsive adjustments must occur via root scaling, not per-token overrides.

### Future Expansion

- Letter-spacing tokens
- Responsive typography scale
- Mobile-specific heading scale
- Emphasis variants
- Numeric / tabular typography

## Spacing System

Spacing tokens define consistent layout rhythm across the system.

### Primitive Tokens

Primitive tokens store raw spacing values.

| Token      | rem      | px   |
| ---------- | -------- | ---- |
| space-xxxs | 0.125rem | 2px  |
| space-xxs  | 0.25rem  | 4px  |
| space-xs   | 0.5rem   | 8px  |
| space-s    | 0.75rem  | 12px |
| space-m    | 1rem     | 16px |
| space-l    | 1.25rem  | 20px |
| space-xl   | 1.5rem   | 24px |
| space-xxl  | 2rem     | 32px |
| space-xxxl | 2.5rem   | 40px |

All spacing values must use rem units.

### Semantic Tokens

Semantic tokens define contextual meaning.

#### Stack (Vertical Spacing)

Used for vertical spacing between stacked elements.

| Token            | References |
| ---------------- | ---------- |
| spacing.stack.xs | space-xs   |
| spacing.stack.sm | space-s    |
| spacing.stack.md | space-m    |
| spacing.stack.lg | space-l    |
| spacing.stack.xl | space-xl   |

#### Inline (Horizontal Spacing)

Used for spacing between inline or horizontal elements.

| Token             | References |
| ----------------- | ---------- |
| spacing.inline.xs | space-xs   |
| spacing.inline.sm | space-s    |
| spacing.inline.md | space-m    |
| spacing.inline.lg | space-l    |

#### Inset (Padding)

Used for internal component padding.

| Token            | References |
| ---------------- | ---------- |
| spacing.inset.sm | space-s    |
| spacing.inset.md | space-m    |
| spacing.inset.lg | space-l    |

#### Section Spacing

Used for major layout separation.

| Token              | References |
| ------------------ | ---------- |
| spacing.section.sm | space-xl   |
| spacing.section.md | space-xxl  |
| spacing.section.lg | space-xxxl |

### Layout Grid Baseline

Base spacing unit: 4px grid.

All spacing tokens align to 4px increments except space-xxxs (2px).

### Usage Rules

1. Production code must use semantic spacing tokens.
2. Primitive tokens must not be used directly in components.
3. Mixing arbitrary px values is prohibited.
4. Vertical rhythm must follow stack tokens.
5. Section spacing must not reuse inline spacing tokens.
6. Avoid using space-xxxs except for micro adjustments.

### Responsive Behavior

Spacing tokens remain constant across breakpoints.

Responsive adjustments should occur at semantic layer only.

Example:
spacing.section.md
→ space-xl on mobile
→ space-xxl on desktop (future expansion)

### Future Expansion

- Density modes (compact / comfortable)
- Fluid spacing
- Grid gap tokens
- Container padding tokens

## Radius System

Radius tokens define corner rounding across the UI.

They must be consistent and scale-based.

### Primitive Tokens

Primitive radius tokens store raw values.

All values are in rem.

| Token       | rem      | px (at 16px root) |
| ----------- | -------- | ----------------- |
| radius-none | 0rem     | 0px               |
| radius-xs   | 0.125rem | 2px               |
| radius-sm   | 0.25rem  | 4px               |
| radius-md   | 0.5rem   | 8px               |
| radius-lg   | 0.75rem  | 12px              |
| radius-xl   | 1rem     | 16px              |
| radius-full | 9999px   | pill/circle       |

Notes:

- `radius-full` is intentionally non-rem to guarantee pill/circle shapes.

### Semantic Tokens

Semantic tokens define intent-based rounding.

#### Interactive Controls

| Semantic Token         | References  |
| ---------------------- | ----------- |
| radius.control.default | radius-md   |
| radius.control.small   | radius-sm   |
| radius.control.pill    | radius-full |

#### Surfaces (Cards / Panels / Containers)

| Semantic Token           | References |
| ------------------------ | ---------- |
| radius.surface.default   | radius-lg  |
| radius.surface.subtle    | radius-md  |
| radius.surface.prominent | radius-xl  |

#### Media

| Semantic Token         | References  |
| ---------------------- | ----------- |
| radius.media.default   | radius-lg   |
| radius.media.thumbnail | radius-md   |
| radius.media.circle    | radius-full |

### Usage Rules

1. Production code must use semantic radius tokens.
2. Primitive radius tokens must not be used directly in components.
3. Do not introduce new rounding values outside the scale.
4. Use `radius-full` only for pill buttons, chips, avatars.
5. Avoid mixing multiple radius tiers in the same component unless structurally required.
6. Nested elements should not exceed parent radius (child radius ≤ parent radius).

### Accessibility & Interaction Notes

- Focus rings must follow the same radius as the control surface.
- Hit area must not be reduced by rounding styles.

### Future Expansion

- Density modes (compact / comfortable)
- Brand mode (more rounded vs more sharp)
- Component token mapping (button, input, card)

## Border System

Border tokens define stroke width, color usage, and structural emphasis.

### Primitive Tokens

Primitive tokens store raw stroke width values.

All values use rem units.

| Token               | rem       | px (at 16px root) |
| ------------------- | --------- | ----------------- |
| border-width-none   | 0rem      | 0px               |
| border-width-thin   | 0.0625rem | 1px               |
| border-width-medium | 0.125rem  | 2px               |
| border-width-thick  | 0.25rem   | 4px               |

Notes:

- `border-width-thin (1px)` is default UI stroke.
- 4px reserved for strong emphasis or highlight states.

### Semantic Tokens

#### Border Width

| Semantic Token  | References          |
| --------------- | ------------------- |
| border.default  | border-width-thin   |
| border.strong   | border-width-medium |
| border.focus    | border-width-medium |
| border.emphasis | border-width-thick  |

#### Border Color

These tokens reference color semantic tokens (not primitive palettes directly).

| Semantic Token       | References           |
| -------------------- | -------------------- |
| border.color.default | color.border.default |
| border.color.subtle  | color.border.subtle  |
| border.color.strong  | color.border.strong  |
| border.color.focus   | color.border.focus   |
| border.color.error   | color.status.error   |
| border.color.success | color.status.success |

### Border Composition Pattern

A border in production must combine:

border-width token

- border-color semantic token
- radius token

Example:

border.default + border.color.default + radius.control.default

---

### 8.5 Divider Tokens

Dividers are treated separately from structural borders.

| Semantic Token  | References                               |
| --------------- | ---------------------------------------- |
| divider.default | border-width-thin + color.border.subtle  |
| divider.strong  | border-width-thin + color.border.default |

### 8.6 Usage Rules

1. Primitive border widths must not be used directly in UI components.
2. All borders must use semantic color tokens.
3. Avoid using medium/thick borders in layout containers.
4. Focus borders must not rely solely on color contrast (consider outline).
5. Borders must align with spacing grid (4px baseline).
6. Border thickness must not exceed parent container radius visually.

### Accessibility Notes

- Focus borders must meet WCAG contrast against background.
- Disabled borders must not rely on color alone to communicate state.
- Error borders must be paired with semantic feedback (icon or message).

### Future Expansion

- Outline tokens (separate from border)
- Dashed / dotted stroke tokens
- High contrast mode adjustments
- Platform-specific adaptations

## Elevation System

Elevation represents visual hierarchy through controlled shadow usage.

Elevation tokens must never reference raw color values directly.

### Primitive Tokens

#### Shadow Opacity

| Token                 | Opacity |
| --------------------- | ------- |
| shadow-opacity-low    | 4%      |
| shadow-opacity-medium | 12%     |
| shadow-opacity-high   | 22%     |
| shadow-opacity-strong | 35%     |

#### Shadow Blur Scale

| Token          | Blur (px) |
| -------------- | --------- |
| shadow-blur-xs | 4px       |
| shadow-blur-sm | 8px       |
| shadow-blur-md | 16px      |
| shadow-blur-lg | 24px      |
| shadow-blur-xl | 40px      |

#### Shadow Offset Scale

| Token            | Offset Y |
| ---------------- | -------- |
| shadow-offset-xs | 1px      |
| shadow-offset-sm | 2px      |
| shadow-offset-md | 4px      |
| shadow-offset-lg | 8px      |
| shadow-offset-xl | 16px     |

X offset is always 0 for UI consistency.

### Semantic Elevation Tokens

These tokens define actual UI elevation levels.

#### Shadow Color Tokens (Defined in Color System)

Shadow color is derived from neutral palette.

| Semantic Token       | References |
| -------------------- | ---------- |
| color.shadow.base    | gray-900   |
| color.shadow.subtle  | gray-700   |
| color.shadow.inverse | black      |

Shadow color must always be applied via opacity modifier,
not via separate RGBA definitions.

#### Elevation Levels

| Semantic Token | Composition                          |
| -------------- | ------------------------------------ |
| elevation.none | none                                 |
| elevation.xs   | offset-xs + blur-xs + opacity-low    |
| elevation.sm   | offset-sm + blur-sm + opacity-low    |
| elevation.md   | offset-md + blur-md + opacity-medium |
| elevation.lg   | offset-lg + blur-lg + opacity-high   |
| elevation.xl   | offset-xl + blur-xl + opacity-strong |

#### Shadow Spread

Shadow spread is fixed to 0 unless explicitly required.

| Token              | Value |
| ------------------ | ----- |
| shadow-spread-none | 0px   |

All elevation tokens must use shadow-spread-none.

### Example CSS Mapping

Example: elevation-md

box-shadow:
0 var(--shadow-offset-md)
var(--shadow-blur-md)
0
rgba(
var(--color-shadow-base-rgb),
var(--shadow-opacity-medium)
);

Implementation Notes:

- color.shadow.base must be stored as RGB value for opacity control.
- Opacity must not be pre-baked into color tokens.
- Elevation tokens must generate complete box-shadow declarations.

### Layering Model

| UI Layer           | Elevation      |
| ------------------ | -------------- |
| Base layout        | elevation.none |
| Cards              | elevation.sm   |
| Floating panels    | elevation.md   |
| Dropdown / Popover | elevation.lg   |
| Modal              | elevation.xl   |

### Usage Rules

1. Components must use semantic elevation tokens.
2. Primitive shadow tokens must not be used directly.
3. Avoid stacking multiple elevation levels.
4. Do not mix elevation with border-heavy styling.
5. Elevation must decrease when component is pressed (active state).
6. Disabled elements must not cast shadow.

### Elevation vs Border Priority Rule

1. High elevation surfaces must use subtle borders.
2. Strong borders must not be combined with elevation above elevation-sm.
3. Modal and popover must rely primarily on elevation, not border thickness.

### Accessibility Notes

- Shadow must not be the sole method of state differentiation.
- High-contrast mode must remove elevation gracefully.
- Motion + elevation should be coordinated for clarity.

## Dark Mode Baseline Strategy (Experimental)

1. Background tokens invert hierarchy (default becomes gray-900).
2. Text tokens invert contrast (primary becomes gray-50).
3. Elevation opacity reduced by 30%.
4. Border colors shift one tier lighter.

## Icon
