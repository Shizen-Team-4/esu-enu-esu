import { encodeCursor } from '../../../shared/domain/cursor'
import type { Post } from '../../domain/post'
import type { PostRepository } from '../ports'

type ListInput = Parameters<PostRepository['list']>[0]

export interface InMemoryPostSeed {
	posts?: Post[]
	follows?: Array<[follower: string, followee: string]>
	likes?: Array<[postId: string, userId: string]>
	saves?: Array<[postId: string, userId: string, time: number]>
}

export class InMemoryPostRepository implements PostRepository {
	posts: Post[]
	writes = 0
	mediaValid = true
	window: { count: number; oldest: Date | null } = { count: 0, oldest: null }
	private readonly follows: Set<string>
	private readonly likes: Set<string>
	private readonly saves: Map<string, number>

	constructor(seed: InMemoryPostSeed = {}) {
		this.posts = [...(seed.posts ?? [])]
		this.follows = new Set((seed.follows ?? []).map(([a, b]) => `${a}|${b}`))
		this.likes = new Set((seed.likes ?? []).map(([a, b]) => `${a}|${b}`))
		this.saves = new Map((seed.saves ?? []).map(([a, b, time]) => [`${a}|${b}`, time]))
	}

	async find(id: string, viewerId: string | null) {
		const post = this.posts.find((candidate) => candidate.id === id)
		return post ? this.view(post, viewerId) : null
	}

	async list(input: ListInput) {
		const sortTime = (post: Post) =>
			input.scope === 'saved'
				? (this.saves.get(`${post.id}|${input.viewerId}`) ?? 0)
				: Date.parse(post.createdAt)
		const rows = this.posts
			.filter((post) => this.matches(post, input))
			.map((post) => ({ post, time: sortTime(post) }))
			.filter(({ post, time }) => this.afterCursor(post.id, time, input))
			.sort((a, b) => b.time - a.time || (a.post.id < b.post.id ? 1 : -1))
		const page = rows.slice(0, input.limit)
		const last = page.at(-1)
		return {
			items: page.map(({ post }) => this.view(post, input.viewerId)),
			nextCursor:
				rows.length > input.limit && last
					? encodeCursor({ time: last.time, id: last.post.id })
					: null,
		}
	}

	async create(
		id: string,
		authorId: string,
		input: Parameters<PostRepository['create']>[2],
		now: Date,
	) {
		this.writes++
		this.posts.push({
			id,
			type: input.type,
			author: { id: authorId, username: authorId, displayName: authorId, avatarUrl: null },
			caption: input.caption,
			media: [],
			counts: { likes: 0, comments: 0 },
			viewer: { liked: false, saved: false, isAuthor: false },
			shareUrl: `https://example.com/p/${id}`,
			createdAt: now.toISOString(),
			editedAt: null,
		})
	}

	async update(id: string, caption: string, now: Date) {
		this.writes++
		this.posts = this.posts.map((post) =>
			post.id === id ? { ...post, caption, editedAt: now.toISOString() } : post,
		)
	}

	async delete(id: string) {
		this.writes++
		this.posts = this.posts.filter((post) => post.id !== id)
	}

	async react(id: string, viewerId: string, kind: 'like' | 'save', active: boolean, now: Date) {
		this.writes++
		const key = `${id}|${viewerId}`
		if (kind === 'like') {
			if (active) this.likes.add(key)
			else this.likes.delete(key)
		} else if (!active) this.saves.delete(key)
		else if (!this.saves.has(key)) this.saves.set(key, now.getTime())
	}

	async checkMedia() {
		return this.mediaValid
	}

	async creationWindow() {
		return this.window
	}

	private matches(post: Post, input: ListInput) {
		const { viewerId, scope } = input
		if (input.type && post.type !== input.type) return false
		if (input.authorId && post.author.id !== input.authorId) return false
		if (scope === 'saved') return this.saves.has(`${post.id}|${viewerId}`)
		if (scope === 'following')
			return post.author.id === viewerId || this.follows.has(`${viewerId}|${post.author.id}`)
		return true
	}

	private afterCursor(id: string, time: number, input: ListInput) {
		const cursor = input.cursor
		return !cursor || time < cursor.time || (time === cursor.time && id < cursor.id)
	}

	private view(post: Post, viewerId: string | null): Post {
		return {
			...post,
			counts: {
				...post.counts,
				likes: [...this.likes].filter((key) => key.startsWith(`${post.id}|`)).length,
			},
			viewer: {
				liked: this.likes.has(`${post.id}|${viewerId}`),
				saved: this.saves.has(`${post.id}|${viewerId}`),
				isAuthor: viewerId !== null && post.author.id === viewerId,
			},
		}
	}
}
