import { createRawSnippet } from 'svelte'

/** Snippet that renders plain text; lets tests pass `children`-style props. */
export const textSnippet = (text: string) =>
	createRawSnippet(() => ({ render: () => `<span>${text}</span>` }))
