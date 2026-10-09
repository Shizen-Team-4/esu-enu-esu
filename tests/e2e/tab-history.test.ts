import { execFileSync } from 'node:child_process'
import { expect, test, type BrowserContext } from '@playwright/test'

// cspell:ignore opencode
test.use({ extraHTTPHeaders: { origin: 'http://localhost:8787' } })
test.describe.configure({ mode: 'default' })
let cookies: Awaited<ReturnType<BrowserContext['storageState']>>['cookies'] = []

test.beforeAll(async ({ playwright, baseURL }) => {
	execFileSync(process.execPath, ['scripts/seed-demo-account.mjs'], {
		stdio: 'pipe',
		env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/opencode/tab-history-seed.log' },
	})
	const request = await playwright.request.newContext({ baseURL })
	try {
		const login = await request.post('/api/auth/sign-in/email', {
			data: { email: 'demo@sns.example', password: 'SnsDemo!2026' },
			headers: { 'x-forwarded-for': `2001:db8:${crypto.randomUUID().slice(0, 4)}::1` },
		})
		expect(login.status(), await login.text()).toBe(200)
		cookies = (await request.storageState()).cookies
	} finally {
		await request.dispose()
	}
})

test.beforeEach(async ({ page }) => {
	await page.context().addCookies(cookies)
})

