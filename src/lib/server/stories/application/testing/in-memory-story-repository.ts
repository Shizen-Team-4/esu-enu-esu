import { encodeCursor, type Cursor } from '../../../shared/domain/cursor'
import { isStoryActive, type Story, type StoryTrayItem } from '../../domain/story'
import type { StoryRepository } from '../ports'
import { aStory, type StoredStory } from './a-story'

export interface InMemoryStorySeed {
	stories?: StoredStory[]
	follows?: Array<[follower: string, followee: string]>
	views?: Array<[storyId: string, viewerId: string]>
	likes?: Array<[storyId: string, userId: string]>
}

interface TrayEntry {
	item: StoryTrayItem
	latestAt: number
	rank: number
}

const pair = (a: string, b: string) => `${a}|${b}`

export class InMemoryStoryRepository implements StoryRepository {
	stories: StoredStory[]
	mediaValid = true
	window: { count: number; oldest: Date | null } = { count: 0, oldest: null }
	private readonly follows: Set<string>
	private readonly views: Set<string>
	private readonly likes: Set<string>

	constructor(seed: InMemoryStorySeed = {}) {
		this.stories = [...(seed.stories ?? [])]
		this.follows = new Set((seed.follows ?? []).map(([a, b]) => pair(a, b)))
		this.views = new Set((seed.views ?? []).map(([a, b]) => pair(a, b)))
		this.likes = new Set((seed.likes ?? []).map(([a, b]) => pair(a, b)))
	}

	async checkMedia() {
		return this.mediaValid
	}

	async creationWindow() {
		return this.window
	}

	async create(id: string, authorId: string, mediaId: string, now: Date, expiresAt: Date) {
		const base = aStory({ authorId })
		const media = { ...base.media, id: mediaId }
		const createdAt = now.toISOString()
		this.stories.push({ ...base, id, media, createdAt, expiresAt: expiresAt.toISOString() })
	}

	async find(id: string, viewerId: string, now: Date) {
		const story = this.stories.find((candidate) => candidate.id === id)
		return story && this.canSee(story, viewerId, now) ? this.view(story, viewerId) : null
	}

	async list(username: string, viewerId: string, now: Date) {
		const author = this.stories.find((story) => story.author.username === username)?.author
		if (!author || !this.isViewerOrFollower(author.id, viewerId)) return null
		return this.stories
			.filter((story) => story.author.id === author.id && this.canSee(story, viewerId, now))
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
			.map((story) => this.view(story, viewerId))
	}

	async tray(viewerId: string, now: Date, limit: number, cursor?: Cursor) {
		const entries = this.trayEntries(viewerId, now).filter((entry) =>
			cursor ? this.isAfter(entry, cursor) : true,
		)
		const page = entries.slice(0, limit),
			last = page.at(-1)
		return {
			items: page.map((entry) => entry.item),
			nextCursor:
				entries.length > limit && last
					? encodeCursor({ time: last.latestAt, id: `${last.rank}_${last.item.user.id}` })
					: null,
		}
	}

	async seen(id: string, viewerId: string, now: Date) {
		const story = this.stories.find((candidate) => candidate.id === id)
		if (story && isStoryActive(story, now)) this.views.add(pair(id, viewerId))
	}

	async like(id: string, viewerId: string, active: boolean, now: Date) {
		const story = this.stories.find((candidate) => candidate.id === id)
		if (!active) this.likes.delete(pair(id, viewerId))
		else if (story && isStoryActive(story, now)) this.likes.add(pair(id, viewerId))
		return this.likeCount(id)
	}

	async delete(id: string) {
		this.stories = this.stories.filter((story) => story.id !== id)
	}

	private isViewerOrFollower(authorId: string, viewerId: string) {
		return authorId === viewerId || this.follows.has(pair(viewerId, authorId))
	}

	private canSee(story: StoredStory, viewerId: string, now: Date) {
		return isStoryActive(story, now) && this.isViewerOrFollower(story.author.id, viewerId)
	}

	private likeCount(id: string) {
		return [...this.likes].filter((key) => key.startsWith(`${id}|`)).length
	}

	private view(story: StoredStory, viewerId: string): Story {
		return {
			...story,
			viewer: {
				seen: this.views.has(pair(story.id, viewerId)),
				liked: this.likes.has(pair(story.id, viewerId)),
			},
			likes: this.likeCount(story.id),
		}
	}

	private trayEntries(viewerId: string, now: Date): TrayEntry[] {
		const visible = this.stories.filter((story) => this.canSee(story, viewerId, now))
		const authors = new Map(visible.map((story) => [story.author.id, story.author]))
		return [...authors.values()]
			.map((user) => this.trayEntry(user, visible, viewerId))
			.sort(
				(a, b) =>
					a.rank - b.rank ||
					b.latestAt - a.latestAt ||
					b.item.user.id.localeCompare(a.item.user.id),
			)
	}

	private trayEntry(user: Story['author'], visible: StoredStory[], viewerId: string): TrayEntry {
		const own = visible.filter((story) => story.author.id === user.id)
		const hasUnseen = own.some((story) => !this.views.has(pair(story.id, viewerId)))
		const latestAt = Math.max(...own.map((story) => Date.parse(story.createdAt)))
		const rank = user.id === viewerId ? 0 : hasUnseen ? 1 : 2
		const item: StoryTrayItem = {
			user,
			hasUnseen,
			storyCount: own.length,
			latestAt: new Date(latestAt).toISOString(),
		}
		return { item, latestAt, rank }
	}

	private isAfter(entry: TrayEntry, cursor: Cursor) {
		const group = Number(cursor.id[0]),
			id = cursor.id.slice(2)
		if (entry.rank !== group) return entry.rank > group
		return (
			entry.latestAt < cursor.time || (entry.latestAt === cursor.time && entry.item.user.id < id)
		)
	}
}
