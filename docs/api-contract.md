# Data and Operations Contract: Frontend ⇄ Backend

Issue: #37. Status: **draft for team review**.

This document defines shared data shapes, operation inputs/results and rules, so the frontend and backend can be built in parallel. The frontend builds mocks from this document and the files in [`samples/`](./samples). The backend implements the same shapes. #38 turns this document into TypeScript repository interfaces. The filename is kept so existing links still work; this is not a required REST API.

For this SvelteKit app, `+page.server.ts` loads read data and form actions handle mutations through server-side services/repositories. They do not need to fetch the app's own `/api` routes. SvelteKit handles the request and data transfer, but does not automatically create REST endpoints. Add `+server.ts` endpoints only when needed, such as incremental feed loading or browser-initiated uploads. These adapters use the same operations below; their paths are implementation details.

Server repositories receive the current session/viewer from trusted server context, never from a client-supplied user ID. Database access and credentials remain server-only. Notifications and post visibility settings are out of scope for now. The app shows a Notifications nav slot as a UI placeholder page only; there is no notifications API.

Items marked **(proposed)** are suggested defaults. They have not been agreed by the whole team yet. Change them in this file first, then in code.

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Conventions](#2-conventions)
3. [Shared objects](#3-shared-objects)
4. [Operations](#4-operations)

---

## 1. How to use this document

- **Frontend:** build mock repositories that return the shapes in [3](#3-shared-objects). Load them from the JSON files in `docs/samples/`. Screens must only use these shapes, never DB rows or raw API responses.
- **Backend:** return exactly these shapes from services/repositories. If you need to change a shape, change this document in the same PR and tell the frontend owner.
- All samples are seen by the signed-in user **`dara` (`usr_01`)**, so `viewer.*` fields are from Dara's point of view.

| Sample file                                            | Shows                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| [`me.json`](./samples/me.json)                         | `getMe` result                                                       |
| [`users.json`](./samples/users.json)                   | `Profile` for every sample user                                      |
| [`posts.json`](./samples/posts.json)                   | Text-only, single image, 10-item mixed gallery, wide video and reels |
| [`paginated-feed.json`](./samples/paginated-feed.json) | A feed page with `nextCursor`                                        |
| [`comments.json`](./samples/comments.json)             | Top-level comments and flattened replies                             |
| [`stories.json`](./samples/stories.json)               | Story tray                                                           |
| [`preferences.json`](./samples/preferences.json)       | `getPreferences` result                                              |
| [`errors.json`](./samples/errors.json)                 | One example domain error envelope for every error code               |

---

## 2. Conventions

### 2.1 Format

- Operation inputs/results use the plain, serializable objects below. JSON files are mock fixtures, not a requirement to expose HTTP responses. Media files are uploaded separately ([4.3](#43-media-upload)).
- Field names use **camelCase**.
- IDs are **opaque strings** with a type prefix (`usr_`, `pst_`, `med_`, `cmt_`, `sty_`). The frontend must not parse them.
- Times are **ISO-8601 UTC strings** (`2026-10-02T03:00:00.000Z`). The frontend formats them for the user's language.
- A missing optional result value is `null`. Result fields are never left out. Empty text is `""`. Partial update inputs may omit unchanged fields.
- BetterAuth owns `/api/auth/*`; application operations do not require matching `/api` routes.

### 2.2 Authentication

- Login uses a **BetterAuth session cookie** (httpOnly, `Secure`, `SameSite=Lax`). The frontend never reads or stores the token. SvelteKit loads/actions read the session on the server; same-origin browser requests send cookies.
- Sessions are also stored in Cloudflare KV for fast checks (#12). This does not change the contract.
- In this document, 🔒 means login is required.
  - Not logged in → `UNAUTHENTICATED`.
  - Logged in but not allowed (e.g. editing someone else's post) → `FORBIDDEN`.
- Pages that need login are protected in `hooks.server.ts` (#10). Logged-out users are redirected to the login page.
- Operations without 🔒 still work when logged out, but `viewer.*` fields are `false`. Posts and reels are public. Story access follows [3.5](#35-story).

### 2.3 Pagination (cursor-based, #17)

Paginated list operations take:

| Input    | Type   | Default | Rule                                         |
| -------- | ------ | ------- | -------------------------------------------- |
| `cursor` | string | none    | Value of `nextCursor` from the previous page |
| `limit`  | number | 20      | 1–50                                         |

and return:

```json
{ "items": [], "nextCursor": "opaque-string-or-null" }
```

- `nextCursor: null` means there are no more pages.
- The cursor is opaque. Do not build it on the frontend.
- An invalid cursor → `VALIDATION_FAILED` with `fields.cursor = "INVALID_FORMAT"`.
- Sort order **(proposed)**: feeds, profile grids and top-level comments are **newest first**. Replies are **oldest first**, so they read like a conversation.

### 2.4 "No data" vs "failed"

These must be handled differently in the UI (#38):

| Situation                           | Response                              | UI shows                                          |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------- |
| List has no items                   | `{ "items": [], "nextCursor": null }` | Empty state ("No posts yet")                      |
| Single item does not exist          | `NOT_FOUND`                           | Not-found screen                                  |
| Item exists but viewer can't see it | `NOT_FOUND` (do not reveal it exists) | Not-found screen                                  |
| Operation failed                    | Error envelope                        | Error message + retry button (internal / network) |

### 2.5 Errors

Repositories expose domain errors using this envelope; successes return the result shown in [4](#4-operations):

```json
{
	"error": {
		"code": "VALIDATION_FAILED",
		"message": "caption must be at most 2200 characters",
		"fields": { "caption": "TOO_LONG" }
	}
}
```

- `code`: fixed value from the table below. **The frontend shows text based on `code`** (translated with svelte-i18n, e.g. key `error.VALIDATION_FAILED`).
- `message`: English text for developers and logs. Do not show it to users.
- `fields` (only for `VALIDATION_FAILED` and `CONFLICT`): field name → field error code. The form shows the error under that field.
- `retryAfterSec` (only for `RATE_LIMITED`): seconds until the user can try again.

| `code`                   | When                                               |
| ------------------------ | -------------------------------------------------- |
| `VALIDATION_FAILED`      | Input breaks a rule in [2.6](#26-input-validation) |
| `UNAUTHENTICATED`        | Not logged in, or session expired                  |
| `INVALID_CREDENTIALS`    | Wrong email or password                            |
| `FORBIDDEN`              | Logged in but not allowed                          |
| `EMAIL_NOT_VERIFIED`     | Action needs a verified email                      |
| `NOT_FOUND`              | Does not exist, or the viewer can't see it         |
| `CONFLICT`               | Already exists (email or username)                 |
| `PAYLOAD_TOO_LARGE`      | Upload is bigger than the limit                    |
| `UNSUPPORTED_MEDIA_TYPE` | File type not allowed                              |
| `RATE_LIMITED`           | Too many requests                                  |
| `INTERNAL`               | Unexpected server error                            |

Field error codes: `REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `TOO_MANY`, `INVALID_FORMAT`, `NOT_ALLOWED`, `TAKEN`.

> BetterAuth returns its own error shape for `/api/auth/*`. The frontend **auth repository** maps those errors to the codes above, so screens only see this envelope.

SvelteKit adapters choose the transport behavior: form actions use `fail(status, envelope)` for expected failures; page loads use redirects or `error(status, ...)` as appropriate. Optional HTTP endpoints map domain codes to HTTP status codes. Do not return raw database errors or internal exception details to the browser.

### 2.6 Input validation (proposed limits)

The frontend checks these before sending, so users get fast feedback. The backend **always** checks them again. Text length is counted in Unicode characters, after trimming spaces at the start and end.

| Field           | Rule                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| `username`      | `^[a-z0-9_]{3,30}$`, unique                                                                                    |
| `displayName`   | 1–50 characters                                                                                                |
| `bio`           | 0–160 characters                                                                                               |
| `email`         | Valid email, unique                                                                                            |
| `password`      | 8–128 characters                                                                                               |
| Post `caption`  | 0–2200 characters                                                                                              |
| Comment `body`  | 1–500 characters                                                                                               |
| Post `mediaIds` | `post`: 0–10 (images and videos can be mixed). `reel`: exactly 1 video. A `post` with no media needs a caption |
| Story `mediaId` | Exactly 1 image or video. **No caption**                                                                       |
| Image upload    | `image/jpeg`, `image/png`, `image/webp`, ≤ 10 MB                                                               |
| Video upload    | `video/mp4`, `video/webm`, ≤ 100 MB                                                                            |
| Search `q`      | 1–50 characters                                                                                                |
| Report `note`   | 0–500 characters                                                                                               |

### 2.7 Rate limits (proposed)

Values are per user, or per IP when logged out. Going over the limit → `RATE_LIMITED`. Enforce these on server operations regardless of whether they are called by an action or an endpoint.

| Action                                     | Limit       |
| ------------------------------------------ | ----------- |
| Sign-in                                    | 10 / 15 min |
| Sign-up                                    | 3 / hour    |
| Password reset / resend verification email | 3 / hour    |
| Report a post                              | 10 / hour   |
| Create post, reel, story                   | 30 / hour   |
| Create comment                             | 60 / hour   |

---

## 3. Shared objects

Written in TypeScript-like notation for readability. #38 creates the real types.

### 3.1 Users

```ts
UserSummary {            // used inside other objects (post author, comment author, ...)
  id: string
  username: string
  displayName: string
  avatarUrl: string | null   // null → UI shows default avatar
}

Profile extends UserSummary {
  bio: string
  counts: { posts: number; followers: number; following: number }  // posts includes posts and reels
  viewer: { isMe: boolean; following: boolean }
  createdAt: string
}

Me extends Profile {       // only returned by getMe / updateMe
  email: string
  emailVerified: boolean
}

FollowListItem extends UserSummary {   // followers / following / user search
  viewer: { isMe: boolean; following: boolean }
}
```

### 3.2 Media

```ts
Media {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl: string | null  // video poster image; null for images
  width: number                // pixels; the UI keeps this aspect ratio (9:16, 1:1, 16:9, ...)
  height: number
  durationSec: number | null   // videos only
}
```

### 3.3 Post (also used for reels)

The wireframe says posts and reels share the same logic. A **reel** is a post that has exactly one focus video and uses the reel layout by default. Both use one object, `Post`, with a different `type`.

```ts
Post {
  id: string
  type: 'post' | 'reel'
  author: UserSummary
  caption: string                    // "" if none
  media: Media[]                     // post: 0–10 (gallery slider if >1); reel: exactly 1 video
  counts: { likes: number; comments: number }   // comments includes replies
  viewer: { liked: boolean; saved: boolean; isAuthor: boolean }
  shareUrl: string                   // link for the share button (copy / Web Share API)
  createdAt: string
  editedAt: string | null            // not null → UI shows "edited"
}
```

How the UI picks a layout:

| `type` | `media`             | Layout (wireframe)                                                                                       |
| ------ | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `post` | empty               | Text post                                                                                                |
| `post` | 1 item              | Single image/video card                                                                                  |
| `post` | 2–10 items          | Gallery: **slide** between items, not a grid. Fill the gaps on narrow items                              |
| `post` | 1 wide video        | Shown as a normal post card ("if post →" in the wireframe)                                               |
| `reel` | 1 video (any ratio) | Reel layout. A wide video is centered with filled sides ("wide video will be shown as" in the wireframe) |

All posts and reels are public, including when logged out. Only the author can edit or delete them. There is no visibility field or selector.

### 3.4 Comment

There are **two levels** only: a top-level comment and its replies.

```ts
Comment {
  id: string
  postId: string
  author: UserSummary
  body: string
  parentId: string | null          // null = top-level; otherwise always the id of a TOP-LEVEL comment
  replyToCommentId: string | null  // exact comment answered; null for roots, legacy data or a deleted target
  replyToUser: UserSummary | null  // set when replying to a reply → UI shows "@username"
  replyCount: number               // top-level only; 0 for replies
  viewer: { canDelete: boolean }   // comment author or post author (proposed)
  createdAt: string
}
```

**Flatten rule:** if the user replies to a reply, the server stores the new comment under the **same top-level comment**, not one level deeper. It retains the exact answered comment as `replyToCommentId`, sets `parentId` to the top-level id and `replyToUser` to the author of the reply they answered. See `cmt_312` and `cmt_313` in [`comments.json`](./samples/comments.json).

The UI shows only parent and reply levels. Expanding a reply’s children promotes that reply to the parent position and shows its exact ancestors above it with dashed connectors. Older comments without an exact target remain flat; do not infer ancestry from `replyToUser`.

Comments cannot be edited or liked.

### 3.5 Story

```ts
Story {
  id: string
  author: UserSummary
  media: Media            // exactly one image or video; stories have NO caption
  createdAt: string
  expiresAt: string       // createdAt + 24 h
  viewer: { seen: boolean; liked: boolean }
  likes: number
}

StoryTrayItem {           // one circle in the story tray
  user: UserSummary
  hasUnseen: boolean      // ring is highlighted when true
  latestAt: string
  storyCount: number      // active stories; load them with listUserStories
}
```

Who can see a story **(proposed)**: the author and the author's followers.

Stories expire **24 hours** after creation (`expiresAt` = `createdAt` + 24 h). An expired story is hidden everywhere (tray, `listUserStories`, `markStorySeen`, `likeStory`) and behaves as `NOT_FOUND`. The author can also delete a story earlier. There is no archive.

### 3.6 Preferences

```ts
Preferences {
  theme: 'system' | 'light' | 'dark'
  language: 'en' | 'km' | 'ja'       // must be in SUPPORTED_LANGS (src/lib/i18n/config.ts)
  updatedAt: string
}
```

Defaults for a new user **(proposed)**: `theme: "system"`, `language` = the language detected from `Accept-Language` at sign-up.

---

## 4. Operations

Operation names define repository methods, not URLs. 🔒 means login is required. Results are domain values, not HTTP response bodies. Common errors (`UNAUTHENTICATED` for protected operations, `RATE_LIMITED`, `INTERNAL`) are not repeated in every row. `void` means successful completion with no domain result.

`Page<T>` means `{ items: T[]; nextCursor: string | null }`. Pagination inputs (`cursor?`, `limit?`) follow [2.3](#23-pagination-cursor-based-17). Table input fields are required unless marked `?` or explicitly described as a partial update. IDs and usernames identify targets; authorization always uses the trusted server session.

### 4.1 Auth (BetterAuth)

Authentication stays with the BetterAuth client/server integration (#10), rather than custom application endpoints. These are frontend auth repository operations; the integration maps the provider's results and errors.

| Operation               | Input                                 | Success                                                                                                   | Errors                                                                           |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `signUp`                | `{ email, password, name, username }` | Generic success, even for an existing email; verification email sent only for a new or unverified account | `VALIDATION_FAILED`, `CONFLICT` (`username` `TAKEN` only)                        |
| `signIn`                | `{ email, password }`                 | Session cookie set                                                                                        | `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED` (also sends a new verification link) |
| `signInWithGoogle`      | `{ callbackURL }`                     | Redirect to provider                                                                                      | `VALIDATION_FAILED`                                                              |
| `signOut`               | none                                  | Cookie cleared, KV session removed                                                                        | none                                                                             |
| `getSession`            | none                                  | BetterAuth session/user or `null` when logged out                                                         | none                                                                             |
| `verifyEmail`           | `{ token }`                           | User signed in, then redirect to `/login` (which forwards to `/` or `/onboard`)                           | Redirect to `/login?error=invalid_token` or `token_expired`                      |
| `sendVerificationEmail` | `{ email }` (+ `callbackURL`)         | Same result whether or not the email exists                                                               | `RATE_LIMITED`                                                                   |
| `requestPasswordReset`  | `{ email, redirectTo }`               | Same result whether or not the email exists                                                               | `RATE_LIMITED`                                                                   |
| `resetPassword`         | `{ token, newPassword }`              | Password updated                                                                                          | `VALIDATION_FAILED` (`token` expired, `newPassword` rules)                       |

- `name` is used as the first `displayName`.
- `username` needs the BetterAuth username plugin **(proposed)**.
- Google is the OAuth provider (`GOOGLE_CLIENT_ID` is in `.env.example`).
- New OAuth users have no username yet. After the first OAuth login, `getMe` returns `username: ""`, and the frontend asks the user to pick one with `updateMe` **(proposed)**.

### 4.2 Users, profile, follow, search

| Operation       | Auth | Input                                                                                             | Result                                    | Errors                                      |
| --------------- | ---- | ------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| `getMe`         | 🔒   | none                                                                                              | `Me`                                      | none                                        |
| `updateMe`      | 🔒   | Any of `{ username, displayName, bio, avatarMediaId }` (`avatarMediaId: null` removes the avatar) | `Me`                                      | `VALIDATION_FAILED`, `CONFLICT`             |
| `getProfile`    |      | `{ username }`                                                                                    | `Profile`                                 | `NOT_FOUND`                                 |
| `followUser`    | 🔒   | `{ username }`                                                                                    | `{ following: true, followers: number }`  | `NOT_FOUND`, `VALIDATION_FAILED` (yourself) |
| `unfollowUser`  | 🔒   | `{ username }`                                                                                    | `{ following: false, followers: number }` | `NOT_FOUND`                                 |
| `listFollowers` |      | `{ username, cursor?, limit? }`                                                                   | `Page<FollowListItem>`                    | `NOT_FOUND`                                 |
| `listFollowing` |      | `{ username, cursor?, limit? }`                                                                   | `Page<FollowListItem>`                    | `NOT_FOUND`                                 |
| `searchUsers`   |      | `{ q, cursor?, limit? }`                                                                          | `Page<FollowListItem>`                    | `VALIDATION_FAILED`                         |

- Following is **instant**. There are no private accounts or follow requests.
- Follow/unfollow are idempotent: following twice is not an error.
- Search matches the start of `username` or `displayName` (case-insensitive). It searches **users only**.

### 4.3 Media upload

Files are uploaded **directly to Cloudflare R2 with a presigned URL**. They do not pass through the Worker, so large videos work. A form action or a small `+server.ts` adapter can expose the upload operations to the browser.

```text
1. createUpload    → get mediaId + uploadUrl
2. PUT <uploadUrl> → upload file bytes straight to R2
3. completeUpload  → server checks the file, returns Media
4. createPost / createStory / updateMe with the mediaId(s)
```

| Operation        | Auth | Input                                                                                               | Result                                                                                                                                            | Errors                                                                                   |
| ---------------- | ---- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `createUpload`   | 🔒   | `{ purpose: "post" \| "reel" \| "story" \| "avatar", mimeType, sizeBytes, thumbnailSizeBytes? }`    | `{ mediaId, uploadUrl, method: "PUT", headers: { "Content-Type": string, "If-None-Match": "*" }, expiresAt, thumbnailUploadUrl: string \| null }` | `VALIDATION_FAILED`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`                       |
| `completeUpload` | 🔒   | `{ mediaId, width, height, durationSec: number \| null }` (dimensions/duration read by the browser) | `Media`                                                                                                                                           | `NOT_FOUND`, `VALIDATION_FAILED` (file missing or does not match `mimeType`/`sizeBytes`) |

- The browser sends raw file bytes to R2 with the supplied headers. R2 returns `200` on success or `403` if the signed URL has expired; the upload adapter handles these separately from domain errors.
- The upload URL is valid for **15 minutes** **(proposed)**. Its `expiresAt` is a security limit, not story expiration.
- Uploads are write-once: send `If-None-Match: *` with the PUT. A second PUT to the same key is rejected.
- For video, `thumbnailSizeBytes` (exact byte length of the poster) is required. The poster is `image/webp` and at most **1 MB**, otherwise `PAYLOAD_TOO_LARGE`. The result then carries `thumbnailUploadUrl`, a second signed PUT URL for the poster (same headers rule, `Content-Type: image/webp`). For images `thumbnailUploadUrl` is `null` and `thumbnailSizeBytes` is ignored.
- Media that is not attached to a post, story or avatar within 24 h is deleted **(proposed)**.
- `purpose: "reel"` only allows video. `"avatar"` only allows images.
- Only the upload owner can complete or attach media. The server checks the real file type, not only the extension (#18).

### 4.4 Posts and reels

| Operation       | Auth | Input                                                                            | Result                             | Errors                                                     |
| --------------- | ---- | -------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `createPost`    | 🔒   | `{ type: "post" \| "reel", caption, mediaIds: string[] }`                        | `Post`                             | `VALIDATION_FAILED`                                        |
| `getPost`       |      | `{ id }`                                                                         | `Post`                             | `NOT_FOUND`                                                |
| `updatePost`    | 🔒   | `{ id, caption }`. **Media cannot be changed**                                   | `Post` (`editedAt` set)            | `VALIDATION_FAILED`, `FORBIDDEN`, `NOT_FOUND`              |
| `deletePost`    | 🔒   | `{ id }`                                                                         | `void`                             | `FORBIDDEN`, `NOT_FOUND`                                   |
| `listFeed`      |      | `{ scope: "following" \| "all", cursor?, limit? }`                               | `Page<Post>`                       | `UNAUTHENTICATED` for `scope: "following"` when logged out |
| `listReels`     |      | `{ cursor?, limit? }`                                                            | `Page<Post>` (only `type: "reel"`) | none                                                       |
| `listUserPosts` |      | `{ username, type?: "post" \| "reel", cursor?, limit? }` (`type` omitted = both) | `Page<Post>`                       | `NOT_FOUND`                                                |

- `mediaIds` order = gallery order.
- Each media must be uploaded by the same user, finished with `completeUpload`, and not used by another post yet.
- `scope: "following"` = posts and reels by people you follow, plus your own posts. `scope: "all"` = all posts and reels.
- The home feed contains **both posts and reels**. The wireframe shows reel cards in the feed, and tapping one opens the full reel view. The Reels tab uses `listReels`.
- All posts and reels are public. Editing and deletion remain author-only, enforced on the server.

### 4.5 Like, save, share

| Operation        | Auth | Input                 | Result                            | Errors      |
| ---------------- | ---- | --------------------- | --------------------------------- | ----------- |
| `likePost`       | 🔒   | `{ id }`              | `{ liked: true, likes: number }`  | `NOT_FOUND` |
| `unlikePost`     | 🔒   | `{ id }`              | `{ liked: false, likes: number }` | `NOT_FOUND` |
| `savePost`       | 🔒   | `{ id }`              | `{ saved: true }`                 | `NOT_FOUND` |
| `unsavePost`     | 🔒   | `{ id }`              | `{ saved: false }`                | `NOT_FOUND` |
| `listSavedPosts` | 🔒   | `{ cursor?, limit? }` | `Page<Post>` (newest saved first) | none        |

- Like and save are idempotent. The frontend may update the UI first (optimistic update) and roll back on error.
- **Share** has no server operation. The UI uses `Post.shareUrl` with the Web Share API, or copies it to the clipboard.

### 4.6 Comments

| Operation       | Auth | Input                                        | Result                                         | Errors                                            |
| --------------- | ---- | -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| `listComments`  |      | `{ postId, cursor?, limit? }`                | `Page<Comment>` (top-level only, newest first) | `NOT_FOUND`                                       |
| `listReplies`   |      | `{ commentId, cursor?, limit? }`             | `Page<Comment>` (oldest first)                 | `NOT_FOUND`                                       |
| `createComment` | 🔒   | `{ postId, body, parentId: string \| null }` | `Comment`                                      | `VALIDATION_FAILED`, `NOT_FOUND` (post or parent) |
| `deleteComment` | 🔒   | `{ id }`                                     | `void`                                         | `FORBIDDEN`, `NOT_FOUND`                          |

- `parentId` may be a top-level comment **or a reply** on the same post. The server applies the flatten rule ([3.4](#34-comment)).
- Deleting a comment removes only that comment. Replies of a deleted top-level comment become top-level comments, preserving other users’ comments (including the post author’s). `Post.counts.comments` goes down by one.

### 4.7 Stories

| Operation         | Auth | Input                 | Result                              | Errors                                                      |
| ----------------- | ---- | --------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `createStory`     | 🔒   | `{ mediaId }`         | `Story`                             | `VALIDATION_FAILED`                                         |
| `listStoryTray`   | 🔒   | `{ cursor?, limit? }` | `Page<StoryTrayItem>`               | none                                                        |
| `listUserStories` | 🔒   | `{ username }`        | `{ items: Story[] }` (oldest first) | `NOT_FOUND` (user missing or viewer is not author/follower) |
| `markStorySeen`   | 🔒   | `{ id }`              | `void`                              | `NOT_FOUND`                                                 |
| `likeStory`       | 🔒   | `{ id, active }`      | `{ liked, likes }`                  | `NOT_FOUND`                                                 |
| `deleteStory`     | 🔒   | `{ id }`              | `void`                              | `FORBIDDEN`, `NOT_FOUND`                                    |

- Stories have **no caption**. A `caption` field in the input → `VALIDATION_FAILED` (`caption` `NOT_ALLOWED`).
- Stories expire 24 h after `createdAt` (`expiresAt`). Expired stories are excluded from the tray and lists, and `markStorySeen`, `likeStory` and `deleteStory` return `NOT_FOUND` for them.
- `likeStory` sets (`active: true`) or clears (`active: false`) the viewer's like. It is idempotent and returns the new `liked` state and total `likes`. Only viewers who can see the story can like it.
- The tray contains your own stories and stories by people you follow. Read and seen operations enforce author/follower access on the server; inaccessible stories return `NOT_FOUND`.
- Tray order: your own stories first, then users with unseen stories, then the rest. Within each group, the newest `latestAt` comes first.

### 4.8 Preferences

| Operation           | Auth | Input                        | Result        | Errors              |
| ------------------- | ---- | ---------------------------- | ------------- | ------------------- |
| `getPreferences`    | 🔒   | none                         | `Preferences` | none                |
| `updatePreferences` | 🔒   | Any of `{ theme, language }` | `Preferences` | `VALIDATION_FAILED` |

- After `language` changes, server-rendered pages use the saved language instead of `Accept-Language` (#26).
