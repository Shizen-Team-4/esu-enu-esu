# CLAUDE.md

Rules Claude must follow when writing code in this repository. They apply to every change. If a rule can't be followed, stop and explain why before writing code.

Stack: SvelteKit 2 + Svelte 5, TypeScript, Cloudflare Workers (D1, KV), Drizzle ORM, Vitest, Playwright, pnpm.

Read first when the task touches them: [`docs/api-contract.md`](docs/api-contract.md), [`docs/backend-requirements.md`](docs/backend-requirements.md), [`docs/db-schema.md`](docs/db-schema.md).

---

## 1. Clean Architecture

Code is split into layers. **Dependencies point inward only**: outer layers may import inner layers, never the reverse.

```
routes (+server.ts, +page.server.ts, .svelte)   ← delivery / UI
        ↓
infrastructure (Drizzle, D1, KV, R2, email)     ← adapters
        ↓
application (use cases + ports)                 ← orchestration
        ↓
domain (entities, value objects, rules)         ← pure business logic
```

### Folder layout (backend)

Group by feature first, then by layer:

```
src/lib/server/
  <feature>/                 e.g. posts/, comments/, settings/
    domain/                  entities, value objects, validation, pure rules
    application/             use cases and port interfaces
    infrastructure/          Drizzle repositories and other adapters
  shared/                    cross-feature code: AppError, Result type, Clock, IdGenerator
  db/                        Drizzle client and schema (already exists)
  container.ts               composition root: builds use cases from platform.env
```

Existing files that don't follow this layout (e.g. `src/lib/server/settings/language.ts`) are moved into it when a task touches them. Don't do large unrelated moves.

### Layer rules

| Layer          | May import                                                  | Must NOT import                                                                  |
| -------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| domain         | other domain code, `shared/` pure types                     | `drizzle-orm`, `@sveltejs/kit`, `$app/*`, `platform`, `fetch`, `Date.now()`, I/O |
| application    | domain, its own ports, `shared/`                            | infrastructure, Drizzle, SvelteKit, Cloudflare bindings                          |
| infrastructure | application ports, domain types, Drizzle                    | routes, Svelte components                                                        |
| routes / UI    | `container.ts`, application input/output types, `$lib/i18n` | Drizzle, `getDb`, schema tables, repositories directly                           |

- **Routes are thin controllers.** A `+server.ts` / `+page.server.ts` only: parse the request → call one use case → map the result to an HTTP response (status + error envelope from `api-contract.md`). No business rules, no SQL.
- **Svelte components hold no business logic.** They render state and call endpoints/actions. Shared client-side logic goes in `src/lib/` as plain TS functions.
- **Domain is pure.** No I/O, no current time, no random IDs. Pass them in (`Clock`, `IdGenerator` ports) so logic is deterministic and testable.
- **Errors**: domain and application return typed results or throw `AppError` subclasses with a contract error code (`VALIDATION_FAILED`, `NOT_FOUND`, `CONFLICT`, …). Only the route layer turns them into HTTP status codes.
- **Database rows never leave infrastructure.** Repositories map Drizzle rows to domain types; routes map domain types to the API response shape.

## 2. Single Responsibility

- One module = one reason to change. One use case per file (`create-post.ts`, `like-post.ts`), named after the action.
- A function does one thing. If you need "and" to describe it, split it. Aim for functions under ~30 lines and files under ~200 lines; larger is a signal to split.
- Validation, business rules, persistence and HTTP mapping are separate functions in separate layers — never mixed in one function.
- No "utils" / "helpers" dumping grounds. Name modules after what they do (`escape-like-pattern.ts`, `cursor.ts`).
- Svelte components: one UI responsibility each. Extract a child component when a component handles more than one concern or passes ~150 lines.
- Don't add features, options or abstractions the task didn't ask for.

## 3. Decoupling

