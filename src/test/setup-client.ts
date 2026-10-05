import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/svelte'
import { addMessages, init } from 'svelte-i18n'
import { afterEach } from 'vitest'
import en from '../lib/i18n/locales/en.json'

addMessages('en', en)
init({ fallbackLocale: 'en', initialLocale: 'en' })

afterEach(() => {
	cleanup()
	// Bits UI locks the body (pointer-events/scroll) while a layer is open and
	// restores it asynchronously; reset it so a test cannot affect the next one.
	document.body.removeAttribute('style')
})
