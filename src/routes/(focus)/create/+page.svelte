<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { page } from '$app/state'
	import { initialPostType } from '$lib/create/initial-post-type'
	import Composer from '$lib/components/create/Composer.svelte'
	let { data, form } = $props()
</script>

<svelte:head><title>{$_('create.title')} · {$_('app.name')}</title></svelte:head>
<Composer
	me={data.me}
	error={form?.error}
	initialType={initialPostType(page.url.searchParams.get('type'))}
/>
