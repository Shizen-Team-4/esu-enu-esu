import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import { mockPosts } from '$lib/mocks/posts'
import PostGrid from './PostGrid.svelte'

const post = (id: string) => mockPosts.find((item) => item.id === id)!

describe('PostGrid', () => {
	it('distinguishes text statuses from pictures and links both to their posts', () => {
		const { container } = render(PostGrid, { props: { posts: [post('pst_101'), post('pst_107')] } })
		const status = container.querySelector<HTMLAnchorElement>('[data-kind="status"]')!
		const picture = container.querySelector<HTMLAnchorElement>('[data-kind="picture"]')!

		expect(status).toHaveAttribute('href', '/p/pst_101')
		expect(status).toHaveTextContent('Status')
		expect(status.querySelector('img')).toBeNull()
		expect(picture).toHaveAttribute('href', '/p/pst_107')
		expect(picture.querySelector('img')).toHaveClass('object-cover')
	})

	it('opens a reel in the dedicated player even without a thumbnail', () => {
		const reel = {
			...post('pst_106'),
			media: [{ ...post('pst_106').media[0], thumbnailUrl: null }],
		}
		const { container } = render(PostGrid, { props: { posts: [reel] } })
		const tile = container.querySelector<HTMLAnchorElement>('[data-kind="reel"]')!

		expect(tile).toHaveAttribute('href', '/reels?post=pst_106')
		expect(tile).toHaveTextContent('Reel')
		expect(tile.querySelector('img')).toBeNull()
	})
})
