import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { textSnippet } from '$lib/test/snippet'
import Button from './Button.svelte'

const setup = (props: Record<string, unknown> = {}) =>
	render(Button, { props: { children: textSnippet('Save'), ...props } })

describe('Button', () => {
	it('renders a button with its label', () => {
		setup()
		expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
	})

	it.each(['primary', 'secondary', 'ghost', 'destructive'] as const)(
		'renders the %s variant',
		(variant) => {
			setup({ variant })
			expect(screen.getByRole('button')).toBeEnabled()
		},
	)

	it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
		setup({ size })
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('calls onclick when clicked', async () => {
		const onclick = vi.fn()
		setup({ onclick })
		await userEvent.click(screen.getByRole('button'))
		expect(onclick).toHaveBeenCalledOnce()
	})

	it('activates with Enter and Space', async () => {
		const onclick = vi.fn()
		const user = userEvent.setup()
		setup({ onclick })
		await user.tab()
		await user.keyboard('{Enter}')
		await user.keyboard(' ')
		expect(onclick).toHaveBeenCalledTimes(2)
	})

	it('does not call onclick when disabled', async () => {
		const onclick = vi.fn()
		setup({ onclick, disabled: true })
		const button = screen.getByRole('button')
		expect(button).toBeDisabled()
		await userEvent.click(button)
		expect(onclick).not.toHaveBeenCalled()
	})

	it('shows busy state and ignores clicks while loading', async () => {
		const onclick = vi.fn()
		setup({ onclick, loading: true })
		const button = screen.getByRole('button', { name: 'Save' })
		expect(button).toHaveAttribute('aria-busy', 'true')
		expect(button).toBeDisabled()
		await userEvent.click(button)
		expect(onclick).not.toHaveBeenCalled()
	})

	it('uses the given type', () => {
		setup({ type: 'submit' })
		expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
	})

	it('renders a link when href is set', async () => {
		const onclick = vi.fn((event: MouseEvent) => event.preventDefault())
		setup({ href: '/login', onclick })
		const link = screen.getByRole('link', { name: 'Save' })
		expect(link).toHaveAttribute('href', '/login')
		await userEvent.click(link)
		expect(onclick).toHaveBeenCalledOnce()
	})

	it('marks a link as disabled and does not call onclick', () => {
		const onclick = vi.fn()
		setup({ href: '/login', disabled: true, onclick })
		const link = screen.getByRole('link', { name: 'Save' })
		expect(link).toHaveAttribute('aria-disabled', 'true')
		expect(link).toHaveAttribute('tabindex', '-1')
		link.click()
		expect(onclick).not.toHaveBeenCalled()
	})

	it('marks a loading link as busy', () => {
		setup({ href: '/login', loading: true })
		expect(screen.getByRole('link')).toHaveAttribute('aria-busy', 'true')
	})
})
