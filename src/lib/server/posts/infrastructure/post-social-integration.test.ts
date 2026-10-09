import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getDb } from '../../db'
import { SqliteD1 } from '../../shared/testing/sqlite-d1'
import { createPostRepository } from './drizzle-posts'
import { createPostSocialRepository } from './drizzle-post-social'

function setup() {
	const d1 = new SqliteD1()
	for (const name of [
		'0000_low_penance',
		'0001_sns_foundation',
		'0002_story_expiry_and_likes',
		'0003_comment_reply_target',
		'0004_red_shocker',
		'0005_direct_messages',
		'0006_dapper_dreaming_celestial',
	])
		d1.sqlite.exec(readFileSync(`drizzle/${name}.sql`, 'utf8'))
	for (const [id, username] of [
		['usr_a', 'alice'],
		['usr_b', 'bob'],
		['usr_c', 'carol'],
	]) {
		d1.sqlite
			.prepare(
				'INSERT INTO user (id, name, email, username, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 1, 1)',
			)
			.run(id, username, `${username}@example.com`, username)
	}
	const db = getDb(d1)
	return {
		d1,
		posts: createPostRepository(db, d1, {
			origin: 'https://example.com',
			media: 'https://media.example.com',
		}),
		social: createPostSocialRepository(db, d1),
	}
}

describe('reposts and social activity', () => {
	it('shows posts liked or commented on by followed users, with actor names', async () => {
		const { d1, posts } = setup()
		d1.sqlite
			.exec(`INSERT INTO follows (follower_id, followee_id, created_at) VALUES ('usr_a', 'usr_b', 1);
			INSERT INTO posts (id, author_id, type, caption, created_at) VALUES ('pst_other', 'usr_c', 'post', 'Carol post', 10);
			INSERT INTO likes (post_id, user_id, created_at) VALUES ('pst_other', 'usr_b', 20);
			INSERT INTO comments (id, post_id, author_id, body, created_at) VALUES ('cmt_1', 'pst_other', 'usr_b', 'Nice', 30);
			UPDATE posts SET like_count = 1, comment_count = 1 WHERE id = 'pst_other';`)
		const feed = await posts.list({ viewerId: 'usr_a', scope: 'following', limit: 20 })
		expect(feed.items.map((post) => post.id)).toEqual(['pst_other'])
		expect(feed.items[0].activity).toMatchObject({ likedBy: [{ username: 'bob' }] })
	})

	it('reposts an original without copying its media and lists its likers', async () => {
		const { d1, posts, social } = setup()
		d1.sqlite
			.exec(`INSERT INTO posts (id, author_id, type, caption, created_at) VALUES ('pst_original', 'usr_c', 'post', 'Original', 10);
			INSERT INTO likes (post_id, user_id, created_at) VALUES ('pst_original', 'usr_b', 20);`)
		await social.createRepost('pst_repost', 'usr_a', 'pst_original', new Date(40))
		const repost = await posts.find('pst_repost', 'usr_a')
		expect(repost).toMatchObject({
			repostOfId: 'pst_original',
			original: { id: 'pst_original', caption: 'Original', author: { username: 'carol' } },
			media: [],
		})
		expect((await social.listLikers('pst_original')).items.map((user) => user.username)).toEqual([
			'bob',
		])
		d1.sqlite.exec("UPDATE posts SET deleted_at = 50 WHERE id = 'pst_original'")
		expect((await posts.find('pst_repost', 'usr_a'))?.original).toBeNull()
	})
})
