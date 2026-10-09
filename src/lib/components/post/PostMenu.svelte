<script lang="ts">
	import { DropdownMenu } from 'bits-ui'
	import Ellipsis from '@lucide/svelte/icons/ellipsis'
	import { _ } from 'svelte-i18n'
	import Icon from '$lib/components/ui/Icon.svelte'
	import { postMenuActions, type PostMenuAction } from '$lib/posts/post-menu'
	import type { Post } from '$lib/types/post'

	let { post, onAction }: { post: Post; onAction?: (action: PostMenuAction) => void } = $props()

	const actions = $derived(postMenuActions(post))
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		aria-label={$_('post.menu')}
		class="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
	>
		<Icon icon={Ellipsis} />
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content
			align="end"
			sideOffset={4}
			class="z-50 min-w-36 rounded-base border border-border bg-background p-1 shadow-lg"
		>
			{#each actions as action (action)}
				<DropdownMenu.Item
					onSelect={() => onAction?.(action)}
					class="flex h-10 cursor-pointer items-center rounded-sm px-3 text-sm outline-none hover:bg-elevated data-highlighted:bg-elevated {action ===
					'delete'
						? 'text-destructive'
						: ''}"
				>
					{$_(`post.${action}`)}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
