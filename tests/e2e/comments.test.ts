import { execFileSync } from 'node:child_process'
import { expect, test, type Page as BrowserPage, type BrowserContext } from '@playwright/test'
import type { Comment, Page, Post } from '../../src/lib/contract'

async function preparePost(page: BrowserPage) {
	const caption = `Comment UI test ${crypto.randomUUID()}`
	const created = await page.request.post('/create?/post', { form: { type: 'post', caption } })
	expect(created.ok(), await created.text()).toBe(true)
	const response = await page.request.get('/api/feed?scope=all')
	const feed: Page<Post> = await response.json()
	const post = feed.items.find((item) => item.caption === caption)
	expect(post).toBeDefined()
	return post!.id
}

async function comments(page: BrowserPage, postId: string): Promise<Page<Comment>> {
	return (await page.request.get(`/api/posts/${postId}/comments`)).json()
}

test.use({ extraHTTPHeaders: { origin: 'http://localhost:8787' } })
test.describe.configure({ mode: 'serial' })
let authenticatedCookies: Awaited<ReturnType<BrowserContext['storageState']>>['cookies'] = []
test.beforeAll(async ({ playwright, baseURL }) => {
	const request = await playwright.request.newContext({ baseURL })
	execFileSync(process.execPath, ['scripts/seed-demo-account.mjs'], {
		stdio: 'pipe',
		env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/comment-test-seed.log' },
	})
	const login = await request.post('/api/auth/sign-in/email', {
		data: { email: 'demo@sns.example', password: 'SnsDemo!2026' },
		headers: { 'x-forwarded-for': `2001:db8:${crypto.randomUUID().slice(0, 4)}::1` },
	})
	expect(login.status(), await login.text()).toBe(200)
	authenticatedCookies = (await request.storageState()).cookies
	await request.dispose()
})
test.beforeEach(async ({ page }) => {
	await page.context().addCookies(authenticatedCookies)
})

