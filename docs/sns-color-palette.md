# SNS UI Color Palette (Tailwind v4 + Svelte + TypeScript)

Primary color: sky blue `#12A9F2`. It stays the same in light and dark mode.

## 1. Color Tokens

| Tailwind name  | Use                              | Light     | Dark      |
| -------------- | -------------------------------- | --------- | --------- |
| `primary`      | Buttons, sent bubble, map pin    | `#12A9F2` | `#12A9F2` |
| `on-primary`   | Text on primary                  | `#0B1B2B` | `#0B1B2B` |
| `primary-soft` | Chips, tags, highlights          | `#E6F6FE` | `#0F2A3A` |
| `link`         | Blue text, links, pressed state  | `#0369A1` | `#5CC4F7` |
| `background`   | Page background                  | `#F5F5F5` | `#0F0F12` |
| `surface`      | Cards                            | `#FFFFFF` | `#1C1C1F` |
| `elevated`     | Modals, inputs                   | `#FFFFFF` | `#2A2A2E` |
| `bubble-in`    | Received bubble                  | `#EBEBEB` | `#2C2C30` |
| `fg`           | Main text                        | `#1C1C1E` | `#F2F2F7` |
| `fg-muted`     | Secondary text                   | `#6B6B70` | `#9A9AA1` |
| `line`         | Border, divider                  | `#E5E5EA` | `#2E2E33` |
| `accent`       | Like (heart), notification badge | `#FF3040` | `#FF4D5E` |
| `danger`       | Error                            | `#EF4444` | `#F87171` |
| `success`      | Success                          | `#22C55E` | `#4ADE80` |

## 2. Setup

### Step 1: `src/app.css`

```css
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));

:root {
	--primary: #12a9f2;
	--on-primary: #0b1b2b;
	--primary-soft: #e6f6fe;
	--link: #0369a1;
	--background: #f5f5f5;
	--surface: #ffffff;
	--elevated: #ffffff;
	--bubble-in: #ebebeb;
	--fg: #1c1c1e;
	--fg-muted: #6b6b70;
	--line: #e5e5ea;
	--accent: #ff3040;
	--danger: #ef4444;
	--success: #22c55e;
}

.dark {
	--primary: #12a9f2;
	--on-primary: #0b1b2b;
	--primary-soft: #0f2a3a;
	--link: #5cc4f7;
	--background: #0f0f12;
	--surface: #1c1c1f;
	--elevated: #2a2a2e;
	--bubble-in: #2c2c30;
	--fg: #f2f2f7;
	--fg-muted: #9a9aa1;
	--line: #2e2e33;
	--accent: #ff4d5e;
	--danger: #f87171;
	--success: #4ade80;
}

@theme inline {
	--color-primary: var(--primary);
	--color-on-primary: var(--on-primary);
	--color-primary-soft: var(--primary-soft);
	--color-link: var(--link);
	--color-background: var(--background);
	--color-surface: var(--surface);
	--color-elevated: var(--elevated);
	--color-bubble-in: var(--bubble-in);
	--color-fg: var(--fg);
	--color-fg-muted: var(--fg-muted);
	--color-line: var(--line);
	--color-accent: var(--accent);
	--color-danger: var(--danger);
	--color-success: var(--success);
	--radius-card: 1.5rem;
}
```

### Step 2: Theme toggle, `src/lib/theme.svelte.ts` (Svelte 5)

```ts
type Theme = 'light' | 'dark'

function apply(t: Theme) {
	document.documentElement.classList.toggle('dark', t === 'dark')
	localStorage.setItem('theme', t)
}

function getInitial(): Theme {
	if (typeof window === 'undefined') return 'light'
	const saved = localStorage.getItem('theme') as Theme | null
	if (saved) return saved
	return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const theme = $state<{ current: Theme }>({ current: getInitial() })

export function toggleTheme() {
	theme.current = theme.current === 'dark' ? 'light' : 'dark'
	apply(theme.current)
}
```

### Step 3: Prevent white flash, `src/app.html` (inside `<head>`)

```html
<script>
	const t =
		localStorage.getItem('theme') ??
		(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
	document.documentElement.classList.toggle('dark', t === 'dark')
</script>
```

### Step 4: Use in components

```svelte
<script lang="ts">
	import { toggleTheme } from '$lib/theme.svelte'
	let { text, mine = false }: { text: string; mine?: boolean } = $props()
</script>

<div class="bg-background text-fg p-4">
	<p
		class="max-w-xs rounded-3xl px-4 py-2
    {mine ? 'bg-primary text-on-primary' : 'bg-bubble-in text-fg'}"
	>
		{text}
	</p>

	<a href="/trips" class="text-link">View trips</a>
	<span class="rounded-full bg-primary-soft text-link px-3 py-1 text-xs">2 slots left</span>
	<button class="text-accent" aria-label="Like">♥</button>
	<button onclick={toggleTheme} class="rounded-card bg-surface border border-line p-3">
		Toggle theme
	</button>
</div>
```

If you use Tailwind v3, move the `@theme` colors into `tailwind.config.ts` with `darkMode: 'class'` and keep the CSS variables in `app.css`.

