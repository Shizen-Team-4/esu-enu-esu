import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { textSnippet } from '$lib/test/snippet'
import Dialog from './Dialog.svelte'

const setup = (props: Record<string, unknown> = {}) =>
	render(Dialog, {
		props: {
			trigger: textSnippet('Open'),
			title: textSnippet('Delete post'),
			description: textSnippet('This cannot be undone'),
			children: textSnippet('Body'),
			...props,
		},
	})

describe('Dialog', () => {
	it('is closed at first', () => {
		setup()
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('opens with title and description when the trigger is clicked', async () => {
		setup()
		await userEvent.click(screen.getByRole('button', { name: 'Open' }))
		const dialog = await screen.findByRole('dialog', { name: 'Delete post' })
		expect(dialog).toHaveAccessibleDescription('This cannot be undone')
		expect(dialog).toHaveTextContent('Body')
	})

	it('moves focus inside, closes with Escape and returns focus to the trigger', async () => {
		const user = userEvent.setup()
		setup()
		const trigger = screen.getByRole('button', { name: 'Open' })
		await user.click(trigger)
		const dialog = await screen.findByRole('dialog')
		await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))

		await user.keyboard('{Escape}')
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
		await waitFor(() => expect(trigger).toHaveFocus())
	})

	it('closes with the translated close button', async () => {
		const user = userEvent.setup()
		setup()
		await user.click(screen.getByRole('button', { name: 'Open' }))
		await user.click(await screen.findByRole('button', { name: 'Close' }))
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
	})

	it('works without a description or body', async () => {
		setup({ description: undefined, children: undefined })
		await userEvent.click(screen.getByRole('button', { name: 'Open' }))
		expect(await screen.findByRole('dialog', { name: 'Delete post' })).not.toHaveTextContent('Body')
	})

	it('can start open', async () => {
		setup({ open: true })
		expect(await screen.findByRole('dialog')).toBeInTheDocument()
	})
})
