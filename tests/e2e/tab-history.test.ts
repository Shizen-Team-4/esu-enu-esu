import { execFileSync } from 'node:child_process'
import { expect, test, type BrowserContext } from '@playwright/test'

// cspell:ignore opencode
test.use({ extraHTTPHeaders: { origin: 'http://localhost:8787' } })
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

for (const width of [390, 1440]) {
	test(`profile tab switches return straight to Home after refresh at ${width}px`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ width, height: 844 })
		const errors: string[] = []
		page.on('pageerror', (error) => errors.push(error.message))
		await page.goto('/', { waitUntil: 'networkidle' })
		await page.getByRole('button', { name: 'Account menu' }).click()
		await page.getByRole('link', { name: 'Profile', exact: true }).click()
		await expect(page).toHaveURL(/\/u\/sns_demo$/)
		const length = await page.evaluate(() => history.length)
		const tabs = page.getByRole('navigation', { name: 'Profile content' })
		for (const name of ['Reels', 'Posts', 'Reels', 'Posts']) {
			await tabs.getByRole('link', { name, exact: true }).click()
			await expect(page).toHaveURL(new RegExp(`\\?type=${name === 'Reels' ? 'reel' : 'post'}$`))
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
		await page.goForward()
		await expect(page).toHaveURL(/\/u\/sns_demo\?type=post$/)
		await back.click()
		await expect(page).toHaveURL(/\/$/)
		expect(errors).toEqual([])
	})

	test(`direct profile tab switches do not invent Back at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 844 })
		await page.goto('/u/sns_demo', { waitUntil: 'networkidle' })
		const length = await page.evaluate(() => history.length)
		const tabs = page.getByRole('navigation', { name: 'Profile content' })
		const back = page.getByRole('main').getByRole('link', { name: 'Back', exact: true })
		for (const name of ['Reels', 'Posts']) {
			await tabs.getByRole('link', { name, exact: true }).click()
			await expect(page).toHaveURL(new RegExp(`\\?type=${name === 'Reels' ? 'reel' : 'post'}$`))
			await expect(back).toHaveCount(0)
		}
		await page.reload({ waitUntil: 'networkidle' })
		await expect(back).toHaveCount(0)
		expect(await page.evaluate(() => history.length)).toBe(length)
		await page
			.getByRole('main')
			.getByRole('link', { name: /followers/i })
			.click()
		await expect(page).toHaveURL(/\/u\/sns_demo\/followers$/)
		await expect(back).toHaveAttribute('href', /\/u\/sns_demo\?type=post$/)
		await back.click()
		await expect(page).toHaveURL(/\/u\/sns_demo\?type=post$/)
		await expect(back).toHaveCount(0)
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
		await expect(page).toHaveURL(/\/bookmarks$/)
		await page.goForward()
		await expect(page).toHaveURL(/\/\?scope=following$/)
	})
}
