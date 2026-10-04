<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Profile } from '$lib/contract'
	let { counts, username }: { counts: Profile['counts']; username: string } = $props()
	const keys = ['posts', 'followers', 'following'] as const
</script>

<ul class="m-0 grid list-none grid-flow-col justify-start gap-6 p-0 md:gap-10">
	{#each keys as key (key)}
		<li class="grid text-center md:text-left">
			{#if key === 'posts'}
				<strong class="text-body font-bold">{counts[key]}</strong>
				<span class="text-meta text-fg-muted">{$_(`profile.${key}`)}</span>
			{:else}
				<a
					href="/u/{username}/{key}"
					class="grid min-h-11 min-w-11 cursor-pointer text-fg no-underline"
				>
					<strong class="text-body font-bold">{counts[key]}</strong>
					<span class="text-meta text-fg-muted">{$_(`profile.${key}`)}</span>
				</a>
			{/if}
		</li>
	{/each}
</ul>
