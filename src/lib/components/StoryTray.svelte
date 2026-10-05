<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import type { StoryTrayItem, UserSummary } from '$lib/contract'
	let { items, me }: { items: StoryTrayItem[]; me: UserSummary | null } = $props()
</script>

<nav aria-label={$_('story.title')} class="story-tray">
	<a href="/create?type=story" class="story-item">
		<span class="story-avatar relative"
			><Avatar src={me?.avatarUrl} name={me?.displayName ?? ''} size="lg" /><span
				class="story-add"
				aria-hidden="true">+</span
			></span
		>
		<span class="story-name">{$_('story.add')}</span>
	</a>
	{#each items as item (item.user.id)}
		{@const name = item.user.username || item.user.displayName}
		<a
			href="/stories/{encodeURIComponent(item.user.username || item.user.id)}"
			class="story-item"
			aria-label={name}
		>
			<span class="story-avatar" class:unseen={item.hasUnseen}
				><Avatar src={item.user.avatarUrl} name={item.user.displayName} size="lg" /></span
			>
			<span class="story-name">{name}</span>
		</a>
	{/each}
</nav>
