/**
 * SEO Optimization Feature Blueprint
 * 
 * Multilingual SEO with hreflang and metadata
 */

import { Blueprint } from '../../../../types/adapter.js';

const seoOptimizationBlueprint: Blueprint = {
  id: 'next-intl-seo-optimization',
  name: 'SEO Optimization',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/seo.ts',
      content: `import { Metadata } from 'next';
import { routing } from '../i18n/routing';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export function generateMetadata(
  config: SEOConfig,
  locale: string = routing.defaultLocale
): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  const localeUrl = locale === routing.defaultLocale 
    ? baseUrl 
    : \`\${baseUrl}/\${locale}\`;

  const metadata: Metadata = {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    authors: config.author ? [{ name: config.author }] : undefined,
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.url || localeUrl,
      siteName: '{{project.name}}',
      images: config.image ? [
        {
          url: config.image,
          width: 1200,
          height: 630,
          alt: config.title,
        }
      ] : undefined,
      locale: locale,
      type: config.type || 'website',
      publishedTime: config.publishedTime,
      modifiedTime: config.modifiedTime,
      section: config.section,
      tags: config.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: config.image ? [config.image] : undefined,
    },
    {{#if module.parameters.canonicalUrls}}
    alternates: {
      canonical: config.url || localeUrl,
    },
    {{/if}}
  };

  return metadata;
}

export function generateHreflangTags(
  currentPath: string,
  locales: string[] = routing.locales
): Array<{ rel: string; href: string; hrefLang: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  const hreflangTags: Array<{ rel: string; href: string; hrefLang: string }> = [];

  locales.forEach(locale => {
    const localeUrl = locale === routing.defaultLocale
      ? \`\${baseUrl}\${currentPath}\`
      : \`\${baseUrl}/\${locale}\${currentPath}\`;

    hreflangTags.push({
      rel: 'alternate',
      href: localeUrl,
      hrefLang: locale
    });
  });

  // Add x-default for the default locale
  const defaultUrl = \`\${baseUrl}\${currentPath}\`;
  hreflangTags.push({
    rel: 'alternate',
    href: defaultUrl,
    hrefLang: 'x-default'
  });

  return hreflangTags;
}

export function generateStructuredData(
  config: SEOConfig,
  locale: string = routing.defaultLocale
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': config.type === 'article' ? 'Article' : 'WebSite',
    name: config.title,
    description: config.description,
    url: config.url || \`\${baseUrl}/\${locale}\`,
    inLanguage: locale,
    ...(config.type === 'article' && {
      headline: config.title,
      author: {
        '@type': 'Person',
        name: config.author || '{{project.name}}'
      },
      datePublished: config.publishedTime,
      dateModified: config.modifiedTime,
      section: config.section,
      keywords: config.tags?.join(', ')
    }),
    ...(config.type === 'product' && {
      name: config.title,
      description: config.description,
      image: config.image
    })
  };

  return structuredData;
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/seo/SEOHead.tsx',
      content: `import React from 'react';
import { generateHreflangTags, generateStructuredData, SEOConfig } from '../../lib/seo.js';

interface SEOHeadProps {
  config: SEOConfig;
  locale: string;
  currentPath: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ config, locale, currentPath }) => {
  const hreflangTags = generateHreflangTags(currentPath);
  const structuredData = generateStructuredData(config, locale);

  return (
    <>
      {/* Hreflang tags */}
      {hreflangTags.map((tag, index) => (
        <link
          key={index}
          rel={tag.rel}
          href={tag.href}
          hrefLang={tag.hrefLang}
        />
      ))}
      
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
    </>
  );
};`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/hooks/useSEO.ts',
      content: `import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { generateMetadata, generateHreflangTags, SEOConfig } from '../lib/seo.js';

export function useSEO(config: SEOConfig) {
  const locale = useLocale();
  const pathname = usePathname();

  const metadata = generateMetadata(config, locale);
  const hreflangTags = generateHreflangTags(pathname);

  return {
    metadata,
    hreflangTags,
    locale,
    pathname
  };
}

export function usePageSEO(
  title: string,
  description: string,
  options?: Partial<SEOConfig>
) {
  const config: SEOConfig = {
    title,
    description,
    ...options
  };

  return useSEO(config);
}`
    }
  ]
};
export default seoOptimizationBlueprint;
