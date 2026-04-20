# ShopEase Design System

A complete visual + UX specification for the ShopEase online shopping system. Written as an implementation-ready handoff: every token has a HEX (and HSL where relevant), a usage rule, and a concrete Tailwind name so developers can pick it up without re-inventing anything.

> **Version 1.0** · Applies to the React + Tailwind frontend under `frontend/`. All tokens below are also mirrored in `frontend/tailwind.config.js` and `frontend/src/index.css` so designers and developers share a single source of truth.

---

## 1. Brand & Aesthetic

### Personality

| Axis | ShopEase is… | …not |
|---|---|---|
| Tone | Clean, premium, trustworthy, with a touch of playful energy | Corporate-stiff, gimmicky, loud |
| Visual | Modern minimalism, bold typography, generous whitespace, soft shadows, smooth micro-interactions | Flat/boring, template-y, overly decorated |
| Voice | Direct and confident, short sentences, cheerful punctuation only where warranted | Jargon-heavy, salesy, exclamation-heavy |
| Memorable device | A warm deep-indigo primary paired with a coral accent; shapes lean on generous `2xl` radii and a signature "lift" shadow on hover | Generic "Shopify-blue" |

### Signature moves (use to make the brand feel distinct)

- **Lift-on-hover**: every card raises 2 px with a softer, longer shadow at 180 ms ease-out. Products, shops, and notifications all share this single motion.
- **Sticker ribbons**: deal badges use the coral accent with a `full` radius and a subtle rotate (-2°), not a square red banner.
- **Display type in short bursts**: H1/H2 use the display font only; body stays in the humanist sans for readability.
- **Grid rhythm**: 8-pt base unit; content columns align to a 4-col / 8-col / 12-col responsive grid at 360 / 768 / 1280 breakpoints.

---

## 2. Color System

All colors are defined on an HSL scale so shade generation is consistent and palette theming in dark mode is predictable. HEX values shown for copy-paste.

### 2.1 Primary — Indigo Royal (brand)

Warmer, deeper, more confident than a generic "Tailwind blue". Conveys premium trust without going corporate-cold.

| Token | HEX | HSL | Usage |
|---|---|---|---|
| `primary-50`  | `#EEF1FF` | `230 100% 97%` | Subtle info backgrounds, hover pills |
| `primary-100` | `#DCE3FE` | `229 95% 93%`  | Chip backgrounds, badge bg on hover |
| `primary-200` | `#BBC8FC` | `227 92% 86%`  | Disabled primary, dividers in branded regions |
| `primary-300` | `#91A6F9` | `226 90% 77%`  | Focus ring (light), decorative |
| `primary-400` | `#6682F3` | `225 86% 68%`  | Illustrations, gradients |
| `primary-500` | `#4762E9` | `228 78% 59%`  | Primary buttons (default) |
| `primary-600` | `#3548D0` | `230 59% 51%`  | Primary buttons (hover), links |
| `primary-700` | `#2B3AA6` | `231 59% 41%`  | Pressed state, high-emphasis text on light bg |
| `primary-800` | `#222E80` | `231 58% 32%`  | Headlines in dark sections |
| `primary-900` | `#1A2460` | `230 56% 25%`  | Dark-mode surface accent |

**Usage rules**

- Only use `primary-500` / `primary-600` for primary actions; reserve `primary-700+` for text/icons on light surfaces.
- Never stack `primary-500` on `primary-600` (poor contrast). Pair with white, `neutral-50`, or `neutral-900`.
- Gradients: `linear-gradient(135deg, primary-500 → primary-700)` — use for hero sections and chat-widget header.

### 2.2 Secondary — Teal Horizon

A calm, modern partner to the primary; use for informational emphasis (shop cards, "followed" state, "verified" badges) so the indigo primary isn't overloaded.

