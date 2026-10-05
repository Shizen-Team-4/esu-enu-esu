<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { UserSummary } from '$lib/contract'
	import type { ComposerType } from '$lib/create/initial-post-type'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte'
	let {
		me,
		type = $bindable(),
		locked,
	}: { me: UserSummary | null; type: ComposerType; locked: boolean } = $props()

	const options = $derived([
		{ value: 'post', label: $_('create.post') },
		{ value: 'reel', label: $_('create.reel') },
		{ value: 'story', label: $_('create.story') },
	])
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
	{#if me}
		<div class="flex items-center gap-3">
			<Avatar user={me} />
			<div class="grid leading-tight">
				<span class="font-semibold text-fg">{me.displayName}</span>
				<span class="text-meta text-fg-muted">@{me.username}</span>
			</div>
		</div>
	{/if}
	<fieldset
		disabled={locked}
		class="m-0 border-0 p-0"
		title={locked ? $_('create.typeLocked') : undefined}
	>
		<SegmentedControl name="composer-type" label={$_('post.type')} {options} bind:value={type} />
	</fieldset>
</div>
