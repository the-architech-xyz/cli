/**
 * Dynamic Imports Feature Blueprint
 * 
 * Lazy loading of translations and locale-specific content
 */

import { Blueprint } from '../../../../types/adapter.js';

const dynamicImportsBlueprint: Blueprint = {
  id: 'next-intl-dynamic-imports',
  name: 'Dynamic Imports',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/dynamic-translations.ts',
      content: `import { routing } from '../i18n/routing';

export interface TranslationCache {
  [locale: string]: {
    [namespace: string]: any;
  };
}

class DynamicTranslationManager {
  private cache: TranslationCache = {};
  private loadingPromises: { [key: string]: Promise<any> } = {};

  /**
   * Load translations for a specific locale and namespace
   */
  async loadTranslations(
    locale: string, 
    namespace: string = 'common'
  ): Promise<any> {
    const cacheKey = \`\${locale}:\${namespace}\`;
    
    // Return cached translations if available
    if (this.cache[locale]?.[namespace]) {
      return this.cache[locale][namespace];
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises[cacheKey]) {
      return this.loadingPromises[cacheKey];
    }

    // Start loading translations
    const loadingPromise = this.fetchTranslations(locale, namespace);
    this.loadingPromises[cacheKey] = loadingPromise;

    try {
      const translations = await loadingPromise;
      
      // Cache the translations
      if (!this.cache[locale]) {
        this.cache[locale] = {};
      }
      this.cache[locale][namespace] = translations;
      
      // Clean up loading promise
      delete this.loadingPromises[cacheKey];
      
      return translations;
    } catch (error) {
      // Clean up loading promise on error
      delete this.loadingPromises[cacheKey];
      throw error;
    }
  }

  /**
   * Fetch translations from the server
   */
  private async fetchTranslations(locale: string, namespace: string): Promise<any> {
    try {
      const response = await fetch(\`/api/translations/\${locale}/\${namespace}\`);
      if (!response.ok) {
        throw new Error(\`Failed to load translations for \${locale}/\${namespace}\`);
      }
      return await response.json();
    } catch (error) {
      // Fallback to static import
      try {
        const module = await import(\`../messages/\${locale}.json\`);
        return namespace === 'common' ? module.default : module.default[namespace];
      } catch (importError) {
        console.error('Failed to load translations:', importError);
        return {};
      }
    }
  }

  /**
   * Preload translations for better performance
   */
  async preloadTranslations(
    locales: string[] = routing.locales,
    namespaces: string[] = ['common']
  ): Promise<void> {
    const preloadPromises = locales.flatMap(locale =>
      namespaces.map(namespace => this.loadTranslations(locale, namespace))
    );

    await Promise.all(preloadPromises);
  }

  /**
   * Clear cache for a specific locale or all locales
   */
  clearCache(locale?: string): void {
    if (locale) {
      delete this.cache[locale];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get cached translations
   */
  getCachedTranslations(locale: string, namespace: string): any {
    return this.cache[locale]?.[namespace];
  }

  /**
   * Check if translations are cached
   */
  isCached(locale: string, namespace: string): boolean {
    return !!this.cache[locale]?.[namespace];
  }
}

// Global instance
export const dynamicTranslationManager = new DynamicTranslationManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/hooks/useDynamicTranslations.ts',
      content: `import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { dynamicTranslationManager } from '../lib/dynamic-translations.js';

export function useDynamicTranslations(namespace: string = 'common') {
  const locale = useLocale();
  const [translations, setTranslations] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTranslations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedTranslations = await dynamicTranslationManager.loadTranslations(
        locale,
        namespace
      );
      setTranslations(loadedTranslations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  }, [locale, namespace]);

  useEffect(() => {
    // Check if translations are already cached
    const cachedTranslations = dynamicTranslationManager.getCachedTranslations(
      locale,
      namespace
    );

    if (cachedTranslations) {
      setTranslations(cachedTranslations);
    } else {
      loadTranslations();
    }
  }, [locale, namespace, loadTranslations]);

  const refreshTranslations = useCallback(() => {
    dynamicTranslationManager.clearCache(locale);
    loadTranslations();
  }, [locale, loadTranslations]);

  return {
    translations,
    loading,
    error,
    refreshTranslations,
    isCached: dynamicTranslationManager.isCached(locale, namespace)
  };
}

