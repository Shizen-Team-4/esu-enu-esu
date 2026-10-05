import { describe, expect, it } from 'vitest'
import { sharePost } from './share-post'

const url = 'https://example.test/p/1'

describe('sharePost', () => {
	it('uses the Web Share API when available', async () => {
		const calls: unknown[] = []
		const result = await sharePost(url, 'Post', { share: async (data) => void calls.push(data) })
		expect(result).toBe('shared')
		expect(calls).toEqual([{ url, title: 'Post' }])
	})

	it('treats an AbortError as cancelled', async () => {
		const result = await sharePost(url, 'Post', {
			share: async () => {
				throw new DOMException('dismissed', 'AbortError')
			},
		})
		expect(result).toBe('cancelled')
	})

	it('reports a failed share', async () => {
		const result = await sharePost(url, 'Post', {
			share: async () => {
				throw new Error('nope')
			},
		})
		expect(result).toBe('failed')
	})

	it('treats a non-Error rejection as failed', async () => {
		const result = await sharePost(url, 'Post', { share: () => Promise.reject('nope') })
		expect(result).toBe('failed')
	})

	it('copies the link when sharing is unavailable', async () => {
		const copied: string[] = []
		const result = await sharePost(url, 'Post', {
			clipboard: { writeText: async (text) => void copied.push(text) },
		})
		expect(result).toBe('copied')
		expect(copied).toEqual([url])
	})

	it('fails when the clipboard rejects', async () => {
		const result = await sharePost(url, 'Post', {
			clipboard: {
				writeText: async () => {
					throw new Error('denied')
				},
			},
		})
		expect(result).toBe('failed')
	})

	it('fails when neither share nor clipboard exists', async () => {
		expect(await sharePost(url, 'Post', {})).toBe('failed')
	})
})
