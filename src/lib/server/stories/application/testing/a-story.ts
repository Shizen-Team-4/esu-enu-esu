import type { Story } from '../../domain/story'

export type StoredStory = Pick<Story, 'id' | 'author' | 'media' | 'createdAt' | 'expiresAt'>

export function aStory(overrides: Partial<StoredStory> & { authorId?: string } = {}): StoredStory {
	const { authorId, ...rest } = overrides
	const author = authorId ?? 'usr_1'
	return {
		id: 'sty_1',
		author: { id: author, username: author, displayName: author, avatarUrl: null },
		media: {
			id: 'med_1',
			type: 'image',
			url: 'https://example.com/med_1.webp',
			thumbnailUrl: null,
			width: 1080,
			height: 1920,
			durationSec: null,
		},
		createdAt: '2026-10-02T12:00:00.000Z',
		expiresAt: '2026-10-03T12:00:00.000Z',
		...rest,
	}
}
