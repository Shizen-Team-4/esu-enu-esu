import { expect, test } from '@playwright/test'

test('home page renders', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('SNS')
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
			await page.goto('/')
			await expect(page.locator('html')).toHaveAttribute('lang', lang)
		})
	})
}
