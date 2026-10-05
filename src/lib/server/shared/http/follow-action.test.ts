import { describe, expect, it } from 'vitest'
import { AppError } from '../domain/app-error'
import { follow } from './follow-action'

function setup(fields: Record<string, string>, cause?: Error) {
	const calls: unknown[][] = []
	const locals = {
		user: { id: 'usr_viewer' },
		services: {
			users: {
				followUser: async (...args: unknown[]) => {
					calls.push(args)
					if (cause) throw cause
					return { following: args[2], followers: 1 }
				},
			},
		},
	} as unknown as App.Locals
	const body = new FormData()
	for (const [key, value] of Object.entries(fields)) body.set(key, value)
	return { calls, locals, request: new Request('http://localhost/', { method: 'POST', body }) }
}

describe('follow action', () => {
	for (const active of ['true', 'false']) {
		it(`passes active=${active} and the trusted viewer to the use case`, async () => {
			const event = setup({ username: 'alice', active, viewerId: 'spoofed' })
			expect(await follow(event)).toEqual({ following: active === 'true', followers: 1 })
			expect(event.calls).toEqual([
				[expect.objectContaining({ id: 'usr_viewer' }), 'alice', active === 'true'],
			])
		})
	}
	it('passes a missing username as empty text', async () => {
		const event = setup({})
		await follow(event)
		expect(event.calls[0][1]).toBe('')
	})
	it('maps use case errors to action failures', async () => {
		expect(await follow(setup({ username: 'missing' }, new AppError('NOT_FOUND')))).toMatchObject({
			status: 404,
			data: { error: { code: 'NOT_FOUND' } },
		})
	})
	it('redirects signed-out viewers to login', async () => {
		const event = setup({ username: 'alice' })
		event.locals.user = null
		await expect(follow(event)).rejects.toMatchObject({ status: 303, location: '/login' })
		expect(event.calls).toHaveLength(0)
	})
})
