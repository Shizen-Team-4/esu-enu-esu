export const SUPPORTED_LANGS = ['en', 'km', 'ja'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: Lang = 'en';

export function isSupported(code: unknown): code is Lang {
  return typeof code === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(code);
}