for (const width of [390, 768, 1440]) {
	test(`profile tab switches return straight to Home after refresh at ${width}px`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ width, height: 844 })
		const errors: string[] = []
		page.on('pageerror', (error) => errors.push(error.message))
		await page.goto('/', { waitUntil: 'networkidle' })
		await page.getByRole('link', { name: 'Profile', exact: true }).first().click()
		await expect(page).toHaveURL(/\/u\/sns_demo$/)
		const length = await page.evaluate(() => history.length)
		const tabs = page.getByRole('navigation', { name: 'Profile content' })
		for (const name of ['Reels', 'Bookmarks', 'Posts', 'Reels', 'Posts']) {
			await tabs.getByRole('link', { name, exact: true }).click()
			const type = { Bookmarks: 'bookmarks', Reels: 'reel', Posts: 'post' }[name]
			await expect(page).toHaveURL(new RegExp(`\\?type=${type}$`))
		}
		expect(await page.evaluate(() => history.length)).toBe(length)
		await page.reload({ waitUntil: 'networkidle' })
		const back = page.getByRole('main').getByRole('link', { name: 'Back', exact: true })
		await expect(back).toHaveAttribute('href', /\/$/)
		await page.screenshot({
			path: testInfo.outputPath(`profile-tabs-${width}.png`),
			fullPage: true,
		})
		await back.click()
		await expect(page).toHaveURL(/\/$/)
		await page.goBack()
		await expect(page).toHaveURL(/\/u\/sns_demo\?type=post$/)
		await back.click()
		await expect(page).toHaveURL(/\/$/)
		expect(errors).toEqual([])
	})

	test(`direct profile tab switches keep Back to Home at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 844 })
		await page.goto('/u/sns_demo', { waitUntil: 'networkidle' })
		const length = await page.evaluate(() => history.length)
		const tabs = page.getByRole('navigation', { name: 'Profile content' })
		const back = page.getByRole('main').getByRole('link', { name: 'Back', exact: true })
		for (const name of ['Reels', 'Posts']) {
			await tabs.getByRole('link', { name, exact: true }).click()
			await expect(page).toHaveURL(new RegExp(`\\?type=${name === 'Reels' ? 'reel' : 'post'}$`))
			await expect(back).toHaveAttribute('href', '/')
		}
		await page.reload({ waitUntil: 'networkidle' })
		await expect(back).toHaveAttribute('href', '/')
		expect(await page.evaluate(() => history.length)).toBe(length)
		await page
			.getByRole('main')
			.getByRole('link', { name: /followers/i })
			.click()
		await expect(page).toHaveURL(/\/u\/sns_demo\/followers$/)
		await expect(back).toHaveAttribute('href', /\/u\/sns_demo\?type=post$/)
		await back.click()
		await expect(page).toHaveURL(/\/u\/sns_demo\?type=post$/)
		await expect(back).toHaveAttribute('href', '/')
		await back.click()
		await expect(page).toHaveURL(/\/$/)
	})

	test(`Preferences and Edit Profile Back go to Home at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 844 })
		for (const path of ['/settings', '/settings/profile']) {
			await page.goto(path, { waitUntil: 'networkidle' })
			const back = page.getByRole('main').getByRole('link', { name: 'Back', exact: true })
			await expect(back).toHaveAttribute('href', '/')
			await back.click()
			await expect(page).toHaveURL(/\/$/)
		}
	})

	test(`Home tab switches preserve the prior page at ${width}px`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width, height: 844 })
		await page.goto('/bookmarks', { waitUntil: 'networkidle' })
		await page.getByRole('link', { name: 'Home', exact: true }).click()
		await expect(page).toHaveURL(/\/$/)
		const length = await page.evaluate(() => history.length)
		const tabs = page.getByRole('navigation', { name: 'Feed', exact: true })
		for (const name of ['Following', 'For you', 'Following']) {
			await tabs.getByRole('link', { name, exact: true }).click()
			await expect(page).toHaveURL(name === 'Following' ? /\/\?scope=following$/ : /\/$/)
		}
		expect(await page.evaluate(() => history.length)).toBe(length)
		await page.reload({ waitUntil: 'networkidle' })
		await page.screenshot({ path: testInfo.outputPath(`feed-tabs-${width}.png`), fullPage: true })
		await page.goBack()
		await expect(page).toHaveURL(/\/u\/sns_demo\?type=bookmarks$/)
		await page.goForward()
		await expect(page).toHaveURL(/\/\?scope=following$/)
	})

	test(`profile navigation, private tabs and menu styling at ${width}px`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ width, height: 844 })
		await page.goto('/', { waitUntil: 'networkidle' })
		const header = page.getByRole('banner')
		await expect(header.getByRole('link', { name: 'Notifications' })).toHaveCount(0)
		const menu = header.getByRole('button', { name: 'Account menu' })
		await expect(menu.locator('svg')).toHaveCount(1)
		await expect(menu.locator('img')).toHaveCount(0)
		await menu.click()
		const entries = page.locator('#avatar-menu').locator('a, button')
		await expect(entries).toHaveText(['Profile', 'Preferences', 'Log out'])
		const styles = await entries.evaluateAll((elements) =>
			elements.map((element) => {
				const style = getComputedStyle(element)
				return { padding: style.padding, radius: style.borderRadius, height: style.height }
			}),
		)
		expect(styles[2]).toEqual(styles[0])
		expect(styles[1]).toEqual(styles[0])
		await entries.last().hover()
		await page.screenshot({ path: testInfo.outputPath(`account-menu-${width}.png`) })
		await page.keyboard.press('Escape')
		await expect(menu).toBeFocused()
		const nav =
			width < 1024
				? page.locator('[data-app-navigation]')
				: page.getByRole('complementary', { name: 'Main navigation' })
		await expect(nav.getByRole('link', { name: 'Bookmarks' })).toHaveCount(0)
		await nav.getByRole('link', { name: 'Profile', exact: true }).click()
		await expect(page).toHaveURL(/\/u\/sns_demo$/)
		await expect(nav.getByRole('link', { name: 'Profile', exact: true })).toHaveAttribute(
			'aria-current',
			'page',
		)
		const tabs = page.getByRole('navigation', { name: 'Profile content' })
		await expect(tabs.getByRole('link')).toHaveText(['Posts', 'Reels', 'Bookmarks'])
		const query = new URLSearchParams({ cursor: 'legacy+cursor' })
		const redirect = await page.request.get(`/bookmarks?${query}`, {
			maxRedirects: 0,
		})
		expect(redirect.status()).toBe(303)
		expect(redirect.headers().location).toBe(`/u/sns_demo?type=bookmarks&${query}`)
		for (const type of ['post', 'reel', 'bookmarks']) {
			await page.goto(`/u/sns_demo?type=${type}`, { waitUntil: 'networkidle' })
			const bounds = await page.getByRole('main').boundingBox()
			expect(bounds!.y + bounds!.height).toBeGreaterThanOrEqual(844)
			await page.screenshot({
				path: testInfo.outputPath(`profile-${type}-${width}.png`),
				fullPage: true,
			})
		}
		await page.context().clearCookies()
		await page.goto('/u/sns_demo', { waitUntil: 'networkidle' })
		await expect(tabs.getByRole('link')).toHaveText(['Posts', 'Reels'])
		const response = await page.goto('/u/sns_demo?type=bookmarks')
		expect(response?.status()).toBe(404)
	})
}
