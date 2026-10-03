import { expect, test } from '@playwright/test'

for (const path of ['/dashboard', '/create', '/profile', '/stories/someone', '/notifications']) {
	test(`logged-out visit to ${path} redirects to /login`, async ({ page }) => {
		await page.goto(path)
		expect(new URL(page.url()).pathname).toBe('/login')
	})
}

test('public page /search is not redirected', async ({ page }) => {
	await page.goto('/search')
	expect(new URL(page.url()).pathname).toBe('/search')
})
