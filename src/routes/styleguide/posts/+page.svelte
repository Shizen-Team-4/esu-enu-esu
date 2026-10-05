<script lang="ts">
	import PostCard from '$lib/components/post/PostCard.svelte'
	import Divider from '$lib/components/ui/Divider.svelte'
	import { mockPosts } from '$lib/mocks/posts'
	import { mediaOrientation } from '$lib/posts/aspect-ratio'
	import type { Media } from '$lib/types/media'
	import type { Post } from '$lib/types/post'

	/** The sample CDN URLs do not exist; use the local placeholder files for the preview. */
	function localImage({ width, height }: Pick<Media, 'width' | 'height'>): string {
		const orientation = mediaOrientation(width, height)
		if (orientation === 'square') return '/samples/square-1x1.svg'
		if (orientation === 'landscape') return '/samples/landscape-16x9.svg'
		return width / height < 0.7 ? '/samples/portrait-9x16.svg' : '/samples/portrait-4x5.svg'
	}

	function localize(post: Post): Post {
		return {
			...post,
			media: post.media.map((media) =>
				media.type === 'image'
					? { ...media, url: localImage(media) }
					: { ...media, thumbnailUrl: localImage(media) },
			),
		}
	}

	const ratioCheck = (id: string, type: Post['type'], width: number, height: number): Post => ({
		...mockPosts[0],
		id,
		type,
		caption: `${width}:${height} placeholder`,
		media: [
			{
				id: `${id}_media`,
				type: 'image',
				url: localImage({ width, height }),
				thumbnailUrl: null,
				width,
				height,
				durationSec: null,
			},
		],
	})

	const longCaption = {
		...mockPosts[6],
		id: 'pst_long',
		caption: 'A very long caption. '.repeat(20),
	}

	const posts = $state<Post[]>([...mockPosts, longCaption].map(localize))
	const checks = $state<Post[]>([
		ratioCheck('check_9x16', 'reel', 1080, 1920),
		ratioCheck('check_1x1', 'post', 1080, 1080),
		ratioCheck('check_16x9', 'post', 1920, 1080),
	])
	let lastMenuAction = $state('none')

	function toggleLike(post: Post) {
		post.viewer.liked = !post.viewer.liked
		post.counts.likes += post.viewer.liked ? 1 : -1
	}
</script>

<main class="mx-auto max-w-md pb-8">
	<h1 class="p-4 text-2xl font-semibold">Posts</h1>
	<p class="px-4 text-sm text-muted-foreground" data-testid="menu-action">
		Last menu action: {lastMenuAction}
	</p>

	<h2 class="p-4 text-lg font-medium">Sample posts</h2>
	{#each posts as post (post.id)}
		<PostCard
			{post}
			now={new Date('2026-10-02T12:00:00.000Z')}
			onLike={() => toggleLike(post)}
			onSave={() => (post.viewer.saved = !post.viewer.saved)}
			onMenuAction={(action) => (lastMenuAction = `${action} (${post.id})`)}
		/>
		<Divider variant="diagonal" />
	{/each}

	<h2 class="p-4 text-lg font-medium">Ratio checks (9:16, 1:1, 16:9)</h2>
	{#each checks as post (post.id)}
		<PostCard {post} onLike={() => toggleLike(post)} />
		<Divider variant="diagonal" />
	{/each}
</main>
