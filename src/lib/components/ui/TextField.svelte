<script lang="ts">
	import type { Snippet } from 'svelte'
	import { _ } from 'svelte-i18n'
	import { fieldErrorKey } from '$lib/errors/error-display'
	import type { FieldErrorCode } from '$lib/types/error'
	import { cn } from '$lib/ui/class-names'

	let {
		label,
		value = $bindable(''),
		type = 'text',
		id: htmlId,
		name,
		placeholder,
		autocomplete,
		autocapitalize,
		autocorrect,
		helpText,
		hint,
		error,
		disabled = false,
		required = false,
		multiline = false,
		maxlength,
		minlength,
		pattern,
		prefix,
		counter,
		aside,
	}: {
		label: string
		value?: string
		type?: 'text' | 'email' | 'password' | 'search' | 'url'
		id?: string
		name?: string
		placeholder?: string
		autocomplete?: AutoFill
		autocapitalize?: 'on' | 'none' | 'off' | 'characters' | 'sentences' | 'words'
		autocorrect?: 'on' | 'off' | ''
		helpText?: string
		hint?: string
		error?: FieldErrorCode
		disabled?: boolean
		required?: boolean
		multiline?: boolean
		maxlength?: number
		minlength?: number
		pattern?: string
		prefix?: string
		counter?: string
		aside?: Snippet
	} = $props()

	const genId = $props.id()
	const id = $derived(htmlId ?? genId)
	const helpId = $derived(`${id}-help`)
	const errorId = $derived(`${id}-error`)
	const helpContent = $derived(helpText ?? hint)
	const describedBy = $derived(
		[error && errorId, helpContent && helpId].filter(Boolean).join(' ') || undefined,
	)

	const inputClass = $derived(
		cn(
			'h-10 w-full rounded-base border bg-background px-3 text-base',
			'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
			'disabled:cursor-not-allowed disabled:opacity-50',
			error ? 'border-destructive' : 'border-border',
		),
	)
</script>

<div class="flex flex-col gap-1.5">
	<div class="flex items-center justify-between">
		<label for={id} class="text-sm font-medium">{label}</label>
		{#if aside}{@render aside()}{/if}
	</div>
	{#if prefix}
		<div
			class="flex items-center rounded-base border {error
				? 'border-destructive'
				: 'border-border'} bg-background focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring"
		>
			<span class="pl-3 text-base text-muted-foreground select-none">{prefix}</span>
			<input
				{id}
				{type}
				{name}
				{placeholder}
				{autocomplete}
				{autocapitalize}
				{autocorrect}
				{disabled}
				{required}
				{maxlength}
				{minlength}
				{pattern}
				bind:value
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				class="h-10 min-w-0 flex-1 bg-transparent pr-3 text-base outline-none"
			/>
		</div>
	{:else if multiline}
		<textarea
			{id}
			{name}
			{placeholder}
			{autocomplete}
			{autocapitalize}
			{disabled}
			{required}
			{maxlength}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			class={cn(
				'min-h-24 w-full rounded-base border bg-background px-3 py-2 text-base',
				'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
				'disabled:cursor-not-allowed disabled:opacity-50',
				error ? 'border-destructive' : 'border-border',
			)}></textarea>
	{:else}
		<input
			{id}
			{type}
			{name}
			{placeholder}
			{autocomplete}
			{autocapitalize}
			{autocorrect}
			{disabled}
			{required}
			{maxlength}
			{minlength}
			{pattern}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			class={inputClass}
		/>
	{/if}
	{#if counter}
		<p class="text-right text-xs text-muted-foreground">{counter}</p>
	{/if}
	{#if helpContent}
		<p id={helpId} class="text-sm text-muted-foreground">{helpContent}</p>
	{/if}
	{#if error}
		<p id={errorId} class="text-sm text-destructive">{$_(fieldErrorKey(error))}</p>
	{/if}
</div>
