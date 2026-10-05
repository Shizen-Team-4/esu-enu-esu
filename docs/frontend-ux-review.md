# Frontend UX / UI Review

**Date:** 2026-10-04
**Branch:** fix/search-escape-and-video-duration
**Measured against:** `CLAUDE.md` §5, `docs/api-frontend-audit.md` (open frontend items), `docs/api-contract.md`, `docs/responsive-ui-rules.md`
**Method:** read every route under `src/routes/**` and every component under `src/lib/components/**`. Screens were **not** rendered; a 390px / wide screenshot pass is still needed (CLAUDE.md §5).

The backend is in good shape (audit Phase 1–5 done). The frontend is the opposite: most screens are a raw stack of default-styled elements, several backend features have no UI at all, and some basic flows (log out, open a post, read comments) can't be done.

---

## 0. Decisions (answered 2026-10-04)

| #   | Topic                                                                                          | Decision                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Visual spec: CLAUDE.md §5 (Geist, white page, blue only) vs `app.css` / `sns-color-palette.md` | ✅ **Keep the current setup for now**: `app.css` tokens (Space Grotesk, palette incl. red like `accent`, dark theme). CLAUDE.md §5 visual style updated to match.                                                                      |
| D2  | Notifications nav slot vs contract "out of scope"                                              | ✅ **Agreed**: placeholder `/notifications` page with an empty state; note it in the contract.                                                                                                                                         |
| D3  | Where Reels live after the nav change                                                          | ✅ **No Reels nav entry.** Reels show in the home feed and the profile Reels tab; the mockup has no Reels.                                                                                                                             |
| D4  | Two homes (`/` vs `/dashboard`)                                                                | ✅ **Agreed**: the "Log in" panel on `/` is out of place. `/` becomes the logged-in feed (story tray + feed), logged-out visitors go to `/login`, `/dashboard` redirects to `/`, login lands on `/`.                                   |
| D5  | Design mockups                                                                                 | ✅ **Mobile / tablet follow the current responsive setup** (`responsive-ui-rules.md`, bottom nav, 390px reference). **Desktop follows the mockup** at `docs/design/sns-dashboard-mockup.html`, which covers only the Home/feed screen. |

### Mockup notes

- **Desktop layout (`lg` and up):** top header (logo left; bell, avatar and menu right), a centered search input under the header, and a 3-column grid. Left sidebar: "Your space" label, Home, Notifications, Bookmarks and a "Create post" primary button. Center column with left and right borders: stories section, For you / Following tabs, flat posts separated by thin borders. Right column: reserved and empty for now. Layout comes from the mockup; colors and fonts stay on the current tokens.
- **Mobile tab bar:** 5 labelled items; Create is a raised blue square; the active item has a top indicator line.
- **Left out (no backend yet, future work):** People to follow, Explore communities, re-share count, notification badge count; brand stays SNS.

---

## 1. Open frontend items from `api-frontend-audit.md` (re-checked in code)

| Audit item                                 | Status in code today                                                                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4. Feed scope / pagination / empty / error | ⬜ Not started. `/` and `/dashboard` load page 1 of `scope:"all"` only; no tabs, no load-more, no empty or error state.                                                                                   |
| 4. Header `getMe` avatar + logout          | ⬜ Not started. **There is no logout anywhere in the UI** (no `signOut` call in any `.svelte`/client file).                                                                                               |
| 5. Like / save / share UI                  | ⬜ Like button only renders when `interactive` (only `/dashboard`). `/`, `/p/[id]`, `/reels` are read-only although their routes export `like`. No save button anywhere. Share is a plain `<a href>`.     |
| 5. Optimistic update                       | ⬜ Like form has no `use:enhance` (`PostCard.svelte:37`) → full page reload and scroll jumps to top on every like.                                                                                        |
| 5. Bookmarks nav tab                       | ⬜ `/bookmarks` exists but is unreachable from any link.                                                                                                                                                  |
| 6. Post edit / delete UI                   | ⬜ `/p/[id]` exports `edit` and `delete`; the page renders neither.                                                                                                                                       |
| 7. Comments UI                             | ⬜ `/p/[id]` **loads** `comments` (`+page.server.ts:14`) but the page never renders them. No composer, no thread, no reply.                                                                               |
| 8. Followers / following lists             | ⬜ API exists; counts in `ProfileHeader` are plain text.                                                                                                                                                  |
| 8. Avatar upload                           | ⬜ Settings only has a "remove avatar" checkbox.                                                                                                                                                          |
| 1. Profile grid pagination                 | ⬜ Routes accept `?cursor=`; no UI.                                                                                                                                                                       |
| 11. Happy-path e2e                         | ⬜ Only `tests/e2e/auth-guard.test.ts` and `home.test.ts`.                                                                                                                                                |
| 12. Nav order / destinations               | ⬜ Still Home, Reels, Create, Search, Profile (`Navigation.svelte:4`). Blocked on D2/D3.                                                                                                                  |
| 12. Hatch band                             | ⬜ None. Posts are `.panel` rounded cards.                                                                                                                                                                |
| 12. Media rules                            | ⬜ `PostGrid` and all avatars use `object-cover`; story media uses `rounded-card`; gallery is scroll-snap with no arrows or `2 / 5` counter.                                                              |
| 12. Hard-coded strings / inline styles     | ⬜ `SNS` hard-coded in `Header`, `Navigation`, `/`, `/dashboard`, `/login`, `/p/[id]`. Inline `style="max-width: …"` in `bookmarks`, `reels`, `search`, `profile`, `u/[username]`, `settings`, `stories`. |
| 12. Video viewer, comment thread UI        | ⬜ Not started.                                                                                                                                                                                           |

