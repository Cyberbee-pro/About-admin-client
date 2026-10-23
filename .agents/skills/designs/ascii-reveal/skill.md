---
name: ascii-reveal
description: Implement the `ascii-reveal` React library, a loading and reveal effect where text, images, canvas, video and whole cards decode into place through an ASCII character grid, plus the `AsciiSkeleton` ASCII skeleton loader. Use this skill whenever the user mentions ascii-reveal, AsciiReveal, AsciiSkeleton, an ASCII/decode/scramble/matrix-style reveal or loading animation, ASCII skeletons or shimmer placeholders, ASCII loading mascots (spider, ghost, pumpkin, bat), or wants content to "decode in" when data loads, even if they don't name the package. Covers install, wrapping content, loading states, skeletons, SSR/Next.js, theming, replay from code, the vanilla `ascii-reveal/core` API, and common pitfalls.
---

# ascii-reveal

A React loading effect. Content decodes into place through a character grid in one wave across the page. Source of truth: https://github.com/quanhoangindex/ascii-reveal (live demo: https://quanhoangindex.github.io/ascii-reveal/).

## How it works (read first)

The real content always stays in the DOM in its real position. The scramble is drawn on a canvas layer *above* it. Three consequences drive correct usage:

1. **No layout shift and no restructuring.** Wrap existing markup. Never rebuild a layout around the library or position content manually.
2. **Accessibility is already handled.** Screen readers read the real text throughout, and `prefers-reduced-motion` turns the reveal into a short fade. Don't add extra aria workarounds for the effect.
3. **Everything inside the wrapper participates.** Every text node, `<img>`, `<canvas>` and `<video>` in the subtree is animated unless excluded. Scope it deliberately (see "Scoping").

Package facts: no dependencies, about 15 KB gzipped with all mascots and the skeleton, one canvas per reveal, one shared animation loop. React 17+ is a peer dependency. The React entry is marked `"use client"`, so it works with the Next.js App Router.

## Install

```bash
npm i ascii-reveal
# or straight from GitHub (dist/ is committed, no build step needed)
npm i github:quanhoangindex/ascii-reveal
```

Check the project's package manager (lockfile) and use the matching command (`pnpm add`, `yarn add`, `bun add`). Confirm React is 17 or newer before installing.

## Choose the pattern

| Situation | Use |
| --- | --- |
| Content is already available; reveal it when it mounts | `<AsciiReveal>` with defaults |
| Data loads asynchronously; show the effect when it arrives | `<AsciiReveal loading={...} revealOnMount={false}>` |
| Need a placeholder that paints instantly (SSR, no JS) | `<AsciiSkeleton>` |
| Placeholder, then decode the real content in | `<AsciiReveal loading={!data}>` wrapping a skeleton/content ternary |
| Animated character while loading instead of shimmer | `mascot` prop |
| Replay on click or from code | `ref` with `reveal()` / `hide()` |
| No React | `createAsciiReveal` from `ascii-reveal/core` |

## Recipes

### 1. Reveal on mount

```tsx
import { AsciiReveal } from 'ascii-reveal';

export function Page() {
  return (
    <AsciiReveal preset="decode">
      <article className="card" data-ascii="surface">
        <img src="/cover.jpg" alt="" />
        <h2>Hello world</h2>
        <button data-ascii="fade">Read more</button>
      </article>
    </AsciiReveal>
  );
}
```

### 2. Loading state on specific values

Use `selector` to limit which content animates, and `revealOnMount={false}` so nothing animates before the data state is meaningful.

```tsx
const { data, isLoading } = useQuery(/* ... */);

<AsciiReveal loading={isLoading} selector="[data-value]" revealOnMount={false}>
  <dd data-value>{data?.latency ?? '—'}</dd>
</AsciiReveal>
```

When `loading` becomes `true`, matching content scrambles out and a shimmer runs where the data will land. When it becomes `false`, the new content decodes in.

### 3. Skeleton only

Drop-in replacement for a gray skeleton. Content appears normally when it arrives.

```tsx
import { AsciiSkeleton } from 'ascii-reveal';

{data ? <Profile data={data} /> : <AsciiSkeleton lines={3} />}
```

### 4. Skeleton plus reveal

```tsx
import { AsciiReveal, AsciiSkeleton } from 'ascii-reveal';

<AsciiReveal loading={!data}>
  {data ? <Profile data={data} /> : <AsciiSkeleton lines={3} />}
</AsciiReveal>
```

The reveal never animates the skeleton itself. It leaves it alone while loading and decodes the content that replaces it. Keep the ternary inside the wrapper, and drive `loading` from the same condition as the ternary.

