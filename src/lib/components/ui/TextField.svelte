<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { fieldErrorKey } from '$lib/errors/error-display'
	import type { FieldErrorCode } from '$lib/types/error'
	import { cn } from '$lib/ui/class-names'

	let {
		label,
		value = $bindable(''),
		type = 'text',
		name,
		placeholder,
		autocomplete,
		helpText,
		error,
		disabled = false,
		required = false,
	}: {
		label: string
		value?: string
		type?: 'text' | 'email' | 'password' | 'search' | 'url'
		name?: string
		placeholder?: string
		autocomplete?: AutoFill
		helpText?: string
		error?: FieldErrorCode
		disabled?: boolean
		required?: boolean
	} = $props()

	const id = $props.id()
	const helpId = `${id}-help`
	const errorId = `${id}-error`
	const describedBy = $derived(
		[error && errorId, helpText && helpId].filter(Boolean).join(' ') || undefined,
	)
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-sm font-medium">{label}</label>
	<input
		{id}
		{type}
		{name}
		{placeholder}
		{autocomplete}
		{disabled}
		{required}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
		class={cn(
			'h-10 rounded-base border bg-background px-3 text-base',
			'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
			'disabled:cursor-not-allowed disabled:opacity-50',
			error ? 'border-destructive' : 'border-border',
		)}
	/>
	{#if helpText}
		<p id={helpId} class="text-sm text-muted-foreground">{helpText}</p>
	{/if}
	{#if error}
		<p id={errorId} class="text-sm text-destructive">{$_(fieldErrorKey(error))}</p>
	{/if}
</div>
