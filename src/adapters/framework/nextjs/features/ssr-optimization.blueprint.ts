/**
 * Next.js SSR Optimization Feature
 * 
 * Adds server-side rendering optimization and caching to Next.js
 */

import { Blueprint } from '../../../../types/adapter.js';

const ssrOptimizationBlueprint: Blueprint = {
  id: 'nextjs-ssr-optimization',
  name: 'Next.js SSR Optimization',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/ssr/cache.ts',
      content: `import { unstable_cache } from 'next/cache';

// Cache configuration
export const cacheConfig = {
  revalidate: 3600, // 1 hour
  tags: ['ssr-cache'],
};

// Generic cache wrapper
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  options: {
    revalidate?: number;
    tags?: string[];
  } = {}
) {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      revalidate: options.revalidate || cacheConfig.revalidate,
      tags: options.tags || cacheConfig.tags,
    }
  );
}

// Data fetching with caching
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: {
    revalidate?: number;
    tags?: string[];
  } = {}
): Promise<T> {
  const cachedFetch = createCachedFunction(
    async (url: string, options: RequestInit) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      return response.json();
    },
    'fetch-cache',
    cacheOptions
  );

  return cachedFetch(url, options);
}

// Database query caching
export function createCachedQuery<T extends any[], R>(
  queryFn: (...args: T) => Promise<R>,
  queryName: string,
  options: {
    revalidate?: number;
    tags?: string[];
  } = {}
) {
  return createCachedFunction(queryFn, \`query-\${queryName}\`, options);
}

// Cache invalidation utilities
export async function revalidateCache(tags: string[]) {
  const { revalidateTag } = await import('next/cache');
  
  for (const tag of tags) {
    revalidateTag(tag);
  }
}

export async function revalidatePath(path: string) {
  const { revalidatePath: revalidate } = await import('next/cache');
  revalidate(path);
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/ssr/streaming.ts',
      content: `import { Suspense } from 'react';

// Streaming components
export function StreamingWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback || <StreamingFallback />}>
      {children}
    </Suspense>
  );
}

export function StreamingFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}

// Streaming data fetcher
export async function* streamData<T>(
  dataGenerator: () => AsyncGenerator<T, void, unknown>
) {
  for await (const item of dataGenerator()) {
    yield item;
  }
}

// Progressive loading component
export function ProgressiveLoader({ 
  children, 
  loadingComponent,
  delay = 0 
}: { 
  children: React.ReactNode; 
  loadingComponent?: React.ReactNode;
  delay?: number;
}) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (isLoading) {
    return loadingComponent || <StreamingFallback />;
  }

  return <>{children}</>;
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/ssr/performance.ts',
      content: `// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startTimer(name: string): void {
    this.metrics.set(name, performance.now());
  }

  static endTimer(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(\`Timer "\${name}" was not started\`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(\`⏱️ \${name}: \${duration.toFixed(2)}ms\`);
    }

    return duration;
  }

  static measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(name);
    return fn().finally(() => {
      this.endTimer(name);
    });
  }

  static measureSync<T>(
    name: string,
    fn: () => T
  ): T {
    this.startTimer(name);
    try {
      return fn();
    } finally {
      this.endTimer(name);
    }
  }
}

// Resource optimization
export function optimizeImage(src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
} = {}) {
  const { width, height, quality = 75, format = 'webp' } = options;
  
  let optimizedSrc = src;
  
  if (width) optimizedSrc += \`?w=\${width}\`;
  if (height) optimizedSrc += \`&h=\${height}\`;
  if (quality !== 75) optimizedSrc += \`&q=\${quality}\`;
  if (format !== 'webp') optimizedSrc += \`&f=\${format}\`;
  
  return optimizedSrc;
}

// Bundle optimization
export function getBundleSize(moduleName: string): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      // Client-side bundle analysis
      const script = document.createElement('script');
      script.src = \`/_next/static/chunks/\${moduleName}.js\`;
      script.onload = () => {
        resolve(script.textContent?.length || 0);
      };
      document.head.appendChild(script);
    } else {
      // Server-side estimation
      resolve(0);
    }
  });
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }
  return null;
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/ssr/CachedData.tsx',
      content: `import { Suspense } from 'react';
