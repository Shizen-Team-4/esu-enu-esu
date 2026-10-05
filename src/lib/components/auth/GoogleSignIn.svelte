<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from '$lib/components/ui/Button.svelte'
	import GoogleLogo from '$lib/components/GoogleLogo.svelte'
</script>

<div class="grid gap-4">
	<p class="flex items-center gap-3 text-meta text-fg-muted">
		<span class="h-px flex-1 bg-line"></span>{$_('auth.orContinue')}<span
			class="h-px flex-1 bg-line"
		></span>
	</p>
	<form method="POST" action="/auth/google">
		<Button type="submit" class="w-full"><GoogleLogo />{$_('auth.google')}</Button>
	</form>
</div>
