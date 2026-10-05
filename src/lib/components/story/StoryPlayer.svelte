<script lang="ts">
	import { onMount } from 'svelte'
	import { enhance } from '$app/forms'
	import { _ } from 'svelte-i18n'
	import type { Story } from '$lib/contract'
	import Avatar from '$lib/components/ui/Avatar.svelte'
	import StorySeenForm from '$lib/components/StorySeenForm.svelte'
	import StoryAudience from './StoryAudience.svelte'
	import { IMAGE_STORY_MS, storyProgress } from '$lib/story/progress'
	let {
		story,
		index,
		count,
		viewerId,
		next,
		previous,
	}: {
		story: Story
		index: number
		count: number
		viewerId: string
		next: () => void
		previous: () => void
	} = $props()
	let progress = $state(0)
	let ready = $state(false)
	let paused = $state(false)
	let audienceOpen = $state(false)
	let replying = $state(false)
	let reply = $state('')
	let muted = $state(true)
	let video = $state<HTMLVideoElement>()
	// svelte-ignore state_referenced_locally
	let liked = $state(story.viewer.liked)
	// svelte-ignore state_referenced_locally
	let likes = $state(story.likes)
	let views = $state(0)
	let replyId = `msg_${crypto.randomUUID().replaceAll('-', '')}`
	const isMe = $derived(story.author.id === viewerId)
	let elapsed = 0
	let lastTick = 0
	let expired = $state(false)
	function advance() {
		if (!expired) next()
	}
	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (audienceOpen) audienceOpen = false
			else window.location.href = '/'
		}
		if ((event.target as HTMLElement)?.closest('input, textarea, button')) return
		if (event.key === 'ArrowRight') advance()
		if (event.key === 'ArrowLeft') previous()
		if (event.key === ' ') {
			event.preventDefault()
			paused = !paused
		}
	}
	onMount(() => {
		if (isMe)
			void fetch(`/api/stories/${encodeURIComponent(story.id)}/viewers`)
				.then((response) => (response.ok ? response.json() : null))
				.then((result) => {
					if (
						result &&
						typeof result === 'object' &&
						'total' in result &&
						typeof result.total === 'number'
					)
						views = result.total
				})
				.catch(() => {})
		const timer = window.setInterval(() => {
			const now = Date.now(),
				delta = lastTick ? now - lastTick : 0
			lastTick = now
			if (Date.parse(story.expiresAt) <= now) {
				expired = true
				return
			}
			if (!ready || paused || audienceOpen || replying || document.hidden) return
			if (story.media.type === 'video' && video)
				progress = storyProgress(video.currentTime, video.duration || story.media.durationSec || 0)
			else {
				elapsed += delta
				progress = storyProgress(elapsed, IMAGE_STORY_MS)
			}
			if (progress >= 1) advance()
		}, 50)
		return () => window.clearInterval(timer)
	})
	$effect(() => {
		if (!video) return
		if (!ready || paused || audienceOpen || replying || document.hidden) video.pause()
		else
			void video.play().catch(() => {
				paused = true
			})
	})
</script>

