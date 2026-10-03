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

## 5. Workflow for Claude

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
8. Before opening or merging a pull request, pass the gate in section 6.

## 6. Pre-PR / Pre-merge gate (mandatory, run locally)

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
- The rules in sections 1–4 (layers, single responsibility, decoupling, tests).

### 4. Report

Tell the user the result of each command, the test count, coverage of the changed files, and anything found in the self-review and how it was fixed.

## 7. Review checklist

Before finishing, check each item:

- [ ] Domain and application code import nothing from Drizzle, SvelteKit or Cloudflare.
- [ ] Routes only parse → call a use case → map the response.
- [ ] Each new file/function has one clear responsibility.
- [ ] Dependencies are injected through ports and wired in `container.ts`.
- [ ] New logic has unit tests using fakes, covering success and error paths.
- [ ] `pnpm test:coverage`, `pnpm check`, `pnpm lint` and `pnpm spellcheck` pass.
- [ ] Changed code has ≥ 80% coverage (≥ 90% for domain and application).
- [ ] Before PR / merge: the local gate in section 6 passed.
