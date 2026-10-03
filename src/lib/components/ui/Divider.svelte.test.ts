import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Divider from './Divider.svelte'

describe('Divider', () => {
	it('renders a solid separator by default', () => {
		render(Divider)
		const separator = screen.getByRole('separator')
		expect(separator).toHaveClass('bg-border')
		expect(separator).not.toHaveClass('divider-diagonal')
	})

	it('renders the diagonal variant', () => {
		render(Divider, { props: { variant: 'diagonal' } })
		expect(screen.getByRole('separator')).toHaveClass('divider-diagonal')
	})
})
