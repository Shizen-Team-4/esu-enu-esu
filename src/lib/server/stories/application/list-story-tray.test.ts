import { describe, expect, it } from 'vitest'
import { encodeCursor } from '../../shared/domain/cursor'
import { fixedClock } from '../../shared/testing/fixed-clock'
import { viewer } from '../../shared/testing/viewer'
import { listStoryTray } from './list-story-tray'
import { aStory } from './testing/a-story'
import { InMemoryStoryRepository } from './testing/in-memory-story-repository'

const setup = () => ({
	stories: new InMemoryStoryRepository({
		stories: [
			aStory({ id: 'sty_1', authorId: 'usr_2', createdAt: '2026-10-02T10:00:00.000Z' }),
			aStory({ id: 'sty_2', authorId: 'usr_3', createdAt: '2026-10-02T11:00:00.000Z' }),
			aStory({ id: 'sty_3', authorId: 'usr_4', createdAt: '2026-10-02T12:00:00.000Z' }),
			aStory({ id: 'sty_4', authorId: 'usr_4', createdAt: '2026-10-02T13:00:00.000Z' }),
			aStory({ id: 'sty_5', authorId: viewer.id, createdAt: '2026-10-02T09:00:00.000Z' }),
			aStory({ id: 'sty_6', authorId: 'usr_5' }),
			aStory({ id: 'sty_7', authorId: 'usr_2', expiresAt: '2026-10-02T23:00:00.000Z' }),
		],
		follows: [
			[viewer.id, 'usr_2'],
			[viewer.id, 'usr_3'],
			[viewer.id, 'usr_4'],
		],
		views: [
			['sty_1', viewer.id],
			['sty_3', viewer.id],
		],
	}),
	clock: fixedClock(),
})

const ids = (page: { items: { user: { id: string } }[] }) => page.items.map((i) => i.user.id)

describe('listStoryTray', () => {
	it('ranks own stories, then unseen, then seen, newest first', async () => {
		const page = await listStoryTray(setup())(viewer)

		expect(ids(page)).toEqual([viewer.id, 'usr_4', 'usr_3', 'usr_2'])
	})

	it('describes each tray item', async () => {
		const page = await listStoryTray(setup())(viewer)

		expect(page.items[1]).toMatchObject({
			user: { id: 'usr_4' },
			hasUnseen: true,
			storyCount: 2,
			latestAt: '2026-10-02T13:00:00.000Z',
		})
	})

	it('omits users the viewer does not follow and expired stories', async () => {
		const page = await listStoryTray(setup())(viewer)

		expect(ids(page)).not.toContain('usr_5')
		expect(page.items.find((item) => item.user.id === 'usr_2')?.storyCount).toBe(1)
	})

	it('pages with a cursor across groups', async () => {
		const deps = setup()
		const first = await listStoryTray(deps)(viewer, { limit: 2 })
		const second = await listStoryTray(deps)(viewer, { limit: 2, cursor: first.nextCursor! })

		expect([ids(first), ids(second)]).toEqual([
			[viewer.id, 'usr_4'],
			['usr_3', 'usr_2'],
		])
		expect(second.nextCursor).toBeNull()
	})

	it('continues within a group after the cursor user', async () => {
		const deps = {
			clock: fixedClock(),
			stories: new InMemoryStoryRepository({
				stories: [
					aStory({ id: 'sty_1', authorId: 'usr_2', createdAt: '2026-10-02T11:00:00.000Z' }),
					aStory({ id: 'sty_2', authorId: 'usr_3', createdAt: '2026-10-02T11:00:00.000Z' }),
				],
				follows: [
					[viewer.id, 'usr_2'],
					[viewer.id, 'usr_3'],
				],
			}),
		}
		const first = await listStoryTray(deps)(viewer, { limit: 1 })
		const second = await listStoryTray(deps)(viewer, { limit: 1, cursor: first.nextCursor! })

		expect([ids(first), ids(second)]).toEqual([['usr_3'], ['usr_2']])
	})

	it('rejects an invalid limit', async () => {
		await expect(listStoryTray(setup())(viewer, { limit: 0 })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
		})
	})

	it('rejects a malformed cursor', async () => {
		await expect(listStoryTray(setup())(viewer, { cursor: '***' })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { cursor: 'INVALID_FORMAT' },
		})
	})

	it('rejects a cursor that does not carry a tray group', async () => {
		const cursor = encodeCursor({ time: 1, id: 'usr_2' })

		await expect(listStoryTray(setup())(viewer, { cursor })).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			fields: { cursor: 'INVALID_FORMAT' },
		})
	})

	it('requires a viewer', async () => {
		await expect(listStoryTray(setup())(null)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
	})
})
