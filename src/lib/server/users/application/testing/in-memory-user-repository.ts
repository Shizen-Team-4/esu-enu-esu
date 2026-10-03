import { encodeCursor, type Cursor } from '../../../shared/domain/cursor'
import type { Me } from '../../domain/user'
import type { UserRepository } from '../ports'

export type StoredUser = Omit<Me, 'viewer'>

export function aUser(overrides: Partial<StoredUser> = {}): StoredUser {
	const id = overrides.id ?? 'usr_1'
	return {
		id,
		username: id,
		displayName: id,
		avatarUrl: null,
		bio: '',
		email: `${id}@example.com`,
		emailVerified: true,
		createdAt: '2026-10-01T00:00:00.000Z',
		counts: { posts: 0, followers: 0, following: 0 },
		...overrides,
	}
}

export interface InMemoryUserSeed {
	users?: StoredUser[]
	follows?: Array<[follower: string, followee: string]>
}

interface Row {
	user: StoredUser
	rank: number
}

const hex = (value: string) =>
	[...value].map((char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('')
const fromHex = (value: string) =>
	(value.match(/.{2}/g) ?? []).map((pair) => String.fromCharCode(parseInt(pair, 16))).join('')

export class InMemoryUserRepository implements UserRepository {
	users: StoredUser[]
	private readonly follows: Set<string>

	constructor(seed: InMemoryUserSeed = {}) {
		this.users = [...(seed.users ?? [])]
		this.follows = new Set((seed.follows ?? []).map(([a, b]) => `${a}|${b}`))
	}

	async find(input: { id?: string; username?: string }, viewerId: string | null) {
		const user = this.users.find((candidate) =>
			input.id ? candidate.id === input.id : candidate.username === input.username,
		)
		return user ? this.view(user, viewerId) : null
	}

	async search(q: string, viewerId: string | null, limit: number, cursor?: Cursor) {
		const rows = this.users
			.filter((user) => user.username && this.matches(user, q))
			.map((user) => ({ user, rank: this.rank(user, q, viewerId) }))
			.sort(
				(a, b) =>
					a.rank - b.rank ||
					a.user.username.localeCompare(b.user.username) ||
					a.user.id.localeCompare(b.user.id),
			)
			.filter((row) => (cursor ? this.isAfter(row, cursor) : true))
		const page = rows.slice(0, limit),
			last = page.at(-1)
		return {
			items: page.map(({ user }) => {
				const { id, username, displayName, avatarUrl, viewer } = this.view(user, viewerId)
				return { id, username, displayName, avatarUrl, viewer }
			}),
			nextCursor:
				rows.length > limit && last
					? encodeCursor({ time: last.rank, id: `${hex(last.user.username)}_${last.user.id}` })
					: null,
		}
	}

	async follow(viewerId: string, userId: string, active: boolean) {
		if (active) this.follows.add(`${viewerId}|${userId}`)
		else this.follows.delete(`${viewerId}|${userId}`)
		return this.followerCount(userId)
	}

	private followerCount(userId: string) {
		return [...this.follows].filter((key) => key.endsWith(`|${userId}`)).length
	}

	private isFollowing(viewerId: string | null, userId: string) {
		return viewerId !== null && this.follows.has(`${viewerId}|${userId}`)
	}

	private matches(user: StoredUser, q: string) {
		return user.username.toLowerCase().startsWith(q) || user.displayName.toLowerCase().startsWith(q)
	}

	private rank(user: StoredUser, q: string, viewerId: string | null) {
		if (user.username === q) return 0
		return this.isFollowing(viewerId, user.id) ? 1 : 2
	}

	private isAfter(row: Row, cursor: Cursor) {
		const [hexName, ...idParts] = cursor.id.split('_')
		const name = fromHex(hexName)
		if (row.rank !== cursor.time) return row.rank > cursor.time
		const { username, id } = row.user
		return username > name || (username === name && id > idParts.join('_'))
	}

	private view(user: StoredUser, viewerId: string | null): Me {
		const following = [...this.follows].filter((key) => key.startsWith(`${user.id}|`)).length
		return {
			...user,
			counts: { ...user.counts, followers: this.followerCount(user.id), following },
			viewer: { isMe: user.id === viewerId, following: this.isFollowing(viewerId, user.id) },
		}
	}
}
