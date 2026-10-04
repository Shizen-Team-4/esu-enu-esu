<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import Navigation from '$lib/components/Navigation.svelte'
	import Sidebar from '$lib/components/Sidebar.svelte'
	import Toast from '$lib/components/ui/Toast.svelte'
	let { children, data } = $props()
</script>

<div class="min-h-dvh md:pl-rail lg:pl-0">
	<Header me={data.me} />
	<div
		class="mx-auto lg:grid lg:max-w-[calc(var(--spacing-sidebar)+var(--container-content)+var(--spacing-aside))] lg:grid-cols-[var(--spacing-sidebar)_minmax(0,1fr)_var(--spacing-aside)]"
	>
		<Sidebar me={data.me} />
		<main
			class="mx-auto min-h-[calc(100dvh-var(--spacing-app-header))] w-full max-w-content px-gutter pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8 lg:border-x lg:border-line"
		>
			{@render children()}
		</main>
		<div class="hidden lg:block" aria-hidden="true"></div>
	</div>
	<Navigation me={data.me} />
	<Toast />
</div>
