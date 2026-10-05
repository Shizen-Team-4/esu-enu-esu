<script lang="ts">
	import { locale } from 'svelte-i18n'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import type { Post } from '$lib/contract'
	import { relativeTime } from '$lib/format/relative-time'

	let { post }: { post: Post } = $props()
	const profileHref = $derived(`/u/${encodeURIComponent(post.author.username)}`)
	let now = $state(new Date())
	$effect(() => {
		const id = setInterval(() => {
			now = new Date()
		}, 60_000)
		return () => clearInterval(id)
	})
	const when = $derived(relativeTime(post.createdAt, now, $locale ?? 'en'))
</script>

<header class="flex items-center gap-3 px-3 py-3">
	<Avatar src={post.author.avatarUrl} name={post.author.displayName} />
	<div class="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-body">
		<a href={profileHref} class="truncate font-semibold text-fg no-underline"
			>{post.author.displayName}</a
		>
		<span class="text-meta text-fg-muted"
			>· <a href="/p/{post.id}" class="text-fg-muted no-underline"
				><time datetime={post.createdAt}>{when}</time></a
			></span
		>
		<a href={profileHref} class="truncate text-meta text-fg-muted no-underline"
			>@{post.author.username}</a
		>
	</div>
</header>