- **Depend on interfaces (ports), not implementations.** Use cases receive their dependencies through a factory function argument:

  ```ts
  // application/ports.ts
  export interface PostRepository {
  	findById(id: string): Promise<Post | null>
  	save(post: Post): Promise<void>
  }

  // application/create-post.ts
  export const createPost =
  	(deps: { posts: PostRepository; clock: Clock; ids: IdGenerator }) =>
  	async (input: CreatePostInput): Promise<Result<Post, AppError>> => {
  		// ...
  	}
  ```

- **Wire everything in one place.** `src/lib/server/container.ts` builds concrete adapters from `platform.env` (bindings are per request on Workers) and `hooks.server.ts` puts the result on `event.locals`. Nothing else calls `new` on infrastructure classes or `getDb()`.
- No module-level singletons holding env, DB or request state.
- Features don't reach into each other's internals. If `posts` needs something from `users`, it goes through a port or the other feature's public use case — never by importing its repository or tables.
- Share types, not implementations. Cross-feature types live in `shared/` (or `packages/types` once that package is in use).
- Config values come from env / `src/lib/i18n/config.ts` etc. — never copy constants into a second place.

## 4. Unit Testing

Every change to logic ships with tests. Run with `pnpm test` (Vitest, `src/**/*.test.ts`).

- **Location**: co-locate tests next to the code — `create-post.ts` → `create-post.test.ts`.
- **What must be tested**:
  - domain: every rule and validation branch, including edge cases (empty, too long, wrong type, boundary values).
  - application: every use case — success path and each error path.
  - infrastructure mappers (row ↔ domain) when they contain logic.
- **Isolation**: unit tests never touch D1, KV, R2, the network or real time. Use in-memory fakes that implement the port interfaces (e.g. `InMemoryPostRepository`, `FixedClock`). Put shared fakes in `src/lib/server/<feature>/application/testing/` or `src/lib/server/shared/testing/`.
- Prefer hand-written fakes over `vi.mock` of modules. If a test needs `vi.mock` to work, the code is probably too coupled — fix the design.
- **Structure**: Arrange / Act / Assert. One behavior per `it`. Test names describe behavior: `it('rejects a caption longer than 2200 characters')`.
- Test behavior through the public function, not private helpers or implementation details.
- Tests must be deterministic and independent: no shared mutable state between tests, no order dependence.
- When fixing a bug, first write a test that fails because of the bug, then fix it.
- End-to-end flows use Playwright in `tests/e2e/` (`pnpm test:e2e`). Unit tests are still required for the logic underneath.
- Coverage targets (`pnpm test:coverage`, report in `coverage/`):
  - new and changed code: **≥ 80%** line coverage (the SonarCloud "Sonar way" bar for new code).
  - domain and application layers: **≥ 90%** line coverage.

## 5. Frontend Implementation

These are the design decisions from the design exports. Every UI change must follow them. If a design and these rules disagree, stop and ask before building.

### Visual style

- Use the tokens from `docs/sns-color-palette.md` / `src/app.css`: Space Grotesk for all text, a gray page background, white surfaces, thin borders, and the `primary` blue for primary actions and selection. The red `accent` is only for the liked heart. The dark theme comes from the same tokens (`.dark`). Don't add other accent colors.
- Define colors, spacing and type as shared tokens (Tailwind theme / CSS variables) and use the tokens. No hard-coded hex values or one-off spacing inside components.
- Posts are flat: no shadows and no rounded cards. Only comment bubbles get rounded corners.

### Layout and spacing

