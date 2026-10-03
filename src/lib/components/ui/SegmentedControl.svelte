<script lang="ts">
	type Option = { value: string; label: string; icon?: string }
	type Props = {
		name: string
		label: string
		options: Option[]
		value: string
		onchange?: (value: string) => void
	}

	let { name, label, options, value = $bindable(), onchange }: Props = $props()
</script>

<div
	role="radiogroup"
	aria-label={label}
	class="field inline-flex overflow-hidden max-sm:flex max-sm:w-full"
>
	{#each options as option, i (option.value)}
		<label class="flex-1 {i > 0 ? 'border-l border-line' : ''}">
			<input
				type="radio"
				{name}
				value={option.value}
				checked={value === option.value}
				onchange={() => {
					value = option.value
					onchange?.(option.value)
				}}
				class="peer sr-only"
			/>
			<span
				class="flex min-h-11 cursor-pointer items-center justify-center gap-2 px-4 text-meta text-fg-muted peer-checked:bg-primary-soft peer-checked:font-semibold peer-checked:text-primary peer-focus-visible:outline-3 peer-focus-visible:-outline-offset-3 peer-focus-visible:outline-primary"
			>
				{#if option.icon}
					<svg
						viewBox="0 0 24 24"
						class="size-4"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"><path d={option.icon} /></svg
					>
				{/if}
				{option.label}
			</span>
		</label>
	{/each}
</div>
