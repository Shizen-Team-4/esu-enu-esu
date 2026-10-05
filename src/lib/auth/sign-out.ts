import { readApiError } from '$lib/api/api-error'

export async function signOut(fetchFn: typeof globalThis.fetch = globalThis.fetch): Promise<void> {
	const response = await fetchFn('/api/auth/sign-out', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: '{}',
	})
	if (!response.ok) throw await readApiError(response)
}
