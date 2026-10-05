<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Composer from '$lib/components/create/Composer.svelte'
	let { data, form } = $props()
</script>

<svelte:head><title>{$_('story.add')} · {$_('app.name')}</title></svelte:head>
<Composer me={data.me} error={form?.error} initialType="story" lockType />