- Build mobile-first. The reference width is **390px**, with **12px outer gutters**, and content starts **24px from the screen edge**.
- Long mockups show scrolling content, not fixed page heights. Never set a fixed height on a page to match a mockup.
- Don't draw the phone status bar or home indicator from the mockups. Use safe-area insets (`env(safe-area-inset-*)`) instead.
- Breakpoints (see `docs/responsive-ui-rules.md`): below `md` (768px) is mobile with a bottom bar; `md` to `lg` is tablet with an icon rail; `lg` (1024px) and up is desktop.
- Desktop follows the layout of `docs/design/sns-dashboard-mockup.html`: a top header (logo on the left; search and hamburger account menu on the right), and a 3-column grid. The left sidebar has a "Your space" label, Home, Notifications, Profile and a "Create post" primary button. The center column has left and right borders and holds the stories section, For you / Following tabs and flat posts separated by diagonal hatch bands with thin borders on all four sides. The right column is reserved and empty for now.
- When the mockup and these rules disagree on colors or fonts, the tokens win. The mockup sets the layout only.

### Post separation

- Separate adjacent posts with the diagonal hatch band on mobile, tablet and desktop. The post separator is the pattern with thin borders on all four sides (`hatch h-3 w-full border border-line`), forming a closed rectangle, not a plain border or an empty gap. Reuse the shared `HatchBand` component between posts, without extra spacing around the band or a trailing band after the last post. Do not place a hatch band between the story tray and the feed; keep the existing section spacing instead.
- Use the same hatch pattern to fill unused space around media. The shared `.hatch` class owns the standard thin border on all four sides and uses the page background token as an explicit base color so media fills and post separators match in light and dark mode, regardless of their parent surface. Do not duplicate border styling in media components.
- Post lists use the shared `post-list` utility to remove post borders that touch a hatch band. Each band edge stays one pixel thick, never doubled by an adjacent post border. Keep the list's outer post borders and standalone post borders, including the post-to-comments divider.

### Media

- Keep the original aspect ratio. Never stretch or crop media (`object-fit: contain`, never `cover` or `fill`). Fill leftover space with the hatch pattern.
- Carousels have previous/next arrows and an item counter (e.g. `2 / 5`).
- Avatars are circles and may use `object-cover`. Post and story media are never cropped.

### Navigation

- The mobile bottom bar has exactly five labelled destinations, in this order: Home, Search, Create, Notifications, Profile. The tablet rail uses the same destinations.
- Create is the raised blue button. The other four are plain labelled icons, and the active item shows a top indicator line.
- Desktop (`lg` and up): the sidebar has Home, Notifications, Profile and a "Create post" primary button. Search lives in the header. Profile opens the signed-in user's profile on every screen size.
- Profile tabs are Posts, Reels, then Bookmarks. Bookmarks is visible and accessible only on the viewer's own profile. Legacy `/bookmarks` links redirect to that tab, preserving pagination.
- The header has no notification button. Its hamburger menu keeps Profile, Preferences and Log out, with matching alignment and rounded hover styles.
- Profile container borders extend to the viewport bottom even when there are no posts; pages remain content-driven, never fixed-height.
- Notifications is a placeholder page until a notifications backend exists.
- Reels have no nav entry. They show in the home feed and in the profile Reels tab.

### Comments

- The post comment page header uses the reusable `common.back` label beside the back arrow. The post and comment section meet at the post's thin horizontal border, without a hatch band or an outer spacing gap.
- Show only **two visual levels**: parent and reply. Never indent deeper than one reply level.
- For deeper threads, open a focused branch: the selected comment moves to the parent position, and its ancestors stay visible above it as context.
- Solid lines connect visible replies. Dashed lines show ancestor context in a focused branch.
- Collapsed replies show a reply-count button that expands them. Expanded replies show "Hide replies".
- The comment composer appears above the comment list. Reply composers appear inline beneath the selected comment. They scroll with the page.

### Video

- The video viewer is dark and supports portrait, square and landscape media.
- Portrait video: engagement controls sit beside the video. Square and landscape video: controls sit below it.
- Comments on a video open in a white bottom sheet. The video shrinks so it stays visible above the sheet.

### Frontend guard rails

