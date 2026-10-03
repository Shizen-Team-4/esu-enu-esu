import { describe, expect, it, vi } from 'vitest'
import { like, save } from './post-actions'

const user = { id: 'usr_1' }
const viewerOf = { id: 'usr_1' }

function setup(overrides: Record<string, unknown> = {}) {
	const posts = {
		likePost: vi.fn().mockResolvedValue({ liked: true, likes: 3 }),
		unlikePost: vi.fn().mockResolvedValue({ liked: false, likes: 2 }),
		savePost: vi.fn().mockResolvedValue({ saved: true }),
		unsavePost: vi.fn().mockResolvedValue({ saved: false }),
		...overrides,
	}
	const locals = { user, services: { posts } } as unknown as App.Locals
	const request = (fields: Record<string, string>) => {
		const body = new FormData()
		for (const [key, value] of Object.entries(fields)) body.set(key, value)
		return new Request('http://x/', { method: 'POST', body })
	}
	return { posts, locals, request }
}

const thrownBy = async (run: () => Promise<unknown>) => {
	try {
		await run()
	} catch (thrown) {
		return thrown as { status: number; location?: string }
	}
	throw new Error('did not throw')
}

describe('like action', () => {
	it('likes when active is true and returns the contract result', async () => {
		const { posts, locals, request } = setup()
		const result = await like({ locals, request: request({ id: 'pst_1', active: 'true' }) })
		expect(result).toEqual({ liked: true, likes: 3 })
		expect(posts.likePost).toHaveBeenCalledWith(expect.objectContaining(viewerOf), 'pst_1')
	})

	it('removes the like when active is false', async () => {
		const { posts, locals, request } = setup()
		const result = await like({ locals, request: request({ id: 'pst_1', active: 'false' }) })
		expect(result).toEqual({ liked: false, likes: 2 })
		expect(posts.unlikePost).toHaveBeenCalled()
	})

	it('returns an action failure when the use case throws', async () => {
		const { locals, request } = setup({ likePost: vi.fn().mockRejectedValue(new Error('boom')) })
		const result = await like({ locals, request: request({ id: 'pst_1', active: 'true' }) })
		expect(result).toMatchObject({ status: 500 })
	})

	it('redirects anonymous visitors to login', async () => {
		const { request } = setup()
		const anon = { user: null } as unknown as App.Locals
		const thrown = await thrownBy(() => like({ locals: anon, request: request({ id: 'p' }) }))
		expect(thrown).toMatchObject({ status: 303, location: '/login' })
	})
})

describe('save action', () => {
	it('saves when active is true', async () => {
		const { posts, locals, request } = setup()
		const result = await save({ locals, request: request({ id: 'pst_1', active: 'true' }) })
		expect(result).toEqual({ saved: true })
		expect(posts.savePost).toHaveBeenCalledWith(expect.objectContaining(viewerOf), 'pst_1')
	})

	it('removes the save when active is false', async () => {
		const { locals, request } = setup()
		const result = await save({ locals, request: request({ id: 'pst_1', active: 'false' }) })
		expect(result).toEqual({ saved: false })
	})

	it('returns an action failure when the use case throws', async () => {
		const { locals, request } = setup({ savePost: vi.fn().mockRejectedValue(new Error('boom')) })
		const result = await save({ locals, request: request({ id: 'pst_1', active: 'true' }) })
		expect(result).toMatchObject({ status: 500 })
	})
})
