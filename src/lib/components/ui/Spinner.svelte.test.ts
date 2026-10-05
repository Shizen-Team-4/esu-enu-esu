import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Spinner from './Spinner.svelte'

describe('Spinner', () => {
	it('is a status region with a translated label', () => {
		render(Spinner)
		expect(screen.getByRole('status')).toHaveTextContent('Loading')
	})

	it('accepts an extra class', () => {
		render(Spinner, { props: { class: 'mx-auto' } })
		expect(screen.getByRole('status')).toHaveClass('mx-auto')
	})
})
