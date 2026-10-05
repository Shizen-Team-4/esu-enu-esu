import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import type { UserSummary } from '$lib/types/user'
import Avatar from './Avatar.svelte'

const user: UserSummary = {
	id: 'usr_02',
	username: 'mei_k',
	displayName: 'Mei Kobayashi',
	avatarUrl: 'https://cdn.example.com/avatars/usr_02.webp',
}

describe('Avatar', () => {
	it('shows the image with the display name as alt text', () => {
		render(Avatar, { props: { user } })
		expect(screen.getByRole('img', { name: 'Mei Kobayashi' })).toHaveAttribute(
			'src',
			user.avatarUrl,
		)
	})

	it('shows initials when avatarUrl is null', () => {
		render(Avatar, { props: { user: { ...user, avatarUrl: null } } })
		const fallback = screen.getByRole('img', { name: 'Mei Kobayashi' })
		expect(fallback).toHaveTextContent('MK')
		expect(fallback.tagName).toBe('SPAN')
	})

	it('falls back to initials when the image fails to load', async () => {
		render(Avatar, { props: { user } })
		await fireEvent.error(screen.getByRole('img', { name: 'Mei Kobayashi' }))
		const fallback = screen.getByRole('img', { name: 'Mei Kobayashi' })
		expect(fallback.tagName).toBe('SPAN')
		expect(fallback).toHaveTextContent('MK')
	})

	it('applies the size', () => {
		const { container } = render(Avatar, { props: { user, size: 64 } })
		expect(container.firstElementChild).toHaveStyle({ width: '64px', height: '64px' })
	})
})
