<script lang="ts">
	import { _ } from 'svelte-i18n'
	import PageBar from '$lib/components/ui/PageBar.svelte'
	import EditProfileForm from '$lib/components/settings/EditProfileForm.svelte'

	let { data, form } = $props()
</script>

<svelte:head><title>{$_('editProfile.title')} · {$_('app.name')}</title></svelte:head>
<PageBar title={$_('editProfile.title')} />
<div class="px-gutter py-6">
	<div class="mx-auto max-w-[520px] border border-line bg-surface p-[18px] md:p-[22px]">
		<EditProfileForm profile={data.profile} {form} />
	</div>
</div>
