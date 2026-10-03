<script lang="ts">
	import { enhance } from '$app/forms'
	import { goto } from '$app/navigation'
	import { errorCodeFromData } from '$lib/posts/reaction-result'
	import ActionButton from './ActionButton.svelte'

	let {
		action,
		postId,
		next,
		label,
		icon,
		filled,
		tone,
		count,
		loggedIn,
		onbegin,
		onsuccess,
		onfailure,
	}: {
		action: 'like' | 'save'
		postId: string
		next: boolean
		label: string
		icon: 'heart' | 'bookmark'
		filled: boolean
		tone: string
		count?: number
		loggedIn: boolean
		onbegin: () => void
		onsuccess: (data: unknown) => void
		onfailure: (code: string) => void
	} = $props()

	let pending = $state(false)
</script>

{#if loggedIn}
	<form
		method="POST"
		action="?/{action}"
		use:enhance={() => {
			pending = true
			onbegin()
			return async ({ result }) => {
				pending = false
				if (result.type === 'success') onsuccess(result.data)
				else if (result.type === 'redirect') await goto(result.location)
				else onfailure(result.type === 'failure' ? errorCodeFromData(result.data) : 'INTERNAL')
			}
		}}
	>
		<input type="hidden" name="id" value={postId} />
		<input type="hidden" name="active" value={String(next)} />
		<ActionButton
			type="submit"
			{label}
			{icon}
			{filled}
			{tone}
			{count}
			aria-pressed={filled}
			disabled={pending}
		/>
	</form>
{:else}
	<ActionButton href="/login" {label} {icon} {tone} {count} />
{/if}
