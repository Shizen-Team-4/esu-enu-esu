import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import TextField from './TextField.svelte'

describe('TextField', () => {
	it('links the label to the input', () => {
		render(TextField, { props: { label: 'Email' } })
		expect(screen.getByLabelText('Email')).toBeInTheDocument()
	})

	it('accepts typing', async () => {
		render(TextField, { props: { label: 'Email', value: '' } })
		const input = screen.getByLabelText('Email')
		await userEvent.type(input, 'a@b.c')
		expect(input).toHaveValue('a@b.c')
	})

	it('shows the help text and links it with aria-describedby', () => {
		render(TextField, { props: { label: 'Email', helpText: 'We never share it' } })
		const input = screen.getByLabelText('Email')
		const help = screen.getByText('We never share it')
		expect(input).toHaveAttribute('aria-describedby', help.id)
		expect(input).not.toHaveAttribute('aria-invalid')
	})

	it('shows the translated error and marks the input invalid', () => {
		render(TextField, { props: { label: 'Email', error: 'REQUIRED' } })
		const input = screen.getByLabelText('Email')
		expect(input).toBeInvalid()
		expect(input).toHaveAccessibleDescription('This field is required.')
	})

	it('describes the input with both the error and the help text', () => {
		render(TextField, { props: { label: 'Email', error: 'TAKEN', helpText: 'Hint' } })
		expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
			'This is already taken. Hint',
		)
	})

	it('can be disabled', () => {
		render(TextField, { props: { label: 'Email', disabled: true } })
		expect(screen.getByLabelText('Email')).toBeDisabled()
	})

	it('passes type, name and required to the input', () => {
		render(TextField, {
			props: { label: 'Password', type: 'password', name: 'pw', required: true },
		})
		const input = screen.getByLabelText('Password')
		expect(input).toHaveAttribute('type', 'password')
		expect(input).toHaveAttribute('name', 'pw')
		expect(input).toBeRequired()
	})
})
