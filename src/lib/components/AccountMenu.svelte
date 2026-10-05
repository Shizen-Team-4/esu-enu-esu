<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { goto } from '$app/navigation'
	import { ApiError } from '$lib/api/api-error'
	import { signOut } from '$lib/auth/sign-out'
	import type { UserSummary } from '$lib/contract'
	import { errorMessageKey } from '$lib/errors/error-message'
	import { showToast } from '$lib/toast/toast-state'
	import NavIcon from './NavIcon.svelte'
	import Button from './ui/Button.svelte'
	let { me, placement = 'header' }: { me: UserSummary | null; placement?: 'header' | 'sidebar' } =
		$props()
	const menuId = $props.id()
	let open = $state(false)
	let root = $state<HTMLElement>()
	const itemClass =
		'flex min-h-11 w-full cursor-pointer items-center rounded-lg border-0 bg-transparent px-3 text-body text-fg no-underline hover:bg-elevated'

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
			aria-label={$_(placement === 'sidebar' ? 'nav.more' : 'header.menu')}
			aria-expanded={open}
			aria-controls={menuId}
			class={placement === 'sidebar'
				? 'sidebar-link w-full cursor-pointer border-0 bg-transparent'
				: 'inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-fg hover:bg-elevated'}
			onclick={() => (open = !open)}
			><NavIcon path="M4 6h16 M4 12h16 M4 18h16" size={26} />{#if placement === 'sidebar'}<span
					class="sidebar-label">{$_('nav.more')}</span
				>{/if}</button
		>
		{#if open}
			<ul
				id={menuId}
				class="absolute z-50 grid min-w-56 gap-1 rounded-xl border border-line bg-surface p-2 shadow-lg {placement ===
				'sidebar'
					? 'bottom-full left-0 mb-3'
					: 'top-full right-0 mt-1'}"
			>
				<li>
					<a href="/u/{me?.username}" class={itemClass}>{$_('nav.profile')}</a>
				</li>
				<li>
					<a href="/settings" class={itemClass}>{$_('preferences.title')}</a>
				</li>
				<li>
					<button type="button" class={itemClass} onclick={logout}>{$_('auth.logout')}</button>
				</li>
			</ul>
		{/if}
	</div>
{:else}
	<Button href="/login" variant="primary">{$_('auth.login')}</Button>
{/if}
