import type { Handle } from '@sveltejs/kit';
import { parseAcceptLanguage } from '$lib/i18n/accept-language';

const SUPPORTED_LOCALES = ['en', 'km', 'ja'] as const;
const DEFAULT_LOCALE = 'en';

export const handle: Handle = async ({ event, resolve }) => {
  const acceptLanguage = event.request.headers.get('accept-language');

  const detectedLang = parseAcceptLanguage(acceptLanguage, SUPPORTED_LOCALES);
  const lang = detectedLang ?? DEFAULT_LOCALE;

  event.locals.lang = lang;

  console.log('Accept-Language Header:', acceptLanguage);
  console.log('Detected Language:', detectedLang);

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', lang)
  });
};