| Token | HEX | HSL | Usage |
|---|---|---|---|
| `secondary-50`  | `#EEFBFA` | `175 69% 96%` | Tag/chip background |
| `secondary-100` | `#CEF4F0` | `173 66% 88%` | Hover on secondary buttons |
| `secondary-300` | `#6DDDCE` | `172 60% 65%` | Illustrations, icons |
| `secondary-500` | `#13B5A1` | `172 80% 39%` | Secondary buttons default, success-adjacent states |
| `secondary-600` | `#0F9383` | `172 82% 32%` | Secondary button hover, "followed" pill |
| `secondary-700` | `#0B6E63` | `172 81% 24%` | Dark text/emphasis on light backgrounds |

### 2.3 Accent — Coral Spark

Playful, energetic; reserved for conversion moments (deal badges, CTAs that sell, limited-stock hints). Never more than ONE accent usage per screen region.

| Token | HEX | HSL | Usage |
|---|---|---|---|
| `accent-50`  | `#FFF1EC` | `17 100% 96%` | "New" / "Trending" tag bg |
| `accent-300` | `#FFAF93` | `17 100% 79%` | Illustration strokes |
| `accent-500` | `#FF6B3D` | `16 100% 62%` | Deal ribbons, "Buy now" CTA |
| `accent-600` | `#E54F22` | `12 81% 52%`  | Hover on accent CTAs |
| `accent-700` | `#B63B17` | `12 79% 40%`  | Pressed / emphasis text |

### 2.4 Neutrals — Warm Graphite

A warm neutral scale (slight +3° hue) so pages feel less clinical than standard Tailwind gray. All body text, backgrounds, and borders come from here.

| Token | HEX | HSL | Usage |
|---|---|---|---|
| `neutral-0`   | `#FFFFFF` | `0 0% 100%`   | Page background (light mode) |
| `neutral-50`  | `#F8F8F7` | `40 6% 97%`   | App shell background, muted cards |
| `neutral-100` | `#F1F0EE` | `35 8% 94%`   | Hover bg, disabled surfaces |
| `neutral-200` | `#E5E3DF` | `35 9% 89%`   | Borders, dividers |
| `neutral-300` | `#D2D0CB` | `36 7% 80%`   | Input borders |
| `neutral-400` | `#A09E98` | `36 4% 61%`   | Placeholder text, tertiary icons |
| `neutral-500` | `#6B6963` | `36 4% 40%`   | Secondary text, captions |
| `neutral-600` | `#4B4945` | `36 5% 28%`   | Body text |
| `neutral-700` | `#34332F` | `40 5% 19%`   | Headings |
| `neutral-800` | `#1F1E1C` | `40 5% 12%`   | High-emphasis headings, dark mode shell |
| `neutral-900` | `#0F0F0E` | `60 3% 6%`    | Dark mode page background |

### 2.5 Semantic

Always refer to semantic tokens for state; never hard-code Tailwind colors for errors/warnings etc.

| Token | HEX | HSL | Usage |
|---|---|---|---|
| `success-50`  | `#EAFBF0` | `138 68% 95%` | Success toast bg |
| `success-500` | `#1DB954` | `138 74% 42%` | Success icon, checkmarks |
| `success-700` | `#12793A` | `140 73% 27%` | Success text on light bg |
| `warning-50`  | `#FFF8E6` | `44 100% 95%` | Warning banner bg |
| `warning-500` | `#F5A623` | `36 92% 55%`  | Warning icon, caution labels |
| `warning-700` | `#A86D0E` | `37 85% 36%`  | Warning text |
| `error-50`    | `#FDECEC` | `0 74% 95%`   | Error banner, destructive hover |
| `error-500`   | `#E5484D` | `358 72% 59%` | Destructive actions, form errors |
| `error-700`   | `#A52A2F` | `358 59% 41%` | Error text |
| `info-50`     | `#EAF4FF` | `211 100% 96%` | Info banner bg |
| `info-500`    | `#2E86F5` | `214 91% 57%` | Info icons |
| `info-700`    | `#1554A6` | `213 78% 37%` | Info text |

