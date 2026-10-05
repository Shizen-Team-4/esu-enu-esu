<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { STICKERS, stickerToken } from '$lib/messages/sticker'
	let { onpick }: { onpick: (value: string) => void } = $props()
	let open = $state(false)
	let tab = $state<'emoji' | 'gif'>('emoji')
	let root = $state<HTMLElement>()
	const emoji = [
		'❤️',
		'😂',
		'🥰',
		'😊',
		'😭',
		'🎉',
		'🔥',
		'👏',
		'💜',
		'✨',
		'👍',
		'😍',
		'🙏',
		'👋',
		'🤝',
		'💯',
	]
	function pick(value: string) {
		onpick(value)
		open = false
	}
	function onWindowPointerDown(event: PointerEvent) {
		if (open && root && !root.contains(event.target as Node)) open = false
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} />
<div class="message-picker" bind:this={root}>
	<button
		type="button"
		class="message-picker-trigger"
		onclick={() => {
			open = !open
		}}
		aria-expanded={open}
		aria-label={$_('messages.emoji')}
	>
		<svg
			viewBox="0 0 24 24"
			class="size-6"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
			><circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg
		>
	</button>
	{#if open}
		<div class="message-picker-panel">
			<div role="tablist" class="message-picker-tabs">
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'emoji'}
					class:active={tab === 'emoji'}
					onclick={() => {
						tab = 'emoji'
					}}>{$_('messages.emoji')}</button
				>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'gif'}
					class:active={tab === 'gif'}
					onclick={() => {
						tab = 'gif'
					}}>{$_('messages.gif')}</button
				>
			</div>
			{#if tab === 'emoji'}<div class="message-emoji-grid">
					{#each emoji as symbol}<button
							type="button"
							onclick={() => pick(symbol)}
							aria-label={symbol}>{symbol}</button
						>{/each}
				</div>
			{:else}<div class="message-gif-grid">
					{#each STICKERS as sticker}<button
							type="button"
							onclick={() => pick(stickerToken(sticker))}
							aria-label={$_(`messages.${sticker}`)}
							><img src="/stickers/{sticker}.gif" alt="" /><span>{$_(`messages.${sticker}`)}</span
							></button
						>{/each}
				</div>{/if}
		</div>
	{/if}
</div>
