import { execFileSync } from 'node:child_process'
// cspell:ignore opencode replacestate
import { expect, test, type BrowserContext } from '@playwright/test'

test.use({ extraHTTPHeaders: { origin: 'http://localhost:8787' } })
test.describe.configure({ mode: 'serial' })
let cookies: Awaited<ReturnType<BrowserContext['storageState']>>['cookies'] = []

test.beforeAll(async ({ playwright, baseURL }) => {
	execFileSync(process.execPath, ['scripts/seed-demo-account.mjs'], {
		stdio: 'pipe',
		env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/opencode/follows-seed.log' },
	})
	const sql: string[] = []
	for (const name of ['owner', 'empty', ...Array.from({ length: 25 }, (_, i) => String(i))]) {
		sql.push(`INSERT OR IGNORE INTO user (id, name, email, email_verified, username, created_at, updated_at)
			VALUES ('usr_follow_ui_${name}', 'Follow UI ${name}', 'follow_ui_${name}@sns.example', 1, 'follow_ui_${name}', 1, 1);`)
	}
	for (let i = 0; i < 25; i += 1) {
		sql.push(`INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at)
			VALUES ('usr_follow_ui_${i}', 'usr_follow_ui_owner', ${100 + i}),
			('usr_follow_ui_owner', 'usr_follow_ui_${i}', ${100 + i});`)
	}
	sql.push(`INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at)
		VALUES ('usr_sns_demo', 'usr_follow_ui_owner', 200), ('usr_follow_ui_owner', 'usr_sns_demo', 200);`)
	execFileSync(
		process.execPath,
		[
			'node_modules/wrangler/bin/wrangler.js',
			'd1',
			'execute',
			'DB',
			'--local',
			'--command',
			sql.join('\n'),
		],
		{
			stdio: 'pipe',
			env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/opencode/follows-seed.log' },
		},
	)
	const request = await playwright.request.newContext({ baseURL })
	const login = await request.post('/api/auth/sign-in/email', {
		data: { email: 'demo@sns.example', password: 'SnsDemo!2026' },
		headers: { 'x-forwarded-for': `2001:db8:${crypto.randomUUID().slice(0, 4)}::1` },
	})
	expect(login.status(), await login.text()).toBe(200)
	cookies = (await request.storageState()).cookies
	await request.dispose()
})

test.beforeEach(async ({ page }) => {
	await page.context().addCookies(cookies)
})

for (const width of [390, 1440]) {
	for (const kind of ['followers', 'following'] as const) {
		test(`${kind}: navigation, infinite scrolling and follow controls at ${width}px`, async ({
			page,
		}, testInfo) => {
			await page.setViewportSize({ width, height: 844 })
			const errors: string[] = []
			page.on('pageerror', (error) => errors.push(error.message))
			await page.goto('/u/follow_ui_owner', { waitUntil: 'networkidle' })
			const stat = page.getByRole('main').getByRole('link', { name: new RegExp(kind, 'i') })
			await expect(stat).toHaveCSS('cursor', 'pointer')
			expect((await stat.boundingBox())!.height).toBeGreaterThanOrEqual(44)
			await stat.focus()
			await expect(stat).toBeFocused()
			await stat.press('Enter')
			await expect(page).toHaveURL(new RegExp(`/u/follow_ui_owner/${kind}$`))
			await expect(page.getByRole('heading', { name: kind, exact: false })).toBeVisible()
			await expect(page.locator('[data-user-id]')).toHaveCount(20)
			await expect(page.locator('[data-user-id="usr_sns_demo"]').getByRole('button')).toHaveCount(0)
			const row = page.locator('[data-user-id="usr_follow_ui_24"]')
			try {
				await row.getByRole('button', { name: 'Follow', exact: true }).click()
				await expect(row.getByRole('button', { name: 'Unfollow', exact: true })).toBeVisible()
				await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
				await expect(page.locator('[data-user-id]')).toHaveCount(26)
				await expect(row.getByRole('button', { name: 'Unfollow', exact: true })).toBeVisible()
				await expect(row.locator('input[name="active"]')).toHaveValue('false')
				await row.getByRole('button', { name: 'Unfollow', exact: true }).click()
				await expect(row.getByRole('button', { name: 'Follow', exact: true })).toBeVisible()
				const response = await page.request.get(`/api/users/follow_ui_owner/${kind}`)
				expect(response.ok()).toBe(true)
				const people: { items: { id: string; viewer: { following: boolean } }[] } =
					await response.json()
				expect(people.items.find((user) => user.id === 'usr_follow_ui_24')?.viewer.following).toBe(
					false,
				)
			} finally {
				await page.request.post(`/u/follow_ui_owner/${kind}?/follow`, {
					form: { username: 'follow_ui_24', active: 'false' },
				})
			}
			await expect(page.locator('[data-user-id="usr_follow_ui_0"] a')).toHaveAttribute(
				'href',
				'/u/follow_ui_0',
			)
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
			).toBe(true)
			await page.evaluate(() => window.scrollTo(0, 0))
			await page.screenshot({ path: testInfo.outputPath(`${kind}-${width}.png`), fullPage: true })
			await page.evaluate(() => document.documentElement.classList.add('dark'))
			await page.screenshot({
				path: testInfo.outputPath(`${kind}-dark-${width}.png`),
				fullPage: true,
			})
			await page.getByRole('link', { name: 'Back', exact: true }).click()
			await expect(page).toHaveURL(/\/u\/follow_ui_owner$/)
			expect(errors).toEqual([])
		})
	}
}

