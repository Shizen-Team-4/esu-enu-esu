<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { errorMessageKey, isRetryable } from '$lib/errors/error-display'
	import type { ErrorCode } from '$lib/types/error'
	import Button from './Button.svelte'

	let { code, onRetry }: { code: ErrorCode; onRetry?: () => void } = $props()
</script>

<div role="alert" class="flex flex-col items-center gap-3 p-6 text-center">
	<p class="text-base text-foreground">{$_(errorMessageKey(code))}</p>
	{#if onRetry && isRetryable(code)}
		<Button variant="secondary" onclick={() => onRetry()}>{$_('common.retry')}</Button>
	{/if}
</div>
