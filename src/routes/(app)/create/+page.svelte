<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { page } from '$app/state'
	import { initialPostType } from '$lib/create/initial-post-type'
	import Composer from '$lib/components/Composer.svelte'
	let { form } = $props()
</script>

<svelte:head><title>{$_('nav.create')} · {$_('app.name')}</title></svelte:head>
<div class="py-4">
	<h1 class="mb-6 text-title font-semibold">{$_('nav.create')}</h1>
	<Composer error={form?.error} initialType={initialPostType(page.url.searchParams.get('type'))} />
</div>
