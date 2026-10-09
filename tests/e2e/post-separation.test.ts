// cspell:ignore opencode
import { execFileSync } from 'node:child_process'
import { expect, test, type BrowserContext } from '@playwright/test'

test.use({ extraHTTPHeaders: { origin: 'http://localhost:8787' } })
test.describe.configure({ mode: 'serial' })
let authenticatedCookies: Awaited<ReturnType<BrowserContext['storageState']>>['cookies'] = []
const fixtureId = crypto.randomUUID()
const postIds = [0, 1].map((index) => `pst_${fixtureId}_${index}`)
const mediaId = `med_${fixtureId}`
const mediaKey = `post-separation-${fixtureId}.svg`

function fixtureSql(command: string) {
	execFileSync(
		process.execPath,
		[
			'node_modules/wrangler/bin/wrangler.js',
			'd1',
			'execute',
			'DB',
			'--local',
			'--command',
			command,
		],
		{
			stdio: 'pipe',
			env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/opencode/post-separation-fixture.log' },
		},
	)
}

test.beforeAll(async ({ playwright, baseURL }) => {
	const request = await playwright.request.newContext({ baseURL })
	execFileSync(process.execPath, ['scripts/seed-demo-account.mjs'], {
		stdio: 'pipe',
		env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/opencode/post-separation-seed.log' },
	})
	const login = await request.post('/api/auth/sign-in/email', {
		data: { email: 'demo@sns.example', password: 'SnsDemo!2026' },
		headers: { 'x-forwarded-for': `2001:db8:${crypto.randomUUID().slice(0, 4)}::1` },
	})
	expect(login.status(), await login.text()).toBe(200)
	authenticatedCookies = (await request.storageState()).cookies
	await request.dispose()
	const now = Date.now()
	fixtureSql(`
		INSERT INTO posts (id, author_id, type, caption, created_at) VALUES
		('${postIds[0]}', 'usr_sns_demo', 'post', 'Post separation portrait fixture', ${now + 1}),
		('${postIds[1]}', 'usr_sns_demo', 'post', 'Post separation text fixture', ${now});
		INSERT INTO media (id, owner_id, purpose, type, mime_type, size_bytes, r2_key, status, width, height)
		VALUES ('${mediaId}', 'usr_sns_demo', 'post', 'image', 'image/svg+xml', 100, '${mediaKey}', 'attached', 100, 2000);
		INSERT INTO post_media (post_id, media_id, position) VALUES ('${postIds[0]}', '${mediaId}', 0);
	`)
})

test.afterAll(() => {
	fixtureSql(`
		DELETE FROM post_media WHERE media_id = '${mediaId}';
		DELETE FROM posts WHERE id IN ('${postIds[0]}', '${postIds[1]}');
		DELETE FROM media WHERE id = '${mediaId}';
	`)
})

