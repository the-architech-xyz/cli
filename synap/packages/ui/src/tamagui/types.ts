/**
 * Tamagui Types
 * 
 * TypeScript type definitions for Tamagui
 */

export type TamaguiTheme = 'light' | 'dark';

export interface TamaguiConfig {
  theme: TamaguiTheme;
  defaultTheme?: TamaguiTheme;
}

export type { Theme } from './theme';

