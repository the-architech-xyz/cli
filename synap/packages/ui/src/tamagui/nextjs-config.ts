/**
 * Tamagui Next.js Configuration
 * 
 * Next.js-specific configuration for Tamagui SSR
 */

import { config } from './config';

// Ensure Tamagui is configured for Next.js SSR
export const tamaguiConfig = config;

// Export for use in Next.js pages
export default tamaguiConfig;