for (const width of [390, 1440]) {
	test(`comment, reply, branch expansion and confirmed deletion at ${width}px`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ width, height: 844 })
		const postId = await preparePost(page)
		const errors: string[] = []
		page.on('pageerror', (error) => errors.push(error.message))
		try {
			await page.goto(`/p/${postId}`)
			await expect(page.getByText('No comments yet', { exact: true })).toBeVisible()
			await expect(page.locator('.comment-dock')).toHaveCount(0)
			const sectionBox = await page.locator('#comments').boundingBox()
			expect(sectionBox!.y + sectionBox!.height).toBeGreaterThanOrEqual(844)
			await expect(page.locator('[data-root-composer]')).toBeVisible()
			const composer = page.getByRole('textbox', { name: 'Write a comment…' })
			await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled()
			const send = page.getByRole('button', { name: 'Send', exact: true })
			expect((await send.boundingBox())!.height).toBeGreaterThanOrEqual(44)
			expect((await send.locator('span').boundingBox())!.height).toBeLessThan(44)
			await composer.fill('Root comment')
			await page.getByRole('button', { name: 'Send', exact: true }).click()
			await expect(page.getByText('Root comment', { exact: true })).toBeVisible()
			await expect(composer).toHaveValue('')
			const root = (await comments(page, postId)).items[0]
			const rootItem = page.locator(`[data-comment-id="${root.id}"]`)
			await expect(rootItem.getByRole('button', { name: 'Reply', exact: true })).toHaveCSS(
				'cursor',
				'pointer',
			)
			await expect(rootItem.getByRole('button', { name: 'Delete', exact: true })).toHaveCSS(
				'cursor',
				'pointer',
			)
			await rootItem.getByRole('button', { name: 'Reply', exact: true }).click()
			await expect(rootItem.getByRole('button', { name: 'Cancel reply', exact: true })).toHaveCSS(
				'cursor',
				'pointer',
			)
			await expect(page.getByText('Replying to @sns_demo', { exact: true })).toBeVisible()
			await expect(rootItem.getByRole('textbox')).toBeVisible()
			await expect(page.locator('.comment-dock')).toHaveCount(0)
			await rootItem.getByRole('textbox').fill('First reply')
			await page.screenshot({
				path: testInfo.outputPath(`inline-reply-${width}.png`),
				fullPage: true,
			})
			await page.getByRole('button', { name: 'Send', exact: true }).click()
			await expect(page.getByText('First reply', { exact: true })).toBeVisible()
			await page.getByRole('button', { name: 'Hide replies', exact: true }).click()
			await expect(page.getByText('First reply', { exact: true })).toBeHidden()
			await page.getByRole('button', { name: '1 reply', exact: true }).click()
			const replyResponse = await page.request.get(`/api/comments/${root.id}/replies`)
			expect(replyResponse.ok()).toBe(true)
			const replies: Page<Comment> = await replyResponse.json()
			const replyItem = page.locator(`[data-comment-id="${replies.items[0].id}"]`)
			await replyItem.getByRole('button', { name: 'Reply', exact: true }).click()
			await expect(replyItem.getByRole('textbox')).toBeVisible()
			await replyItem.getByRole('textbox').fill('Reply to a reply')
			await page.getByRole('button', { name: 'Send', exact: true }).click()
			await expect(page.getByText('Reply to a reply')).toHaveCount(0)
			const allReplies: Page<Comment> = await (
				await page.request.get(`/api/comments/${root.id}/replies`)
			).json()
			expect(allReplies.items[1].parentId).toBe(root.id)
			expect(allReplies.items[1].replyToUser?.username).toBe('sns_demo')
			expect(allReplies.items[1].replyToCommentId).toBe(replies.items[0].id)
			await expect(page.getByRole('button', { name: 'Focus thread' })).toHaveCount(0)
			await replyItem.getByRole('button', { name: '1 reply', exact: true }).click()
			await expect(page.getByLabel('Parent comment context')).toContainText('Root comment')
			await expect(page.getByText('Reply to a reply')).toBeVisible()
			const rootBox = await rootItem.boundingBox(),
				replyBox = await replyItem.boundingBox()
			expect(replyBox!.x).toBe(rootBox!.x)
			const connector = page.locator('.ancestor')
			expect(
				await connector.evaluate(
					(element) => getComputedStyle(element, '::before').borderLeftStyle,
				),
			).toBe('dashed')
			expect(
				await connector.evaluate(
					(element) => getComputedStyle(element, '::before').borderLeftWidth,
				),
			).toBe('2px')
			await page.evaluate(() => window.scrollTo(0, 0))
			await page.screenshot({ path: testInfo.outputPath(`comments-${width}.png`), fullPage: true })
			await page.evaluate(() => document.documentElement.classList.add('dark'))
			await page.screenshot({
				path: testInfo.outputPath(`comments-dark-${width}.png`),
				fullPage: true,
			})
			await page.evaluate(() => document.documentElement.classList.remove('dark'))
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
			).toBe(true)
			await page.getByRole('button', { name: 'Back to main thread' }).click()
			await rootItem.getByRole('button', { name: 'Delete', exact: true }).click()
			await expect(page.getByText('Delete this comment?', { exact: true })).toBeVisible()
			await rootItem.getByRole('button', { name: 'Cancel', exact: true }).click()
			await expect(rootItem).toBeVisible()
			await rootItem.getByRole('button', { name: 'Delete', exact: true }).click()
			await rootItem.locator('form').getByRole('button', { name: 'Delete', exact: true }).click()
			await expect(rootItem).toHaveCount(0)
			await expect(page.getByText('First reply', { exact: true })).toBeVisible()
			await expect(page.getByText('Reply to a reply')).toBeVisible()
			expect((await comments(page, postId)).items).toHaveLength(2)
			expect(errors).toEqual([])
		} finally {
			await page.request.post(`/p/${postId}?/delete`, { form: {} })
		}
	})
}

test('guests see comments without deletion controls and can log in to reply', async ({ page }) => {
	const postId = await preparePost(page)
	try {
		await page.request.post(`/p/${postId}?/comment`, {
			form: { body: 'A public comment', parentId: '' },
		})
		await page.context().clearCookies()
		await page.goto(`/p/${postId}`)
		await expect(page.getByText('A public comment', { exact: true })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0)
		await expect(page.getByText('Log in to join the conversation.', { exact: true })).toBeVisible()
	} finally {
		await page.context().addCookies(authenticatedCookies)
		await page.request.post(`/p/${postId}?/delete`, { form: {} })
	}
})

