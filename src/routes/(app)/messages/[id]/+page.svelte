<script lang="ts">
	import { _ } from 'svelte-i18n'
	import ConversationView from '$lib/components/messages/ConversationView.svelte'
	let { data } = $props()
</script>

<svelte:head
	><title>{data.thread.conversation.peer.displayName} · {$_('nav.messages')}</title></svelte:head
>
{#key data.thread.conversation.id}<ConversationView
		initial={data.thread}
		viewerId={data.me!.id}
		draftId={data.draftId}
	/>{/key}
