import { eq, sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { user } from '../../db/schema'
import { AppError } from '../../shared/domain/app-error'
import { encodeCursor } from '../../shared/domain/cursor'
import type { Me, PageRequest, UserRepository } from '../application/ports'
import { isUniqueViolation } from './unique-violation'
import { userSearchCondition } from './user-search-condition'

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
	async function listFollows(
		scope: { owner: ReturnType<typeof sql>; other: ReturnType<typeof sql> },
		viewerId: string | null,
		page: PageRequest,
	) {
		const conditions = [scope.owner, sql`u.banned = 0`, sql`u.username IS NOT NULL`]
		if (page.cursor)
			conditions.push(
				sql`(f.created_at < ${page.cursor.time} OR (f.created_at = ${page.cursor.time} AND u.id < ${page.cursor.id}))`,
			)
		const rows = await db.all<{
			id: string
			username: string
			name: string
			image: string | null
			followedAt: number
			viewerFollowing: number
		}>(
			sql`SELECT u.id, u.username, u.name, u.image, f.created_at AS followedAt,
			EXISTS(SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND followee_id = u.id) AS viewerFollowing
			FROM follows f JOIN user u ON u.id = ${scope.other}
			WHERE ${sql.join(conditions, sql` AND `)} ORDER BY f.created_at DESC, u.id DESC LIMIT ${page.limit + 1}`,
		)
		const items = rows.slice(0, page.limit),
			last = items.at(-1)
		return {
			items: items.map((row) => ({
				id: row.id,
				username: row.username,
				displayName: row.name,
				avatarUrl: row.image,
				viewer: { isMe: row.id === viewerId, following: Boolean(row.viewerFollowing) },
			})),
			nextCursor:
				rows.length > page.limit && last
					? encodeCursor({ time: last.followedAt, id: last.id })
					: null,
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
			const rank = sql`CASE WHEN u.username = ${q} THEN 0 WHEN EXISTS(SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND followee_id = u.id) THEN 1 ELSE 2 END`
			// Search cursors carry rank and the hex-encoded username followed by the user ID.
			const conditions = [sql`u.banned = 0`, sql`u.username IS NOT NULL`, userSearchCondition(q)]
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
			const result = active
				? await db.run(
						sql`INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (${viewerId}, ${userId}, ${now.getTime()})`,
					)
				: await db.run(
						sql`DELETE FROM follows WHERE follower_id = ${viewerId} AND followee_id = ${userId}`,
					)
			const followers =
				(
					await db.get<{ count: number }>(
						sql`SELECT COUNT(*) AS count FROM follows WHERE followee_id = ${userId}`,
					)
				)?.count ?? 0
			return { followers, created: active && result.meta.changes > 0 }
		},
		async update(id, patch) {
			const values: Partial<typeof user.$inferInsert> = { updatedAt: new Date() }
			if (patch.username !== undefined) {
				values.username = patch.username
				values.displayUsername = patch.username
			}
			if (patch.displayName !== undefined) values.name = patch.displayName
			if (patch.bio !== undefined) values.bio = patch.bio
			if (patch.avatar !== undefined) {
				values.avatarMediaId = patch.avatar?.mediaId ?? null
				values.image = patch.avatar?.url ?? null
			}
			try {
				await db.update(user).set(values).where(eq(user.id, id))
			} catch (cause) {
				if (isUniqueViolation(cause)) throw new AppError('CONFLICT', { username: 'TAKEN' })
				throw cause
			}
		},
		async isUsernameTaken(username, exceptUserId) {
			const row = await db.get<{ id: string }>(
				sql`SELECT id FROM user WHERE username = ${username} AND id != ${exceptUserId} LIMIT 1`,
			)
			return Boolean(row)
		},
		listFollowers: (userId, viewerId, page) =>
			listFollows(
				{ owner: sql`f.followee_id = ${userId}`, other: sql`f.follower_id` },
				viewerId,
				page,
			),
		listFollowing: (userId, viewerId, page) =>
			listFollows(
				{ owner: sql`f.follower_id = ${userId}`, other: sql`f.followee_id` },
				viewerId,
				page,
			),
	}
}
