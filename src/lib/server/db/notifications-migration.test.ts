import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function database() {
	const db = new DatabaseSync(':memory:')
	db.exec('PRAGMA foreign_keys = ON')
	for (const name of [
		'0000_low_penance',
		'0001_sns_foundation',
		'0002_story_expiry_and_likes',
		'0003_comment_reply_target',
		'0004_red_shocker',
	])
		db.exec(readFileSync(`drizzle/${name}.sql`, 'utf8'))
	db.exec(`INSERT INTO user (id, name, email, email_verified, username, created_at, updated_at)
		VALUES ('usr_1', 'Recipient', 'recipient@example.com', 1, 'recipient', 0, 0),
		('usr_2', 'Actor', 'actor@example.com', 1, 'actor', 0, 0);
		INSERT INTO posts (id, author_id, type, caption, created_at) VALUES ('pst_1', 'usr_1', 'post', 'Hello', 0);
		INSERT INTO comments (id, author_id, post_id, body, created_at) VALUES ('cmt_1', 'usr_2', 'pst_1', 'Reply', 0);
		INSERT INTO notifications (id, recipient_id, type, actor_id, post_id, comment_id, dedupe_key, created_at)
		VALUES ('ntf_1', 'usr_1', 'reply', 'usr_2', 'pst_1', 'cmt_1', 'comment:cmt_1:usr_1', 0);`)
	return db
}

describe('notification migration', () => {
	it('is additive and keeps foreign keys enabled', () => {
		const db = database()
		try {
			expect(db.prepare('SELECT COUNT(*) AS count FROM posts').get()).toMatchObject({ count: 1 })
			expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
			expect(db.prepare('PRAGMA foreign_keys').get()).toMatchObject({ foreign_keys: 1 })
		} finally {
			db.close()
		}
	})
	it('enforces stable event dedupe without dropping history', () => {
		const db = database()
		try {
			db.exec(`INSERT INTO notifications (id, recipient_id, type, dedupe_key, created_at)
				VALUES ('ntf_2', 'usr_1', 'reply', 'comment:cmt_1:usr_1', 10) ON CONFLICT(dedupe_key) DO NOTHING;`)
			expect(db.prepare('SELECT COUNT(*) AS count FROM notifications').get()).toMatchObject({
				count: 1,
			})
		} finally {
			db.close()
		}
	})
	it('retains notification and dedupe after hard deletion of comments, posts and actors', () => {
		const db = database()
		try {
			db.exec(
				"UPDATE notifications SET read_at = 20; DELETE FROM comments WHERE id = 'cmt_1'; DELETE FROM posts WHERE id = 'pst_1'; DELETE FROM user WHERE id = 'usr_2';",
			)
			expect(
				db
					.prepare('SELECT actor_id, post_id, comment_id, dedupe_key, read_at FROM notifications')
					.get(),
			).toMatchObject({
				actor_id: null,
				post_id: null,
				comment_id: null,
				dedupe_key: 'comment:cmt_1:usr_1',
				read_at: 20,
			})
			expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
		} finally {
			db.close()
		}
	})
	it('deletes private history when its recipient account is deleted', () => {
		const db = database()
		try {
			db.exec("DELETE FROM user WHERE id = 'usr_1'")
			expect(db.prepare('SELECT COUNT(*) AS count FROM notifications').get()).toMatchObject({
				count: 0,
			})
		} finally {
			db.close()
		}
	})
	it('uses the recipient and unread indexes for list and badge queries', () => {
		const db = database()
		try {
			const list = db
				.prepare(
					'EXPLAIN QUERY PLAN SELECT id FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC, id DESC LIMIT 21',
				)
				.all('usr_1')
			const count = db
				.prepare(
					'EXPLAIN QUERY PLAN SELECT COUNT(*) FROM notifications WHERE recipient_id = ? AND read_at IS NULL',
				)
				.all('usr_1')
			expect(list.some((row) => String(row.detail).includes('notifications_list_idx'))).toBe(true)
			expect(count.some((row) => String(row.detail).includes('notifications_unread_idx'))).toBe(
				true,
			)
		} finally {
			db.close()
		}
	})
})
