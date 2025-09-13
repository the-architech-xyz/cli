/**
 * Sentry Error Monitoring Blueprint
 * 
 * Sets up framework-agnostic Sentry integration for error monitoring and performance tracking
 * Creates Sentry configuration, error boundaries, and monitoring utilities that work with any framework
 */

import { Blueprint } from '../../../types/adapter.js';

export const sentryBlueprint: Blueprint = {
  id: 'sentry-observability-setup',
  name: 'Sentry Error Monitoring Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@sentry/browser', '@sentry/node']
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/client.ts',
      content: `import * as Sentry from '@sentry/browser';

// Initialize Sentry for client-side
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

export { Sentry };
`,
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/server.ts',
      content: `import * as Sentry from '@sentry/node';

// Initialize Sentry for server-side
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
});

export { Sentry };
`,
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/config.ts',
      content: `// Sentry configuration
export const SENTRY_CONFIG = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
};

// Custom error reporting
export const reportError = (error: Error, context?: Record<string, unknown>) => {
  // This will be implemented by the framework-specific integration
  console.error('Error reported:', error, context);
};

// Custom message reporting
export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  // This will be implemented by the framework-specific integration
  console.log(\`[\${level.toUpperCase()}] \${message}\`);
};

// Performance monitoring
export const startSpan = (name: string, op: string) => {
  // This will be implemented by the framework-specific integration
  return { name, op };
};

// User context
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  // This will be implemented by the framework-specific integration
  console.log('User context set:', user);
};

// Breadcrumb tracking
export const addBreadcrumb = (message: string, category?: string, level?: 'info' | 'warning' | 'error') => {
  // This will be implemented by the framework-specific integration
  console.log('Breadcrumb added:', { message, category, level });
};`,
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/performance.ts',
      content: `// Performance monitoring utilities
export class PerformanceMonitor {
  private static transactions: Map<string, unknown> = new Map();

  /**
   * Start a performance transaction
   */
  static startSpan(name: string, op: string, description?: string) {
    // This will be implemented by the framework-specific integration
    return { name, op, description };
  }

  /**
   * Finish a performance transaction
   */
  static finishTransaction(name: string) {
    const transaction = this.transactions.get(name);
    if (transaction) {
      // This will be implemented by the framework-specific integration
      this.transactions.delete(name);
    }
  }

  /**
   * Add a span to a transaction
   */
  static addSpan(transactionName: string, spanName: string, op: string) {
    const transaction = this.transactions.get(transactionName);
    if (transaction) {
      // This will be implemented by the framework-specific integration
      return { name: spanName, op };
    }
    return null;
  }

  /**
   * Monitor API call performance
   */
  static async monitorApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(\`api.\${apiName}\`, 'http.client');
    
    try {
      const result = await apiCall();
      // Span automatically handles status
      return result;
    } catch (error) {
      // Span automatically handles error status
      throw error;
    } finally {
      this.finishTransaction(\`api.\${apiName}\`);
    }
  }

  /**
   * Monitor function execution time
   */
  static async monitorFunction<T>(
    functionName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(\`function.\${functionName}\`, 'function');
    
    try {
      const result = await fn();
      // Span automatically handles status
      return result;
    } catch (error) {
      // Span automatically handles error status
      throw error;
    } finally {
      this.finishTransaction(\`function.\${functionName}\`);
    }
  }
}`,
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/analytics.ts',
      content: `// Analytics and event tracking
export class Analytics {
  /**
   * Track user events
   */
  static trackEvent(eventName: string, properties?: Record<string, unknown>) {
    // This will be implemented by the framework-specific integration
    console.log('Event tracked:', eventName, properties);
  }

  /**
   * Track page views
   */
  static trackPageView(page: string, properties?: Record<string, unknown>) {
    // This will be implemented by the framework-specific integration
    console.log('Page view tracked:', page, properties);
  }

  /**
   * Track user interactions
   */
  static trackInteraction(element: string, action: string, properties?: Record<string, unknown>) {
    // This will be implemented by the framework-specific integration
    console.log('Interaction tracked:', element, action, properties);
  }

  /**
   * Track errors with context
   */
  static trackError(error: Error, context?: Record<string, unknown>) {
    // This will be implemented by the framework-specific integration
    console.error('Error tracked:', error, context);
  }

  /**
   * Set user properties
   */
  static setUserProperties(user: {
    id: string;
    email?: string;
    username?: string;
    properties?: Record<string, unknown>;
  }) {
    // This will be implemented by the framework-specific integration
    console.log('User properties set:', user);
  }
}`,
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_DSN',
      value: 'https://...',
      description: 'Sentry DSN for server-side error reporting'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_DSN',
      value: 'https://...',
      description: 'Sentry DSN for client-side error reporting'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_ORG',
      value: 'your-org',
      description: 'Sentry organization slug'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_PROJECT',
      value: 'your-project',
      description: 'Sentry project slug'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_RELEASE',
      value: '1.0.0',
      description: 'Sentry release version'
    }
  ]
};