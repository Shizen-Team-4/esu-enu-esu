import type { Post, CreatePostInput } from '../domain/post'
import type { Cursor } from '../../shared/domain/cursor'

export interface Page<T> {
	items: T[]
	nextCursor: string | null
}
export interface PostRepository {
	find(id: string, viewerId: string | null): Promise<Post | null>
	list(input: {
		viewerId: string | null
		scope: 'all' | 'following' | 'saved'
		type?: 'reel'
		authorId?: string
		cursor?: Cursor
		limit: number
	}): Promise<Page<Post>>
	create(id: string, authorId: string, input: CreatePostInput, now: Date): Promise<void>
	update(id: string, caption: string, now: Date): Promise<void>
	delete(id: string, now: Date): Promise<void>
	react(
		id: string,
		viewerId: string,
		kind: 'like' | 'save',
		active: boolean,
		now: Date,
	): Promise<void>
	checkMedia(ids: string[], ownerId: string, type: 'post' | 'reel'): Promise<boolean>
	creationWindow(authorId: string, since: Date): Promise<{ count: number; oldest: Date | null }>
}

export interface IdGenerator {
	generate(prefix: string): string
}
