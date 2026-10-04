<script lang="ts">
	import { enhance } from '$app/forms'
	let { id, pending }: { id: string; pending: boolean } = $props()
	let formElement: HTMLFormElement
	$effect(() => {
		if (pending) formElement.requestSubmit()
	})
</script>

<form
	bind:this={formElement}
	method="POST"
	action="?/seen"
	hidden
	use:enhance={() => async () => {}}
>
	<input type="hidden" name="id" value={id} />
</form>
