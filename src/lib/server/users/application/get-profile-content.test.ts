import { describe, expect, it } from 'vitest'
import { viewer, otherViewer } from '../../shared/testing/viewer'
import { AppError } from '../../shared/domain/app-error'
import { getProfile } from './get-profile'
import { getProfileContent, type ProfileContentSources } from './get-profile-content'
import { aUser, InMemoryUserRepository } from './testing/in-memory-user-repository'

function setup() {
	const users = new InMemoryUserRepository({ users: [aUser({ username: 'dara' })] })
	const calls: string[] = []
	const sources: ProfileContentSources = {
		getProfile: getProfile(users),
		listUserPosts: async (_viewer, input) => {
			calls.push(`user:${input.type}:${input.cursor ?? ''}`)
			return { items: [], nextCursor: null }
		},
		listSavedPosts: async (_viewer, input) => {
			calls.push(`saved:${input.cursor ?? ''}`)
			return { items: [], nextCursor: 'next' }
		},
	}
	return { sources, calls, load: getProfileContent(sources) }
}

describe('getProfileContent', () => {
	for (const type of [undefined, 'post', 'unknown']) {
		it(`loads Posts for ${type ?? 'the default tab'}`, async () => {
			const { load, calls } = setup()
			const result = await load(viewer, { username: 'dara', type })
			expect(result.type).toBe('post')
			expect(calls).toEqual(['user:post:'])
		})
	}

	it('loads public Reels with the cursor', async () => {
		const { load, calls } = setup()
		const result = await load(null, { username: 'dara', type: 'reel', cursor: 'cursor' })
		expect(result.type).toBe('reel')
		expect(calls).toEqual(['user:reel:cursor'])
	})

	it('loads only the owner’s bookmarks with pagination', async () => {
		const { load, calls } = setup()
		const result = await load(viewer, { username: 'dara', type: 'bookmarks', cursor: 'cursor' })
		expect(result).toMatchObject({ type: 'bookmarks', posts: { nextCursor: 'next' } })
		expect(calls).toEqual(['saved:cursor'])
	})

	for (const visitor of [null, otherViewer]) {
		it(`does not expose bookmarks to ${visitor ? 'another user' : 'a guest'}`, async () => {
			const { load, calls } = setup()
			await expect(load(visitor, { username: 'dara', type: 'bookmarks' })).rejects.toMatchObject({
				code: 'NOT_FOUND',
			})
			expect(calls).toEqual([])
		})
	}

	it('does not load content for a missing profile', async () => {
		const { load, calls } = setup()
		await expect(load(viewer, { username: 'missing' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
		expect(calls).toEqual([])
	})

	for (const type of ['post', 'bookmarks']) {
		it(`propagates ${type} loading errors`, async () => {
			const { sources } = setup()
			const fail = async () => {
				throw new AppError('VALIDATION_FAILED', { cursor: 'INVALID_FORMAT' })
			}
			sources.listUserPosts = fail
			sources.listSavedPosts = fail
			await expect(
				getProfileContent(sources)(viewer, { username: 'dara', type }),
			).rejects.toMatchObject({
				code: 'VALIDATION_FAILED',
			})
		})
	}
})