export function usePreloadTranslations() {
  const [preloading, setPreloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preload = useCallback(async (
    locales?: string[],
    namespaces?: string[]
  ) => {
    setPreloading(true);
    setError(null);

    try {
      await dynamicTranslationManager.preloadTranslations(locales, namespaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preload translations');
    } finally {
      setPreloading(false);
    }
  }, []);

  return {
    preload,
    preloading,
    error
  };
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/i18n/DynamicTranslationProvider.tsx',
      content: `import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { dynamicTranslationManager } from '../../lib/dynamic-translations.js';

interface DynamicTranslationContextType {
  translations: { [namespace: string]: any };
  loading: boolean;
  error: string | null;
  loadNamespace: (namespace: string) => Promise<void>;
  isNamespaceLoaded: (namespace: string) => boolean;
}

const DynamicTranslationContext = createContext<DynamicTranslationContextType | null>(null);

interface DynamicTranslationProviderProps {
  children: React.ReactNode;
  preloadNamespaces?: string[];
}

export const DynamicTranslationProvider: React.FC<DynamicTranslationProviderProps> = ({
  children,
  preloadNamespaces = ['common']
}) => {
  const locale = useLocale();
  const [translations, setTranslations] = useState<{ [namespace: string]: any }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNamespace = async (namespace: string) => {
    if (translations[namespace]) return; // Already loaded

    setLoading(true);
    setError(null);

    try {
      const namespaceTranslations = await dynamicTranslationManager.loadTranslations(
        locale,
        namespace
      );
      setTranslations(prev => ({
        ...prev,
        [namespace]: namespaceTranslations
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const isNamespaceLoaded = (namespace: string) => {
    return !!translations[namespace];
  };

  // Preload specified namespaces on mount
  useEffect(() => {
    const preloadPromises = preloadNamespaces.map(namespace => loadNamespace(namespace));
    Promise.all(preloadPromises);
  }, [locale]); // Re-run when locale changes

  const contextValue: DynamicTranslationContextType = {
    translations,
    loading,
    error,
    loadNamespace,
    isNamespaceLoaded
  };

  return (
    <DynamicTranslationContext.Provider value={contextValue}>
      {children}
    </DynamicTranslationContext.Provider>
  );
};

export const useDynamicTranslationContext = () => {
  const context = useContext(DynamicTranslationContext);
  if (!context) {
    throw new Error('useDynamicTranslationContext must be used within DynamicTranslationProvider');
  }
  return context;
};

export const useDynamicT = (namespace: string) => {
  const { translations, loadNamespace, isNamespaceLoaded } = useDynamicTranslationContext();
  
  useEffect(() => {
    if (!isNamespaceLoaded(namespace)) {
      loadNamespace(namespace);
    }
  }, [namespace, loadNamespace, isNamespaceLoaded]);

  const t = (key: string, values?: any) => {
    const namespaceTranslations = translations[namespace];
    if (!namespaceTranslations) return key;

    const keys = key.split('.');
    let value = namespaceTranslations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }

    if (typeof value === 'string' && values) {
      return value.replace(/\\{\\{([^}]+)\\}\\}/g, (match, key) => {
        return values[key] || match;
      });
    }

    return value || key;
  };

  return t;
};`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/translations/[locale]/[namespace]/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { routing } from '../../../../i18n/routing';

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string; namespace: string } }
) {
  const { locale, namespace } = params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    return NextResponse.json(
      { error: 'Invalid locale' },
      { status: 400 }
    );
  }

  try {
    // Try to load the specific namespace
    const messages = await import(\`../../../../messages/\${locale}.json\`);
    const translations = namespace === 'common' 
      ? messages.default 
      : messages.default[namespace];

    if (!translations) {
      return NextResponse.json(
        { error: 'Namespace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(translations);
  } catch (error) {
    console.error('Error loading translations:', error);
    return NextResponse.json(
      { error: 'Failed to load translations' },
      { status: 500 }
    );
  }
}`
    }
  ]
};
export default dynamicImportsBlueprint;
