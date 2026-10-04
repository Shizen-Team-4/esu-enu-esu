<script lang="ts">
	import { enhance } from '$app/forms'
	import { _ } from 'svelte-i18n'
	import type { ErrorEnvelope, FollowListItem } from '$lib/contract'
	import { errorMessageKey } from '$lib/errors/error-message'
	import Avatar from '../ui/Avatar.svelte'
	import Button from '../ui/Button.svelte'

	let { user }: { user: FollowListItem } = $props()
	// svelte-ignore state_referenced_locally
	let following = $state(user.viewer.following)
	let pending = $state(false)
	let errorCode = $state<string | null>(null)
	$effect(() => {
		following = user.viewer.following
	})
</script>

<li class="flex flex-wrap items-center gap-3 px-3 py-4" data-user-id={user.id}>
	<a
		href="/u/{user.username}"
		class="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-fg no-underline"
	>
		<Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
		<span class="grid min-w-0">
			<strong class="truncate text-body font-semibold">{user.displayName}</strong>
			<span class="truncate text-meta text-fg-muted">@{user.username}</span>
		</span>
	</a>
	{#if !user.viewer.isMe}
		<form
			method="POST"
			action="?/follow"
			use:enhance={() => {
				pending = true
				errorCode = null
				return async ({ result, update }) => {
					try {
						if (result.type === 'success' && typeof result.data?.following === 'boolean') {
							following = result.data.following
						} else if (result.type === 'failure') {
							errorCode = (result.data as ErrorEnvelope | undefined)?.error?.code ?? 'INTERNAL'
						} else {
							await update()
						}
					} finally {
						pending = false
					}
				}
			}}
		>
			<input type="hidden" name="username" value={user.username} />
			<input type="hidden" name="active" value={String(!following)} />
			<Button type="submit" disabled={pending} variant={following ? 'secondary' : 'primary'}>
				{$_(following ? 'profile.unfollow' : 'profile.follow')}
			</Button>
		</form>
	{/if}
	{#if errorCode}<p role="alert" class="m-0 w-full text-meta text-danger">
			{$_(errorMessageKey(errorCode))}
		</p>{/if}
</li>
