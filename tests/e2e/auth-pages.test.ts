import { expect, test } from '@playwright/test'

test.use({ locale: 'en-US' })

test('auth tabs switch between sign in and create account', async ({ page }) => {
	await page.goto('/login')
	await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute('aria-current', 'page')
	await page.getByRole('link', { name: 'Create account' }).click()
	await expect(page).toHaveURL(/\/register$/)
	await expect(page.getByLabel('Username')).toBeVisible()
})

test('password visibility can be toggled', async ({ page }) => {
	await page.goto('/login', { waitUntil: 'networkidle' })
	const password = page.getByLabel('Password', { exact: true })
	await expect(password).toHaveAttribute('type', 'password')
	await page.getByRole('button', { name: 'Show' }).click()
	await expect(password).toHaveAttribute('type', 'text')
})

test('login links to forgot password', async ({ page }) => {
	await page.goto('/login')
	await page.getByRole('link', { name: 'Forgot password?' }).click()
	await expect(page).toHaveURL(/\/forgot-password$/)
})

test('logged-out visit to /settings/profile redirects to /login', async ({ page }) => {
	await page.goto('/settings/profile')
	expect(new URL(page.url()).pathname).toBe('/login')
})
