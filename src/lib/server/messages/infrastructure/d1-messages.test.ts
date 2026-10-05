import { afterEach, describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { SqliteD1 } from '../../shared/testing/sqlite-d1'
import { createMessageRepository } from './d1-messages'
import { decodeCursor } from '../../shared/domain/cursor'
const opened: SqliteD1[] = []
function setup() {
	const db = new SqliteD1()
	opened.push(db)
	const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'))
	for (const { tag } of journal.entries)
		db.sqlite.exec(readFileSync('drizzle/' + tag + '.sql', 'utf8'))
	for (const id of ['a', 'b', 'c'])
		db.sqlite
			.prepare(
				'INSERT INTO user(id,name,email,username,email_verified,created_at,updated_at) VALUES(?,?,?,?,1,0,0)',
			)
			.run('usr_' + id, id, id + '@example.test', id)
	return { db, repo: createMessageRepository(db) }
}
afterEach(() => {
	for (const db of opened.splice(0)) db.sqlite.close()
})
const open = (repo: ReturnType<typeof createMessageRepository>) =>
	repo.start({ id: 'dm_ab', viewerId: 'usr_a', recipientId: 'usr_b', now: 1 })
const send = (repo: ReturnType<typeof createMessageRepository>, n = 1, senderId = 'usr_a') =>
	repo.send({ id: 'msg_' + n, threadId: 'dm_ab', senderId, body: 'Hello ' + n, now: n + 10 })
describe('message persistence and privacy', () => {
	it('adds message tables without modifying posts or media and reuses the same pair in either direction', async () => {
		const { db, repo } = setup()
		expect(await open(repo)).toBe('dm_ab')
		expect(
			await repo.start({ id: 'dm_other', viewerId: 'usr_b', recipientId: 'usr_a', now: 2 }),
		).toBe('dm_ab')
		expect(db.sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([])
		expect((await repo.list('usr_b', { limit: 20 })).items).toHaveLength(0)
	})
	it('does not expose other people·s threads or unread counts', async () => {
		const { repo } = setup()
		await open(repo)
		await send(repo)
		expect(await repo.find('dm_ab', 'usr_c')).toBeNull()
		expect((await repo.list('usr_c', { limit: 20 })).items).toHaveLength(0)
		expect(await repo.unread('usr_c')).toBe(0)
		await expect(send(repo, 2, 'usr_c')).rejects.toMatchObject({ code: 'NOT_FOUND' })
	})
	it('tracks unread and monotonic read receipts without marking newer messages read', async () => {
		const { repo } = setup()
		await open(repo)
		const first = await send(repo)
		const second = await send(repo, 2)
		expect(await repo.unread('usr_b')).toBe(2)
		await repo.read('dm_ab', 'usr_b', first.sequence)
		expect(await repo.unread('usr_b')).toBe(1)
		await repo.read('dm_ab', 'usr_b', 9999)
		expect(await repo.unread('usr_b')).toBe(1)
		await repo.read('dm_ab', 'usr_b', second.sequence)
		await repo.read('dm_ab', 'usr_b', first.sequence)
		expect(await repo.unread('usr_b')).toBe(0)
		expect((await repo.find('dm_ab', 'usr_a'))?.peerReadSequence).toBe(second.sequence)
	})
	it('deduplicates a retry but rejects reuse for different content', async () => {
		const { repo } = setup()
		await open(repo)
		const first = await send(repo)
		expect(await send(repo)).toEqual(first)
		expect((await repo.history('dm_ab')).messages).toHaveLength(1)
		await expect(
			repo.send({ id: 'msg_1', threadId: 'dm_ab', senderId: 'usr_a', body: 'Changed', now: 20 }),
		).rejects.toMatchObject({ code: 'CONFLICT' })
	})
	it('enforces 30 sends per minute atomically and preserves retries at the limit', async () => {
		const { repo } = setup()
		await open(repo)
		for (let i = 1; i <= 30; i++) await send(repo, i)
		await expect(send(repo, 31)).rejects.toMatchObject({ code: 'RATE_LIMITED', retryAfterSec: 60 })
		expect((await send(repo)).id).toBe('msg_1')
	})
	it('paginates messages chronologically without omissions', async () => {
		const { repo } = setup()
		await open(repo)
		for (let i = 1; i <= 55; i++)
			await repo.send({
				id: 'msg_' + i,
				threadId: 'dm_ab',
				senderId: 'usr_a',
				body: 'Item ' + i,
				now: i * 61000,
			})
		const latest = await repo.history('dm_ab')
		expect(latest.messages).toHaveLength(50)
		expect(latest.messages[0].id).toBe('msg_6')
		const older = await repo.history('dm_ab', latest.nextBefore!)
		expect(older.messages.map((x) => x.id)).toEqual(['msg_1', 'msg_2', 'msg_3', 'msg_4', 'msg_5'])
		expect(older.nextBefore).toBeNull()
	})
	it('paginates inbox and maps message previews and avatars', async () => {
		const { repo } = setup()
		await open(repo)
		await send(repo)
		await repo.start({ id: 'dm_ac', viewerId: 'usr_a', recipientId: 'usr_c', now: 100 })
		const first = await repo.list('usr_a', { limit: 1 })
		expect(first.items[0].id).toBe('dm_ac')
		const second = await repo.list('usr_a', { limit: 1, cursor: decodeCursor(first.nextCursor!) })
		expect(second.items[0]).toMatchObject({
			id: 'dm_ab',
			lastMessage: 'Hello 1',
			peer: { username: 'b', avatarUrl: null },
		})
		expect(second.nextCursor).toBeNull()
	})
	it('hides banned recipients and refuses missing or unverified recipients', async () => {
		const { db, repo } = setup()
		await expect(
			repo.start({ id: 'dm_none', viewerId: 'usr_a', recipientId: 'usr_missing', now: 1 }),
		).rejects.toMatchObject({ code: 'NOT_FOUND' })
		await open(repo)
		db.sqlite.exec("UPDATE user SET banned=1 WHERE id='usr_b'")
		expect(await repo.find('dm_ab', 'usr_a')).toBeNull()
		await expect(send(repo)).rejects.toMatchObject({ code: 'NOT_FOUND' })
		expect(await repo.unread('usr_a')).toBe(0)
	})
	it('deletes private history with a participant account', async () => {
		const { db, repo } = setup()
		await open(repo)
		await send(repo)
		db.sqlite.exec("DELETE FROM user WHERE id='usr_b'")
		expect((await repo.list('usr_a', { limit: 20 })).items).toHaveLength(0)
		expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM direct_messages').get()).toMatchObject({
			count: 0,
		})
	})
})