### 5. Mascots

```tsx
<AsciiReveal loading={isLoading} mascot="spider">  {/* spider | ghost | pumpkin | bat */}
  <Stats data={data} />
</AsciiReveal>

<AsciiReveal loading={isLoading} mascot="/logo.svg">…</AsciiReveal>
```

`mascot` accepts a built-in name, an SVG URL, SVG markup, or a draw function `(ctx, w, h, t, color) => void`. Set `--ascii-mascot` to recolor the line-art mascots. A mascot replaces the shimmer while loading and dissolves as content decodes in.

### 6. Replay from code

```tsx
import { useRef } from 'react';
import { AsciiReveal, type AsciiRevealHandle } from 'ascii-reveal';

const ref = useRef<AsciiRevealHandle>(null);

<AsciiReveal ref={ref}>…</AsciiReveal>

// replay one card from where it was clicked
ref.current?.reveal({ within: cardElement, origin: { x: e.clientX, y: e.clientY } });
ref.current?.hide();
```

`origin` coordinates are viewport pixels (`clientX`/`clientY`).

### 7. Without React

```ts
import { createAsciiReveal, asciiSkeletonHTML } from 'ascii-reveal/core';

const reveal = createAsciiReveal(document.querySelector('#app')!, { preset: 'dither' });
reveal.reveal();
await reveal.hide();
reveal.shimmer(true);

el.innerHTML = asciiSkeletonHTML({ lines: 3 });
```

## `AsciiReveal` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `preset` | `'decode' \| 'dither' \| 'terminal' \| 'blueprint' \| Preset` | `'decode'` | Glyph set, timing, image style |
| `duration` | `'fast' \| 'cinematic'` | `'fast'` | `fast` is readable in about 400 ms; `cinematic` is slower, for hero sections |
| `speed` | `number` | `1` | Multiplier on top of `duration` |
| `origin` | `'center' \| 'top-left' \| 'pointer' \| { x, y }` | `'center'` | Wave start; `{x, y}` in viewport px |
| `selector` | `string` | none | Only animate content inside matching elements |
| `revealOnMount` | `boolean` | `true` | Reveal on mount |
| `loading` | `boolean` | none | Scramble out and shimmer while `true`; decode in on `false` |
| `shimmer` | `boolean` | `true` | Glyph shimmer while loading |
| `lazy` | `boolean` | `true` | Below-the-fold sections decode as they scroll into view |
| `revealOnHydrate` | `boolean` | `false` | Also animate server-rendered content |
| `fallback` | `boolean` | `true` | If frames run slow, finish and use a short fade for the next 10 s |
| `mascot` | `'spider' \| 'ghost' \| 'pumpkin' \| 'bat' \| string \| MascotDraw` | none | Mascot instead of shimmer |
| `onRevealComplete` | `() => void` | none | Fires when a reveal finishes |
| `as` | `ElementType` | `'div'` | Wrapper element; other props pass through to it |

Presets: `decode` (light-to-dense glyphs, then lock to real value), `dither` (block shading, images keep their colors), `terminal` (cursor leads each character, binary-style scramble), `blueprint` (line glyphs in the accent color). A custom preset is an object with the `Preset` shape: `ramp`, `scramble`, `mode`, `color`, `cells`, `tick`.

## `AsciiSkeleton`

- Static HTML and CSS: paints on the first frame, renders on the server, needs no JavaScript, reserves the space the content will take. Patterns are deterministic, so there are no hydration warnings.
- Shape a paragraph with `lines` and `widths`. Make a block for an image or avatar with `rows`, `width`, `height`, `circle`.
- `variant`: `dither` (default, shaded blocks `░▒▓█`), `scan` (dots with a dense scrambling band, matches `decode`), `braille` (fine dot texture), `terminal` (faint 0s and 1s lit in `--ascii-accent`).
- With reduced motion, the sweep stops.

```tsx
<AsciiSkeleton variant="braille" lines={3} />
<AsciiSkeleton variant="dither" rows={6} width={64} height={64} circle />
```

## Marking elements

| Attribute | Effect |
| --- | --- |
| `data-ascii="surface"` | Cards and panels: dot field and corner frame first, then the surface fades in |
| `data-ascii="fade"` | Buttons, chips, badges: fade in on the wave |
| `data-ascii="media"` | Treat any element as media (glyph texture) |
| `data-ascii="skip"` | Leave the subtree alone |
| `data-ascii-digits` | Scramble only through digits (automatic for numeric text) |

