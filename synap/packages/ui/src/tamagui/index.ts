/**
 * Tamagui UI Library
 * 
 * Central export for Tamagui components and utilities
 */

export { TamaguiProvider } from './provider';
export { config } from './config';
export { theme } from './theme';
export type { TamaguiTheme, TamaguiConfig, Theme } from './types';

// Re-export common Tamagui components
export {
  Button,
  Text,
  View,
  Input,
  Card,
  Dialog,
  Sheet,
  Select,
  Switch,
  Checkbox,
  RadioGroup,
  Slider,
  Progress,
  Tabs,
  Accordion,
  Avatar,
  Badge,
} from '@tamagui/core';

