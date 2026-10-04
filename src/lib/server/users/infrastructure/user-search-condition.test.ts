import { DatabaseSync } from 'node:sqlite'
import { sql } from 'drizzle-orm'
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'
import { userSearchCondition } from './user-search-condition'

function matchingUsernames(q: string) {
	const db = new DatabaseSync(':memory:')
	db.exec('CREATE TABLE user (username TEXT, name TEXT)')
	const insert = db.prepare('INSERT INTO user (username, name) VALUES (?, ?)')
	for (const [username, name] of [
		['alice', 'Alice Smith'],
		['al_x', 'Alex'],
		['alpha', 'Bob 100%'],
		['bob', 'Bob'],
	])
		insert.run(username, name)
	const query = new SQLiteSyncDialect().sqlToQuery(
		sql`SELECT u.username FROM user u WHERE ${userSearchCondition(q)} ORDER BY u.username`,
	)
	const rows = db.prepare(query.sql).all(...(query.params as string[])) as { username: string }[]
	db.close()
	return rows.map((row) => row.username)
}

describe('userSearchCondition', () => {
	it('builds SQL that SQLite accepts with a single-character escape', () => {
		expect(() => matchingUsernames('al')).not.toThrow()
	})

	it('matches usernames and display names by prefix', () => {
		expect(matchingUsernames('al')).toEqual(['al_x', 'alice', 'alpha'])
		expect(matchingUsernames('bob')).toEqual(['alpha', 'bob'])
	})

	it('treats underscore as a literal character', () => {
		expect(matchingUsernames('al_')).toEqual(['al_x'])
	})

	it('treats percent as a literal character', () => {
		expect(matchingUsernames('%')).toEqual([])
	})

	it('treats backslash as a literal character', () => {
		expect(matchingUsernames('\\')).toEqual([])
	})
})
