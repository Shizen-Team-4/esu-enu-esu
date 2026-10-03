<script lang="ts">
	import type { Snippet } from 'svelte'
	import { Dialog } from 'bits-ui'
	import X from '@lucide/svelte/icons/x'
	import { _ } from 'svelte-i18n'
	import Icon from './Icon.svelte'

	let {
		open = $bindable(false),
		trigger,
		title,
		description,
		children,
	}: {
		open?: boolean
		trigger: Snippet
		title: Snippet
		description?: Snippet
		children?: Snippet
	} = $props()
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class="inline-flex h-10 items-center justify-center rounded-base bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
	>
		{@render trigger()}
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-base bg-background p-6 shadow-lg"
		>
			<Dialog.Title class="text-lg font-semibold">{@render title()}</Dialog.Title>
			{#if description}
				<Dialog.Description class="mt-1 text-sm text-muted-foreground">
					{@render description()}
				</Dialog.Description>
			{/if}
			{#if children}
				<div class="mt-4">{@render children()}</div>
			{/if}
			<Dialog.Close
				aria-label={$_('common.close')}
				class="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
			>
				<Icon icon={X} size={18} />
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
