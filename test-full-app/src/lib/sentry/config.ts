// Sentry configuration
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
};
