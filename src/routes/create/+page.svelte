<script lang="ts">
	import { _ } from 'svelte-i18n'
	import Composer from '$lib/components/Composer.svelte'
	let { form } = $props()
</script>

<svelte:head><title>{$_('nav.create')}</title></svelte:head>
<main class="container">
	<h1 class="mb-6 text-3xl font-semibold">{$_('nav.create')}</h1>
	<Composer error={form?.error} />
</main>