---

## 2. Global problems (affect every screen)

These are the main reason every screen "looks messy". Fixing them first removes most of the mess before touching single pages.

### 2.1 App shell

- **Nav and header render on every page**, including login, register, forgot/reset password, onboard and the story viewer (`+layout.svelte:20`). Logged-out users see nav links to protected pages that bounce them back to login. Story viewer is not immersive.
  → Use route groups: `(app)` with header + nav, `(auth)` centered single column without nav, `(viewer)` full-screen dark without nav.
- **Header has no identity.** Only `SNS` (mobile) and a settings icon. No avatar, no profile link, no logout.
- **Nav active state is invisible.** `aria-current` is set but no style uses it, and it only matches exact paths (`/u/x`, `/p/x`, `/stories/x` never highlight anything).
- **No `+error.svelte`.** `toHttpError` 404/500s land on SvelteKit's unstyled default page with no way back.
- **Most pages have no `<title>`** (only `/`, `/dashboard`, `/bookmarks`, `/create` set one).

### 2.2 Global CSS fights the design

- `app.css:76-99` styles **every** `button` and `.button` as a bordered 44px pill, and every submit as solid blue. Result: every link that uses `.button` (`SNS`, `Register`, `Reset`, `Log in`, profile tabs, "Load more", share) looks like the same boxed button — "button soup" on every screen.
  → Remove element-level button styles; add `Button` (primary / secondary / ghost) and `IconButton` components.
- `h1` is `clamp(2rem, …, 3.5rem)` globally (`app.css:129`) → 56px headings for "Search", "Bookmarks", a user's display name on `/dashboard`, etc.
  → Small type scale tokens (e.g. title 20px, body 16px, meta 13px).
- `.panel` (rounded 1.5rem + border + padding) is used for posts, search results, forms and auth pages. Violates "posts are flat".
- `.container` gives 16px gutters; CLAUDE.md wants 12px outer gutter and content 24px from the edge.
- Each page invents its own width (`630px`, `935px`, `44rem`, `36rem`, `32rem`), so content jumps width and position when switching tabs. `/dashboard`'s feed is `max-width: 36rem` with no `margin-inline: auto` → left-aligned on desktop while other pages are centered.
  → One content-column token (feed/profile/detail) used by all `(app)` pages.
- Font is Space Grotesk; Geist is not installed (D1).
- `button[aria-pressed='true']` turns any pressed button red (D1).

### 2.3 Interaction model

- Almost no form uses `use:enhance` (like, follow, story delete, auth links). Every tap is a full page reload that loses scroll position — this is the main reason the UX feels "unusable".
- No pending / disabled state on any action except auth submit and upload.
- No success feedback (settings save, comment posted, profile updated) — need a `Toast` / inline status.
- No confirmation before destructive actions (story delete; post/comment delete when built).
- "Load more" links (`/bookmarks`, `/reels`, `/search`) navigate to `?cursor=` which **replaces** page 1 instead of appending; there is no way back to earlier items except the browser back button.

---

## 3. Screen by screen

Each screen lists **Missing** (functionality), **UX** (flow problems) and **UI** (visual problems).

### 3.1 `/` Home (logged out and logged in)

- **Missing:** like / save / comment entry points, following / all switch, pagination, empty + error state.
- **UX:** Shows a marketing panel with "Log in" **even when logged in**. Feed is read-only. Users land on `/dashboard` after login, so Home and "where I land" differ (D4).
- **UI:** On mobile `SNS` appears three times (Header link, page `<header>` link, `<h1>`). Huge `h1`. Posts are rounded cards.

### 3.2 `/dashboard`

- **Missing:** "Add story" bubble for yourself in the story tray; empty / error states; pagination.
- **UX:** A `SNS` button that goes to `/` plus the user's name as a giant `h1` — neither is useful. Duplicate of Home (D4).
- **UI:** Feed left-aligned at 36rem on wide screens. Story tray avatars use `object-cover` + generic rings.