test('pagination failures preserve rows and offer a working retry', async ({ page }) => {
	let fail = true
	await page.route('**/api/users/follow_ui_owner/followers?*', async (route) => {
		if (fail) {
			fail = false
			await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL' } } })
		} else {
			await route.continue()
		}
	})
	await page.goto('/u/follow_ui_owner/followers', { waitUntil: 'networkidle' })
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
	await expect(page.getByRole('alert')).toBeVisible()
	await expect(page.locator('[data-user-id]')).toHaveCount(20)
	await page.getByRole('button', { name: 'Try again' }).click()
	await expect(page.locator('[data-user-id]')).toHaveCount(26)
})

for (const width of [390, 1440]) {
	test(`Back retraces nested profiles and follow lists after refresh at ${width}px`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ width, height: 844 })
		const errors: string[] = []
		page.on('pageerror', (error) => errors.push(error.message))
		const main = page.getByRole('main')
		const back = main.getByRole('link', { name: 'Back', exact: true })
		await page.goto('/u/follow_ui_owner', { waitUntil: 'networkidle' })
		await expect(back).toHaveCount(0)
		await main.getByRole('link', { name: /followers/i }).click()
		await expect(page).toHaveURL(/\/u\/follow_ui_owner\/followers$/)
		await page.locator('[data-user-id="usr_sns_demo"] a').click()
		await expect(page).toHaveURL(/\/u\/sns_demo$/)
		await expect(back).toBeVisible()
		await expect(back).toHaveAttribute('href', /\/u\/follow_ui_owner\/followers$/)
		await main.getByRole('link', { name: /following/i }).click()
		await expect(page).toHaveURL(/\/u\/sns_demo\/following$/)
		await page.locator('[data-user-id="usr_follow_ui_owner"] a').click()
		await expect(page).toHaveURL(/\/u\/follow_ui_owner$/)
		await page.reload({ waitUntil: 'networkidle' })
		await expect(back).toBeVisible()
		await back.focus()
		await expect(back).toBeFocused()
		expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44)
		await page.screenshot({
			path: testInfo.outputPath(`profile-back-${width}.png`),
			fullPage: true,
		})
		await page.evaluate(() => document.documentElement.classList.add('dark'))
		await page.screenshot({
			path: testInfo.outputPath(`profile-back-dark-${width}.png`),
			fullPage: true,
		})
		for (const path of [
			'/u/sns_demo/following',
			'/u/sns_demo',
			'/u/follow_ui_owner/followers',
			'/u/follow_ui_owner',
		]) {
			await back.click()
			await expect(page).toHaveURL(new RegExp(`${path}$`))
		}
		await expect(back).toHaveCount(0)
		await page.goForward()
		await expect(page).toHaveURL(/\/u\/follow_ui_owner\/followers$/)
		await expect(back).toBeVisible()
		await back.press('Enter')
		await expect(page).toHaveURL(/\/u\/follow_ui_owner$/)
		await expect(back).toHaveCount(0)
		await main.getByRole('link', { name: /following/i }).click()
		await expect(page).toHaveURL(/\/u\/follow_ui_owner\/following$/)
		await back.click()
		await expect(page).toHaveURL(/\/u\/follow_ui_owner$/)
		await expect(back).toHaveCount(0)
		expect(errors).toEqual([])
	})
}

