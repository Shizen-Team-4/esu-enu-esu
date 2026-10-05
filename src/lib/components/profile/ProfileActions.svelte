<script lang="ts">
	import { enhance } from '$app/forms'
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	import { errorMessageKey } from '$lib/errors/error-message'
	import type { Profile } from '$lib/contract'

	let { viewer, errorCode = null }: { viewer: Profile['viewer']; errorCode?: string | null } =
		$props()
	let pending = $state(false)
</script>

<div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:flex-none">
	{#if viewer.isMe}
		<Button href="/settings/profile" variant="secondary" class="flex-1 md:flex-none">
			<svg
				viewBox="0 0 24 24"
				class="size-4"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg
			>{$_('profile.editProfile')}
		</Button>
	{:else}
		<form
			method="POST"
			action="?/follow"
			class="flex flex-1 md:flex-none"
			use:enhance={() => {
				pending = true
				return async ({ update }) => {
					await update()
					pending = false
				}
			}}
		>
			<input type="hidden" name="active" value={String(!viewer.following)} />
			<Button
				type="submit"
				disabled={pending}
				variant={viewer.following ? 'secondary' : 'primary'}
				class="flex-1 md:flex-none"
				>{$_(viewer.following ? 'profile.unfollow' : 'profile.follow')}</Button
			>
		</form>
	{/if}
	{#if errorCode}<p role="alert" class="m-0 text-meta text-danger">
			{$_(errorMessageKey(errorCode))}
		</p>{/if}
</div>
