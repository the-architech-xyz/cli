/**
 * Tamagui Configuration
 * 
 * Central configuration for Tamagui design tokens and theming
 */

import { createTamagui } from '@tamagui/core';
import { config as defaultConfig } from '@tamagui/config/v3';
import { theme } from './theme';

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    light: theme.light,
    dark: theme.dark,
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
  shorthands: {
    ...defaultConfig.shorthands,
  },
  fonts: {
    ...defaultConfig.fonts,
  },
  tokens: {
    ...defaultConfig.tokens,
  },
});

export default config;

export type Conf = typeof config;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

