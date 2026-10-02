import { isSupported, type Lang } from '$lib/i18n/config'

export function validateLanguageInput(
	body: unknown,
): { ok: true; lang: Lang } | { ok: false; error: string } {
	if (typeof body !== 'object' || body === null || !('language' in body)) {
		return { ok: false, error: 'Missing "language" field' }
	}
	const lang = (body as { language: unknown }).language
	if (!isSupported(lang)) {
		return { ok: false, error: `Unsupported language code: ${lang}` }
	}
	return { ok: true, lang }
}
