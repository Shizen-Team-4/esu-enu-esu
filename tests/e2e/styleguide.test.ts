import { devices, expect, test } from '@playwright/test'

test.use({ ...devices['Pixel 7'] })

test('the bottom nav does not cover the last item', async ({ page }) => {
	await page.goto('/styleguide/layout')
	const lastItem = page.getByText('Last item')
	await lastItem.scrollIntoViewIfNeeded()
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

	const nav = page.getByRole('navigation', { name: 'Main navigation' })
	await expect(lastItem).toBeVisible()
	const itemBox = (await lastItem.boundingBox())!
	const navBox = (await nav.boundingBox())!
	expect(itemBox.y + itemBox.height).toBeLessThanOrEqual(navBox.y)
})

test('the gallery next button moves to the second item', async ({ page }) => {
	await page.goto('/styleguide/posts')
	await page.waitForLoadState('networkidle')
	const gallery = page.getByRole('group', { name: 'Post media' })
	await gallery.scrollIntoViewIfNeeded()
	await expect(gallery.getByText('1 / 10', { exact: true })).toBeVisible()

	await gallery.getByRole('button', { name: 'Next' }).click()
	await expect(gallery.getByText('2 / 10', { exact: true })).toBeVisible()
})

test('the dialog opens, closes with Escape and returns focus to its trigger', async ({ page }) => {
	await page.goto('/styleguide')
	// wait for hydration so the click reaches the Svelte handler
	await page.waitForLoadState('networkidle')
	const trigger = page.getByRole('button', { name: 'Open dialog' })
	await trigger.click()
	await expect(page.getByRole('dialog', { name: 'Delete this post?' })).toBeVisible()

	await page.keyboard.press('Escape')
	await expect(page.getByRole('dialog')).toBeHidden()
	await expect(trigger).toBeFocused()
})
