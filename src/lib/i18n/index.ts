import { register, init } from 'svelte-i18n';
import { DEFAULT_LANG } from './config';

register('en', () => import('./locales/en.json'));
register('km', () => import('./locales/km.json'));
register('ja', () => import('./locales/ja.json'));

init({ fallbackLocale: DEFAULT_LANG, initialLocale: DEFAULT_LANG });