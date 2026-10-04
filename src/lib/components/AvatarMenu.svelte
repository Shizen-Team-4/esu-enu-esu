<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { goto } from '$app/navigation'
	import { ApiError } from '$lib/api/api-error'
	import { signOut } from '$lib/auth/sign-out'
	import type { UserSummary } from '$lib/contract'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { showToast } from '$lib/toast/toast-state'
	import Avatar from './ui/Avatar.svelte'
	import Button from './ui/Button.svelte'
	let { me }: { me: UserSummary | null } = $props()
	let open = $state(false)
	let root = $state<HTMLElement>()

	function onWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) open = false
	}
	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !open) return
		open = false
		root?.querySelector<HTMLElement>('button')?.focus()
	}
	async function logout() {
		try {
			await signOut()
			open = false
			await goto('/login', { invalidateAll: true })
		} catch (error) {
			const code = error instanceof ApiError ? error.code : 'INTERNAL'
			showToast($_(errorMessageKey(code)))
		}
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

{#if me}
	<div bind:this={root} class="relative">
		<button
			type="button"
			aria-label={$_('header.menu')}
			aria-expanded={open}
			aria-controls="avatar-menu"
			class="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0"
			onclick={() => (open = !open)}><Avatar src={me.avatarUrl} name={me.displayName} /></button
		>
		{#if open}
			<ul
				id="avatar-menu"
				class="absolute top-full right-0 z-20 mt-1 grid min-w-44 gap-1 rounded-xl border border-line bg-surface p-1"
			>
				<li>
					<a
						href="/profile"
						class="flex min-h-11 items-center rounded-lg px-3 text-body text-fg no-underline hover:bg-elevated"
						>{$_('nav.profile')}</a
					>
				</li>
				<li>
					<a
						href="/settings"
						class="flex min-h-11 items-center rounded-lg px-3 text-body text-fg no-underline hover:bg-elevated"
						>{$_('preferences.title')}</a
					>
				</li>
				<li>
					<Button variant="ghost" class="w-full justify-start" onclick={logout}
						>{$_('auth.logout')}</Button
					>
				</li>
			</ul>
		{/if}
	</div>
{:else}
	<Button href="/login" variant="primary">{$_('auth.login')}</Button>
{/if}
