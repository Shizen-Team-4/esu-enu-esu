<script lang="ts">
	import { _ } from 'svelte-i18n'
</script>

<aside
	aria-hidden="true"
	class="hatch hidden flex-col items-center justify-center gap-8 bg-primary-soft p-10 md:flex"
>
	<div class="w-full max-w-sm border border-line bg-surface">
		<div class="flex items-center gap-3 p-4">
			<span class="size-10 shrink-0 rounded-full bg-primary-soft"></span>
			<div class="min-w-0">
				<p class="font-semibold">{$_('authShowcase.name')}</p>
				<p class="text-meta text-fg-muted">{$_('authShowcase.handle')}</p>
			</div>
		</div>
		<div class="hatch aspect-[4/3] border-y border-line"></div>
		<p class="p-4">{$_('authShowcase.caption')}</p>
	</div>
	<p class="max-w-sm text-center text-title font-semibold">{$_('authShowcase.tagline')}</p>
</aside>
