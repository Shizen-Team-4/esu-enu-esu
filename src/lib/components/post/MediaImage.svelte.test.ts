import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import { mockPosts } from '$lib/mocks/posts'
import MediaImage from './MediaImage.svelte'

const media = mockPosts.find((post) => post.id === 'pst_107')!.media[0]

describe('MediaImage', () => {
	it('renders a lazy image that keeps the file ratio', () => {
		render(MediaImage, { props: { media, alt: 'Waterfall' } })
		const image = screen.getByRole('img', { name: 'Waterfall' })
		expect(image).toHaveAttribute('src', media.url)
		expect(image).toHaveAttribute('loading', 'lazy')
		expect(image).toHaveAttribute('width', '1080')
		expect(image).toHaveAttribute('height', '1350')
		expect(image).toHaveClass('object-contain')
	})

	it('shows a fallback when the image fails to load', async () => {
		render(MediaImage, { props: { media, alt: 'Waterfall' } })
		await fireEvent.error(screen.getByRole('img', { name: 'Waterfall' }))
		expect(screen.queryByRole('img', { name: 'Waterfall' })).not.toBeInTheDocument()
		expect(screen.getByRole('img', { name: 'Could not load this media' })).toBeInTheDocument()
	})
})
