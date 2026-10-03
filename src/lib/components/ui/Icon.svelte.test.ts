import { render, screen } from '@testing-library/svelte'
import Heart from '@lucide/svelte/icons/heart'
import { describe, expect, it } from 'vitest'
import Icon from './Icon.svelte'

describe('Icon', () => {
	it('is hidden from assistive technology when decorative', () => {
		const { container } = render(Icon, { props: { icon: Heart } })
		expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
		expect(screen.queryByRole('img')).not.toBeInTheDocument()
	})

	it('has role img and a name when a label is given', () => {
		render(Icon, { props: { icon: Heart, label: 'Liked' } })
		expect(screen.getByRole('img', { name: 'Liked' })).toBeInTheDocument()
	})

	it('applies size and class', () => {
		const { container } = render(Icon, { props: { icon: Heart, size: 32, class: 'text-primary' } })
		const svg = container.querySelector('svg')
		expect(svg).toHaveAttribute('width', '32')
		expect(svg).toHaveClass('text-primary')
	})
})
