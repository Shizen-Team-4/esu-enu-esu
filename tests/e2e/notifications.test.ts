import { execFileSync } from 'node:child_process'
import { hashPassword } from 'better-auth/crypto'
import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test'
import type { Comment, Notification, Page, Post } from '../../src/lib/contract'
import { failNotificationReload } from './notification-reload'

// cspell:ignore opencode
test.describe.configure({ mode: 'serial' })
test.use({ extraHTTPHeaders: { origin: 'http://localhost:8787' } })
const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 6)
const username = (role: string) => `notification_${suffix}_${role}`
const userId = (role: string) => `usr_${username(role)}`
const ownPost = `pst_notification_${suffix}`
const clients = {} as Record<'owner' | 'actor' | 'third', APIRequestContext>
let cookies: Awaited<ReturnType<BrowserContext['storageState']>>['cookies'] = []
let deletedCursor = ''

function localSql(sql: string) {
	execFileSync(
		process.execPath,
		['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB', '--local', '--command', sql],
		{
			stdio: 'pipe',
			env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/opencode/notifications-seed.log' },
		},
	)
}
async function entries(client = clients.owner): Promise<Notification[]> {
	const response = await client.get('/api/notifications?limit=50')
	expect(response.ok(), await response.text()).toBe(true)
	return ((await response.json()) as Page<Notification>).items
}
async function submit(client: APIRequestContext, path: string, form: Record<string, string>) {
	const response = await client.post(path, { form })
	expect(response.ok(), await response.text()).toBe(true)
}

test.beforeAll(async ({ playwright, baseURL }) => {
	const hash = await hashPassword('NotificationTest!2026')
	const sql: string[] = []
	for (const role of ['owner', 'actor', 'third'] as const) {
		sql.push(`INSERT INTO user (id, name, email, email_verified, username, created_at, updated_at)
			VALUES ('${userId(role)}', 'Notification ${role}', '${username(role)}@sns.example', 1, '${username(role)}', 1, 1);
			INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
			VALUES ('account_${username(role)}', '${userId(role)}', 'credential', '${userId(role)}', '${hash}', 1, 1);
			INSERT INTO preferences (user_id, theme, language, updated_at) VALUES ('${userId(role)}', 'light', 'en', 1);`)
	}
	sql.push(`INSERT INTO posts (id, author_id, type, caption, created_at) VALUES ('${ownPost}', '${userId('owner')}', 'post', 'Notification test post', 1);
		INSERT INTO follows (follower_id, followee_id, created_at) VALUES ('${userId('owner')}', '${userId('actor')}', 1);`)
	localSql(sql.join('\n'))
	for (const role of ['owner', 'actor', 'third'] as const) {
		clients[role] = await playwright.request.newContext({
			baseURL,
			extraHTTPHeaders: { origin: baseURL! },
		})
		const response = await clients[role].post('/api/auth/sign-in/email', {
			data: { email: `${username(role)}@sns.example`, password: 'NotificationTest!2026' },
			headers: { 'x-forwarded-for': `2001:db8:${crypto.randomUUID().slice(0, 4)}::1` },
		})
		expect(response.status(), await response.text()).toBe(200)
	}
	cookies = (await clients.owner.storageState()).cookies
})
test.beforeEach(async ({ page }) => {
	await page.context().addCookies(cookies)
})
test.afterAll(async () => {
	for (const client of Object.values(clients)) await client.dispose()
	localSql(
		`DELETE FROM user WHERE id IN ('${userId('owner')}', '${userId('actor')}', '${userId('third')}');`,
	)
})

