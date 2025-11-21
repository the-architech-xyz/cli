/**
 * Tamagui Theme Configuration
 * 
 * Design tokens and color schemes
 */

export const theme = {
  light: {
    background: '#ffffff',
    backgroundHover: '#f5f5f5',
    backgroundPress: '#e5e5e5',
    backgroundFocus: '#e5e5e5',
    color: '#0a0a0a',
    colorHover: '#0a0a0a',
    colorPress: '#0a0a0a',
    colorFocus: '#0a0a0a',
    borderColor: '#e5e5e5',
    borderColorHover: '#d4d4d4',
    borderColorPress: '#a3a3a3',
    borderColorFocus: '#a3a3a3',
    placeholderColor: '#737373',
    
    // Primary colors
    primary: '#0a0a0a',
    primaryHover: '#171717',
    primaryPress: '#262626',
    primaryFocus: '#262626',
    primaryBackground: '#fafafa',
    primaryBackgroundHover: '#f5f5f5',
    primaryBackgroundPress: '#e5e5e5',
    primaryBackgroundFocus: '#e5e5e5',
    
    // Secondary colors
    secondary: '#737373',
    secondaryHover: '#525252',
    secondaryPress: '#404040',
    secondaryFocus: '#404040',
    secondaryBackground: '#f5f5f5',
    secondaryBackgroundHover: '#e5e5e5',
    secondaryBackgroundPress: '#d4d4d4',
    secondaryBackgroundFocus: '#d4d4d4',
    
    // Success colors
    success: '#22c55e',
    successHover: '#16a34a',
    successPress: '#15803d',
    successFocus: '#15803d',
    successBackground: '#dcfce7',
    
    // Warning colors
    warning: '#f59e0b',
    warningHover: '#d97706',
    warningPress: '#b45309',
    warningFocus: '#b45309',
    warningBackground: '#fef3c7',
    
    // Error colors
    error: '#ef4444',
    errorHover: '#dc2626',
    errorPress: '#b91c1c',
    errorFocus: '#b91c1c',
    errorBackground: '#fee2e2',
    
    // Info colors
    info: '#3b82f6',
    infoHover: '#2563eb',
    infoPress: '#1d4ed8',
    infoFocus: '#1d4ed8',
    infoBackground: '#dbeafe',
  },
  dark: {
    background: '#0a0a0a',
    backgroundHover: '#171717',
    backgroundPress: '#262626',
    backgroundFocus: '#262626',
    color: '#fafafa',
    colorHover: '#f5f5f5',
    colorPress: '#e5e5e5',
    colorFocus: '#e5e5e5',
    borderColor: '#262626',
    borderColorHover: '#404040',
    borderColorPress: '#525252',
    borderColorFocus: '#525252',
    placeholderColor: '#a3a3a3',
    
    // Primary colors
    primary: '#fafafa',
    primaryHover: '#f5f5f5',
    primaryPress: '#e5e5e5',
    primaryFocus: '#e5e5e5',
    primaryBackground: '#171717',
    primaryBackgroundHover: '#262626',
    primaryBackgroundPress: '#404040',
    primaryBackgroundFocus: '#404040',
    
    // Secondary colors
    secondary: '#a3a3a3',
    secondaryHover: '#737373',
    secondaryPress: '#525252',
    secondaryFocus: '#525252',
    secondaryBackground: '#262626',
    secondaryBackgroundHover: '#404040',
    secondaryBackgroundPress: '#525252',
    secondaryBackgroundFocus: '#525252',
    
    // Success colors
    success: '#22c55e',
    successHover: '#16a34a',
    successPress: '#15803d',
    successFocus: '#15803d',
    successBackground: '#14532d',
    
    // Warning colors
    warning: '#f59e0b',
    warningHover: '#d97706',
    warningPress: '#b45309',
    warningFocus: '#b45309',
    warningBackground: '#78350f',
    
    // Error colors
    error: '#ef4444',
    errorHover: '#dc2626',
    errorPress: '#b91c1c',
    errorFocus: '#b91c1c',
    errorBackground: '#7f1d1d',
    
    // Info colors
    info: '#3b82f6',
    infoHover: '#2563eb',
    infoPress: '#1d4ed8',
    infoFocus: '#1d4ed8',
    infoBackground: '#1e3a8a',
  },
};

export type Theme = typeof theme.light;

