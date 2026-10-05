<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import type { StoryTrayItem, UserSummary } from '$lib/contract'

	let { items, me }: { items: StoryTrayItem[]; me: UserSummary | null } = $props()
	const tile =
		'relative block h-22 min-w-20 flex-1 overflow-hidden rounded-xs border text-nav font-semibold no-underline md:h-26'
</script>

<nav aria-label={$_('story.title')} class="flex gap-2 overflow-x-auto">
	<a href="/create?type=story" class="{tile} border-line bg-surface text-fg">
		<span class="grid h-3/4 place-items-center bg-elevated">
			<Avatar src={me?.avatarUrl} name={me?.displayName ?? ''} />
		</span>
		<span
			aria-hidden="true"
			class="absolute top-[58%] left-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-surface bg-primary text-body text-on-primary"
			>+</span
		>
		<span class="absolute inset-x-0 bottom-0 truncate px-1.5 pb-1 text-center"
			>{$_('story.add')}</span
		>
	</a>
	{#each items as item (item.user.id)}
		{@const name = item.user.username || item.user.displayName}
		<a
			href="/stories/{encodeURIComponent(item.user.username || item.user.id)}"
			aria-label={name}
			class="{tile} bg-elevated text-background {item.hasUnseen
				? 'border-2 border-primary'
				: 'border-line'}"
		>
			{#if item.user.avatarUrl}
				<img src={item.user.avatarUrl} alt="" class="size-full object-cover" />
			{:else}
				<span class="grid size-full place-items-center text-title text-fg" aria-hidden="true"
					>{item.user.displayName.slice(0, 1).toUpperCase()}</span
				>
			{/if}
			<span
				class="absolute top-1 left-1 rounded-full ring-2 {item.hasUnseen
					? 'ring-primary'
					: 'ring-surface'}"
			>
				<Avatar src={item.user.avatarUrl} name={item.user.displayName} size="sm" />
			</span>
			<span class="absolute inset-x-0 bottom-0 truncate bg-fg px-1.5 py-1">{name}</span>
		</a>
	{/each}
</nav>
