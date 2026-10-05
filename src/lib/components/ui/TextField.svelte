<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements'
	import FieldError from '$lib/components/FieldError.svelte'

	type Props = {
		label: string
		name: string
		id: string
		value?: string
		type?: string
		prefix?: string
		hint?: string
		counter?: string
		error?: string | null
		multiline?: boolean
	} & Omit<HTMLInputAttributes, 'value' | 'type' | 'name' | 'id' | 'prefix'>

	let {
		label,
		name,
		id,
		value = $bindable(''),
		type = 'text',
		prefix,
		hint,
		counter,
		error,
		multiline = false,
		...rest
	}: Props = $props()

	const hintId = $derived(`${id}-hint`)
	const describedBy = $derived(
		[error ? `${id}-error` : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined,
	)
	const control =
		'min-h-11 w-full min-w-0 flex-1 border-0 bg-transparent px-3 text-body outline-none'
</script>

<div class="flex flex-col gap-1">
	<label for={id} class="text-meta font-semibold text-fg">{label}</label>
	<div class="field flex items-center" data-invalid={error ? 'true' : undefined}>
		{#if prefix}<span class="pl-3 text-fg-muted" aria-hidden="true">{prefix}</span>{/if}
		{#if multiline}
			<textarea
				{id}
				{name}
				bind:value
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				class="{control} resize-y py-2"
				{...rest as object}></textarea>
		{:else}
			<input
				{id}
				{name}
				{type}
				bind:value
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				class={prefix ? `${control} pl-1` : control}
				{...rest}
			/>
		{/if}
	</div>
	{#if hint || counter}
		<div class="flex justify-between gap-2 text-meta text-fg-muted">
			{#if hint}<p id={hintId}>{hint}</p>{/if}
			{#if counter}<p class="ml-auto">{counter}</p>{/if}
		</div>
	{/if}
	<FieldError code={error} id="{id}-error" />
</div>
