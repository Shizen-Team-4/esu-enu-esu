import { AppError } from '../../shared/domain/app-error'
import { encodeCursor } from '../../shared/domain/cursor'
import type { MessageRepository } from '../application/ports'
import {
	mapConversation,
	mapMessage,
	type ConversationRow,
	type MessageRow,
} from './message-mapper'

const messageColumns = 'id, sequence, sender_id AS senderId, body, created_at AS createdAt'
const members = '(t.first_user_id = ?1 OR t.second_user_id = ?1)'
const peerJoin =
	'JOIN user u ON u.id = CASE WHEN t.first_user_id = ?1 THEN t.second_user_id ELSE t.first_user_id END'
const activePeer = '(u.banned = 0 AND u.email_verified = 1 AND u.username IS NOT NULL)'
const readSequence =
	'CASE WHEN t.first_user_id = ?1 THEN t.first_read_sequence ELSE t.second_read_sequence END'
const projection = `SELECT t.id, u.id AS peerId, u.username, u.name, u.image, t.updated_at AS updatedAt,
 CASE WHEN t.first_user_id = ?1 THEN t.second_read_sequence ELSE t.first_read_sequence END AS peerReadSequence,
 (SELECT body FROM direct_messages WHERE thread_id = t.id ORDER BY sequence DESC LIMIT 1) AS lastMessage,
 (SELECT COUNT(*) FROM direct_messages WHERE thread_id = t.id AND sender_id != ?1 AND sequence > (${readSequence})) AS unreadCount
 FROM direct_threads t ${peerJoin} WHERE ${members} AND ${activePeer}`

