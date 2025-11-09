/**
 * Language Selector Component
 * 
 * Button group for switching languages
 */

'use client';

import { useTranslation } from '@/lib/i18n';
import { getLocaleConfig, getSupportedLocales } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const locales = getSupportedLocales();

  return (
    <div className="flex gap-2">
      {locales.map((loc) => {
        const config = getLocaleConfig(loc);
        const isActive = locale === loc;
        
        return (
          <Button
            key={loc}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLocale(loc)}
            className={cn(
              'transition-colors',
              isActive && 'bg-primary text-primary-foreground'
            )}
          >
            <span className="mr-2">{config.flag}</span>
            <span>{config.code.toUpperCase()}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default LanguageSelector;
