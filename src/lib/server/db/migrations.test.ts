import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('SNS migration', () => {
	it('preserves existing auth data and creates the 17 required tables with foreign keys enabled', () => {
		const db = new DatabaseSync(':memory:')
		try {
			db.exec('PRAGMA foreign_keys = ON')
			db.exec(readFileSync('drizzle/0000_low_penance.sql', 'utf8'))
			db.exec(
				"INSERT INTO user VALUES ('usr_1', 'Name', 'user@example.com', 1, NULL, 1700000000, 1700000000)",
			)
			db.exec(
				"INSERT INTO session VALUES ('session_1', 1800000000, 'token', 1700000000, 1700000000, NULL, NULL, 'usr_1')",
			)
			db.exec(readFileSync('drizzle/0001_sns_foundation.sql', 'utf8'))
			expect(
				db
					.prepare('SELECT COUNT(*) AS count FROM sqlite_master WHERE type = ? AND name NOT LIKE ?')
					.get('table', 'sqlite_%'),
			).toMatchObject({ count: 17 })
			expect(db.prepare('SELECT username, role, created_at FROM user').get()).toMatchObject({
				username: null,
				role: 'user',
				created_at: 1700000000000,
			})
			expect(db.prepare('SELECT expires_at FROM session').get()).toMatchObject({
				expires_at: 1800000000000,
			})
			expect(db.prepare('PRAGMA foreign_keys').get()).toMatchObject({ foreign_keys: 1 })
			expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
		} finally {
			db.close()
		}
	})
})
