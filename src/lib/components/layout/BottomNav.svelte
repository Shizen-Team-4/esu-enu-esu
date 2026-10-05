<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Icon from '$lib/components/ui/Icon.svelte'
	import { cn } from '$lib/ui/class-names'
	import { isActive, type NavItem } from './nav-items'

	let { items, pathname }: { items: NavItem[]; pathname: string } = $props()
</script>

<nav
	aria-label={$_('nav.label')}
	class="fixed inset-x-0 bottom-0 z-10 bg-background shadow-[0_-1px_0_var(--color-border)] pb-[env(safe-area-inset-bottom)]"
>
	<ul class="flex h-(--nav-height) items-stretch">
		{#each items as item (item.id)}
			{@const active = isActive(item, pathname)}
			<li class="flex-1">
				<a
					href={item.href}
					aria-current={active ? 'page' : undefined}
					aria-label={$_(item.labelKey)}
					class={cn(
						'flex h-full items-center justify-center transition-colors',
						'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
						active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
					)}
				>
					<Icon icon={item.icon} size={24} class={active ? 'stroke-[2.5]' : undefined} />
				</a>
			</li>
		{/each}
	</ul>
</nav>