test('keeps a failed inline reply draft and restores the top composer after sending', async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 })
	const postId = await preparePost(page)
	try {
		await page.request.post(`/p/${postId}?/comment`, {
			form: { body: 'Reply target', parentId: '' },
		})
		await page.goto(`/p/${postId}`, { waitUntil: 'networkidle' })
		await page.getByRole('button', { name: 'Reply', exact: true }).click()
		await expect(page.getByText('Replying to @sns_demo', { exact: true })).toBeVisible()
		const composer = page.getByRole('textbox', { name: 'Write a comment…' })
		await composer.fill('😀'.repeat(501))
		await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled()
		await composer.fill('😀'.repeat(500))
		await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeEnabled()
		await composer.fill('Draft survives failure')
		await page.route(
			(url) => url.pathname === `/p/${postId}` && url.search === '?/comment',
			(route) =>
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						type: 'failure',
						status: 429,
						data: '[{"error":1},{"code":2},"RATE_LIMITED"]',
					}),
				}),
		)
		await page.getByRole('button', { name: 'Send', exact: true }).click()
		await expect(page.getByRole('alert')).toContainText('Too many attempts.')
		await expect(composer).toHaveValue('Draft survives failure')
		await expect(page.getByText('Replying to @sns_demo', { exact: true })).toBeVisible()
		await page.unrouteAll({ behavior: 'wait' })
		await page.getByRole('button', { name: 'Send', exact: true }).click()
		await expect(page.getByText('Draft survives failure', { exact: true })).toBeVisible()
		await expect(page.getByRole('alert')).toHaveCount(0)
		await expect(page.locator('.comment-dock')).toHaveCount(0)
		await expect(page.locator('[data-root-composer]')).toBeVisible()
		await expect(composer).toHaveValue('')
	} finally {
		await page.request.post(`/p/${postId}?/delete`, { form: {} })
	}
})

test('shows a new root at the top when posted from an expanded branch', async ({ page }) => {
	const postId = await preparePost(page)
	try {
		await page.request.post(`/p/${postId}?/comment`, {
			form: { body: 'Original root', parentId: '' },
		})
		const root = (await comments(page, postId)).items[0]
		await page.request.post(`/p/${postId}?/comment`, {
			form: { body: 'Branch parent', parentId: root.id },
		})
		const replies: Page<Comment> = await (
			await page.request.get(`/api/comments/${root.id}/replies`)
		).json()
		await page.request.post(`/p/${postId}?/comment`, {
			form: { body: 'Branch child', parentId: replies.items[0].id },
		})
		await page.goto(`/p/${postId}`)
		await page.getByRole('button', { name: '2 replies', exact: true }).click()
		await page
			.locator(`[data-comment-id="${replies.items[0].id}"]`)
			.getByRole('button', { name: '1 reply', exact: true })
			.click()
		await page.locator('[data-root-composer]').getByRole('textbox').fill('New root at the top')
		await page
			.locator('[data-root-composer]')
			.getByRole('button', { name: 'Send', exact: true })
			.click()
		await expect(page.locator('[data-comment-id]').first()).toContainText('New root at the top')
		await expect(page.getByRole('button', { name: 'Back to main thread' })).toHaveCount(0)
	} finally {
		await page.request.post(`/p/${postId}?/delete`, { form: {} })
	}
})

for (const width of [390, 1440]) {
	test(`comment fields grow and shrink without internal scrolling at ${width}px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 844 })
		const postId = await preparePost(page)
		try {
			await page.goto(`/p/${postId}`, { waitUntil: 'networkidle' })
			const input = page.getByRole('textbox', { name: 'Write a comment…' })
			const initialHeight = (await input.boundingBox())!.height
			await expect(input).toHaveCSS('resize', 'none')
			await input.fill(Array.from({ length: 15 }, (_, i) => `Line ${i}`).join('\n'))
			await expect
				.poll(async () => (await input.boundingBox())!.height)
				.toBeGreaterThan(initialHeight)
			await expect
				.poll(() =>
					input.evaluate(
						(element: HTMLTextAreaElement) => element.scrollHeight - element.clientHeight,
					),
				)
				.toBeLessThanOrEqual(1)
			await input.fill('A short root comment')
			await expect.poll(async () => (await input.boundingBox())!.height).toBe(initialHeight)
			await page.getByRole('button', { name: 'Send', exact: true }).click()
			await expect(input).toHaveValue('')
			await page.getByRole('button', { name: 'Reply', exact: true }).click()
			await input.fill('A wrapped reply '.repeat(30))
			await expect
				.poll(async () => (await input.boundingBox())!.height)
				.toBeGreaterThan(initialHeight)
			await expect
				.poll(() =>
					input.evaluate(
						(element: HTMLTextAreaElement) => element.scrollHeight - element.clientHeight,
					),
				)
				.toBeLessThanOrEqual(1)
			await page.setViewportSize({ width: 320, height: 844 })
			await expect
				.poll(() =>
					input.evaluate(
						(element: HTMLTextAreaElement) => element.scrollHeight - element.clientHeight,
					),
				)
				.toBeLessThanOrEqual(1)
			await input.fill('Short reply')
			await expect.poll(async () => (await input.boundingBox())!.height).toBe(initialHeight)
		} finally {
			await page.request.post(`/p/${postId}?/delete`, { form: {} })
		}
	})
}
