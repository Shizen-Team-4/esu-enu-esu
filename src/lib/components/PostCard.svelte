<script lang="ts">
	import { _ } from 'svelte-i18n'
	import type { Post } from '$lib/contract'
	let { post, interactive = false }: { post: Post; interactive?: boolean } = $props()
</script>

<article class="panel">
	<header><strong>{post.author.displayName}</strong><span>@{post.author.username}</span></header>
	<p>{post.caption}</p>
	{#if post.media.length}
		<div class="gallery">
			{#each post.media as media (media.id)}
				{#if media.type === 'image'}<img
						src={media.url}
						width={media.width}
						height={media.height}
						alt=""
						loading="lazy"
					/>
				{:else}<video
						src={media.url}
						poster={media.thumbnailUrl ?? undefined}
						width={media.width}
						height={media.height}
						controls
						preload="metadata"><track kind="captions" /></video
					>{/if}
			{/each}
		</div>
	{/if}
	<footer>
		{#if interactive}
			<form method="POST" action="?/like">
				<input type="hidden" name="id" value={post.id} /><input
					type="hidden"
					name="active"
					value={String(!post.viewer.liked)}
				/><button aria-pressed={post.viewer.liked}>{$_('post.like')} · {post.counts.likes}</button>
			</form>
		{:else}<span>{$_('post.like')} · {post.counts.likes}</span>{/if}
		<a class="button" href={post.shareUrl}>{$_('post.share')}</a>
	</footer>
</article>

<style>
	article {
		min-width: 0;
		container-type: inline-size;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	p {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		line-height: 1.6;
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}
	.gallery {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 100%;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
	}
	img,
	video {
		width: 100%;
		max-height: 35rem;
		object-fit: contain;
		scroll-snap-align: start;
	}
</style>
