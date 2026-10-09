<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart'
	import MessageCircle from '@lucide/svelte/icons/message-circle'
	import { _, locale } from 'svelte-i18n'
	import type { Post, UserSummary } from '$lib/contract'
	import Avatar from '$lib/components/ui/Avatar.svelte'

	let {
		postId,
		activity,
		reel = false,
	}: { postId: string; activity: Post['activity']; reel?: boolean } = $props()

	function names(users: UserSummary[]) {
		return new Intl.ListFormat($locale ?? 'en', { type: 'conjunction' }).format(
			users.map((user) => user.displayName),
		)
	}
</script>

{#if activity?.likedBy.length || activity?.commentedBy.length}
	<div class="grid gap-2" aria-label={$_('post.activity')}>
		{#each [{ kind: 'like', users: activity?.likedBy ?? [], href: `/p/${postId}/likes` }, { kind: 'comment', users: activity?.commentedBy ?? [], href: `/p/${postId}#comments` }] as group (group.kind)}
			{#if group.users.length}
				<div
					data-activity={group.kind}
					class="flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 {reel
						? 'border-white/20 bg-black/55 text-white'
						: 'border-line bg-elevated/70 text-fg'}"
				>
					<div class="relative flex shrink-0 items-center pr-2">
						{#each group.users as user (user.id)}
							<a
								href="/u/{user.username}"
								aria-label={user.displayName}
								class="-mr-2 inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							>
								<Avatar {user} size={28} class="ring-2 {reel ? 'ring-black' : 'ring-surface'}" />
							</a>
						{/each}
						<span
							class="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-surface text-white {group.kind ===
							'like'
								? 'bg-accent'
								: 'bg-primary'}"
							aria-hidden="true"
						>
							{#if group.kind === 'like'}<Heart
									size={11}
									fill="currentColor"
								/>{:else}<MessageCircle size={11} fill="currentColor" />{/if}
						</span>
					</div>
					<a
						href={group.href}
						class="min-w-0 flex-1 text-sm leading-snug font-medium no-underline hover:underline {reel
							? 'text-white'
							: 'text-fg'}"
					>
						{$_(group.kind === 'like' ? 'post.activityLiked' : 'post.activityCommented', {
							values: { names: names(group.users) },
						})}
					</a>
				</div>
			{/if}
		{/each}
	</div>
{/if}