### 2.6 Dark mode palette

The design shifts to a near-black (`neutral-900`) canvas with **elevated surfaces** rather than lightening the background. This preserves the premium feel.

| Purpose | Light | Dark |
|---|---|---|
| Page background | `neutral-0` | `neutral-900` |
| Surface / card  | `neutral-0` | `#1A1A18` (`neutral-850`, computed token) |
| Elevated surface | `neutral-50` + shadow | `#232320` + shadow-dark |
| Primary text | `neutral-800` | `#F2F1EE` |
| Secondary text | `neutral-500` | `neutral-400` |
| Border | `neutral-200` | `#2E2D2A` |
| Primary action | `primary-600` | `primary-400` (lighter for legibility) |
| Accent | `accent-500` | `accent-400` |
| Focus ring | `primary-500` @ 40% | `primary-300` @ 60% |

Implementation: dark mode is opt-in via the `.dark` class on `<html>` plus a `useDarkMode()` hook that persists to `localStorage` under `shopease.theme` (values: `light` | `dark` | `system`).

### 2.7 Accessibility

- All text tokens meet **WCAG AA** against their intended background (tested with 4.5:1 for body, 3:1 for large text ≥18px).
- `primary-500` on white = 4.8 ✓ · `neutral-500` on white = 4.6 ✓ · `accent-500` on white = 3.1 (large text only).
- Focus ring is 2px `primary-500` @ 40% alpha, with a 2px offset in the page background color.

---

## 3. Typography

Two-font pairing: a distinctive display, and a workhorse humanist sans that's crisp at small sizes.

### 3.1 Families

| Role | Family | Fallback stack | Load strategy |
|---|---|---|---|
| Display | **Fraunces** (variable, Google Fonts) | `'Fraunces', 'Source Serif Pro', Georgia, serif` | Self-host variable font, preloaded for first-paint headings |
| Body    | **Inter** (variable) | `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif` | Same; loaded as `font-display: swap` |
| Mono    | **JetBrains Mono** | `'JetBrains Mono', ui-monospace, Menlo, monospace` | Only for order IDs and prices that need tabular digits |

- Fraunces is warmer and more distinctive than Playfair/Recoleta while staying editorial-friendly.
- Inter at `font-feature-settings: "ss01","cv05","cv11"` gives single-story `a` and straight quotes for a more modern stance.
- All price displays use `font-variant-numeric: tabular-nums` so digits don't jitter when the currency switches.

### 3.2 Type scale (1.25 — "major third")

| Token  | Size / line-height         | Weight | Family  | Usage |
|--------|----------------------------|--------|---------|-------|
| `display-1` | 64/68 px (4 / 4.25rem) | 700    | Display | Landing hero only |
| `h1`        | 40/44 px (2.5 / 2.75rem) | 700    | Display | Page title (once per page) |
| `h2`        | 32/36 px (2 / 2.25rem)   | 700    | Display | Section title |
| `h3`        | 24/28 px (1.5 / 1.75rem) | 600    | Display | Subsection / card group title |
| `h4`        | 20/24 px (1.25 / 1.5rem) | 600    | Body    | Card title, modal title |
| `h5`        | 18/24 px (1.125 / 1.5rem)| 600    | Body    | List group headers |
| `h6`        | 16/20 px (1 / 1.25rem)   | 600    | Body    | Form legends |
| `body-lg`   | 18/28 px                 | 400    | Body    | Hero support text |
| `body`      | 16/24 px                 | 400    | Body    | Default reading text |
| `body-sm`   | 14/20 px                 | 400    | Body    | Secondary labels, table rows |
| `caption`   | 12/16 px                 | 500    | Body    | Metadata, timestamps |
| `label`     | 12/16 px (uppercase, letter-spacing 0.08em) | 600 | Body | Form labels, chip labels |
| `price-lg`  | 28/32 px (tabular-nums)  | 700    | Body    | Product detail price |
| `price`     | 18/24 px (tabular-nums)  | 700    | Body    | Card price |

