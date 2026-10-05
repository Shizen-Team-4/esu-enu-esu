<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { toasts, dismissToast } from '$lib/toast/toast-state'
	import Button from './Button.svelte'
</script>

<div
	role="status"
	class="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 grid justify-items-center gap-2 px-gutter md:bottom-6"
>
	{#each $toasts as toast (toast.id)}
		<div
			class="pointer-events-auto flex max-w-content items-center gap-2 rounded-xl border border-line bg-surface py-1 pr-1 pl-4 text-body text-fg"
		>
			<span>{toast.message}</span>
			<Button variant="ghost" class="px-3" onclick={() => dismissToast(toast.id)}
				>{$_('toast.dismiss')}</Button
			>
		</div>
	{/each}
</div>
