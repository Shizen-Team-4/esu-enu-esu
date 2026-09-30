import type { LayoutLoad } from './$types';
import '$lib/i18n'; // Initializes svelte-i18n registrations
import { locale, waitLocale } from 'svelte-i18n';

export const load: LayoutLoad = async ({ data }) => {
  locale.set(data.lang);
  await waitLocale();
  return {
    lang: data.lang
  };
};