test('directly opened follow lists have no Back, including after refresh', async ({ page }) => {
	await page.goto('/u/follow_ui_owner/followers', { waitUntil: 'networkidle' })
	const back = page.getByRole('main').getByRole('link', { name: 'Back', exact: true })
	await expect(back).toHaveCount(0)
	await page.reload({ waitUntil: 'networkidle' })
	await expect(back).toHaveCount(0)
	await page.locator('[data-user-id="usr_sns_demo"] a').click()
	await expect(back).toBeVisible()
	const [newTab] = await Promise.all([
		page.context().waitForEvent('page'),
		back.click({ modifiers: ['Control'] }),
	])
	await newTab.waitForLoadState('networkidle')
	await expect(newTab.getByRole('link', { name: 'Back', exact: true })).toHaveCount(0)
	await newTab.close()
	await back.click()
	await expect(page).toHaveURL(/\/u\/follow_ui_owner\/followers$/)
	await expect(back).toHaveCount(0)
})

for (const width of [390, 1440]) {
	test(`settings retrace their actual entry point at ${width}px`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width, height: 844 })
		await page.goto('/u/follow_ui_owner', { waitUntil: 'networkidle' })
		await page.getByRole('button', { name: 'Account menu' }).click()
		await page.getByRole('link', { name: 'Preferences', exact: true }).click()
		await expect(page).toHaveURL(/\/settings$/)
		const back = page.getByRole('main').getByRole('link', { name: 'Back', exact: true })
		await expect(back).toBeVisible()
		const length = await page.evaluate(() => history.length)
		await page.getByRole('link', { name: 'Preferences', exact: true }).click()
		await expect(page.getByRole('link', { name: 'Preferences', exact: true })).not.toBeFocused()
		await page.reload({ waitUntil: 'networkidle' })
		expect(await page.evaluate(() => history.length)).toBe(length)
		await expect(back).toHaveAttribute('href', /\/u\/follow_ui_owner$/)
		await page.screenshot({
			path: testInfo.outputPath(`settings-back-${width}.png`),
			fullPage: true,
		})
		await page.getByRole('main').getByRole('link', { name: 'Edit profile' }).click()
		await expect(page).toHaveURL(/\/settings\/profile$/)
		await page.reload({ waitUntil: 'networkidle' })
		await page.screenshot({
			path: testInfo.outputPath(`edit-profile-back-${width}.png`),
			fullPage: true,
		})
		await back.click()
		await expect(page).toHaveURL(/\/settings$/)
		await back.click()
		await expect(page).toHaveURL(/\/u\/follow_ui_owner$/)
		await expect(back).toHaveCount(0)
	})

	test(`direct story viewer has no Back at ${width}px`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width, height: 844 })
		await page.goto('/stories/sns_demo', { waitUntil: 'networkidle' })
		await expect(page.getByRole('link', { name: 'Back', exact: true })).toHaveCount(0)
		await expect(page.getByRole('link', { name: 'Close', exact: true })).toBeVisible()
		await page.screenshot({
			path: testInfo.outputPath(`story-direct-${width}.png`),
			fullPage: true,
		})
	})
}

