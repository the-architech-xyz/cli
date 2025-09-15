import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the \`[locale]\` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  const supportedLocales = en,fr,es;
  const defaultLocale = 'en';
  
  if (!locale || !supportedLocales.includes(locale as string)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(\`../messages/\${locale}.json\`)).default
  };
});
