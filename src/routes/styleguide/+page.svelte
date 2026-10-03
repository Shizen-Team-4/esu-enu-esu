<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart'
	import Search from '@lucide/svelte/icons/search'
	import { _ } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Divider from '$lib/components/ui/Divider.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import ErrorState from '$lib/components/ui/ErrorState.svelte'
	import Icon from '$lib/components/ui/Icon.svelte'
	import IconButton from '$lib/components/ui/IconButton.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import TextField from '$lib/components/ui/TextField.svelte'
	import { mockErrors } from '$lib/mocks/errors'
	import { mockUsers } from '$lib/mocks/users'
	import type { ErrorCode } from '$lib/types/error'

	const variants = ['primary', 'secondary', 'ghost', 'destructive'] as const
	const withAvatar = mockUsers.find((user) => user.avatarUrl !== null) ?? mockUsers[0]
	const withoutAvatar = mockUsers.find((user) => user.avatarUrl === null) ?? mockUsers[0]
	const errorCodes = Object.keys(mockErrors) as ErrorCode[]

	let liked = $state(false)
	let email = $state('')
	let retries = $state(0)
</script>

<main class="mx-auto flex max-w-2xl flex-col gap-8 p-4">
	<h1 class="text-2xl font-semibold">Styleguide</h1>
	<a href="/styleguide/layout" class="underline">Layout (AppShell, header, bottom nav)</a>
	<a href="/styleguide/posts" class="underline">Posts (PostCard, gallery, video, reels)</a>

	<section class="flex flex-col gap-3" aria-labelledby="buttons">
		<h2 id="buttons" class="text-lg font-medium">Button</h2>
		<div class="flex flex-wrap gap-2">
			{#each variants as variant (variant)}
				<Button {variant}>{variant}</Button>
			{/each}
		</div>
		<div class="flex flex-wrap gap-2">
			{#each variants as variant (variant)}
				<Button {variant} loading>{variant} loading</Button>
			{/each}
		</div>
		<div class="flex flex-wrap gap-2">
			{#each variants as variant (variant)}
				<Button {variant} disabled>{variant} disabled</Button>
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
			<Button href="/styleguide" variant="secondary">Link</Button>
		</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="icons">
		<h2 id="icons" class="text-lg font-medium">Icon and IconButton</h2>
		<div class="flex items-center gap-2">
			<Icon icon={Search} />
			<Icon icon={Heart} label="Heart" class="text-destructive" />
			<IconButton
				icon={Heart}
				label={liked ? 'Unlike' : 'Like'}
				pressed={liked}
				onclick={() => (liked = !liked)}
			/>
			<IconButton icon={Search} label="Search disabled" disabled />
		</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="fields">
		<h2 id="fields" class="text-lg font-medium">TextField</h2>
		<TextField label="Email" type="email" bind:value={email} helpText="We never share it" />
		<TextField label="Username (error)" error="TAKEN" value="dara" />
		<TextField label="Password (required error)" type="password" error="REQUIRED" />
		<TextField label="Disabled" disabled value="Read only" />
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="avatars">
		<h2 id="avatars" class="text-lg font-medium">Avatar</h2>
		<div class="flex items-center gap-3">
			<Avatar user={withAvatar} size={32} />
			<Avatar user={withAvatar} size={48} />
			<Avatar user={withoutAvatar} size={48} />
			<Avatar user={withoutAvatar} size={72} />
		</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="dialog">
		<h2 id="dialog" class="text-lg font-medium">Dialog</h2>
		<div>
			<Dialog>
				{#snippet trigger()}Open dialog{/snippet}
				{#snippet title()}Delete this post?{/snippet}
				{#snippet description()}This cannot be undone.{/snippet}
				<Button variant="destructive">Delete</Button>
			</Dialog>
		</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="loading">
		<h2 id="loading" class="text-lg font-medium">Spinner</h2>
		<Spinner />
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="errors">
		<h2 id="errors" class="text-lg font-medium">ErrorState</h2>
		{#each errorCodes as code (code)}
			<ErrorState {code} onRetry={() => (retries += 1)} />
		{/each}
		<p class="text-sm text-muted-foreground">Retries: {retries}</p>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="empty">
		<h2 id="empty" class="text-lg font-medium">EmptyState</h2>
		<EmptyState title={$_('empty.posts')} description="Follow someone to see their posts." />
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="dividers">
		<h2 id="dividers" class="text-lg font-medium">Divider</h2>
		<Divider />
		<Divider variant="diagonal" />
	</section>
</main>
