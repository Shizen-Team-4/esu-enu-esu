<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Profile } from '$lib/contract'
	import ProfileAvatar from './ProfileAvatar.svelte'
	import ProfileStats from './ProfileStats.svelte'
	import ProfileActions from './ProfileActions.svelte'

	let { profile, errorCode = null }: { profile: Profile; errorCode?: string | null } = $props()
</script>

<section
	class="grid grid-cols-[76px_1fr] items-center gap-x-6 gap-y-4 md:grid-cols-[132px_1fr] md:gap-x-16 md:gap-y-5"
>
	<div class="md:row-span-3 md:row-start-1">
		<ProfileAvatar src={profile.avatarUrl} name={profile.displayName || profile.username} />
	</div>
	<div class="col-start-2 row-start-1 md:row-start-2">
		<ProfileStats counts={profile.counts} username={profile.username} />
	</div>
	<div
		class="col-span-2 row-start-2 flex items-center gap-3 md:col-span-1 md:col-start-2 md:row-start-1 md:gap-4"
	>
		<h1 class="m-0 min-w-0 break-words text-xl font-semibold md:text-[22px]">
			@{profile.username}
		</h1>
		<ProfileActions viewer={profile.viewer} {errorCode} />
	</div>
	<div class="col-span-2 row-start-3 grid gap-2 md:col-span-1 md:col-start-2">
		<strong class="text-body font-bold">{profile.displayName}</strong>
		{#if profile.bio}<p class="m-0 whitespace-pre-wrap break-words text-body">{profile.bio}</p>
		{:else if profile.viewer.isMe}<a href="/settings/profile" class="text-body text-primary"
				>{$_('profile.addBio')}</a
			>{/if}
	</div>
</section>
