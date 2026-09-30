import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Outputs to .svelte-kit/cloudflare — matches `main` / `assets` in wrangler.jsonc.
		// In `vite dev`, bindings (DB, KV) are emulated from wrangler.jsonc via platformProxy.
		adapter: adapter(),
	},
}

export default config
