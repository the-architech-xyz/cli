/**
 * Tamagui Provider
 * 
 * Wraps the application with Tamagui configuration and theme
 */

'use client';

import { TamaguiProvider as BaseTamaguiProvider } from '@tamagui/core';
import { config } from './config';


import { SafeAreaProvider } from 'react-native-safe-area-context';


interface TamaguiProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export function TamaguiProvider({ 
  children, 
  defaultTheme = 'light' 
}: TamaguiProviderProps) {
  
  return (
    <SafeAreaProvider>
      <BaseTamaguiProvider config={config} defaultTheme={defaultTheme}>
        {children}
      </BaseTamaguiProvider>
    </SafeAreaProvider>
  );
  
}

