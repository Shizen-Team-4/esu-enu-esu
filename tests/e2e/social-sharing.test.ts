import { execFileSync } from 'node:child_process'
import { expect, test, type BrowserContext } from '@playwright/test'

test.use({ extraHTTPHeaders: { origin: 'http://localhost:8787' } })
test.describe.configure({ mode: 'serial' })
let cookies: Awaited<ReturnType<BrowserContext['storageState']>>['cookies'] = []
const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 12)
const friendId = `usr_friend_${suffix}`
const authorId = `usr_author_${suffix}`
const postId = `pst_social_${suffix}`
const commentId = `cmt_social_${suffix}`
const friendName = `friend_${suffix}`
const caption = `Social feed fixture ${suffix}`

function fixtureSql(command: string) {
	execFileSync(
		process.execPath,
		[
			'node_modules/wrangler/bin/wrangler.js',
			'd1',
			'execute',
			'DB',
			'--local',
			'--command',
			command,
		],
		{
			stdio: 'pipe',
			env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/social-sharing-fixture.log' },
		},
	)
}

test.beforeAll(async ({ playwright, baseURL }) => {
	execFileSync(process.execPath, ['scripts/seed-demo-account.mjs'], {
		stdio: 'pipe',
		env: { ...process.env, WRANGLER_LOG_PATH: '/tmp/social-sharing-seed.log' },
	})
	const request = await playwright.request.newContext({ baseURL })
	try {
		const login = await request.post('/api/auth/sign-in/email', {
			data: { email: 'demo@sns.example', password: 'SnsDemo!2026' },
			headers: { 'x-forwarded-for': `2001:db8:${suffix.slice(0, 4)}::1` },
		})
		expect(login.status(), await login.text()).toBe(200)
		cookies = (await request.storageState()).cookies
	} finally {
		await request.dispose()
	}
	const now = Date.now()
	fixtureSql(`INSERT INTO user (id, name, email, email_verified, username, created_at, updated_at)
		VALUES ('${friendId}', 'Fixture friend', '${friendName}@example.com', 1, '${friendName}', ${now}, ${now}),
		('${authorId}', 'Fixture author', 'author_${suffix}@example.com', 1, 'author_${suffix}', ${now}, ${now});
		INSERT INTO follows (follower_id, followee_id, created_at) VALUES ('usr_sns_demo', '${friendId}', ${now});
		INSERT INTO posts (id, author_id, type, caption, like_count, comment_count, created_at)
		VALUES ('${postId}', '${authorId}', 'post', '${caption}', 1, 1, ${now});
		INSERT INTO likes (post_id, user_id, created_at) VALUES ('${postId}', '${friendId}', ${now + 1});
		INSERT INTO comments (id, post_id, author_id, body, created_at) VALUES ('${commentId}', '${postId}', '${friendId}', 'Fixture comment', ${now + 2});`)
})

test.afterAll(() => {
	fixtureSql(`DELETE FROM posts WHERE repost_of_id = '${postId}';
		DELETE FROM comments WHERE id = '${commentId}';
		DELETE FROM likes WHERE post_id = '${postId}';
		DELETE FROM posts WHERE id = '${postId}';
		DELETE FROM follows WHERE follower_id = 'usr_sns_demo' AND followee_id = '${friendId}';
		DELETE FROM user WHERE id IN ('${friendId}', '${authorId}');`)
})

test('followed activity leads to a third-party post and it can be reposted', async ({ page }) => {
	await page.context().addCookies(cookies)
	await page.goto('/?scope=following', { waitUntil: 'networkidle' })
	const post = page.locator('article').filter({ hasText: caption })
	await expect(post).toBeVisible()
	await expect(post.getByText('Fixture friend')).toHaveCount(2)
	await post.getByRole('button', { name: 'Share' }).click()
	await expect(page.getByRole('dialog', { name: 'Share' })).toBeVisible()
	await page
		.getByRole('dialog', { name: 'Share' })
		.getByRole('button', { name: 'Repost to feed' })
		.click()
	await expect(page).toHaveURL(/\/$/)
	await expect(
		page.locator('article').filter({ hasText: caption }).filter({ hasText: 'View original post' }),
	).toBeVisible()
	await page.goto(`/p/${postId}/likes`)
	await expect(page.getByRole('link', { name: /Fixture friend/ })).toBeVisible()
})
