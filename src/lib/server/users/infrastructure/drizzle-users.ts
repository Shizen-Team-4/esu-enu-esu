import { sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { encodeCursor } from '../../shared/domain/cursor'
import type { Me, UserRepository } from '../application/ports'

type UserRow = {
	id: string
	username: string | null
	name: string
	image: string | null
	bio: string
	email: string
	emailVerified: number
	createdAt: number
	posts: number
	followers: number
	following: number
	viewerFollowing: number
}
const columns = sql`u.id, u.username, u.name, u.image, u.bio, u.email, u.email_verified AS emailVerified, u.created_at AS createdAt,
(SELECT COUNT(*) FROM posts WHERE author_id = u.id AND deleted_at IS NULL) AS posts,
(SELECT COUNT(*) FROM follows WHERE followee_id = u.id) AS followers,
(SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following`

export function createUserRepository(db: ReturnType<typeof getDb>): UserRepository {
	function map(row: UserRow, viewerId: string | null): Me {
		return {
			id: row.id,
			username: row.username ?? '',
			displayName: row.name,
			avatarUrl: row.image,
			bio: row.bio,
			email: row.email,
			emailVerified: Boolean(row.emailVerified),
			createdAt: new Date(row.createdAt).toISOString(),
			counts: { posts: row.posts, followers: row.followers, following: row.following },
			viewer: { isMe: row.id === viewerId, following: Boolean(row.viewerFollowing) },
		}
	}
	return {
		async find(input, viewerId) {
			const where = input.id ? sql`u.id = ${input.id}` : sql`u.username = ${input.username}`
			const row = await db.get<UserRow>(
				sql`SELECT ${columns}, EXISTS(SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND followee_id = u.id) AS viewerFollowing FROM user u WHERE ${where} AND u.banned = 0`,
			)
			return row ? map(row, viewerId) : null
		},
		async search(q, viewerId, limit, cursor) {
			const escaped = q.replace(/[\\%_]/g, (char) => `\\${char}`) + '%'
			const rank = sql`CASE WHEN u.username = ${q} THEN 0 WHEN EXISTS(SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND followee_id = u.id) THEN 1 ELSE 2 END`
			// Search cursors carry rank and the hex-encoded username followed by the user ID.
			const conditions = [
				sql`u.banned = 0`,
				sql`u.username IS NOT NULL`,
				sql`(u.username LIKE ${escaped} ESCAPE '\' OR lower(u.name) LIKE ${escaped} ESCAPE '\')`,
			]
			if (cursor) {
				const [hexName, ...idParts] = cursor.id.split('_')
				const name =
					hexName
						.match(/.{2}/g)
						?.map((pair) => String.fromCharCode(parseInt(pair, 16)))
						.join('') ?? ''
				conditions.push(
					sql`(${rank} > ${cursor.time} OR (${rank} = ${cursor.time} AND (u.username > ${name} OR (u.username = ${name} AND u.id > ${idParts.join('_')}))))`,
				)
			}
			const rows = await db.all<UserRow & { rank: number }>(
				sql`SELECT ${columns}, ${rank} AS rank, EXISTS(SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND followee_id = u.id) AS viewerFollowing FROM user u WHERE ${sql.join(conditions, sql` AND `)} ORDER BY rank, u.username, u.id LIMIT ${limit + 1}`,
			)
			const page = rows.slice(0, limit),
				last = page.at(-1)
			const items = page.map((row) => {
				const profile = map(row, viewerId)
				return {
					id: profile.id,
					username: profile.username,
					displayName: profile.displayName,
					avatarUrl: profile.avatarUrl,
					viewer: profile.viewer,
				}
			})
			const name = last?.username
				?.split('')
				.map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
				.join('')
			return {
				items,
				nextCursor:
					rows.length > limit && last
						? encodeCursor({ time: last.rank, id: `${name}_${last.id}` })
						: null,
			}
		},
		async follow(viewerId, userId, active, now) {
			if (active)
				await db.run(
					sql`INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (${viewerId}, ${userId}, ${now.getTime()})`,
				)
			else
				await db.run(
					sql`DELETE FROM follows WHERE follower_id = ${viewerId} AND followee_id = ${userId}`,
				)
			return (
				(
					await db.get<{ count: number }>(
						sql`SELECT COUNT(*) AS count FROM follows WHERE followee_id = ${userId}`,
					)
				)?.count ?? 0
			)
		},
	}
}
