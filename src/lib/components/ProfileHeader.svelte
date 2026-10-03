<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Profile } from '$lib/server/users/application/ports'
	let { profile }: { profile: Profile } = $props()
</script>

<section class="mb-8 grid grid-cols-[5rem_1fr] items-center gap-4 md:grid-cols-[9rem_1fr] md:gap-8">
	{#if profile.avatarUrl}<img
			src={profile.avatarUrl}
			alt=""
			width="144"
			height="144"
			class="aspect-square w-full rounded-full object-cover"
		/>{:else}<div
			class="grid aspect-square place-items-center rounded-full bg-bubble-in text-2xl text-fg"
		>
			{profile.displayName.slice(0, 1)}
		</div>{/if}
	<div>
		<h1 class="text-xl font-semibold md:text-3xl">@{profile.username}</h1>
		<div class="mt-4 grid grid-cols-3 gap-2 text-center">
			{#each ['posts', 'followers', 'following'] as key}<p>
					<strong class="block">{profile.counts[key as keyof typeof profile.counts]}</strong><span
						class="text-sm text-fg-muted">{$_(`profile.${key}`)}</span
					>
				</p>{/each}
		</div>
	</div>
	<div class="col-span-2 md:col-start-2">
		<strong>{profile.displayName}</strong>
		<p class="my-3 whitespace-pre-wrap break-words">{profile.bio}</p>
		{#if !profile.viewer.isMe}<form method="POST" action="?/follow">
				<input type="hidden" name="active" value={String(!profile.viewer.following)} /><button
					type="submit"
					>{$_(profile.viewer.following ? 'profile.unfollow' : 'profile.follow')}</button
				>
			</form>{/if}
	</div>
</section>