### 3.3 Text-color rules

| Situation | Token |
|---|---|
| Headlines on light | `neutral-800` |
| Body on light | `neutral-700` |
| Secondary text / captions | `neutral-500` |
| Disabled | `neutral-400` |
| Links | `primary-600`, underline on hover only |
| Error inline | `error-700` |

---

## 4. Spacing & Layout

### 4.1 Scale (8-pt base, plus 4-pt half-step)

| Token | px | rem | Common uses |
|---|---|---|---|
| `space-0`  | 0   | 0       | — |
| `space-1`  | 4   | 0.25    | Icon ↔ label gap |
| `space-2`  | 8   | 0.5     | Tight stacks, inside-badge padding |
| `space-3`  | 12  | 0.75    | Input vertical padding |
| `space-4`  | 16  | 1       | Default element spacing |
| `space-5`  | 20  | 1.25    | Section padding inside cards |
| `space-6`  | 24  | 1.5     | Card padding, section gaps |
| `space-8`  | 32  | 2       | Between card rows |
| `space-10` | 40  | 2.5     | Between major sections |
| `space-12` | 48  | 3       | Hero vertical padding (sm) |
| `space-16` | 64  | 4       | Hero vertical padding (lg) |
| `space-24` | 96  | 6       | Page bottom padding (desktop) |

### 4.2 Responsive grid

- Base: 4-column, 16 px gutter (mobile ≤640 px)
- Tablet: 8-column, 24 px gutter (641–1023 px)
- Desktop: 12-column, 32 px gutter (≥1024 px)
- Max content width: `1280 px` (`max-w-7xl`), centered

### 4.3 Breakpoints (match Tailwind defaults)

| Token | min-width |
|---|---|
| `sm` | 640 px |
| `md` | 768 px |
| `lg` | 1024 px |
| `xl` | 1280 px |
| `2xl` | 1536 px |

---

## 5. Radii & Shape

Generous corners throughout — reinforces "premium + friendly".

| Token | px | Usage |
|---|---|---|
| `radius-xs` | 4   | Tags, checkboxes |
| `radius-sm` | 6   | Inline chips |
| `radius-md` | 10  | Inputs, small buttons |
| `radius-lg` | 14  | Buttons (default), small cards |
| `radius-xl` | 20  | Cards, modals |
| `radius-2xl`| 28  | Hero surfaces, chat widget |
| `radius-full`| 9999 | Avatars, badges, pill buttons |

Avatars use `radius-full`. Product images use `radius-xl` and crop inside; never force square images.

---

## 6. Elevation & Shadows

Four-level system. All shadows use the neutral scale with a tint toward primary for warmth.