test('same-URL Preferences links do not invent Back on a direct visit', async ({ page }) => {
	await page.goto('/settings', { waitUntil: 'networkidle' })
	const back = page.getByRole('main').getByRole('link', { name: 'Back', exact: true })
	await expect(back).toHaveCount(0)
	const length = await page.evaluate(() => history.length)
	await page.getByRole('button', { name: 'Account menu' }).click()
	await page.getByRole('link', { name: 'Preferences', exact: true }).click()
	await expect(page.getByRole('link', { name: 'Preferences', exact: true })).not.toBeFocused()
	await page.reload({ waitUntil: 'networkidle' })
	expect(await page.evaluate(() => history.length)).toBe(length)
	await expect(back).toHaveCount(0)
})

test('explicit replacement links preserve the original predecessor', async ({ page }) => {
	await page.goto('/u/follow_ui_owner', { waitUntil: 'networkidle' })
	await page.getByRole('button', { name: 'Account menu' }).click()
	const preferences = page.getByRole('link', { name: 'Preferences', exact: true })
	await preferences.evaluate((link) => link.setAttribute('data-sveltekit-replacestate', 'true'))
	const length = await page.evaluate(() => history.length)
	await preferences.click()
	await expect(page).toHaveURL(/\/settings$/)
	await page.reload({ waitUntil: 'networkidle' })
	expect(await page.evaluate(() => history.length)).toBe(length)
	await expect(page.getByRole('link', { name: 'Back', exact: true })).toHaveCount(0)
})

test('explicit same-URL pushes remain real Back steps', async ({ page }) => {
	await page.goto('/settings', { waitUntil: 'networkidle' })
	await page.getByRole('button', { name: 'Account menu' }).click()
	const preferences = page.getByRole('link', { name: 'Preferences', exact: true })
	await preferences.evaluate((link) => link.setAttribute('data-sveltekit-replacestate', 'false'))
	const length = await page.evaluate(() => history.length)
	await preferences.click()
	const back = page.getByRole('main').getByRole('link', { name: 'Back', exact: true })
	await expect(back).toBeVisible()
	expect(await page.evaluate(() => history.length)).toBe(length + 1)
	await back.click()
	await expect(back).toHaveCount(0)
	await expect(page).toHaveURL(/\/settings$/)
})

test('follow failures keep the existing follow state', async ({ page }) => {
	await page.goto('/u/follow_ui_owner/following', { waitUntil: 'networkidle' })
	await page.route('**/u/follow_ui_owner/following?/follow', (route) =>
		route.fulfill({
			json: { type: 'failure', status: 404, data: '[{"error":1},{"code":2},"NOT_FOUND"]' },
		}),
	)
	const row = page.locator('[data-user-id="usr_follow_ui_24"]')
	await row.getByRole('button', { name: 'Follow', exact: true }).click()
	await expect(row.getByRole('alert')).toBeVisible()
	await expect(row.getByRole('button', { name: 'Follow', exact: true })).toBeEnabled()
})

test('empty lists and missing profiles have distinct states', async ({ page }) => {
	await page.goto('/u/follow_ui_empty/followers')
	await expect(page.getByText('No followers yet', { exact: true })).toBeVisible()
	await page.goto('/u/follow_ui_empty/following')
	await expect(page.getByText('Not following anyone yet', { exact: true })).toBeVisible()
	const response = await page.goto('/u/follow_ui_missing/followers')
	expect(response?.status()).toBe(404)
})

test('server-rendered controls reflect existing follows without JavaScript', async ({
	browser,
	baseURL,
}) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false })
	try {
		await context.addCookies(cookies)
		const page = await context.newPage()
		await page.goto('/u/sns_demo/following')
		await expect(
			page
				.locator('[data-user-id="usr_follow_ui_owner"]')
				.getByRole('button', { name: 'Unfollow', exact: true }),
		).toBeVisible()
	} finally {
		await context.close()
	}
})

test('signed-out visitors can read lists and are sent to login when following', async ({
	browser,
	baseURL,
}) => {
	const context = await browser.newContext({ baseURL })
	try {
		const page = await context.newPage()
		await page.goto('/u/follow_ui_owner/followers')
		await page
			.locator('[data-user-id="usr_follow_ui_24"]')
			.getByRole('button', { name: 'Follow', exact: true })
			.click()
		await expect(page).toHaveURL(/\/login$/)
	} finally {
		await context.close()
	}
})
