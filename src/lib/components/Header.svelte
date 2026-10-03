<script lang="ts">
	import { _ } from 'svelte-i18n'
</script>

<header
	class="flex min-h-16 items-center justify-between border-b border-line bg-surface px-4 md:justify-end"
>
	<a href="/" class="flex min-h-11 items-center text-xl font-semibold text-fg md:hidden">SNS</a>
	<a
		href="/settings"
		class="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-fg hover:bg-elevated"
		aria-label={$_('preferences.title')}
	>
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			aria-hidden="true"
			><path d="M4 7h16 M4 17h16" /><circle cx="9" cy="7" r="3" fill="var(--surface)" /><circle
				cx="15"
				cy="17"
				r="3"
				fill="var(--surface)"
			/></svg
		>
	</a>
</header>
