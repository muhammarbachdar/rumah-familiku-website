import { getRequestConfig } from 'next-intl/server';

const locales = ['id', 'en'] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as any)) {
    locale = 'id';
  }

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});