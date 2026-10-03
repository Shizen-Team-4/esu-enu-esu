<script lang="ts">
	type Name = 'heart' | 'comment' | 'bookmark' | 'share'
	let { name, filled = false }: { name: Name; filled?: boolean } = $props()

	const paths: Record<Name, string> = {
		heart:
			'M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.5 11.8 19.5 16.4 12 21 12 21z',
		comment: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.6A8 8 0 1 1 21 12z',
		bookmark: 'M6 3h12v18l-6-4-6 4z',
		share: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
	}
</script>

<svg
	width="22"
	height="22"
	viewBox="0 0 24 24"
	fill={filled ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"><path d={paths[name]} /></svg
>