### 3.3 `PostCard` (used by `/`, `/dashboard`, `/reels`, `/p/[id]`)

The single most important component; it needs a full rewrite.

- **Missing:** author avatar; link to author profile; post time; **link to the post detail page** (nothing in the feed links to `/p/[id]`, so comments are unreachable); comment count / button; save button; owner menu (edit / delete).
- **UX:** Like reloads the page. "Share" is a link that navigates away instead of Web Share API / copy link. Like is plain text when not `interactive`.
- **UI:** Caption is above the media; text buttons (`Like · 3`, `Share`) instead of an icon action bar; gallery is scroll-snap with no arrows or `2 / 5` counter; no hatch fill around media; native `<video controls>`.
- **Target structure:** `PostHeader` (avatar, name, time, `…` menu) → `MediaCarousel` (contain + hatch, arrows, counter) → `PostActions` (like, comment, share, save; optimistic) → caption + "View all N comments" → `HatchBand` separator.

### 3.4 `/p/[id]` Post detail

- **Missing:** comment thread (data already loaded), reply composer, edit caption, delete post, back button.
- **UX:** Only a `SNS` button and a read-only PostCard. Like is disabled although the route exports `like`.
- **UI:** Should follow CLAUDE.md §5 Comments: two visual levels, solid reply lines, focused branch with dashed ancestor lines, "N replies" / "Hide replies", sticky composer above the nav and keyboard.

### 3.5 `/create` Composer

- **Missing:** media previews; remove / reorder selected files; per-file upload progress; caption character counter (2200).
- **UX:**
  - Post type is a `<select>` that becomes locked after upload, with no "start over" control.
  - Upload starts as soon as files are picked; after one failure `failed` stays true and Publish stays disabled until files are re-picked, with no hint why.
  - Caption is hidden for stories with no explanation.
  - No preview of what will be published.
- **UI:** Raw `<input type="file">`; everything inside a rounded panel. Use a segmented control (Post / Reel / Story), a large drop / pick area with thumbnails (contain + hatch), then caption, then a sticky Publish button.

### 3.6 `/search`

- **Missing:** avatars and follow buttons in results; "no users found" state; idle state (recent / suggestions or a hint).
- **UX:** Must press a submit button; `required` blocks empty submit; no search-as-you-type. "Load more" replaces results.
- **UI:** Each result is a rounded `.panel` card containing a blue link. Use flat `UserRow` (avatar, display name, @username, follow button) separated by thin borders.

### 3.7 `/reels`

- **Missing:** the dark video viewer (CLAUDE.md §5 Video): portrait → controls beside video, square / landscape → controls below, comments in a white bottom sheet with the video shrinking above it.
- **UX:** It is just a list of normal PostCards with native video controls. No auto-play when in view, no vertical snap. No `<title>`.
- **UI:** Same card problems as PostCard. Not in the target nav (D3).

### 3.8 `/profile` and `/u/[username]`

- **Missing:** "Edit profile" + settings / logout on your own profile; clickable followers / following counts (lists); share profile; grid pagination; "no posts yet" empty state.
- **UX:**
  - `/profile` duplicates `/u/<me>`; prefer redirecting `/profile` → `/u/<me>`.
  - Follow / Unfollow reloads the page and looks identical in both states (both solid blue submit). "Following" should be a secondary style.
  - Error alert renders above the header, far from the button that caused it.
- **UI:**
  - `@username` is the `h1`; display name is small below — swap the hierarchy.
  - Tabs are bordered `.button` boxes with no active indicator; use icon / text tabs with an underline for the active one.
  - Grid uses `object-cover` (crops) — violates the media rule; use contain + hatch. Text-only posts show a clamped caption on a white square.
  - Reel badge `▶` is a text glyph in a white box.

### 3.9 `/bookmarks`

- **Missing:** nav entry (unreachable today); remove-from-saved; empty-state illustration / CTA.
- **UX:** "Load more" replaces page 1.
- **UI:** Inline `max-width: 935px`; giant `h1`; same grid issues as profile.

### 3.10 `/stories/[username]`

- **Missing:** progress bars per story; tap-left / tap-right zones; auto-advance (image timer, video end); jump to next user's stories at the end; delete confirmation.
- **UX:**
  - Rendered inside the normal shell (header + bottom nav visible).
  - "Close" always goes to `/dashboard`, not back to where the user came from.
  - Prev / Next are text buttons below the media.
  - Expired-story message replaces everything with a sentence and no way forward.
- **UI:** Should be a full-screen dark viewer. Media uses `rounded-card` (only comment bubbles may be rounded).

### 3.11 `/login`