export function createMessageRepository(db: D1Database): MessageRepository {
	return {
		async start({ id, viewerId, recipientId, now }) {
			const [first, second] = [viewerId, recipientId].sort()
			await db
				.prepare(
					`INSERT INTO direct_threads (id, first_user_id, second_user_id, created_by, updated_at)
    SELECT ?, ?, ?, ?, ? WHERE EXISTS(SELECT 1 FROM user WHERE id = ? AND banned = 0 AND email_verified = 1 AND username IS NOT NULL)
    AND EXISTS(SELECT 1 FROM user WHERE id = ? AND banned = 0 AND email_verified = 1)
    ON CONFLICT(first_user_id, second_user_id) DO NOTHING`,
				)
				.bind(id, first, second, viewerId, now, recipientId, viewerId)
				.run()
			const thread = await db
				.prepare(`${projection} AND t.first_user_id = ?2 AND t.second_user_id = ?3`)
				.bind(viewerId, first, second)
				.first<ConversationRow>()
			if (!thread) throw new AppError('NOT_FOUND')
			return thread.id
		},
		async list(viewerId, { cursor, limit }) {
			const bindings: (string | number)[] = [viewerId]
			let boundary = ''
			if (cursor) {
				boundary = ' AND (t.updated_at < ?2 OR (t.updated_at = ?2 AND t.id < ?3))'
				bindings.push(cursor.time, cursor.id)
			}
			bindings.push(limit + 1)
			const result = await db
				.prepare(
					`${projection}
    AND (t.created_by = ?1 OR EXISTS(SELECT 1 FROM direct_messages WHERE thread_id = t.id))
    ${boundary} ORDER BY t.updated_at DESC, t.id DESC LIMIT ?${bindings.length}`,
				)
				.bind(...bindings)
				.all<ConversationRow>()
			const rows = result.results.slice(0, limit)
			const last = rows.at(-1)
			return {
				items: rows.map(mapConversation),
				nextCursor:
					result.results.length > limit && last
						? encodeCursor({ time: last.updatedAt, id: last.id })
						: null,
			}
		},
		async find(threadId, viewerId) {
			const row = await db
				.prepare(`${projection} AND t.id = ?2`)
				.bind(viewerId, threadId)
				.first<ConversationRow>()
			return row ? mapConversation(row) : null
		},
		async history(threadId, before) {
			const result = await db
				.prepare(
					`SELECT ${messageColumns} FROM direct_messages WHERE thread_id = ? AND sequence < ? ORDER BY sequence DESC LIMIT 51`,
				)
				.bind(threadId, before ?? Number.MAX_SAFE_INTEGER)
				.all<MessageRow>()
			const rows = result.results.slice(0, 50)
			return {
				messages: rows.reverse().map(mapMessage),
				nextBefore: result.results.length > 50 ? rows[0].sequence : null,
			}
		},
		async send(input) {
			const { id, threadId, senderId, body, now } = input
			const results = await db.batch([
				db
					.prepare(
						`INSERT INTO direct_messages (id, thread_id, sender_id, body, created_at)
     SELECT ?2, ?3, ?1, ?4, ?5 WHERE EXISTS(
      SELECT 1 FROM direct_threads t ${peerJoin} WHERE ${members} AND ${activePeer} AND t.id = ?3
     ) AND EXISTS(SELECT 1 FROM user WHERE id = ?1 AND banned = 0 AND email_verified = 1)
     AND (SELECT COUNT(*) FROM direct_messages WHERE sender_id = ?1 AND created_at > ?5 - 60000) < 30
     ON CONFLICT(id) DO NOTHING`,
					)
					.bind(senderId, id, threadId, body, now),
				db
					.prepare(
						`UPDATE direct_threads SET updated_at = MAX(updated_at, ?)
     WHERE id = ? AND EXISTS(SELECT 1 FROM direct_messages WHERE id = ? AND thread_id = ? AND sender_id = ? AND body = ?)`,
					)
					.bind(now, threadId, id, threadId, senderId, body),
			])
			const row = await db
				.prepare(
					`SELECT ${messageColumns}, thread_id AS threadId FROM direct_messages WHERE id = ?`,
				)
				.bind(id)
				.first<MessageRow & { threadId: string }>()
			if (row && row.threadId === threadId && row.senderId === senderId && row.body === body)
				return mapMessage({
					id: row.id,
					sequence: row.sequence,
					senderId: row.senderId,
					body: row.body,
					createdAt: row.createdAt,
				})
			if (row) throw new AppError('CONFLICT')
			if (!results[0].meta.changes) {
				const available = await db
					.prepare(`${projection} AND t.id = ?2`)
					.bind(senderId, threadId)
					.first()
				if (!available) throw new AppError('NOT_FOUND')
			}
			throw new AppError('RATE_LIMITED', undefined, 60)
		},
		async read(threadId, viewerId, sequence) {
			// The exact displayed message must belong to this thread; an arbitrary future cursor cannot clear unread messages.
			await db
				.prepare(
					`UPDATE direct_threads SET
    first_read_sequence = CASE WHEN first_user_id = ? THEN MAX(first_read_sequence, ?) ELSE first_read_sequence END,
    second_read_sequence = CASE WHEN second_user_id = ? THEN MAX(second_read_sequence, ?) ELSE second_read_sequence END
    WHERE id = ? AND (first_user_id = ? OR second_user_id = ?)
    AND EXISTS(SELECT 1 FROM direct_messages WHERE thread_id = ? AND sequence = ?)`,
				)
				.bind(
					viewerId,
					sequence,
					viewerId,
					sequence,
					threadId,
					viewerId,
					viewerId,
					threadId,
					sequence,
				)
				.run()
		},
		async unread(viewerId) {
			const row = await db
				.prepare(
					`SELECT COUNT(*) AS count FROM direct_messages m
    JOIN direct_threads t ON t.id = m.thread_id ${peerJoin}
    WHERE ${members} AND ${activePeer} AND m.sender_id != ?1 AND m.sequence > (${readSequence})`,
				)
				.bind(viewerId)
				.first<{ count: number }>()
			return row?.count ?? 0
		},
	}
}
