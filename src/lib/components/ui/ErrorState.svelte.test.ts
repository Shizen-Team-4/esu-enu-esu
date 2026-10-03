import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ErrorState from './ErrorState.svelte'

describe('ErrorState', () => {
	it('shows the translated message for the code', () => {
		render(ErrorState, { props: { code: 'NOT_FOUND' } })
		expect(screen.getByRole('alert')).toHaveTextContent(
			'We could not find what you are looking for.',
		)
	})

	it('shows a retry button for INTERNAL and calls onRetry', async () => {
		const onRetry = vi.fn()
		render(ErrorState, { props: { code: 'INTERNAL', onRetry } })
		await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
		expect(onRetry).toHaveBeenCalledOnce()
	})

	it('hides the retry button when no onRetry is given', () => {
		render(ErrorState, { props: { code: 'INTERNAL' } })
		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})

	it('hides the retry button for codes that are not retryable', () => {
		render(ErrorState, { props: { code: 'FORBIDDEN', onRetry: vi.fn() } })
		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})
})
