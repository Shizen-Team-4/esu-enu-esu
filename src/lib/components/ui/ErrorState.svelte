<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Button from './Button.svelte'
	let { message, onretry }: { message: string; onretry: () => void } = $props()
</script>

<div class="grid justify-items-center gap-3 px-inset py-12 text-center">
	<p role="alert" class="text-body">{message}</p>
	<Button onclick={onretry}>{$_('error.retry')}</Button>
</div>