test('creates relevant activity, exact-target replies and lifetime-deduplicated history', async ({
	page,
}) => {
	expect(await entries()).toHaveLength(0)
	await page.goto('/notifications', { waitUntil: 'networkidle' })
	await expect(page.getByText('No notifications yet', { exact: true })).toBeVisible()
	const caption = `Followed post ${suffix}`
	await submit(clients.actor, '/create?/post', { type: 'post', caption })
	const feed: Page<Post> = await (await clients.actor.get('/api/feed?scope=all')).json()
	const followedPost = feed.items.find((post) => post.caption === caption)!
	expect(followedPost).toBeDefined()
	await expect
		.poll(
			async () =>
				(await entries()).filter(
					(entry) => entry.type === 'post' && entry.post?.id === followedPost.id,
				).length,
		)
		.toBe(1)
	await submit(clients.actor, `/p/${ownPost}?/like`, { id: ownPost, active: 'true' })
	await submit(clients.actor, `/p/${ownPost}?/like`, { id: ownPost, active: 'true' })
	await submit(clients.actor, `/p/${ownPost}?/like`, { id: ownPost, active: 'false' })
	await submit(clients.actor, `/p/${ownPost}?/like`, { id: ownPost, active: 'true' })
	await expect
		.poll(async () => (await entries()).filter((entry) => entry.type === 'like').length)
		.toBe(1)
	await submit(clients.third, `/p/${ownPost}?/comment`, { body: 'Thread root' })
	const roots: Page<Comment> = await (
		await clients.third.get(`/api/posts/${ownPost}/comments`)
	).json()
	const root = roots.items[0]
	await submit(clients.actor, `/p/${ownPost}?/comment`, { body: 'First reply', parentId: root.id })
	const replies: Page<Comment> = await (
		await clients.actor.get(`/api/comments/${root.id}/replies`)
	).json()
	await expect
		.poll(
			async () => (await entries(clients.third)).filter((entry) => entry.type === 'reply').length,
		)
		.toBe(1)
	await submit(clients.third, `/p/${ownPost}?/comment`, {
		body: 'Reply to exact target',
		parentId: replies.items[0].id,
	})
	await expect
		.poll(
			async () => (await entries(clients.actor)).filter((entry) => entry.type === 'reply').length,
		)
		.toBe(1)
	expect((await entries(clients.third)).filter((entry) => entry.type === 'reply')).toHaveLength(1)
	await expect
		.poll(async () => (await entries()).filter((entry) => entry.type === 'comment').length)
		.toBe(3)
	await submit(clients.owner, `/p/${ownPost}?/comment`, { body: 'Owner root' })
	const allRoots: Page<Comment> = await (
		await clients.owner.get(`/api/posts/${ownPost}/comments`)
	).json()
	const ownerRoot = allRoots.items.find((comment) => comment.body === 'Owner root')!
	await submit(clients.actor, `/p/${ownPost}?/comment`, {
		body: 'Reply to owner',
		parentId: ownerRoot.id,
	})
	await expect
		.poll(async () => (await entries()).filter((entry) => entry.type === 'reply').length)
		.toBe(1)
	expect(
		(await entries()).filter((entry) => entry.commentId && entry.type === 'comment'),
	).toHaveLength(3)
	for (const active of ['true', 'true', 'false', 'true'])
		await submit(clients.actor, `/u/${username('owner')}?/follow`, {
			username: username('owner'),
			active,
		})
	await expect
		.poll(async () => (await entries()).filter((entry) => entry.type === 'follow').length)
		.toBe(1)
	const before = (await entries()).length
	await submit(clients.owner, `/p/${ownPost}?/like`, { id: ownPost, active: 'true' })
	await submit(clients.owner, `/p/${ownPost}?/comment`, { body: 'Self comment' })
	expect(await entries()).toHaveLength(before)
	expect((await entries()).every((entry) => entry.actor?.id !== userId('owner'))).toBe(true)
})

test('enforces recipient privacy and preserves deleted-content history', async () => {
	const owned = (await entries())[0]
	const forbidden = await clients.third.post('/notifications?/read', {
		form: { id: owned.id },
		headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
	})
	expect(await forbidden.json()).toMatchObject({ type: 'failure', status: 404 })
	const countResponse = await clients.owner.get('/api/notifications/unread')
	expect(countResponse.headers()['cache-control']).toContain('no-store')
	const count = (await countResponse.json()).unreadCount
	expect(count).toBe((await entries()).length)
	await submit(clients.owner, `/p/${ownPost}?/delete`, {})
	await expect
		.poll(
			async () =>
				(await entries()).filter((entry) => entry.type === 'like' && entry.post === null).length,
		)
		.toBe(1)
	const unavailableLike = (await entries()).find((entry) => entry.type === 'like')!
	deletedCursor = Buffer.from(`${Date.parse(unavailableLike.createdAt)}:ntf_z`).toString(
		'base64url',
	)
	expect(
		(await entries())
			.filter((entry) => entry.type === 'comment' || entry.type === 'reply')
			.every((entry) => entry.post === null && entry.commentId === null),
	).toBe(true)
	const invalid = await clients.owner.get('/api/notifications?cursor=invalid')
	expect(invalid.status()).toBe(400)
})

