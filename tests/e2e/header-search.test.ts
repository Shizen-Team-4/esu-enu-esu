import { expect, test } from '@playwright/test'

const user = {
	id: 'search-user',
	username: 'alice',
	displayName: 'Alice',
	avatarUrl: null,
	viewer: { isMe: false, following: false },
}

test.describe('desktop header search', () => {
	test.use({ viewport: { width: 1440, height: 900 } })

	for (const items of [[user], []]) {
		test(`Enter keeps ${items.length ? 'matching' : 'empty'} results on the current screen`, async ({
			page,
		}, testInfo) => {
			let requests = 0
			await page.route('**/api/users/search?*', (route) => {
				requests += 1
				return route.fulfill({ json: { items, nextCursor: null } })
			})
			await page.goto('/search', { waitUntil: 'networkidle' })
			const originalUrl = page.url()
			const input = page.getByRole('combobox')
			await input.fill('alice')
			await expect(input).toHaveAttribute('aria-expanded', 'true')
			await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(items.length)
			await input.press('Enter')
			await expect.poll(() => requests).toBe(2)
			await expect(input).toHaveAttribute('aria-expanded', 'true')
			await expect(page).toHaveURL(originalUrl)
			await page.screenshot({ path: testInfo.outputPath('desktop-search.png') })
		})
	}

	test('Enter before suggestions load shows results without navigating', async ({ page }) => {
		let release!: () => void
		const submitted = new Promise<void>((resolve) => (release = resolve))
		await page.route('**/api/users/search?*', async (route) => {
			await submitted
			await route.fulfill({ json: { items: [user], nextCursor: null } })
		})
		await page.goto('/search', { waitUntil: 'networkidle' })
		const originalUrl = page.url()
		const input = page.getByRole('combobox')
		await input.fill('alice')
		await input.press('Enter')
		release()
		await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(1)
		await expect(page).toHaveURL(originalUrl)
	})

	test('Enter opens a profile only after keyboard selection', async ({ page }) => {
		await page.route('**/api/users/search?*', (route) =>
			route.fulfill({ json: { items: [user], nextCursor: null } }),
		)
		await page.goto('/search', { waitUntil: 'networkidle' })
		const input = page.getByRole('combobox')
		await input.fill('alice')
		await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(1)
		await input.press('ArrowDown')
		await input.press('Enter')
		await expect(page).toHaveURL(/\/u\/alice$/)
	})
})

test('mobile keeps the dedicated search page', async ({ page }, testInfo) => {
	await page.setViewportSize({ width: 390, height: 844 })
	await page.goto('/search', { waitUntil: 'networkidle' })
	await expect(page.getByRole('combobox')).toBeHidden()
	await expect(page.getByRole('main').getByRole('textbox')).toBeVisible()
	await expect(page.getByRole('main').getByRole('button', { name: 'Search' })).toBeVisible()
	await page.screenshot({ path: testInfo.outputPath('mobile-search.png') })
})
