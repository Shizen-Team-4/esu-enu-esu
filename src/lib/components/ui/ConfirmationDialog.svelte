<script lang="ts">
	import type { Snippet } from 'svelte'

	type Props = {
		open: boolean
		title: string
		message: string
		cancelLabel: string
		children: Snippet
		oncancel: () => void
	}

	let { open, title, message, cancelLabel, children, oncancel }: Props = $props()
</script>

{#if open}
	<div
		class="fixed inset-0 z-30 grid place-items-center bg-black/50 p-gutter"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) oncancel()
		}}
	>
		<div
			class="w-full max-w-sm border border-line bg-surface p-5"
			role="dialog"
			aria-modal="true"
			aria-label={title}
		>
			<h2 class="m-0 text-title font-semibold">{title}</h2>
			<p class="mt-2 mb-5 text-body text-fg-muted">{message}</p>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="min-h-11 cursor-pointer border border-line bg-transparent px-5 py-2 text-body text-fg hover:bg-elevated"
					onclick={oncancel}>{cancelLabel}</button
				>
				{@render children()}
			</div>
		</div>
	</div>
{/if}