<svelte:window onkeydown={onKey} />
<div class="story-stage">
	{#if expired}
		<div class="story-expired">
			<p>{$_('story.expired')}</p>
			<a href="/">{$_('story.backHome')}</a>
		</div>
	{:else}
		{#if index > 0}<button
				class="story-step story-step-prev"
				type="button"
				onclick={previous}
				aria-label={$_('story.previous')}>‹</button
			>{/if}
		<div class="story-canvas">
			{#if story.media.type === 'image'}
				<img
					src={story.media.url}
					width={story.media.width}
					height={story.media.height}
					alt=""
					onload={() => {
						ready = true
					}}
				/>
			{:else}
				<video
					bind:this={video}
					src={story.media.url}
					poster={story.media.thumbnailUrl ?? undefined}
					width={story.media.width}
					height={story.media.height}
					playsinline
					{muted}
					oncanplay={() => {
						ready = true
					}}
					onended={advance}><track kind="captions" /></video
				>
			{/if}
			{#if ready && !story.viewer.seen}<StorySeenForm id={story.id} pending />{/if}
			<div class="story-shade story-shade-top"></div>
			<div class="story-shade story-shade-bottom"></div>
			<div class="story-overlay-top">
				<div class="story-progress" aria-label={`${index + 1} / ${count}`}>
					{#each Array(count) as _, position}<span
							><i
								style:width={position < index
									? '100%'
									: position === index
										? `${progress * 100}%`
										: '0%'}
							></i></span
						>{/each}
				</div>
				<div class="story-topline">
					<Avatar user={story.author} size={32} /><a href="/u/{story.author.username}"
						>{story.author.username || story.author.displayName}</a
					><time datetime={story.createdAt}
						>{Math.max(0, Math.floor((Date.now() - Date.parse(story.createdAt)) / 3600000))}h</time
					>
					<div class="story-top-actions">
						{#if story.media.type === 'video'}<button
								type="button"
								onclick={() => {
									muted = !muted
								}}
								aria-label={$_(muted ? 'story.unmute' : 'story.mute')}>{muted ? '⌁' : '♪'}</button
							>{/if}
						<button
							type="button"
							onclick={() => {
								paused = !paused
							}}
							aria-label={$_(paused ? 'story.play' : 'story.pause')}>{paused ? '▶' : 'Ⅱ'}</button
						>
					</div>
				</div>
			</div>
			<div class="story-tap-zone story-tap-prev">
				<button
					type="button"
					onclick={previous}
					aria-label={$_('story.previous')}
					disabled={index === 0}
				></button>
			</div>
			<div class="story-tap-zone story-tap-next">
				<button type="button" onclick={advance} aria-label={$_('story.next')}></button>
			</div>
			<div class="story-bottom">
				{#if isMe}
					<button
						type="button"
						class="story-view-count"
						onclick={() => {
							audienceOpen = true
						}}
						aria-label={$_('story.views')}>◉ <span>{$_('story.views')} {views}</span></button
					>
					<div class="story-bottom-actions">
						<a href="/create/story" aria-label={$_('story.addAnother')}>＋</a>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={story.id} /><button
								type="submit"
								aria-label={$_('post.delete')}
								><svg
									viewBox="0 0 24 24"
									width="22"
									height="22"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7" /></svg
								></button
							>
						</form>
					</div>
				{:else}
					<form class="story-reply" method="POST" action="?/reply" use:enhance>
						<input type="hidden" name="storyId" value={story.id} /><input
							type="hidden"
							name="id"
							value={replyId}
						/>
						<input
							name="body"
							type="text"
							bind:value={reply}
							maxlength="1900"
							required
							placeholder={$_('story.reply')}
							aria-label={$_('story.reply')}
							onfocus={() => {
								replying = true
							}}
							onblur={() => {
								replying = false
							}}
						/>
						{#if reply.trim()}<button type="submit" aria-label={$_('messages.send')}>➤</button>{/if}
					</form>
					<form
						method="POST"
						action="?/love"
						use:enhance={() =>
							async ({ result }) => {
								if (result.type === 'success') {
									liked = !liked
									likes += liked ? 1 : -1
								}
							}}
					>
						<input type="hidden" name="id" value={story.id} /><input
							type="hidden"
							name="active"
							value={String(!liked)}
						/><button class:liked type="submit" aria-label={$_('story.love')} aria-pressed={liked}
							>♡<span class="sr-only">{likes}</span></button
						>
					</form>
				{/if}
			</div>
		</div>
		<button
			class="story-step story-step-next"
			type="button"
			onclick={advance}
			aria-label={$_('story.next')}>›</button
		>
	{/if}
</div>
{#if audienceOpen}<StoryAudience
		storyId={story.id}
		onclose={() => {
			audienceOpen = false
		}}
	/>{/if}
