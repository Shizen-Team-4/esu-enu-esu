<script lang="ts">
	import { _ } from 'svelte-i18n'
	import { fieldErrorKey } from '$lib/errors/error-message'
	let { code, id }: { code?: string | null; id: string } = $props()
</script>

{#if code}<p {id} role="alert" class="text-sm text-danger">{$_(fieldErrorKey(code))}</p>{/if}
