import { describe, expect, it } from 'vitest'
import type { ApiError } from '$lib/api/api-error'
import { uploadFile } from './upload-file'

type Handler = (url: string, init: RequestInit) => Response

const ticket = {
	mediaId: 'm1',
	uploadUrl: 'https://r2.test/put',
	thumbnailUploadUrl: null,
	headers: { 'Content-Type': 'image/png' },
}
const result = {
	id: 'm1',
	type: 'image',
	url: 'u',
	width: 4,
	height: 3,
	thumbnailUrl: null,
	durationSec: null,
}
const envelope = (status: number, code: string) =>
	new Response(JSON.stringify({ error: { code, message: code } }), { status })
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

function routeKey(url: string): 'start' | 'put' | 'complete' {
	if (url === '/api/uploads') return 'start'
	return url.includes('/complete') ? 'complete' : 'put'
}

function setup(routes: Partial<Record<'start' | 'put' | 'complete', Handler>> = {}) {
	const calls: { url: string; init: RequestInit }[] = []
	const defaults: Record<'start' | 'put' | 'complete', Handler> = {
		start: () => ok(ticket),
		put: () => new Response(null, { status: 200 }),
		complete: () => ok(result),
	}
	const fetch = (async (input: string, init: RequestInit) => {
		calls.push({ url: input, init })
		const key = routeKey(input)
		return (routes[key] ?? defaults[key])(input, init)
	}) as typeof globalThis.fetch
	const readMetadata = async () => ({ width: 4, height: 3, durationSec: null, poster: null })
	return { calls, deps: { fetch, readMetadata } }
}

const file = new File(['x'], 'a.png', { type: 'image/png' })
const failureOf = async (promise: Promise<unknown>) => {
	try {
		await promise
	} catch (error) {
		return error as ApiError
	}
	throw new Error('expected rejection')
}

describe('uploadFile', () => {
	it('runs start, transfer and complete for an image', async () => {
		const { calls, deps } = setup()

		const uploaded = await uploadFile(file, 'post', deps)

		expect(uploaded.id).toBe('m1')
		expect(calls.map((c) => c.url)).toEqual([
			'/api/uploads',
			ticket.uploadUrl,
			'/api/uploads/m1/complete',
		])
		expect(JSON.parse(String(calls[0].init.body))).toMatchObject({ purpose: 'post', sizeBytes: 1 })
	})

	it('uploads the poster when the metadata has one', async () => {
		const { calls, deps } = setup({
			start: () => ok({ ...ticket, thumbnailUploadUrl: 'https://r2.test/thumb' }),
		})
		const poster = new Blob(['p'])
		const readMetadata = async () => ({ width: 1, height: 1, durationSec: 2, poster })

		await uploadFile(file, 'reel', { ...deps, readMetadata })

		expect(calls.map((c) => c.url)).toContain('https://r2.test/thumb')
		expect(JSON.parse(String(calls[0].init.body)).thumbnailSizeBytes).toBe(1)
	})

	it.each([
		[413, 'PAYLOAD_TOO_LARGE'],
		[415, 'UNSUPPORTED_MEDIA_TYPE'],
	])('keeps the code of a %i start response', async (status, code) => {
		const { deps } = setup({ start: () => envelope(status, code) })

		expect((await failureOf(uploadFile(file, 'post', deps))).code).toBe(code)
	})

	it('reports an expired upload URL on R2 403', async () => {
		const { deps } = setup({ put: () => new Response(null, { status: 403 }) })

		expect((await failureOf(uploadFile(file, 'post', deps))).code).toBe('UPLOAD_EXPIRED')
	})

	it('reports INTERNAL for other R2 failures', async () => {
		const { deps } = setup({ put: () => new Response(null, { status: 500 }) })

		expect((await failureOf(uploadFile(file, 'post', deps))).code).toBe('INTERNAL')
	})

	it('reports INTERNAL when the network rejects', async () => {
		const { deps } = setup({
			start: () => {
				throw new TypeError('offline')
			},
		})

		expect((await failureOf(uploadFile(file, 'post', deps))).code).toBe('INTERNAL')
	})

	it('keeps the code of a failed completion', async () => {
		const { deps } = setup({ complete: () => envelope(400, 'VALIDATION_FAILED') })

		expect((await failureOf(uploadFile(file, 'post', deps))).code).toBe('VALIDATION_FAILED')
	})
})
