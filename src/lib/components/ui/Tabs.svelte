<script lang="ts">
	type Item = { href: string; label: string; active: boolean }
	type Props = {
		items: Item[]
		label: string
		position?: 'bottom' | 'top'
		class?: string
	}

	let { items, label, position = 'bottom', class: className = '' }: Props = $props()

	const layout = $derived(position === 'top' ? 'justify-center gap-10' : '')
	const itemBase = $derived(
		position === 'top'
			? '-mt-px border-t-2 px-1 py-3.5 text-meta'
			: 'flex-1 border-b-2 py-4 text-center text-body',
	)
</script>

<nav aria-label={label} class="flex {layout} {className}">
	{#each items as item (item.href)}
		<a
			href={item.href}
			aria-current={item.active ? 'page' : undefined}
			class="{itemBase} no-underline {item.active
				? 'border-primary font-semibold text-fg'
				: 'border-transparent text-fg-muted'}">{item.label}</a
		>
	{/each}
</nav>
