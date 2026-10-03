<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { uploadFile } from '$lib/media/upload-file'
	let ids = $state<string[]>([])
	let pending = $state(false)
	let failed = $state(false)
	let type = $state<'post' | 'reel' | 'story'>('post')
	async function choose(event: Event) {
		const files = [...((event.currentTarget as HTMLInputElement).files ?? [])]
		pending = true
		failed = false
		ids = []
		try {
			if (files.length > (type === 'post' ? 10 : 1)) throw new Error('Too many files')
			for (const file of files) ids = [...ids, (await uploadFile(file, type)).id]
		} catch {
			failed = true
			ids = []
		} finally {
			pending = false
		}
	}
</script>

<section class="panel" id="create">
	<form method="POST" action={type === 'story' ? '?/story' : '?/post'} class="grid gap-4">
		<label class="grid gap-2"
			>{$_('post.type')}<select bind:value={type} disabled={pending || ids.length > 0}
				><option value="post">{$_('profile.posts')}</option><option value="reel"
					>{$_('nav.reels')}</option
				><option value="story">{$_('story.title')}</option></select
			></label
		>
		<input type="hidden" name="type" value={type} />
		{#if type !== 'story'}<label class="grid gap-2"
				>{$_('post.caption')}<textarea
					name="caption"
					rows="4"
					required={ids.length === 0}
					class="w-full resize-y rounded-xl border border-line p-3"></textarea></label
			>{/if}
		<label class="grid gap-2"
			>{$_('post.media')}<input
				type="file"
				accept={type === 'reel'
					? 'video/mp4,video/webm'
					: 'image/jpeg,image/png,image/webp,video/mp4,video/webm'}
				multiple={type === 'post'}
				disabled={pending}
				onchange={choose}
			/></label
		>
		{#each ids as id}<input type="hidden" name="mediaId" value={id} />{/each}
		{#if type === 'story'}<p class="text-fg-muted">{$_('story.expires')}</p>{/if}
		{#if pending}<p role="status">{$_('post.uploading')}</p>{/if}
		{#if failed}<p role="alert">{$_('post.uploadError')}</p>{/if}
		<button type="submit" disabled={pending || failed || (type !== 'post' && ids.length !== 1)}
			>{$_('post.publish')}</button
		>
	</form>
</section>