| Token | Values | Usage |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(16, 18, 36, 0.04)` | Input focus subtle lift |
| `shadow-sm` | `0 1px 3px rgba(16, 18, 36, 0.06), 0 1px 2px rgba(16, 18, 36, 0.04)` | Cards at rest |
| `shadow-md` | `0 8px 24px -8px rgba(16, 18, 36, 0.12), 0 2px 6px rgba(16, 18, 36, 0.06)` | Cards on hover ("lift") |
| `shadow-lg` | `0 20px 40px -16px rgba(16, 18, 36, 0.18), 0 4px 12px rgba(16, 18, 36, 0.08)` | Dropdowns, popovers |
| `shadow-xl` | `0 28px 64px -24px rgba(16, 18, 36, 0.24), 0 8px 20px rgba(16, 18, 36, 0.10)` | Modals, chat widget |
| `shadow-ring-primary` | `0 0 0 3px rgba(71, 98, 233, 0.30)` | Focus ring on primary surfaces |

**Dark mode shadows** drop the alpha (values ×0.6) and tint toward pure black since the background is dark already.

---

## 7. Motion

### 7.1 Durations

| Token | ms | When to use |
|---|---|---|
| `duration-instant` | 80   | Checkbox toggles, tiny visual feedback |
| `duration-fast`    | 150  | Hover states, icon spins |
| `duration-base`    | 220  | **Default**; button ↔ card transitions |
| `duration-slow`    | 320  | Modals open/close, tab-panel cross-fade |
| `duration-lazy`    | 500  | Page enter animations (hero) |

### 7.2 Easings

| Token | cubic-bezier | Purpose |
|---|---|---|
| `ease-standard` | `0.2, 0, 0, 1`  | Default for enter/exit |
| `ease-decel`    | `0, 0, 0.2, 1`  | Things coming onto screen |
| `ease-accel`    | `0.4, 0, 1, 1`  | Things leaving screen |
| `ease-spring`   | `0.175, 0.885, 0.32, 1.275` | Playful; reserved for "Add to cart" confirmation bounce |

### 7.3 Motion rules

- **Respect `prefers-reduced-motion`**: disable scale/translate animations, keep opacity transitions at `duration-fast`.
- Never animate `width`/`height` of layout blocks; animate `transform` and `opacity` only.
- Concurrent animations share a single duration to avoid visual dissonance — never one at 150 ms and another at 400 ms on the same interaction.
- Page transitions between routes: 220 ms cross-fade; no slide (causes nausea on wide screens).

### 7.4 Signature micro-interactions

| Interaction | Recipe |
|---|---|
| Card hover lift | `transform: translateY(-2px); box-shadow: shadow-md;` over `duration-base, ease-standard` |
| Add to cart confirmation | Icon pulses once (scale 1 → 1.15 → 1 over 320 ms, `ease-spring`); small success toast slides up from `translateY(8px)` with `duration-base` |
| Currency switch | The price number does a 120 ms vertical 4 px slide-in + opacity cross-fade |
| Chat new message | Message bubble enters from `translateY(8px) scale(0.96)` with `duration-base`, `ease-decel` |
| Button press | `transform: scale(0.98)` held while pressed (`duration-fast`) |

---

## 8. Iconography

- Library: **Lucide Icons** (already in use). Weight: 2 px stroke.
- Sizes: `16` (inline), `20` (default), `24` (prominent), `32` (feature block), `48` (empty states).
- Colors track text color by default (`currentColor`); semantic icons (success/warning/error) use the semantic token at 500.
- Custom icons must match Lucide's feel: rounded linecaps, 24×24 viewport, 2 px stroke, no filled shapes except inside the bounds of the icon's own form.

### Empty-state illustrations

- **Style**: flat, 2-tone, using `primary-200` + `neutral-300` + a single `accent-500` highlight.
- **Composition**: simple geometric objects (box, bag, package, tag), no human figures — keeps it brand-agnostic and localizable.
- **Format**: ship as inline SVG so the colors can be tokenized (no PNGs).
- Use for: empty cart, no search results, no orders yet, no notifications.

---

## 9. Component Recipes

These inform how design tokens compose into the actual UI. Consider them normative.

### 9.1 Button

| Variant | Bg (rest) | Bg (hover) | Bg (press) | Text | Border | Radius | Padding |
|---|---|---|---|---|---|---|---|
| Primary | `primary-500` | `primary-600` | `primary-700` | `neutral-0` | none | `radius-lg` | `10 / 20 px` |
| Secondary | `neutral-0` | `neutral-50` | `neutral-100` | `neutral-700` | `1px neutral-200` | `radius-lg` | `10 / 20 px` |
| Ghost | transparent | `neutral-100` | `neutral-200` | `neutral-700` | none | `radius-lg` | `10 / 16 px` |
| Destructive | `error-500` | `error-700` | `error-700` | `neutral-0` | none | `radius-lg` | `10 / 20 px` |
| Accent CTA | `accent-500` | `accent-600` | `accent-700` | `neutral-0` | none | `radius-lg` | `12 / 24 px` |

All sizes: `sm` (8/16), `md` (10/20, default), `lg` (14/28). All buttons animate scale on press, shadow on hover.

### 9.2 Input

- Height 44 px (touch-friendly), `radius-md`, border `neutral-200`.
- Focus: border `primary-500` + `shadow-ring-primary`.
- Error: border `error-500`, helper text `error-700`.
- Labels above input, 12 px `label` style, 8 px gap to input.

### 9.3 Card

- `neutral-0` bg, `1px neutral-200` border, `radius-xl`, `shadow-sm` at rest.
- Hover: `shadow-md`, `translateY(-2px)`. Only for *actionable* cards — static info cards don't lift.

### 9.4 Badge / Tag

- Pill-shaped (`radius-full`), 20 px tall, 4/10 px padding, `caption` type.
- Soft variant: `color-100` bg + `color-700` text (e.g. `primary-100` bg + `primary-700` text).
- Solid variant: `color-500` bg + `neutral-0` text (used only for deal ribbons).

### 9.5 Toast

- 48 px min-height, `radius-lg`, `shadow-lg`, slides up from bottom-right.
- Icon (20 px) + title (`body-sm` bold) + description (`caption`).
- Auto-dismiss after 4 s; pauses on hover; can be dismissed manually.

### 9.6 Modal

- `neutral-0` bg, `radius-2xl`, `shadow-xl`, max 560 px width centered.
- Backdrop: `neutral-900` @ 45% alpha with `backdrop-blur(8px)`.
- Animation: opacity + `scale(0.96 → 1)` over `duration-slow`, `ease-standard`.
- Always trap focus; ESC closes.

### 9.7 Chat widget

- Header uses `linear-gradient(135deg, primary-500, primary-700)` — the brand's signature gradient.
- Bubble (own): `primary-500` bg, white text, `radius-xl` with `rounded-br-md` corner notch.
- Bubble (other): `neutral-0` bg, `neutral-700` text, `1px neutral-200` border, notch on `bottom-left`.

---

## 10. UX Patterns

### 10.1 Information hierarchy

Every page must expose, in order, top to bottom:
1. A **title** (`h1`) that names what the user is looking at.
2. A **subtitle/support** (`body-sm neutral-500`) that answers "why am I here?".
3. A **primary action** on the right of the title bar — except on purely informational pages.
4. Filters/controls in their own sticky row if the page has lists longer than 10 items.

### 10.2 Feedback

- Every data-mutating action shows either an optimistic UI update or a toast within 220 ms.
- Destructive actions always require confirmation, but the confirmation modal shows the *consequences*, not just "Are you sure?".

### 10.3 Loading

- Use **skeleton screens** (not spinners) for content load > 150 ms.
- Skeletons use `neutral-100` → `neutral-200` shimmer at 1.8 s linear.
- Spinners only for button states ("Processing…").

### 10.4 Empty states

- Illustration + one-sentence reason + a single primary CTA.
- Never show empty tables with headers; replace the whole section with the empty-state block.

### 10.5 Errors

- Inline for form fields (under the input, `error-700`, 12 px).
- Banner for page-level (top of content, `error-50` bg, `error-500` icon, dismissible).
- Toast for transient background failures.

### 10.6 Notifications

- Bell icon badge count shows unread only; caps at "9+".
- Clicking a chat-message notification routes to the correct message thread (business → `/business?tab=messages&conversation=…`; customer → `/shops/:shopId?openChat=1` with widget auto-open).
- Other notification links resolve directly to their `notif.link`.

### 10.7 Currency switching

- Header dropdown; triggered by a `Globe` icon and the active code (e.g. `HKD`).
- Dropdown lists four currencies with symbol + code + full name.
- Footer inside dropdown: "Prices are stored in HKD and converted using static demo rates." — sets expectations.

---

## 11. Accessibility

- All interactive elements reachable via keyboard; visible focus ring always on.
- Minimum touch target: 44 × 44 px.
- Color alone never communicates state — always paired with an icon and text.
- `alt` text required on product images; decorative imagery gets `alt=""`.
- `aria-live="polite"` region for cart updates and toast notifications.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` for system theme default.

