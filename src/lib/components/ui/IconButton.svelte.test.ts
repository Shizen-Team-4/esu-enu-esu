import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Heart from '@lucide/svelte/icons/heart'
import { describe, expect, it, vi } from 'vitest'
import IconButton from './IconButton.svelte'

describe('IconButton', () => {
	it('uses the label as its accessible name', () => {
		render(IconButton, { props: { icon: Heart, label: 'Like' } })
		expect(screen.getByRole('button', { name: 'Like' })).toBeInTheDocument()
	})

	it('calls onclick', async () => {
		const onclick = vi.fn()
		render(IconButton, { props: { icon: Heart, label: 'Like', onclick } })
		await userEvent.click(screen.getByRole('button', { name: 'Like' }))
		expect(onclick).toHaveBeenCalledOnce()
	})

	it('activates with the keyboard', async () => {
		const onclick = vi.fn()
		const user = userEvent.setup()
		render(IconButton, { props: { icon: Heart, label: 'Like', onclick } })
		await user.tab()
		await user.keyboard('{Enter}')
		expect(onclick).toHaveBeenCalledOnce()
	})

	it('does not call onclick when disabled', async () => {
		const onclick = vi.fn()
		render(IconButton, { props: { icon: Heart, label: 'Like', onclick, disabled: true } })
		await userEvent.click(screen.getByRole('button', { name: 'Like' }))
		expect(onclick).not.toHaveBeenCalled()
	})

	it('exposes the pressed state', () => {
		render(IconButton, { props: { icon: Heart, label: 'Like', pressed: true } })
		expect(screen.getByRole('button', { name: 'Like' })).toHaveAttribute('aria-pressed', 'true')
	})

	it('hides the icon from assistive technology', () => {
		const { container } = render(IconButton, { props: { icon: Heart, label: 'Like' } })
		expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
	})
})
