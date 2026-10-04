<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	let { canPost }: { canPost: boolean } = $props()

	function goBack(event: MouseEvent) {
		if (history.length <= 1) return
		event.preventDefault()
		history.back()
	}
</script>

<header
	class="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-surface px-3.5 pt-[env(safe-area-inset-top)] md:px-6"
>
	<a
		href="/"
		onclick={goBack}
		class="inline-flex min-h-11 items-center gap-2 justify-self-start text-body text-fg no-underline"
	>
		<svg
			viewBox="0 0 24 24"
			class="size-5"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg
		>
		{$_('create.cancel')}
	</a>
	<span class="hidden text-title font-semibold text-fg md:block">{$_('app.name')}</span>
	<div class="justify-self-end md:hidden">
		<Button type="submit" form="composer-form" variant="primary" disabled={!canPost}
			>{$_('create.post')}</Button
		>
	</div>
</header>
