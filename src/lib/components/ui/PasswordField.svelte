<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLInputAttributes } from 'svelte/elements'
	import { _ } from 'svelte-i18n'
	import FieldError from '$lib/components/FieldError.svelte'

	type Props = {
		label: string
		name: string
		id: string
		value?: string
		hint?: string
		error?: string | null
		aside?: Snippet
	} & Omit<HTMLInputAttributes, 'value' | 'type' | 'name' | 'id'>

	let { label, name, id, value = $bindable(''), hint, error, aside, ...rest }: Props = $props()

	let visible = $state(false)
	const hintId = $derived(`${id}-hint`)
	const describedBy = $derived(
		[error ? `${id}-error` : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined,
	)
</script>

<div class="flex flex-col gap-1">
	<label for={id} class="text-meta font-semibold text-fg">{label}</label>
	<div class="field flex items-center" data-invalid={error ? 'true' : undefined}>
		<input
			{id}
			{name}
			type={visible ? 'text' : 'password'}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			class="min-h-11 w-full min-w-0 flex-1 border-0 bg-transparent px-3 text-body outline-none"
			{...rest}
		/>
		<button
			type="button"
			aria-pressed={visible}
			onclick={() => (visible = !visible)}
			class="min-h-11 cursor-pointer border-0 bg-transparent px-3 text-meta font-semibold text-fg-muted"
		>
			{visible ? $_('auth.hidePassword') : $_('auth.showPassword')}
		</button>
	</div>
	{#if hint}<p id={hintId} class="text-meta text-fg-muted">{hint}</p>{/if}
	<FieldError code={error} id="{id}-error" />
	{#if aside}<div class="text-right text-meta">{@render aside()}</div>{/if}
</div>
