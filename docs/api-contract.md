# API Contract: Frontend ⇄ Backend

Issue: #37. Status: **draft for team review**.

This document defines the data format, endpoints, rules and owners for each feature, so the frontend and backend can be built in parallel. The frontend builds mocks from this document and the files in [`samples/`](./samples). The backend implements the same shapes. #38 turns this document into TypeScript repository interfaces.

Items marked **(proposed)** are suggested defaults. They have not been agreed by the whole team yet. Change them in this file first, then in code.

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Conventions](#2-conventions)
3. [Shared objects](#3-shared-objects)
4. [Endpoints](#4-endpoints)
5. [Responsibilities](#5-responsibilities)
6. [Wireframe → data mapping](#6-wireframe--data-mapping)
7. [Open questions](#7-open-questions)

---

## 1. How to use this document

- **Frontend:** build mock repositories that return the shapes in [3](#3-shared-objects). Load them from the JSON files in `docs/samples/`. Screens must only use these shapes, never DB rows or raw API responses.
- **Backend:** return exactly these shapes and status codes. If you need to change a shape, change this document in the same PR and tell the frontend owner.
- All samples are seen by the signed-in user **`dara` (`usr_01`)**, so `viewer.*` fields are from Dara's point of view.

| Sample file                                            | Shows                                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [`me.json`](./samples/me.json)                         | `GET /api/me`                                                                                         |
| [`users.json`](./samples/users.json)                   | `Profile` for every sample user                                                                       |
| [`posts.json`](./samples/posts.json)                   | Every post kind: text-only, single image, 10-item mixed gallery, wide video, reels, followers/private |
| [`paginated-feed.json`](./samples/paginated-feed.json) | A feed page with `nextCursor`                                                                         |
| [`comments.json`](./samples/comments.json)             | Top-level comments and flattened replies                                                              |
| [`stories.json`](./samples/stories.json)               | Story tray, plus one expired story                                                                    |
| [`notifications.json`](./samples/notifications.json)   | Every notification type                                                                               |
| [`preferences.json`](./samples/preferences.json)       | `GET /api/preferences`                                                                                |
| [`errors.json`](./samples/errors.json)                 | One example response for every error code                                                             |

---

## 2. Conventions

### 2.1 Format

- Request and response bodies are JSON (`Content-Type: application/json`). Media files are the only exception ([4.3](#43-media-upload)).
- Field names use **camelCase**.
- IDs are **opaque strings** with a type prefix (`usr_`, `pst_`, `med_`, `cmt_`, `sty_`, `ntf_`). The frontend must not parse them.
- Times are **ISO-8601 UTC strings** (`2026-10-02T03:00:00.000Z`). The frontend formats them for the user's language.
- A missing optional value is `null`. Fields are never left out. Empty text is `""`.
- All API routes start with `/api`. BetterAuth routes start with `/api/auth`.

### 2.2 Authentication

- Login uses a **BetterAuth session cookie** (httpOnly, `Secure`, `SameSite=Lax`). The frontend never reads or stores the token. It only sends requests with cookies (same origin).
- Sessions are also stored in Cloudflare KV for fast checks (#12). This does not change the contract.
- In this document, 🔒 means login is required.
  - Not logged in → `401 UNAUTHENTICATED`.
  - Logged in but not allowed (e.g. editing someone else's post) → `403 FORBIDDEN`.
- Pages that need login are protected in `hooks.server.ts` (#10). Logged-out users are redirected to the login page.
- Endpoints without 🔒 still work when logged out, but `viewer.*` fields are `false` and only public content is returned.

### 2.3 Pagination (cursor-based, #17)

Every list endpoint takes:

| Query    | Type   | Default | Rule                                         |
| -------- | ------ | ------- | -------------------------------------------- |
| `cursor` | string | none    | Value of `nextCursor` from the previous page |
| `limit`  | number | 20      | 1–50                                         |

and returns:

```json
{ "items": [], "nextCursor": "opaque-string-or-null" }
```

- `nextCursor: null` means there are no more pages.
- The cursor is opaque. Do not build it on the frontend.
- An invalid cursor → `400 VALIDATION_FAILED` with `fields.cursor = "INVALID_FORMAT"`.
- Sort order **(proposed)**: feeds, profile grids, notifications and top-level comments are **newest first**. Replies are **oldest first**, so they read like a conversation.

### 2.4 "No data" vs "failed"

These must be handled differently in the UI (#38):

| Situation                           | Response                                         | UI shows                                     |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| List has no items                   | `200` with `{ "items": [], "nextCursor": null }` | Empty state ("No posts yet")                 |
| Single item does not exist          | `404 NOT_FOUND`                                  | Not-found screen                             |
| Item exists but viewer can't see it | `404 NOT_FOUND` (do not reveal it exists)        | Not-found screen                             |
| Request failed                      | `4xx/5xx` with error envelope                    | Error message + retry button (5xx / network) |

### 2.5 Errors

Every error uses this envelope:

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

| Status | `code`                   | When                                               |
| ------ | ------------------------ | -------------------------------------------------- |
| 400    | `VALIDATION_FAILED`      | Input breaks a rule in [2.6](#26-input-validation) |
| 401    | `UNAUTHENTICATED`        | Not logged in, or session expired                  |
| 401    | `INVALID_CREDENTIALS`    | Wrong email or password                            |
| 403    | `FORBIDDEN`              | Logged in but not allowed                          |
| 403    | `EMAIL_NOT_VERIFIED`     | Action needs a verified email                      |
| 404    | `NOT_FOUND`              | Does not exist, or the viewer can't see it         |
| 409    | `CONFLICT`               | Already exists (email, username, already reported) |
| 413    | `PAYLOAD_TOO_LARGE`      | Upload is bigger than the limit                    |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | File type not allowed                              |
| 429    | `RATE_LIMITED`           | Too many requests                                  |
| 500    | `INTERNAL`               | Unexpected server error                            |

Field error codes: `REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `TOO_MANY`, `INVALID_FORMAT`, `NOT_ALLOWED`, `TAKEN`.

> BetterAuth returns its own error shape for `/api/auth/*`. The frontend **auth repository** maps those errors to the codes above, so screens only see this envelope.

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
| `visibility`    | `public` \| `followers` \| `private`                                                                           |
| Search `q`      | 1–50 characters                                                                                                |
| Report `note`   | 0–500 characters                                                                                               |

### 2.7 Rate limits (proposed)

Values are per user, or per IP when logged out. Going over the limit → `429 RATE_LIMITED`.

| Action                                     | Limit       |
| ------------------------------------------ | ----------- |
| Sign-in                                    | 10 / 15 min |
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
  counts: { posts: number; followers: number; following: number }  // posts = posts the viewer can see
  viewer: { isMe: boolean; following: boolean }
  createdAt: string
}

Me extends Profile {       // only returned by GET /api/me
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
  visibility: 'public' | 'followers' | 'private'
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

Visibility:

| `visibility` | Who can see it                  |
| ------------ | ------------------------------- |
| `public`     | Everyone, even logged out       |
| `followers`  | Author + the author's followers |
| `private`    | Author only ("only me")         |

### 3.4 Comment

There are **two levels** only: a top-level comment and its replies.

```ts
Comment {
  id: string
  postId: string
  author: UserSummary
  body: string
  parentId: string | null          // null = top-level; otherwise always the id of a TOP-LEVEL comment
  replyToUser: UserSummary | null  // set when replying to a reply → UI shows "@username"
  replyCount: number               // top-level only; 0 for replies
  viewer: { canDelete: boolean }   // comment author or post author (proposed)
  createdAt: string
}
```

**Flatten rule:** if the user replies to a reply, the server stores the new comment under the **same top-level comment**, not one level deeper. It sets `parentId` to the top-level id and `replyToUser` to the author of the reply they answered. See `cmt_312` and `cmt_313` in [`comments.json`](./samples/comments.json).

Comments cannot be edited or liked.

### 3.5 Story

```ts
Story {
  id: string
  author: UserSummary
  media: Media            // exactly one image or video; stories have NO caption
  createdAt: string
  expiresAt: string       // createdAt + 24 hours; the API never returns expired stories
  viewer: { seen: boolean }
}

StoryTrayItem {           // one circle in the story tray
  user: UserSummary
  hasUnseen: boolean      // ring is highlighted when true
  latestAt: string
  stories: Story[]        // oldest first, i.e. play order
}
```

Who can see a story **(proposed)**: the author and the author's followers.

### 3.6 Notification

```ts
Notification {
  id: string
  type: 'like' | 'comment' | 'reply' | 'follow' | 'system'
  actor: UserSummary | null                      // null for system
  post: { id: string; type: 'post' | 'reel'; thumbnailUrl: string | null } | null  // like, comment, reply
  comment: { id: string; excerpt: string } | null   // comment, reply
  message: string | null                         // system only; other types are built by the UI from `type` + `actor`
  read: boolean
  createdAt: string
}
```

### 3.7 Preferences

```ts
Preferences {
  theme: 'system' | 'light' | 'dark'
  language: 'en' | 'km' | 'ja'       // must be in SUPPORTED_LANGS (src/lib/i18n/config.ts)
  notifications: { inApp: boolean; email: boolean; push: boolean }   // on/off per channel (#31)
  updatedAt: string
}
```

Defaults for a new user **(proposed)**: `theme: "system"`, `language` = the language detected from `Accept-Language` at sign-up, `inApp: true`, `email: true`, `push: false`.

---

## 4. Endpoints

Format: `METHOD path`, then 🔒 if login is required. "→" shows the success status and body. Common errors (`401`, `429`, `500`) are not repeated for every endpoint.

### 4.1 Auth (BetterAuth)

These routes come from BetterAuth. The exact paths may change with the BetterAuth version, so the backend owners confirm them when #10 is done. The frontend uses the BetterAuth client through an **auth repository**, so screens do not depend on these paths.

| Endpoint                                | Body                                  | → Success                                             | Errors                                                       |
| --------------------------------------- | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| `POST /api/auth/sign-up/email`          | `{ email, password, name, username }` | `200`, verification email sent                        | `VALIDATION_FAILED`, `CONFLICT` (`email`/`username` `TAKEN`) |
| `POST /api/auth/sign-in/email`          | `{ email, password }`                 | `200`, session cookie set                             | `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`                  |
| `POST /api/auth/sign-in/social`         | `{ provider: "google", callbackURL }` | `200 { url }` → redirect to provider                  | `VALIDATION_FAILED`                                          |
| `POST /api/auth/sign-out`               | none                                  | `200`, cookie cleared, KV session removed             | none                                                         |
| `GET /api/auth/get-session`             | none                                  | `200 { session, user }` or `null` when logged out     | none                                                         |
| `GET /api/auth/verify-email?token=`     | none                                  | redirect to app                                       | `VALIDATION_FAILED` (`token` `INVALID_FORMAT`, expired)      |
| `POST /api/auth/request-password-reset` | `{ email, redirectTo }`               | `200` (same response whether or not the email exists) | `RATE_LIMITED`                                               |
| `POST /api/auth/reset-password`         | `{ token, newPassword }`              | `200`                                                 | `VALIDATION_FAILED` (`token` expired, `newPassword` rules)   |

- `name` is used as the first `displayName`.
- `username` needs the BetterAuth username plugin **(proposed)**.
- Google is the OAuth provider (`GOOGLE_CLIENT_ID` is in `.env.example`).
- New OAuth users have no username yet. After the first OAuth login, `GET /api/me` returns `username: ""`, and the frontend asks the user to pick one with `PATCH /api/me` **(proposed)**.

### 4.2 Users, profile, follow, search

| Endpoint                             | Auth | Request                                                                                           | → Success                                     | Errors                                      |
| ------------------------------------ | ---- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| `GET /api/me`                        | 🔒   | none                                                                                              | `200 Me`                                      | none                                        |
| `PATCH /api/me`                      | 🔒   | Any of `{ username, displayName, bio, avatarMediaId }` (`avatarMediaId: null` removes the avatar) | `200 Me`                                      | `VALIDATION_FAILED`, `CONFLICT`             |
| `GET /api/users/:username`           |      | none                                                                                              | `200 Profile`                                 | `NOT_FOUND`                                 |
| `PUT /api/users/:username/follow`    | 🔒   | none                                                                                              | `200 { following: true, followers: number }`  | `NOT_FOUND`, `VALIDATION_FAILED` (yourself) |
| `DELETE /api/users/:username/follow` | 🔒   | none                                                                                              | `200 { following: false, followers: number }` | `NOT_FOUND`                                 |
| `GET /api/users/:username/followers` |      | `?cursor&limit`                                                                                   | `200 Page<FollowListItem>`                    | `NOT_FOUND`                                 |
| `GET /api/users/:username/following` |      | `?cursor&limit`                                                                                   | `200 Page<FollowListItem>`                    | `NOT_FOUND`                                 |
| `GET /api/search/users`              |      | `?q&cursor&limit`                                                                                 | `200 Page<FollowListItem>`                    | `VALIDATION_FAILED`                         |

- Following is **instant**. There are no private accounts or follow requests.
- `PUT`/`DELETE` are idempotent: following twice is not an error.
- Search matches the start of `username` or `displayName` (case-insensitive). It searches **users only**.

### 4.3 Media upload

Files are uploaded **directly to Cloudflare R2 with a presigned URL**. They do not pass through the Worker, so large videos work.

```text
1. POST /api/uploads              → get mediaId + uploadUrl
2. PUT  <uploadUrl>  (file body)  → upload straight to R2
3. POST /api/uploads/:id/complete → server checks the file, returns Media
4. POST /api/posts | /api/stories | PATCH /api/me  with the mediaId(s)
```

| Endpoint                              | Auth                 | Request                                                                     | → Success                                                                                   | Errors                                                                                   |
| ------------------------------------- | -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `POST /api/uploads`                   | 🔒                   | `{ purpose: "post" \| "reel" \| "story" \| "avatar", mimeType, sizeBytes }` | `201 { mediaId, uploadUrl, method: "PUT", headers: { "Content-Type": string }, expiresAt }` | `VALIDATION_FAILED`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`                       |
| `PUT <uploadUrl>`                     | none (URL is signed) | Raw file bytes with the given headers                                       | `200` from R2                                                                               | `403` from R2 if the URL expired                                                         |
| `POST /api/uploads/:mediaId/complete` | 🔒                   | `{ width, height, durationSec \| null }` (read by the browser)              | `200 Media`                                                                                 | `NOT_FOUND`, `VALIDATION_FAILED` (file missing or does not match `mimeType`/`sizeBytes`) |

- The upload URL is valid for **15 minutes** **(proposed)**.
- Media that is not attached to a post, story or avatar within 24 h is deleted **(proposed)**.
- `purpose: "reel"` only allows video. `"avatar"` only allows images.
- The server checks the real file type, not only the extension (#18).

### 4.4 Posts and reels

| Endpoint                         | Auth | Request                                                               | → Success                              | Errors                                                  |
| -------------------------------- | ---- | --------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `POST /api/posts`                | 🔒   | `{ type: "post" \| "reel", caption, visibility, mediaIds: string[] }` | `201 Post`                             | `VALIDATION_FAILED`                                     |
| `GET /api/posts/:id`             |      | none                                                                  | `200 Post`                             | `NOT_FOUND`                                             |
| `PATCH /api/posts/:id`           | 🔒   | Any of `{ caption, visibility }`. **Media cannot be changed**         | `200 Post` (`editedAt` set)            | `VALIDATION_FAILED`, `FORBIDDEN`, `NOT_FOUND`           |
| `DELETE /api/posts/:id`          | 🔒   | none                                                                  | `204`                                  | `FORBIDDEN`, `NOT_FOUND`                                |
| `GET /api/feed`                  |      | `?scope=following\|all&cursor&limit`                                  | `200 Page<Post>`                       | `UNAUTHENTICATED` for `scope=following` when logged out |
| `GET /api/reels`                 |      | `?cursor&limit`                                                       | `200 Page<Post>` (only `type: "reel"`) | none                                                    |
| `GET /api/users/:username/posts` |      | `?type=post\|reel&cursor&limit` (`type` optional = both)              | `200 Page<Post>`                       | `NOT_FOUND`                                             |

- `mediaIds` order = gallery order.
- Each media must be uploaded by the same user, finished with `complete`, and not used by another post yet.
- `scope=following` = posts and reels by people you follow, plus your own posts. `scope=all` = all posts the viewer can see.
- The home feed contains **both posts and reels**. The wireframe shows reel cards in the feed, and tapping one opens the full reel view. The Reels tab (`/api/reels`) shows reels only.
- All lists only include posts the viewer is allowed to see ([3.3](#33-post-also-used-for-reels)).

### 4.5 Like, save, share

| Endpoint                     | Auth | → Success                             | Errors      |
| ---------------------------- | ---- | ------------------------------------- | ----------- |
| `PUT /api/posts/:id/like`    | 🔒   | `200 { liked: true, likes: number }`  | `NOT_FOUND` |
| `DELETE /api/posts/:id/like` | 🔒   | `200 { liked: false, likes: number }` | `NOT_FOUND` |
| `PUT /api/posts/:id/save`    | 🔒   | `200 { saved: true }`                 | `NOT_FOUND` |
| `DELETE /api/posts/:id/save` | 🔒   | `200 { saved: false }`                | `NOT_FOUND` |
| `GET /api/me/saved`          | 🔒   | `200 Page<Post>` (newest saved first) | none        |

- Like and save are idempotent. The frontend may update the UI first (optimistic update) and roll back on error.
- **Share** has no endpoint. The UI uses `Post.shareUrl` with the Web Share API, or copies it to the clipboard.

### 4.6 Comments

| Endpoint                        | Auth | Request                              | → Success                                          | Errors                                            |
| ------------------------------- | ---- | ------------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| `GET /api/posts/:id/comments`   |      | `?cursor&limit`                      | `200 Page<Comment>` (top-level only, newest first) | `NOT_FOUND`                                       |
| `GET /api/comments/:id/replies` |      | `?cursor&limit`                      | `200 Page<Comment>` (oldest first)                 | `NOT_FOUND`                                       |
| `POST /api/posts/:id/comments`  | 🔒   | `{ body, parentId: string \| null }` | `201 Comment`                                      | `VALIDATION_FAILED`, `NOT_FOUND` (post or parent) |
| `DELETE /api/comments/:id`      | 🔒   | none                                 | `204`                                              | `FORBIDDEN`, `NOT_FOUND`                          |

- `parentId` may be a top-level comment **or a reply**. The server applies the flatten rule ([3.4](#34-comment)).
- Deleting a top-level comment also deletes its replies **(proposed)**. `Post.counts.comments` goes down by the total number removed.

### 4.7 Stories

| Endpoint                           | Auth | Request         | → Success                                            | Errors                   |
| ---------------------------------- | ---- | --------------- | ---------------------------------------------------- | ------------------------ |
| `POST /api/stories`                | 🔒   | `{ mediaId }`   | `201 Story`                                          | `VALIDATION_FAILED`      |
| `GET /api/stories`                 | 🔒   | `?cursor&limit` | `200 Page<StoryTrayItem>`                            | none                     |
| `GET /api/users/:username/stories` |      | none            | `200 { items: Story[] }` (active only, oldest first) | `NOT_FOUND`              |
| `POST /api/stories/:id/seen`       | 🔒   | none            | `204`                                                | `NOT_FOUND`              |
| `DELETE /api/stories/:id`          | 🔒   | none            | `204`                                                | `FORBIDDEN`, `NOT_FOUND` |

- Stories have **no caption**. A `caption` field in the request → `400 VALIDATION_FAILED` (`caption` `NOT_ALLOWED`).
- Tray order: your own stories first, then users with unseen stories, then the rest. Within each group, the newest `latestAt` comes first.

### 4.8 Preferences

| Endpoint                 | Auth | Request                                                                | → Success         | Errors              |
| ------------------------ | ---- | ---------------------------------------------------------------------- | ----------------- | ------------------- |
| `GET /api/preferences`   | 🔒   | none                                                                   | `200 Preferences` | none                |
| `PATCH /api/preferences` | 🔒   | Any of `{ theme, language, notifications: { inApp?, email?, push? } }` | `200 Preferences` | `VALIDATION_FAILED` |

- `notifications` is merged: send only the channels that changed.
- After `language` changes, server-rendered pages use the saved language instead of `Accept-Language` (#26).

### 4.9 Notifications

| Endpoint                              | Auth | → Success                         | Errors      |
| ------------------------------------- | ---- | --------------------------------- | ----------- |
| `GET /api/notifications`              | 🔒   | `200 Page<Notification>`          | none        |
| `GET /api/notifications/unread-count` | 🔒   | `200 { count: number }`           | none        |
| `PATCH /api/notifications/:id/read`   | 🔒   | `200 Notification` (`read: true`) | `NOT_FOUND` |
| `POST /api/notifications/read-all`    | 🔒   | `200 { updated: number }`         | none        |

- Events that create notifications:
  - `like`: someone likes your post.
  - `comment`: someone comments on your post.
  - `reply`: someone replies to your comment, or replies to you with `replyToUser`.
  - `follow`: someone follows you.
  - `system`: sent by the app.
- No notification is created for your own actions. Repeated likes from the same user on the same post create only one notification (#30).
