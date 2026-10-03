<script lang="ts">
	import type { UserSummary } from '$lib/types/user'
	import { initials } from '$lib/users/initials'
	import { cn } from '$lib/ui/class-names'

	let {
		user,
		size = 40,
		class: className,
	}: { user: UserSummary; size?: number; class?: string } = $props()

	let failed = $state(false)
	const showImage = $derived(user.avatarUrl !== null && !failed)
</script>

<span
	class={cn(
		'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground',
		className,
	)}
	style:width="{size}px"
	style:height="{size}px"
>
	{#if showImage}
		<img
			src={user.avatarUrl}
			alt={user.displayName}
			class="size-full object-cover"
			onerror={() => (failed = true)}
		/>
	{:else}
		<span role="img" aria-label={user.displayName}>{initials(user.displayName)}</span>
	{/if}
</span>
