import { expect, test } from '@playwright/test'

test('logged-out home redirects to /login', async ({ page }) => {
	await page.goto('/')
	expect(new URL(page.url()).pathname).toBe('/login')
})

// The browser's `locale` drives the Accept-Language header, which hooks.server.ts reads.
for (const [locale, lang] of [
	['ja-JP', 'ja'],
	['km-KH', 'km'],
	['fr-FR', 'en'], // unsupported -> default
] as const) {
	test.describe(`browser locale ${locale}`, () => {
		test.use({ locale })

		test(`renders <html lang="${lang}">`, async ({ page }) => {
			await page.goto('/login')
			await expect(page.locator('html')).toHaveAttribute('lang', lang)
		})
	})
}
