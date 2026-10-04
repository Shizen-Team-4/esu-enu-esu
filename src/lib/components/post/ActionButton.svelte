<script lang="ts">
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'
	import ActionIcon from './ActionIcon.svelte'

	type Props = {
		label: string
		icon: 'heart' | 'comment' | 'bookmark' | 'share'
		filled?: boolean
		tone?: string
		count?: number
		href?: string
	} & Omit<HTMLButtonAttributes, 'class'> &
		Omit<HTMLAnchorAttributes, 'class' | 'type'>

	let {
		label,
		icon,
		filled = false,
		tone = 'text-fg-muted',
		count,
		href,
		...rest
	}: Props = $props()

	const classes = $derived(
		`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 bg-transparent px-2 text-meta no-underline hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 ${tone}`,
	)
</script>

{#if href}
	<a {href} aria-label={label} class={classes} {...rest as HTMLAnchorAttributes}
		><ActionIcon name={icon} {filled} />{#if count !== undefined}<span>{count}</span>{/if}</a
	>
{:else}
	<button aria-label={label} class={classes} {...rest as HTMLButtonAttributes}
		><ActionIcon name={icon} {filled} />{#if count !== undefined}<span>{count}</span>{/if}</button
	>
{/if}
