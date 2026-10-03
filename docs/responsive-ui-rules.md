# Responsive UI Rules: SvelteKit + TypeScript

Guidelines for building responsive web applications with SvelteKit (Svelte 5) and TypeScript.

---

## 1. Mobile-First

Write base styles for the smallest screen, then layer on larger screens with `min-width` media queries.

```css
.card {
	padding: 1rem;
}

@media (min-width: 768px) {
	.card {
		padding: 2rem;
	}
}
```

## 2. CSS First, JS Second

- Use **CSS** for layout, spacing, visibility and typography.
- Use **JS** (a media-query helper) only when the _structure or behavior_ changes, for example a drawer on mobile vs. a sidebar on desktop.

## 3. Content-Driven Breakpoints

Add a breakpoint where the layout actually breaks, not for specific devices. Keep a small, shared set of breakpoints.

| Token | Min width |
| ----- | --------- |
| `sm`  | 640px     |
| `md`  | 768px     |
| `lg`  | 1024px    |
| `xl`  | 1280px    |

```ts
// src/lib/breakpoints.ts
export const breakpoints = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
} as const

export type Breakpoint = keyof typeof breakpoints
```

## 4. Fluid Over Fixed

Prefer flexible units and functions over fixed pixel widths:

- `rem`, `%`, `fr`
- `clamp()`, `min()`, `max()`
- `minmax()` and `auto-fit` in grids

```css
:root {
	--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
	--text-h1: clamp(1.75rem, 1.2rem + 2.5vw, 3rem);
	--container: min(100% - 2rem, 72rem);
}

.grid {
	display: grid;
	gap: 1rem;
	grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
}
```

## 5. Components Own Their Responsiveness

Use **container queries** so a component adapts to the space it is given, not the viewport size.

```svelte
<div class="card-wrap">
	<article class="card">…</article>
</div>

<style>
	.card-wrap {
		container-type: inline-size;
	}
	.card {
		display: grid;
		gap: 1rem;
	}

	@container (min-width: 480px) {
		.card {
			grid-template-columns: 8rem 1fr;
		}
	}
</style>
```

## 6. SSR-Safe

The server does not know the screen size.

- Never access `window` / `document` outside `onMount`, `$effect` or a `browser` check from `$app/environment`.
- Prefer CSS (`display: none` in a media query) over JS conditionals for show/hide, to avoid hydration flicker.

```svelte
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity'
	import { breakpoints } from '$lib/breakpoints'

	const isDesktop = new MediaQuery(`min-width: ${breakpoints.md}px`)
</script>

{#if isDesktop.current}
	<nav>Desktop nav</nav>
{:else}
	<button>Menu</button>
{/if}
```

> On Svelte 4, use a store wrapping `window.matchMedia`, guarded by `browser`.

## 7. Touch and Accessibility

- Tap targets of at least **44×44px**.
- Body and input text of at least **16px** (smaller triggers iOS zoom on focus).
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Keep full keyboard navigation working in both mobile and desktop layouts.

```css
@media (prefers-reduced-motion: reduce) {
	* {
		animation: none !important;
		transition: none !important;
	}
}
```

## 8. Viewport and Mobile Units

```html
<!-- src/app.html -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

- Use `100dvh` instead of `100vh` so mobile browser bars don't cause jumps.
- For notches, add `viewport-fit=cover` and `padding: env(safe-area-inset-bottom)`.

## 9. Responsive Media

```svelte
<img
	src="/hero-800.webp"
	srcset="/hero-480.webp 480w, /hero-800.webp 800w, /hero-1600.webp 1600w"
	sizes="(min-width: 1024px) 50vw, 100vw"
	alt="Hero"
	loading="lazy"
	width="800"
	height="450"
/>
```

- Always set `width` and `height` to prevent layout shift.
- Global reset: `img, video { max-width: 100%; height: auto; }`.
- `@sveltejs/enhanced-img` can generate sizes automatically.

## 10. Tables and Data-Heavy Views

Wrap tables in a scroll container, or switch to a card layout on small screens.

```css
.table-wrap {
	overflow-x: auto;
}
```

---

## Layout Pattern (Grid Shell)

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css'
	let { children } = $props()
</script>

<div class="shell">
	<header>…</header>
	<aside>…</aside>
	<main class="container">{@render children()}</main>
	<footer>…</footer>
</div>

<style>
	.shell {
		display: grid;
		min-height: 100dvh;
		grid-template-areas: 'header' 'main' 'footer';
		grid-template-rows: auto 1fr auto;
	}
	aside {
		display: none;
	}

	@media (min-width: 1024px) {
		.shell {
			grid-template-columns: 16rem 1fr;
			grid-template-areas:
				'header header'
				'aside  main'
				'footer footer';
		}
		aside {
			display: block;
			grid-area: aside;
		}
	}
	header {
		grid-area: header;
	}
	main {
		grid-area: main;
	}
	footer {
		grid-area: footer;
	}
</style>
```

---

## Common Pitfalls

| Problem                           | Fix                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `window is not defined`           | Use `browser` from `$app/environment`, or only touch `window` in `onMount` / `$effect`            |
| Flash of the wrong layout on load | Use CSS media queries for show/hide instead of JS conditionals                                    |
| `100vh` jumps on mobile           | Use `100dvh`                                                                                      |
| Horizontal scrolling              | Check wide elements (tables, images, code blocks) and add `overflow-x: auto` or `max-width: 100%` |
| Content hidden behind notches     | Use `env(safe-area-inset-*)` with `viewport-fit=cover`                                            |

---

## Testing Checklist

- [ ] Test at 320, 375, 768, 1024 and 1440px, plus landscape orientation
- [ ] No horizontal scroll at any width
- [ ] Layout holds at 200% zoom
- [ ] Keyboard-only navigation works on mobile and desktop nav
- [ ] Verified in Chrome DevTools device mode and on a real phone
- [ ] Playwright projects configured with different `viewport` sizes in `playwright.config.ts`

---

## Quick Summary

1. Mobile-first, `min-width` queries.
2. CSS for layout, JS only for structural changes.
3. Few, content-driven breakpoints.
4. Fluid units: `clamp()`, `minmax()`, `auto-fit`.
5. Container queries for reusable components.
6. SSR-safe: no `window` outside `onMount` / `$effect`.
7. 44px tap targets, 16px text, respect user preferences.
8. `100dvh`, safe areas, proper viewport meta.
9. Responsive images with explicit dimensions.
10. Scrollable or card-based tables on small screens.