for (const width of [390, 1440]) {
	test(`notification list, unread state and keyboard navigation at ${width}px`, async ({
		page,
	}, testInfo) => {
		const now = Date.now()
		localSql(
			Array.from(
				{ length: 25 },
				(_, i) =>
					`INSERT INTO notifications (id, recipient_id, type, actor_id, dedupe_key, created_at) VALUES ('ntf_ui_${suffix}_${width}_${i}', '${userId('owner')}', 'follow', '${userId('actor')}', 'ui:${suffix}:${width}:${i}', ${now + i});`,
			).join('\n'),
		)
		await page.setViewportSize({ width, height: 844 })
		const errors: string[] = []
		page.on('pageerror', (error) => errors.push(error.message))
		await page.goto('/notifications', { waitUntil: 'networkidle' })
		await expect(page.locator('[data-notification-id]')).toHaveCount(20)
		const nav = width < 768 ? page.locator('[data-app-navigation]') : page.locator('aside')
		await expect(nav.locator('[data-unread-count]')).toBeVisible()
		const first = page.locator(`[data-notification-id="ntf_ui_${suffix}_${width}_24"]`)
		await expect(first).toHaveAttribute('data-unread', 'true')
		const button = first.getByRole('button')
		expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
		await button.focus()
		await expect(button).toBeFocused()
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
		await page.screenshot({
			path: testInfo.outputPath(`notifications-${width}.png`),
			fullPage: true,
		})
		await page.evaluate(() => document.documentElement.classList.add('dark'))
		await page.screenshot({
			path: testInfo.outputPath(`notifications-dark-${width}.png`),
			fullPage: true,
		})
		await button.press('Enter')
		await expect(page).toHaveURL(new RegExp(`/u/${username('actor')}$`))
		await page.goto('/notifications', { waitUntil: 'networkidle' })
		await expect(first).toHaveAttribute('data-unread', 'false')
		await page.getByRole('button', { name: 'Show more', exact: true }).click()
		await expect
			.poll(async () => page.locator('[data-notification-id]').count())
			.toBeGreaterThan(20)
		const loadedIds = await page
			.locator('[data-notification-id]')
			.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-notification-id')))
		await page.route('**/notifications/__data.json*', failNotificationReload, { times: 1 })
		await page.getByRole('button', { name: 'Mark all as read' }).click()
		await expect(page.getByRole('alert')).toBeVisible()
		expect(
			await page
				.locator('[data-notification-id]')
				.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-notification-id'))),
		).toEqual(loadedIds)
		await page.getByRole('button', { name: 'Try again' }).click()
		await expect(page.getByRole('alert')).toHaveCount(0)
		await expect(page.locator('[data-notification-id]')).toHaveCount(loadedIds.length)
		await expect(page.locator('[data-unread="true"]')).toHaveCount(0)
		await expect(nav.locator('[data-unread-count]')).toHaveCount(0)
		await page.getByRole('button', { name: 'Mark all as read' }).click()
		await expect(page.locator('[data-notification-id]')).toHaveCount(20)
		expect(errors).toEqual([])
	})
}

test('polls without refresh, pauses hidden tabs and retains rows after a failed refresh', async ({
	page,
}) => {
	await page.clock.install()
	let badgeRequests = 0
	let listRequests = 0
	let fail = false
	await page.route('**/api/notifications/unread', async (route) => {
		badgeRequests++
		await route.continue()
	})
	await page.route('**/api/notifications?*', async (route) => {
		listRequests++
		if (fail) await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL' } } })
		else await route.continue()
	})
	await page.goto('/notifications', { waitUntil: 'networkidle' })
	const initialBadge = badgeRequests
	const initialList = listRequests
	const liveId = `ntf_live_${suffix}`
	localSql(`INSERT INTO notifications (id, recipient_id, type, actor_id, dedupe_key, created_at)
		VALUES ('${liveId}', '${userId('owner')}', 'follow', '${userId('actor')}', 'live:${suffix}', ${Date.now() + 1000});`)
	fail = true
	await page.clock.runFor(30_000)
	await expect.poll(() => badgeRequests).toBeGreaterThan(initialBadge)
	await expect.poll(() => listRequests).toBeGreaterThan(initialList)
	await expect(page.getByRole('alert')).toBeVisible()
	await expect(page.locator('[data-notification-id]')).toHaveCount(20)
	await expect(page.locator('[data-app-navigation] [data-unread-count]')).toHaveAttribute(
		'data-unread-count',
		'1',
	)
	fail = false
	await page.getByRole('button', { name: 'Try again' }).click()
	await expect(page.getByRole('alert')).toHaveCount(0)
	await expect(page.locator(`[data-notification-id="${liveId}"]`)).toBeVisible()
	await page.evaluate(() => {
		Object.defineProperty(document, 'hidden', { configurable: true, value: true })
		document.dispatchEvent(new Event('visibilitychange'))
	})
	const beforeHidden = badgeRequests
	await page.clock.runFor(60_000)
	expect(badgeRequests).toBe(beforeHidden)
	await page.evaluate(() => {
		Object.defineProperty(document, 'hidden', { configurable: true, value: false })
		document.dispatchEvent(new Event('visibilitychange'))
	})
	await expect.poll(() => badgeRequests).toBeGreaterThan(beforeHidden)
})

test('unavailable notifications can be read without JavaScript and signed-out API calls are rejected', async ({
	browser,
	baseURL,
}) => {
	const context = await browser.newContext({
		baseURL,
		javaScriptEnabled: false,
		extraHTTPHeaders: { origin: baseURL! },
	})
	try {
		await context.addCookies(cookies)
		const page = await context.newPage()
		await page.goto('/notifications?cursor=' + deletedCursor)
		const unavailable = page
			.locator('[data-notification-id]')
			.filter({ hasText: 'This content is no longer available' })
			.first()
		await expect(unavailable).toBeVisible()
		await unavailable.getByRole('button').click()
		await expect(page).toHaveURL(/\/notifications/)
		await page.getByRole('button', { name: 'Mark all as read' }).click()
		await expect(page.locator('[data-unread="true"]')).toHaveCount(0)
	} finally {
		await context.close()
	}
	const guest = await browser.newContext({ baseURL })
	try {
		const page = await guest.newPage()
		expect((await page.request.get('/api/notifications')).status()).toBe(401)
		expect((await page.request.get('/api/notifications/unread')).status()).toBe(401)
		await page.goto('/notifications')
		await expect(page).toHaveURL(/\/login$/)
	} finally {
		await guest.close()
	}
})