---

## 12. Token reference (handoff cheat sheet)

### 12.1 Tailwind class map

| Purpose | Tailwind class |
|---|---|
| Primary bg button | `bg-primary-500 hover:bg-primary-600 active:bg-primary-700` |
| Primary text link | `text-primary-600 hover:text-primary-700` |
| Card surface | `bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm` |
| Hover lift | `transition-all duration-base ease-standard hover:-translate-y-0.5 hover:shadow-md` |
| Heading 1 | `font-display text-4xl leading-tight font-bold text-neutral-800 dark:text-neutral-50` |
| Body | `font-sans text-base leading-6 text-neutral-700 dark:text-neutral-300` |
| Price | `font-sans text-lg font-bold tabular-nums` |
| Focus ring | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` |

### 12.2 CSS variables

Defined on `:root` in light mode and overridden on `html.dark`:

```css
:root {
  --color-bg:          #FFFFFF;
  --color-surface:     #FFFFFF;
  --color-surface-2:   #F8F8F7;
  --color-text:        #34332F;
  --color-text-muted:  #6B6963;
  --color-border:      #E5E3DF;
  --color-primary:     #4762E9;
  --color-primary-fg:  #FFFFFF;
  --color-accent:      #FF6B3D;
  --radius-card:       20px;
  --shadow-card:       0 1px 3px rgba(16,18,36,.06), 0 1px 2px rgba(16,18,36,.04);
  --shadow-lift:       0 8px 24px -8px rgba(16,18,36,.12), 0 2px 6px rgba(16,18,36,.06);
  --duration-base:     220ms;
  --ease-standard:     cubic-bezier(0.2, 0, 0, 1);
}

