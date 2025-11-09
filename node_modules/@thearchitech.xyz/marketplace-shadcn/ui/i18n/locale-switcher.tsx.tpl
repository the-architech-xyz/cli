/**
 * Locale Switcher Component
 * 
 * Dropdown for switching languages
 */

'use client';

import { useTranslation } from '@/lib/i18n';
import { getLocaleConfig, getSupportedLocales } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation();
  const locales = getSupportedLocales();
  const currentConfig = getLocaleConfig(locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => {
          const config = getLocaleConfig(loc);
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc)}
              className={locale === loc ? 'bg-accent' : ''}
            >
              <span className="mr-2">{config.flag}</span>
              <span>{config.nativeName}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LocaleSwitcher;