import { fetchWithCache } from '@/lib/ssr/cache';
import { StreamingFallback } from '@/lib/ssr/streaming';

interface CachedDataProps {
  url: string;
  cacheKey: string;
  children: (data: any) => React.ReactNode;
  fallback?: React.ReactNode;
}

export async function CachedData({ 
  url, 
  cacheKey, 
  children, 
  fallback 
}: CachedDataProps) {
  const data = await fetchWithCache(
    url,
    {},
    {
      revalidate: 3600, // 1 hour
      tags: [cacheKey],
    }
  );

  return <>{children(data)}</>;
}

export function CachedDataWrapper({ 
  url, 
  cacheKey, 
  children, 
  fallback 
}: CachedDataProps) {
  return (
    <Suspense fallback={fallback || <StreamingFallback />}>
      <CachedData url={url} cacheKey={cacheKey}>
        {children}
      </CachedData>
    </Suspense>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/ssr/StreamingList.tsx',
      content: `import { Suspense } from 'react';
import { StreamingWrapper, StreamingFallback } from '@/lib/ssr/streaming';

interface StreamingListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  batchSize?: number;
  fallback?: React.ReactNode;
}

export function StreamingList<T>({ 
  items, 
  renderItem, 
  batchSize = 10,
  fallback 
}: StreamingListProps<T>) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return (
    <div className="space-y-4">
      {batches.map((batch, batchIndex) => (
        <StreamingWrapper 
          key={batchIndex} 
          fallback={fallback}
        >
          <div className="grid gap-4">
            {batch.map((item, itemIndex) => 
              renderItem(item, batchIndex * batchSize + itemIndex)
            )}
          </div>
        </StreamingWrapper>
      ))}
    </div>
  );
}

// Progressive loading list
export function ProgressiveList<T>({ 
  items, 
  renderItem, 
  initialCount = 5,
  loadMoreCount = 5,
  fallback 
}: StreamingListProps<T> & {
  initialCount?: number;
  loadMoreCount?: number;
}) {
  const [visibleCount, setVisibleCount] = React.useState(initialCount);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + loadMoreCount, items.length));
  };

  return (
    <div className="space-y-4">
      <StreamingList 
        items={visibleItems} 
        renderItem={renderItem}
        fallback={fallback}
      />
      
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/performance/page.tsx',
      content: `import { PerformanceMonitor, getMemoryUsage } from '@/lib/ssr/performance';
import { revalidateCache, revalidatePath } from '@/lib/ssr/cache';

export default function PerformancePage() {
  const memoryUsage = getMemoryUsage();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Performance Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Memory Usage */}
        {memoryUsage && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Memory Usage</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>RSS:</span>
                <span className="font-mono">{memoryUsage.rss} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Heap Total:</span>
                <span className="font-mono">{memoryUsage.heapTotal} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Heap Used:</span>
                <span className="font-mono">{memoryUsage.heapUsed} MB</span>
              </div>
              <div className="flex justify-between">
                <span>External:</span>
                <span className="font-mono">{memoryUsage.external} MB</span>
              </div>
            </div>
          </div>
        )}

        {/* Cache Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Cache Management</h2>
          <div className="space-y-3">
            <form action={async () => {
              'use server';
              await revalidateCache(['ssr-cache']);
            }}>
              <button 
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear SSR Cache
              </button>
            </form>
            
            <form action={async () => {
              'use server';
              await revalidatePath('/');
            }}>
              <button 
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Revalidate Home Page
              </button>
            </form>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Performance Tips</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Use React.memo for expensive components</li>
            <li>• Implement proper caching strategies</li>
            <li>• Optimize images with next/image</li>
            <li>• Use dynamic imports for code splitting</li>
            <li>• Monitor bundle size regularly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}`
    }
  ]
};
export default ssrOptimizationBlueprint;