html.dark {
  --color-bg:          #0F0F0E;
  --color-surface:     #1A1A18;
  --color-surface-2:   #232320;
  --color-text:        #F2F1EE;
  --color-text-muted:  #A09E98;
  --color-border:      #2E2D2A;
  --color-primary:     #6682F3;
  --color-primary-fg:  #0F0F0E;
  --color-accent:      #FF8F6E;
}
```

---

## 13. Implementation priorities

Suggested rollout order if adopting this system on an existing codebase:

1. **Tokens in config** — update `tailwind.config.js` and `index.css` with the palette/type/shadow/motion above. Zero UI change for now, just wiring.
2. **Typography upgrade** — add Fraunces + Inter, apply display font to H1/H2.
3. **Dark-mode infrastructure** — add the `useDarkMode()` hook and a toggle next to the currency selector in the header.
4. **Card & button pass** — migrate `.card`, `.btn-primary`, `.btn-secondary`, `.input-field` in `index.css` to the new tokens. Most pages update automatically.
5. **Hero + landing** — refresh `Home.jsx` with the new display typography, signature gradient, and empty-state illustration style.
6. **Lists (Products, Orders, Shops)** — apply the card hover lift, update badges to the new soft/solid recipe.
7. **Chat + notifications** — re-skin with the new gradient and bubble corners.
8. **Business Dashboard** — redesign tab bar (larger, underline moves), update chart palettes to the new tokens.
9. **A11y pass** — focus rings, skip links, reduced-motion.

---

## 14. Glossary

- **Token**: a named, reusable value (color, spacing, radius, shadow, duration).
- **Soft variant**: a low-saturation badge/chip that uses `color-100` bg + `color-700` text.
- **Solid variant**: a full-intensity badge using `color-500` bg + `neutral-0` text.
- **Lift**: the signature hover treatment — 2 px upward translate + shadow upgrade.

---

*End of spec. Questions? This doc is the source of truth — if the code disagrees, update the code or propose a PR to this spec first.*
