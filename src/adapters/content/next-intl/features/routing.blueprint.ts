/**
 * Internationalized Routing Feature Blueprint
 * 
 * Locale-based routing with pathname translations
 */

import { Blueprint } from '../../../../types/adapter.js';

const routingBlueprint: Blueprint = {
  id: 'next-intl-routing',
  name: 'Internationalized Routing',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/i18n/routing.ts',
      content: `import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: {{module.parameters.locales}},

  // Used when no locale matches
  defaultLocale: '{{module.parameters.defaultLocale}}',

  {{#if module.parameters.pathnames}}
  // The \`pathnames\` object holds pairs of internal and
  // external paths. Based on the locale, the external
  // paths are rewritten to the shared, internal ones.
  pathnames: {
    // If all locales use the same pathname, a
    // single external pathname can be provided.
    '/': '/',
    '/about': '/about',
    '/contact': '/contact',
    '/pricing': '/pricing',
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    
    // If locales use different pathnames, you can
    // specify each external pathname per locale.
    '/products': {
      en: '/products',
      fr: '/produits',
      es: '/productos',
      de: '/produkte',
      it: '/prodotti',
      pt: '/produtos',
      ja: '/製品',
      ko: '/제품',
      zh: '/产品'
    },
    
    '/dashboard': {
      en: '/dashboard',
      fr: '/tableau-de-bord',
      es: '/panel',
      de: '/dashboard',
      it: '/dashboard',
      pt: '/painel',
      ja: '/ダッシュボード',
      ko: '/대시보드',
      zh: '/仪表板'
    }
  }
  {{/if}}
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);`
    },
    {
      type: 'CREATE_FILE',
      path: 'middleware.ts',
      content: `import createMiddleware from 'next-intl/middleware';
import {routing} from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/({{module.parameters.locales.join('|')}})/:path*']
};`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/i18n/language-switcher.tsx',
      content: `'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
    router.push(\`/\${newLocale}\${pathWithoutLocale}\`);
  };

  const supportedLanguages = languages.filter(lang => 
    {{module.parameters.locales}}.includes(lang.code)
  );

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Select Language</h3>
        <div className="grid grid-cols-3 gap-2">
          {supportedLanguages.map((language) => (
            <Button
              key={language.code}
              variant={locale === language.code ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange(language.code)}
              className="flex flex-col items-center p-2 h-auto"
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-xs mt-1">{language.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}`
    }
  ]
};
export default routingBlueprint;
