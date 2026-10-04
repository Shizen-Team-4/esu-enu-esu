import { sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { AppError } from '../../shared/domain/app-error'
import { encodeCursor } from '../../shared/domain/cursor'
import {
	COMMENT_RATE_LIMIT,
	CREATION_RATE_WINDOW_MS,
} from '../../shared/domain/creation-rate-limit'
import type { CommentRepository, PageRequest } from '../application/ports'
import { toComment, type CommentRow } from './comment-mapper'

const select = sql`SELECT c.id, c.post_id AS postId, c.parent_id AS parentId, c.body,
	c.reply_count AS replyCount, c.created_at AS createdAt, c.author_id AS authorId,
	u.username, u.name, u.image, r.id AS replyToId, r.username AS replyToUsername,
	r.name AS replyToName, r.image AS replyToImage
	FROM comments c JOIN user u ON u.id = c.author_id LEFT JOIN user r ON r.id = c.reply_to_user_id`

export function createCommentRepository(
	db: ReturnType<typeof getDb>,
	d1: D1Database,
): CommentRepository {
	async function page(
		scope: ReturnType<typeof sql>,
		request: PageRequest,
		direction: 'newest' | 'oldest',
	) {
		const newest = direction === 'newest'
		const conditions = [scope]
		if (request.cursor) {
			const { time, id } = request.cursor
			conditions.push(
				newest
					? sql`(c.created_at < ${time} OR (c.created_at = ${time} AND c.id < ${id}))`
					: sql`(c.created_at > ${time} OR (c.created_at = ${time} AND c.id > ${id}))`,
			)
		}
		const order = newest ? sql`c.created_at DESC, c.id DESC` : sql`c.created_at ASC, c.id ASC`
		const rows = await db.all<CommentRow>(
			sql`${select} WHERE ${sql.join(conditions, sql` AND `)} ORDER BY ${order} LIMIT ${request.limit + 1}`,
		)
		const items = rows.slice(0, request.limit)
		const last = items.at(-1)
		return {
			items: items.map(toComment),
			nextCursor:
				rows.length > request.limit && last
					? encodeCursor({ time: last.createdAt, id: last.id })
					: null,
		}
	}

	return {
		async find(id) {
			const rows = await db.all<CommentRow>(sql`${select} WHERE c.id = ${id}`)
			return rows[0] ? toComment(rows[0]) : null
		},
		listTopLevel: (postId, request) =>
			page(sql`c.post_id = ${postId} AND c.parent_id IS NULL`, request, 'newest'),
		listReplies: (commentId, request) => page(sql`c.parent_id = ${commentId}`, request, 'oldest'),
		async creationWindow(authorId, since) {
			const result = await db.get<{ count: number; oldest: number | null }>(
				sql`SELECT COUNT(*) AS count, MIN(created_at) AS oldest FROM comments WHERE author_id = ${authorId} AND created_at > ${since.getTime()}`,
			)
			return { count: result?.count ?? 0, oldest: result?.oldest ? new Date(result.oldest) : null }
		},
		async create(comment, now) {
			const since = now.getTime() - CREATION_RATE_WINDOW_MS
			const statements = [
				d1
					.prepare(
						`INSERT INTO comments (id, post_id, author_id, parent_id, reply_to_user_id, body, created_at)
						SELECT ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM comments WHERE author_id = ? AND created_at > ?) < ${COMMENT_RATE_LIMIT}`,
					)
					.bind(
						comment.id,
						comment.postId,
						comment.authorId,
						comment.parentId,
						comment.replyToUserId,
						comment.body,
						now.getTime(),
						comment.authorId,
						since,
					),
				d1
					.prepare(
						'UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?) WHERE id = ?',
					)
					.bind(comment.postId, comment.postId),
			]
			if (comment.parentId)
				statements.push(
					d1
						.prepare(
							'UPDATE comments SET reply_count = (SELECT COUNT(*) FROM comments WHERE parent_id = ?) WHERE id = ?',
						)
						.bind(comment.parentId, comment.parentId),
				)
			const result = await d1.batch(statements)
			if (!result[0].meta.changes) throw new AppError('RATE_LIMITED')
		},
		async delete(target) {
			const statements = [
				d1.prepare('DELETE FROM comments WHERE parent_id = ?').bind(target.id),
				d1.prepare('DELETE FROM comments WHERE id = ?').bind(target.id),
				d1
					.prepare(
						'UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?) WHERE id = ?',
					)
					.bind(target.postId, target.postId),
			]
			if (target.parentId)
				statements.push(
					d1
						.prepare(
							'UPDATE comments SET reply_count = (SELECT COUNT(*) FROM comments WHERE parent_id = ?) WHERE id = ?',
						)
						.bind(target.parentId, target.parentId),
				)
			await d1.batch(statements)
		},
	}
}