- **UX:**
  - Google sign-in sits at the very bottom after the Register and Reset buttons, with no "or" divider.
  - "Register" and "Forgot password" are full bordered buttons that compete with the primary Log in button; they should be text links ("Forgot password?" next to the password field, "No account? Sign up" below the form).
  - No password show / hide toggle.
- **UI:** `SNS` button at the top of the card; bottom nav and header visible. The audit marks the hard-coded `#ffffff` as fixed, but it is still there (`login/+page.svelte:52`, `.google-logo`).

### 3.12 `/register`, `/forgot-password`, `/reset-password`

- **UX:**
  - Register success shows generic `auth.success`; it should say "check your email to verify" and offer resend.
  - Username rule (`[a-z0-9_]{3,30}`) is only an HTML `pattern` → browser's English tooltip, not i18n, and the rule isn't shown as a hint.
  - No Google option on register.
  - Forgot-password page is titled with the "reset" label; reset page doesn't handle a missing / expired token before the form is filled.
  - After a successful reset there is no redirect to login.
- **UI:** `class="container panel"` on `<main>`; "Log in" is a bordered button under the form; no brand; nav visible.

### 3.13 `/onboard`

- **UX:** Username hint / rules not shown; no display-name step; nav visible though every other page redirects here.
- **UI:** Same panel layout; fine once the auth layout exists.

### 3.14 `/settings`

- **Missing:** **Log out**; avatar upload (only a remove checkbox); success feedback after save; link to it from the profile page.
- **UX:**
  - Preferences need an explicit Save; theme / language could apply instantly.
  - Account form: label then input then error with no grouping; bio has no counter.
  - Page is public (not in `protectedRoots`), which is fine for preferences but the account section silently disappears when logged out.
- **UI:** Two rounded panels; theme options are cards but language options are full-width rows (inconsistent). Should be a flat sectioned list: Account, Appearance, Language, Log out.

---

## 4. Missing pages and shared components

### Pages

| Page                           | Why                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `/notifications` (placeholder) | Required nav slot (D2).                                                                                     |
| Followers / following list     | Page or bottom sheet from profile counts (audit 8).                                                         |
| Edit profile                   | Either a section of `/settings` or `/settings/profile`, reachable from own profile; includes avatar upload. |
| `+error.svelte`                | Styled 404 / 500 with a way home.                                                                           |
| Video / reel viewer            | CLAUDE.md §5 Video.                                                                                         |
| Logout action                  | No UI path exists today.                                                                                    |

### Components (CLAUDE.md §5 guard rails ask for these to be separate)

`AppShell` / route-group layouts · `Header` with `AvatarMenu` · `Navigation` (5 items) · `Button`, `IconButton` · `Avatar` (no crop rule decided — see note) · `HatchBand` · `MediaCarousel` · `PostHeader`, `PostActions`, `PostMenu` · `CommentThread`, `CommentItem`, `ReplyComposer` · `BottomSheet` · `ConfirmDialog` · `Tabs` / `SegmentedControl` · `UserRow` · `EmptyState`, `ErrorState` (with retry) · `Toast` · `LoadMore` (append, not replace) · `StoryViewer`, `StoryProgress` · `VideoViewer`.

Plain TS modules with unit tests (CLAUDE.md §5): `carousel-index.ts`, `aspect-ratio-class.ts`, `comment-thread.ts` (flatten / focus branch), `feed-pager.ts` (append + cursor), `optimistic-toggle.ts` (like / save / follow).

> Note: avatars are circles; whether `object-cover` is allowed for avatars (not media) needs one line added to CLAUDE.md §5. Recommend: allowed for avatars only.

---

## 5. Suggested build order

Each phase is independently shippable and testable at 390px and wide.

1. **Foundations** — keep the current color tokens (D1) and add type scale, gutter and content-width tokens; delete global button / `.panel` / `h1` styles; `Button`, `IconButton`, `Avatar`, `HatchBand`; route groups `(app)` / `(auth)` / `(viewer)`; new `Navigation` + `Header` with avatar menu and **logout**; `+error.svelte`; titles.
2. **Feed** — unify `/` and `/dashboard`; rewrite `PostCard` (header, carousel, action bar with optimistic like / save, share, link to detail); following / all tabs; append pagination; empty / error states.
3. **Post detail + comments** — thread UI, reply composer, owner menu with edit / delete + confirm.
4. **Profile** — header hierarchy, tabs, grid contain + hatch, edit-profile entry, follow states, followers / following lists, pagination, avatar upload in settings.
5. **Create** — segmented type, picker with previews / progress / remove, caption counter.
6. **Viewers** — story viewer (full screen, progress, tap zones), reel / video viewer with bottom-sheet comments.
7. **Remaining screens** — auth pages, search (`UserRow`, live search), bookmarks, settings, notifications placeholder.
8. **E2E** — login → post → like → comment → follow → story happy path (audit 11), plus nav order and carousel tests (audit 12).