- Components follow section 2: one UI concern each, split at ~150 lines. Thread layout, carousel, hatch band, bottom sheet and composer are separate components.
- Logic that is not rendering (thread flattening/focusing, carousel index, aspect-ratio class choice) goes in plain TS modules in `src/lib/` with unit tests.
- All user-facing text, including button labels and `aria-label`s, goes through `svelte-i18n` (section 6, step 6).
- Interactive elements are real `<button>` / `<a>` elements with accessible names and visible focus styles. Icon-only buttons need an `aria-label`.
- Check every new or changed screen at 390px and on a wide screen before calling it done.

## 6. Workflow for Claude

1. Read the relevant docs and existing code for the feature before writing anything.
2. Decide which layer each piece belongs in (section 1) before writing it.
3. Write or update tests alongside the code.
4. Before saying a task is done, run and report results of:
   ```
   pnpm test:coverage
   pnpm check
   pnpm lint
   pnpm spellcheck
   ```
   These are the same steps CI runs (`.github/workflows/ci.yml`). Report the test count and the coverage of the files you changed. If something fails, say so with the output — don't claim success.
5. Follow the existing style (Prettier: tabs, single quotes, no semicolons, width 100). Use `pnpm format` if needed.
6. New user-facing text goes through `svelte-i18n` with keys in every locale file (`en`, `ja`, `km`); `pnpm check:i18n` must pass.
7. Commit or push only when asked. Never commit `.env` or secrets.
8. Before opening or merging a pull request, pass the gate in section 7.

## 7. Pre-PR / Pre-merge gate (mandatory, run locally)

**Rule: before opening a pull request or merging one, run this gate locally. Don't open or merge until every step passes.** If a step fails, stop, fix it (or tell the user why it can't be fixed), and run the whole gate again. Never skip a step, and never say a branch is ready without showing the results.

The gate repeats what CI (`.github/workflows/ci.yml`), SonarCloud and CodeRabbit check, so the PR passes them the first time.

### 1. Commands (all must pass)

```
pnpm install --frozen-lockfile
pnpm lint            # Prettier + lint
pnpm spellcheck
pnpm check           # type check
pnpm check:i18n      # every locale has every key
pnpm test:coverage   # all tests pass
pnpm build
pnpm audit --audit-level=high
```

### 2. Coverage (from the `pnpm test:coverage` table)

- Changed and new files: **≥ 80%** line coverage.
- Domain and application layers: **≥ 90%** line coverage.

### 3. Self-review of the diff (what SonarCloud and CodeRabbit flag)

Read `git diff <base-branch>...HEAD` (`dev` or `main`) and fix anything that matches:

- Bugs: unhandled promises, missing `await`, possible `null`/`undefined` access, wrong error codes for `docs/api-contract.md`.
- Security: hard-coded secrets or tokens, SQL built from strings, unescaped `LIKE` input, missing auth or ownership checks, input that is not validated.
- Code smells: unused imports/variables, `any`, empty `catch`, nested ternaries, duplicated blocks, long or deeply nested functions, leftover `console.log` or commented-out code.
- The rules in sections 1–5 (layers, single responsibility, decoupling, tests, frontend).

### 4. Report

Tell the user the result of each command, the test count, coverage of the changed files, and anything found in the self-review and how it was fixed.

## 8. Review checklist

Before finishing, check each item:

- [ ] Domain and application code import nothing from Drizzle, SvelteKit or Cloudflare.
- [ ] Routes only parse → call a use case → map the response.
- [ ] Each new file/function has one clear responsibility.
- [ ] Dependencies are injected through ports and wired in `container.ts`.
- [ ] New logic has unit tests using fakes, covering success and error paths.
- [ ] `pnpm test:coverage`, `pnpm check`, `pnpm lint` and `pnpm spellcheck` pass.
- [ ] Changed code has ≥ 80% coverage (≥ 90% for domain and application).
- [ ] UI changes follow section 5 (tokens, two-level comments, media ratios, safe areas, i18n, checked at 390px).
- [ ] Before PR / merge: the local gate in section 7 passed.