Put `data-ascii="skip"` on anything that must stay interactive and visible during the effect, such as a toolbar. Use `surface` on card containers and `fade` on buttons and badges so they don't get treated as plain text.

## Theming

Set CSS custom properties on the wrapper or any ancestor:

```css
.my-app {
  --ascii-accent: #5b8cff;   /* cursor and blueprint glyphs */
  --ascii-skeleton: #888;    /* AsciiSkeleton glyph color (defaults to text color) */
  --ascii-flash: #5b8cff;    /* optional: brief color as each character lands */
  --ascii-glyph: #888;       /* scramble glyph color (defaults to text color at 50%) */
  --ascii-font: "Geist Mono", ui-monospace, monospace;
  --ascii-surface: #0b0b0d;  /* color behind transparent images if detection is wrong */
  /* --ascii-mascot: recolors the line-art mascots */
}
```

Match `--ascii-accent` and `--ascii-surface` to the project's existing design tokens rather than inventing new colors. For dark themes, check that transparent images look right and set `--ascii-surface` if not.

## Server rendering and Next.js

- Server-rendered content is never hidden on hydration, since it is already readable. Don't "fix" this. Set `revealOnHydrate` only if the user explicitly wants the effect on first paint.
- Client-side navigations and `loading` transitions animate as usual.
- In the App Router, import from `ascii-reveal` in client components or rely on its built-in `"use client"` entry. `AsciiSkeleton` is safe in server-rendered output.

## Pitfalls checklist

Verify each before declaring the integration done.

- [ ] **Wrapper scope is intentional.** Wrapping a whole app animates everything. Wrap the section, or use `selector`, or mark exceptions with `data-ascii="skip"`.
- [ ] **Loading pattern uses `revealOnMount={false}`** when the effect should only fire on data arrival.
- [ ] **Skeleton lives inside the reveal wrapper** (not beside it) for the skeleton-plus-reveal pattern, and `loading` mirrors the same condition.
- [ ] **Wrapper size doesn't change mid-reveal.** Layout is measured once at start; if the wrapper resizes during a reveal, the reveal finishes instantly instead of drawing misplaced.
- [ ] **Late-loading fonts:** start the reveal after `document.fonts.ready`, since measurement uses the loaded font.
- [ ] **Cross-origin images** without CORS headers can't be sampled; they render through a neutral glyph texture. Add CORS headers or accept the fallback.
- [ ] **Interactive controls** that must stay usable during the effect are marked `data-ascii="skip"`.
- [ ] **Icons** drawn with `currentColor` stay visible while text is hidden; this is expected.
- [ ] **Slow devices:** the watchdog finishes the reveal if 8 frames exceed 45 ms, then uses fades for the next reveals. This is expected behavior, not a bug.
- [ ] **Reduced motion** produces a short fade by design.
- [ ] **Pausing own effects:** an `asciireveal` event (`detail: { active }`) bubbles from the wrapper when animation starts and stops.

## Implementation workflow

1. Inspect the project: framework (Vite, CRA, Next.js App Router or Pages), React version, package manager, styling approach, and how data is fetched (React Query, SWR, `useEffect`, server components).
2. Install `ascii-reveal` with the project's package manager.
3. Identify the smallest subtree that should animate. Wrap it. Don't restructure its markup.
4. Pick the pattern from the table above. Prefer the plain defaults first; add `preset`, `duration`, `origin`, `mascot` only when asked or clearly useful.
5. Add `data-ascii` attributes to cards, buttons and anything that must be skipped.
6. Wire `loading` to the real loading flag from the data layer. Don't invent a fake delay.
7. Apply theming through CSS variables using existing design tokens.
8. Run the type check and build. Open the page, confirm the reveal plays once, no layout shift occurs, and the page remains usable.
9. Briefly tell the user which pattern was used, where the wrapper sits, and any attributes added.

## Rules for the implementing agent

- Use only the API documented above. Do not guess prop names, presets, mascots, or attributes; if something isn't listed here, check the repo README or `dist/` types in `node_modules/ascii-reveal`.
- Make minimal, faithful changes to existing components: wrap and annotate rather than rewrite.
- Don't claim performance numbers beyond the README's: fast mode reads in about 400 ms, repaint is about 30 fps, and the package is about 15 KB gzipped.
- When unsure about behavior, point the user to the live demo (https://quanhoangindex.github.io/ascii-reveal/, skeleton section at `#skeleton`) and the CHANGELOG rather than guessing.

## Development reference (only if modifying the library itself)

```bash
npm install
npm run build        # builds dist/
npm test             # browser smoke test (npx playwright install chromium first)
npm run demo         # demo site (cd demo && npm install first)
```

License: MIT.