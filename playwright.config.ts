import { defineConfig, devices } from '@playwright/test'

const PORT = 8787

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	reporter: [['list'], ['html', { open: 'on-failure' }]],

	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'retain-on-failure',
	},

	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

	// Runs the built worker in workerd (same runtime as production) with local D1/KV.
	webServer: {
		command: `pnpm build && pnpm db:migrate:local && pnpm preview --port ${PORT}`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: true,
		timeout: 180_000,
	},
})
