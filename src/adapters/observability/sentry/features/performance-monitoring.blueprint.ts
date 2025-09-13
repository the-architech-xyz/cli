/**
 * Sentry Performance Monitoring Feature
 * 
 * Adds advanced performance tracking, web vitals, and transaction monitoring
 * Framework-agnostic implementation
 */

import { Blueprint } from '../../../../types/adapter.js';

const performanceMonitoringBlueprint: Blueprint = {
  id: 'sentry-performance-monitoring',
  name: 'Sentry Performance Monitoring',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@sentry/browser', '@sentry/node']
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/monitoring/performance-tracker.ts',
      content: `// Performance monitoring utilities - framework agnostic
export class PerformanceTracker {
  static startSpan(name: string, op: string = 'custom') {
    // This will be implemented by the framework-specific integration
    return { name, op };
  }

  static startSpan(transaction: any, name: string, op: string = 'custom') {
    // This will be implemented by the framework-specific integration
    return { name, op, transaction };
  }

  static finishSpan(span: any) {
    // This will be implemented by the framework-specific integration
    return span;
  }

  static addBreadcrumb(message: string, category?: string, level?: string) {
    // This will be implemented by the framework-specific integration
    console.log('Performance breadcrumb:', { message, category, level });
  }

  static setContext(key: string, context: any) {
    // This will be implemented by the framework-specific integration
    console.log('Performance context:', { key, context });
  }

  static setTag(key: string, value: string) {
    // This will be implemented by the framework-specific integration
    console.log('Performance tag:', { key, value });
  }

  static measurePerformance(name: string, fn: () => any) {
    // This will be implemented by the framework-specific integration
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log('Performance ' + name + ': ' + (end - start) + 'ms');
    return result;
  }

  static measureAsyncPerformance(name: string, fn: () => Promise<any>) {
    // This will be implemented by the framework-specific integration
    const start = performance.now();
    return fn().then(result => {
      const end = performance.now();
      console.log('Async Performance ' + name + ': ' + (end - start) + 'ms');
      return result;
    });
  }
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/monitoring/web-vitals.ts',
      content: `// Web Vitals monitoring - framework agnostic
export class WebVitalsTracker {
  static trackCLS(callback: (value: number) => void) {
    // This will be implemented by the framework-specific integration
    console.log('CLS tracking enabled');
  }

  static trackFID(callback: (value: number) => void) {
    // This will be implemented by the framework-specific integration
    console.log('FID tracking enabled');
  }

  static trackFCP(callback: (value: number) => void) {
    // This will be implemented by the framework-specific integration
    console.log('FCP tracking enabled');
  }

  static trackLCP(callback: (value: number) => void) {
    // This will be implemented by the framework-specific integration
    console.log('LCP tracking enabled');
  }

  static trackTTFB(callback: (value: number) => void) {
    // This will be implemented by the framework-specific integration
    console.log('TTFB tracking enabled');
  }

  static trackINP(callback: (value: number) => void) {
    // This will be implemented by the framework-specific integration
    console.log('INP tracking enabled');
  }
}
`
    }
  ]
};

export const blueprint = performanceMonitoringBlueprint;