for (const width of [390, 1440]) {
	test(`posts are separated by clean spacing at ${width}px`, async ({ page }, testInfo) => {
		await page.context().addCookies(authenticatedCookies)
		await page.setViewportSize({ width, height: 844 })
		await page.route(`**/media/${mediaKey}`, (route) =>
			route.fulfill({
				contentType: 'image/svg+xml',
				body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="2000"><rect width="100" height="2000" fill="white"/></svg>',
			}),
		)
		await page.goto('/', { waitUntil: 'networkidle' })
		const list = page.locator('.feed-posts')
		const posts = list.locator(':scope > article')
		await expect(posts.filter({ hasText: 'Post separation portrait fixture' })).toBeVisible()
		await expect(posts.filter({ hasText: 'Post separation text fixture' })).toBeVisible()
		await expect(list.locator('.hatch')).toHaveCount(0)
		await expect(list).toHaveCSS('row-gap', '20px')
		const first = await posts.nth(0).boundingBox()
		const second = await posts.nth(1).boundingBox()
		expect(second!.y - (first!.y + first!.height)).toBeCloseTo(20)
		await page.screenshot({ path: testInfo.outputPath(`feed-${width}.png`), fullPage: true })
		await page.evaluate(() => document.documentElement.classList.add('dark'))
		await expect(list).toHaveCSS('row-gap', '20px')
		await page.screenshot({ path: testInfo.outputPath(`feed-dark-${width}.png`), fullPage: true })
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
	})

	test(`media without captions has scalable spacing below the author at ${width}px`, async ({
		page,
	}, testInfo) => {
		await page.context().addCookies(authenticatedCookies)
		await page.setViewportSize({ width, height: 844 })
		await page.route(`**/media/${mediaKey}`, (route) =>
			route.fulfill({
				contentType: 'image/svg+xml',
				body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="2000"></svg>',
			}),
		)
		await page.goto(`/p/${postIds[0]}`, { waitUntil: 'networkidle' })
		const post = page.locator('.post-comments > article')
		const media = post.locator(':scope > div.bg-muted')
		const caption = post.getByText('Post separation portrait fixture', { exact: true })
		await expect(caption).toBeVisible()
		try {
			fixtureSql(`UPDATE posts SET caption = '' WHERE id = '${postIds[0]}';`)
			await page.reload({ waitUntil: 'networkidle' })
			await expect(caption).toHaveCount(0)
			for (const fontSize of ['100%', '150%']) {
				await page.evaluate((size) => {
					document.documentElement.style.fontSize = size
				}, fontSize)
				const header = post.locator('header')
				const headerBox = await header.boundingBox()
				const mediaBox = await media.boundingBox()
				const expectedGap = await post.evaluate((element) =>
					parseFloat(getComputedStyle(element).rowGap),
				)
				expect(expectedGap).toBeGreaterThan(0)
				expect(mediaBox!.y - headerBox!.y - headerBox!.height).toBeCloseTo(expectedGap)
			}
			await page.screenshot({
				path: testInfo.outputPath(`media-without-caption-${width}.png`),
				fullPage: true,
			})
		} finally {
			fixtureSql(
				`UPDATE posts SET caption = 'Post separation portrait fixture' WHERE id = '${postIds[0]}';`,
			)
		}
	})

	test(`comment page has a Back link and only a line after the post at ${width}px`, async ({
		page,
	}, testInfo) => {
		await page.context().addCookies(authenticatedCookies)
		await page.setViewportSize({ width, height: 844 })
		await page.goto('/', { waitUntil: 'networkidle' })
		await page
			.locator('article')
			.filter({ hasText: 'Post separation text fixture' })
			.getByRole('button', { name: 'Comment' })
			.click()
		await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeVisible()
		await expect(page.getByRole('link', { name: 'Back', exact: true })).toHaveAttribute(
			'href',
			/\/$/,
		)
		await expect(page.locator('.post-comments > .hatch')).toHaveCount(0)
		const post = page.locator('.post-comments > article')
		await expect(post).toHaveCSS('border-bottom-width', '1px')
		await expect(post.locator('xpath=following-sibling::*[1]')).toHaveAttribute('id', 'comments')
		const postBox = await post.boundingBox()
		const commentsBox = await page.locator('#comments').boundingBox()
		expect(commentsBox!.y).toBeCloseTo(postBox!.y + postBox!.height)
		await page.screenshot({
			path: testInfo.outputPath(`comment-boundary-${width}.png`),
			fullPage: true,
		})
		const url = page.url()
		const length = await page.evaluate(() => history.length)
		const input = page.getByRole('textbox', { name: 'Write a comment…' })
		await input.fill('Keep this draft')
		await input.evaluate((field: HTMLTextAreaElement) => field.setSelectionRange(4, 4))
		for (let click = 0; click < 2; click += 1) {
			await post.getByRole('button', { name: 'Comment' }).click()
			await expect(input).toBeFocused()
			await expect(input).toHaveValue('Keep this draft')
			expect(await input.evaluate((field: HTMLTextAreaElement) => field.selectionStart)).toBe(4)
			await expect(page).toHaveURL(url)
			expect(await page.evaluate(() => history.length)).toBe(length)
		}
		await page.screenshot({
			path: testInfo.outputPath(`comment-focus-${width}.png`),
			fullPage: true,
		})
		await page.reload({ waitUntil: 'networkidle' })
		await page.getByRole('link', { name: 'Back', exact: true }).click()
		await expect(page).toHaveURL(/\/$/)
		await expect(page.locator('.post-comments')).toHaveCount(0)
		await page
			.locator('article')
			.filter({ hasText: 'Post separation text fixture' })
			.getByRole('button', { name: 'Comment' })
			.click()
		await expect(page).toHaveURL(new RegExp(`/p/${postIds[1]}#comments$`))
		await post.getByRole('button', { name: 'Comment' }).click()
		await expect(input).toBeFocused()
		await page.reload({ waitUntil: 'networkidle' })
		await page.getByRole('link', { name: 'Back', exact: true }).click()
		await expect(page).toHaveURL(/\/$/)
		await page.goto(`/p/${postIds[1]}#comments`, { waitUntil: 'networkidle' })
		await expect(page.getByRole('link', { name: 'Back', exact: true })).toHaveCount(0)
		await post.getByRole('button', { name: 'Comment' }).click()
		await expect(input).toBeFocused()
		await page.reload({ waitUntil: 'networkidle' })
		await expect(page.getByRole('link', { name: 'Back', exact: true })).toHaveCount(0)
	})
}
