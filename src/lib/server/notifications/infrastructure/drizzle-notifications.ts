import { sql } from 'drizzle-orm'
import type { Db } from '../../db'
import { encodeCursor } from '../../shared/domain/cursor'
import type { NotificationRepository } from '../application/ports'
import { toNotification, type NotificationRow } from './notification-mapper'

const select = sql`SELECT n.id, n.type, a.id AS actorId, a.username, a.name, a.image,
	p.id AS postId, p.type AS postType, c.id AS commentId,
	n.created_at AS createdAt, n.read_at AS readAt
	FROM notifications n
	LEFT JOIN user a ON a.id = n.actor_id AND a.banned = 0
	LEFT JOIN posts p ON p.id = n.post_id AND p.deleted_at IS NULL
		AND EXISTS (SELECT 1 FROM user u WHERE u.id = p.author_id AND u.banned = 0)
	LEFT JOIN comments c ON c.id = n.comment_id AND c.post_id = p.id`

export function createNotificationRepository(db: Db, d1: D1Database): NotificationRepository {
	return {
		async create(drafts) {
			// Bound background fan-out batches; dedupe makes retries safe.
			for (let offset = 0; offset < drafts.length; offset += 10) {
				await d1.batch(
					drafts.slice(offset, offset + 10).map((draft) =>
						d1
							.prepare(
								`INSERT INTO notifications (id, recipient_id, type, actor_id, post_id, comment_id, dedupe_key, created_at)
								SELECT ?, recipient.id, ?,
								(SELECT id FROM user WHERE id = ?),
								(SELECT id FROM posts WHERE id = ?),
								(SELECT id FROM comments WHERE id = ?), ?, ?
								FROM user recipient WHERE recipient.id = ? AND recipient.banned = 0
								ON CONFLICT(dedupe_key) DO NOTHING`,
							)
							.bind(
								draft.id,
								draft.type,
								draft.actorId,
								draft.postId,
								draft.commentId,
								draft.dedupeKey,
								draft.createdAt.getTime(),
								draft.recipientId,
							),
					),
				)
			}
		},
		async list(recipientId, page) {
			const conditions = [sql`n.recipient_id = ${recipientId}`]
			if (page.cursor) {
				const { time, id } = page.cursor
				conditions.push(sql`(n.created_at < ${time} OR (n.created_at = ${time} AND n.id < ${id}))`)
			}
			const rows = await db.all<NotificationRow>(sql`${select}
				WHERE ${sql.join(conditions, sql` AND `)}
				ORDER BY n.created_at DESC, n.id DESC LIMIT ${page.limit + 1}`)
			const items = rows.slice(0, page.limit)
			const last = items.at(-1)
			return {
				items: items.map(toNotification),
				nextCursor:
					rows.length > page.limit && last
						? encodeCursor({ time: last.createdAt, id: last.id })
						: null,
			}
		},
		async unreadCount(recipientId) {
			const row = await db.get<{ count: number }>(
				sql`SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ${recipientId} AND read_at IS NULL`,
			)
			return row?.count ?? 0
		},
		async markRead(recipientId, id, now) {
			const result = await d1
				.prepare(
					'UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ? AND recipient_id = ?',
				)
				.bind(now.getTime(), id, recipientId)
				.run()
			if (!result.meta.changes) return null
			const row = await db.get<NotificationRow>(
				sql`${select} WHERE n.id = ${id} AND n.recipient_id = ${recipientId}`,
			)
			return row ? toNotification(row) : null
		},
		async markAllRead(recipientId, now) {
			await db.run(
				sql`UPDATE notifications SET read_at = ${now.getTime()} WHERE recipient_id = ${recipientId} AND read_at IS NULL`,
			)
		},
	}
}