## 3. Design Prompt

```text
Design a responsive social network UI (mobile app and website) that looks like Instagram, built with Svelte 5, TypeScript, and Tailwind CSS v4. Mobile-first. Support light and dark mode with a "dark" class on the html element. Use only the color tokens below (as Tailwind names like bg-primary, text-fg, border-line). Do not use any other colors.

COLOR TOKENS (light / dark)
- primary: #12A9F2 / #12A9F2 (buttons, active states, verified badge)
- on-primary: #0B1B2B / #0B1B2B (text and icons on primary; never white)
- primary-soft: #E6F6FE / #0F2A3A (chips, tags, soft highlights)
- link: #0369A1 / #5CC4F7 (blue text and links)
- background: #F5F5F5 / #0F0F12 (page)
- surface: #FFFFFF / #1C1C1F (cards, bottom bar, header)
- elevated: #FFFFFF / #2A2A2E (modals, inputs, search field)
- bubble-in: #EBEBEB / #2C2C30 (received chat bubble)
- fg: #1C1C1E / #F2F2F7 (main text and icons)
- fg-muted: #6B6B70 / #9A9AA1 (secondary text)
- line: #E5E5EA / #2E2E33 (borders and dividers)
- accent: #FF3040 / #FF4D5E (liked heart and notification badge only)
- danger: #EF4444 / #F87171 (errors only)
- success: #22C55E / #4ADE80

GENERAL STYLE
- Follow the Instagram layout and spacing: clean, content-first, thin 1px borders, rounded media, simple line icons (2px stroke).
- No stories. Do not add a stories row or story rings. Avatars are plain circles.
- Font: Space Grotesk or Poppins. Rounded corners of 24px on cards and media.
- Text on primary backgrounds always uses on-primary.

HOME FEED
- Top header (surface background, bottom border line): app wordmark on the left, notification icon (heart outline) and messages icon (paper plane) on the right. On the website the wordmark moves to the sidebar, and the header keeps only the two icons, right-aligned above the feed.
- Feed of post cards, one per row, full width:
  - Post header: avatar, username (bold) with a verified badge in primary, time (fg-muted), location below the username (fg-muted), "..." menu on the right.
  - Media: square or 4:5 image with 24px rounded corners and a 1px line border.
  - Action row: heart, comment, share (paper plane) on the left, save (bookmark) on the right. The heart is outline in fg and turns filled accent when liked.
  - Below: likes count (bold), caption (username bold + text), "View all comments" in fg-muted, and post time in fg-muted.

NAVIGATION (5 items only, same items on every screen size)
1. Home
2. Reels
3. Create (center on mobile): a "+" button
4. Search
5. Profile (small round avatar)
- The active item is filled or highlighted in fg. The Create button is the center item on mobile and uses a primary background with on-primary icon.
- No messages tab in the navigation.
- Mobile (below 768px): fixed bottom bar, surface background, top border line, items in a row.
- Website (768px and up): the bottom bar becomes a fixed left sidebar (surface background, right border line, full height).
  - Sidebar top: app wordmark (on tablet widths, 768px to 1279px, show a small logo mark only).
  - Items stacked vertically in the same order: Home, Reels, Create, Search, Profile.
  - Tablet widths (768px to 1279px): icons only, sidebar about 72px wide.
  - Desktop widths (1280px and up): icon + label, sidebar about 240px wide.
  - Item style: 12px radius, hover background elevated, active item has bold label and filled icon in fg.
  - Create keeps the primary background with on-primary icon (and label on desktop). In the sidebar it is the third item, not centered.
  - Profile item shows the small round avatar.

PROFILE PAGE (open from the Profile tab, Instagram profile layout)
- Header: username with a down arrow on the left, create (+) and menu (three lines) icons on the right.
- Top section: large round avatar on the left, then three stats in a row: posts, followers, following (bold number above a fg-muted label).
- Below: display name (bold), bio (fg), link in link color.
- Buttons in one row: "Edit profile" and "Share profile" (equal width, elevated background, fg text, 12px radius). On other users' profiles: "Follow" (primary background, on-primary text) and "Message" (elevated background).
- Tab bar with three icons: grid (posts), reels, tagged. The active tab has a 2px fg underline.
- Content: 3-column square grid with 2px gaps. Reels tiles show a small play icon in the corner.
- Same navigation as the feed (bottom bar on mobile, sidebar on website), with Profile active.
- Website: profile content is centered with max-width 935px, a larger avatar, and 3-column grid tiles with 4px gaps.

OUTPUT
- Provide Svelte components: Header, PostCard, Navigation (one component that renders the bottom bar on mobile and the sidebar on website using Tailwind breakpoints), ProfileHeader, ProfileTabs, PostGrid, plus the two pages (Home and Profile).
- Use sample data and gradient placeholders for images.
- Layout: mobile is full width. On website, the feed is centered with max-width 630px next to the sidebar, with the page background behind it.
- Use Tailwind responsive classes (md: and xl:). Do not duplicate components for each screen size.
```
