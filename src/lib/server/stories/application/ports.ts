import type { Story, StoryTrayItem } from '../domain/story'
import type { Page } from '$lib/contract'
import type { Cursor } from '../../shared/domain/cursor'

export type { Story, StoryTrayItem } from '../domain/story'
export interface StoryRepository {
	checkMedia(mediaId: string, ownerId: string): Promise<boolean>
	creationWindow(authorId: string, since: Date): Promise<{ count: number; oldest: Date | null }>
	create(id: string, authorId: string, mediaId: string, now: Date, expiresAt: Date): Promise<void>
	find(id: string, viewerId: string, now: Date): Promise<Story | null>
	list(username: string, viewerId: string, now: Date): Promise<Story[] | null>
	tray(viewerId: string, now: Date, limit: number, cursor?: Cursor): Promise<Page<StoryTrayItem>>
	seen(id: string, viewerId: string, now: Date): Promise<void>
	like(id: string, viewerId: string, active: boolean, now: Date): Promise<number>
	delete(id: string): Promise<void>
}
