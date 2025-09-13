/**
 * Shadcn/ui Theming Feature
 * 
 * Adds advanced theming, color schemes, and design system
 */

import { Blueprint } from '../../../../types/adapter.js';

const themingBlueprint: Blueprint = {
  id: 'shadcn-ui-theming',
  name: 'Shadcn/ui Theming',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/themes/theme-manager.ts',
      content: `import { createContext, useContext, useEffect, useState } from 'react';

// Theme configuration
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    input: string;
    ring: string;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Default themes
export const defaultThemes: Record<string, ThemeConfig> = {
  default: {
    name: 'Default',
    colors: {
      primary: 'hsl(222.2 84% 4.9%)',
      secondary: 'hsl(210 40% 98%)',
      accent: 'hsl(210 40% 96%)',
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      muted: 'hsl(210 40% 96%)',
      border: 'hsl(214.3 31.8% 91.4%)',
      input: 'hsl(214.3 31.8% 91.4%)',
      ring: 'hsl(222.2 84% 4.9%)',
    },
    fonts: {
      sans: 'Inter, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Monaco, monospace',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: 'hsl(210 40% 98%)',
      secondary: 'hsl(222.2 84% 4.9%)',
      accent: 'hsl(217.2 32.6% 17.5%)',
      background: 'hsl(222.2 84% 4.9%)',
      foreground: 'hsl(210 40% 98%)',
      muted: 'hsl(217.2 32.6% 17.5%)',
      border: 'hsl(217.2 32.6% 17.5%)',
      input: 'hsl(217.2 32.6% 17.5%)',
      ring: 'hsl(212.7 26.8% 83.9%)',
    },
    fonts: {
      sans: 'Inter, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Monaco, monospace',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
    },
  },
  {{#each module.parameters.themes}}
  {{#if (ne this "default")}}
  {{#if (ne this "dark")}}
  {{this}}: {
    name: '{{toUpperCase this}}',
    colors: {
      primary: 'hsl({{#if (eq this "blue")}}221.2 83.2% 53.3%{{else if (eq this "green")}}142.1 76.2% 36.3%{{else if (eq this "purple")}}262.1 83.3% 57.8%{{else if (eq this "orange")}}24.6 95% 53.1%{{else if (eq this "red")}}0 84.2% 60.2%{{/if}})',
      secondary: 'hsl({{#if (eq this "blue")}}210 40% 98%{{else if (eq this "green")}}138.5 76.5% 96.7%{{else if (eq this "purple")}}263.4 70% 96.7%{{else if (eq this "orange")}}33.3 100% 96.7%{{else if (eq this "red")}}0 0% 96.7%{{/if}})',
      accent: 'hsl({{#if (eq this "blue")}}210 40% 96%{{else if (eq this "green")}}138.5 76.5% 96.7%{{else if (eq this "purple")}}263.4 70% 96.7%{{else if (eq this "orange")}}33.3 100% 96.7%{{else if (eq this "red")}}0 0% 96.7%{{/if}})',
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl({{#if (eq this "blue")}}222.2 84% 4.9%{{else if (eq this "green")}}222.2 84% 4.9%{{else if (eq this "purple")}}222.2 84% 4.9%{{else if (eq this "orange")}}222.2 84% 4.9%{{else if (eq this "red")}}222.2 84% 4.9%{{/if}})',
      muted: 'hsl({{#if (eq this "blue")}}210 40% 96%{{else if (eq this "green")}}138.5 76.5% 96.7%{{else if (eq this "purple")}}263.4 70% 96.7%{{else if (eq this "orange")}}33.3 100% 96.7%{{else if (eq this "red")}}0 0% 96.7%{{/if}})',
      border: 'hsl({{#if (eq this "blue")}}214.3 31.8% 91.4%{{else if (eq this "green")}}138.5 76.5% 96.7%{{else if (eq this "purple")}}263.4 70% 96.7%{{else if (eq this "orange")}}33.3 100% 96.7%{{else if (eq this "red")}}0 0% 96.7%{{/if}})',
      input: 'hsl({{#if (eq this "blue")}}214.3 31.8% 91.4%{{else if (eq this "green")}}138.5 76.5% 96.7%{{else if (eq this "purple")}}263.4 70% 96.7%{{else if (eq this "orange")}}33.3 100% 96.7%{{else if (eq this "red")}}0 0% 96.7%{{/if}})',
      ring: 'hsl({{#if (eq this "blue")}}221.2 83.2% 53.3%{{else if (eq this "green")}}142.1 76.2% 36.3%{{else if (eq this "purple")}}262.1 83.3% 57.8%{{else if (eq this "orange")}}24.6 95% 53.1%{{else if (eq this "red")}}0 84.2% 60.2%{{/if}})',
    },
    fonts: {
      sans: 'Inter, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Monaco, monospace',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
    },
  },
  {{/if}}
  {{/if}}
  {{/each}}
};

// Theme context
interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultThemes.default);
  const [availableThemes] = useState<ThemeConfig[]>(Object.values(defaultThemes));

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty('--' + key, value);
    });
    
    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty('--font-' + key, value);
    });
    
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty('--spacing-' + key, value);
    });
    
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty('--radius-' + key, value);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Theme hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme utilities
export class ThemeManager {
  static getTheme(name: string): ThemeConfig | undefined {
    return defaultThemes[name];
  }

  static getAllThemes(): ThemeConfig[] {
    return Object.values(defaultThemes);
  }

  static createCustomTheme(config: Partial<ThemeConfig>): ThemeConfig {
    return {
      name: config.name || 'Custom',
      colors: { ...defaultThemes.default.colors, ...config.colors },
      fonts: { ...defaultThemes.default.fonts, ...config.fonts },
      spacing: { ...defaultThemes.default.spacing, ...config.spacing },
      borderRadius: { ...defaultThemes.default.borderRadius, ...config.borderRadius },
    };
  }

  static exportTheme(theme: ThemeConfig): string {
    return JSON.stringify(theme, null, 2);
  }

  static importTheme(themeJson: string): ThemeConfig {
    return JSON.parse(themeJson);
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/theme/theme-selector.tsx',
      content: `'use client';

import { useTheme } from '@/lib/themes/theme-manager';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4 mr-2" />
          {theme.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableThemes.map((availableTheme) => (
          <DropdownMenuItem
            key={availableTheme.name}
            onClick={() => setTheme(availableTheme)}
            className={theme.name === availableTheme.name ? 'bg-accent' : ''}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: availableTheme.colors.primary }}
              />
              <span>{availableTheme.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/theme/theme-preview.tsx',
      content: `'use client';

import { useTheme } from '@/lib/themes/theme-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function ThemePreview() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Theme Preview</h3>
        <p className="text-sm text-muted-foreground">
          Current theme: {theme.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Button variants and states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Input fields and form controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Enter your name" />
            <Input placeholder="Enter your email" type="email" />
            <Input placeholder="Enter your password" type="password" />
            <div className="flex space-x-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Theme color values</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-xs font-medium">Primary</div>
                <div
                  className="w-full h-8 rounded border"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium">Secondary</div>
                <div
                  className="w-full h-8 rounded border"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium">Accent</div>
                <div
                  className="w-full h-8 rounded border"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium">Background</div>
                <div
                  className="w-full h-8 rounded border"
                  style={{ backgroundColor: theme.colors.background }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/theme/page.tsx',
      content: `import { ThemeProvider } from '@/lib/themes/theme-manager';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { ThemePreview } from '@/components/theme/theme-preview';

export default function ThemePage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Theme System</h1>
              <p className="text-muted-foreground">
                Customize your application's appearance with our theming system
              </p>
            </div>
            <ThemeSelector />
          </div>

          <ThemePreview />
        </div>
      </div>
    </ThemeProvider>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/themes/tailwind-config.ts',
      content: `import { ThemeConfig } from './theme-manager';

// Generate Tailwind config from theme
export function generateTailwindConfig(theme: ThemeConfig) {
  return {
    theme: {
      extend: {
        colors: {
          border: theme.colors.border,
          input: theme.colors.input,
          ring: theme.colors.ring,
          background: theme.colors.background,
          foreground: theme.colors.foreground,
          primary: {
            DEFAULT: theme.colors.primary,
            foreground: theme.colors.secondary,
          },
          secondary: {
            DEFAULT: theme.colors.secondary,
            foreground: theme.colors.primary,
          },
          destructive: {
            DEFAULT: 'hsl(0 84.2% 60.2%)',
            foreground: 'hsl(210 40% 98%)',
          },
          muted: {
            DEFAULT: theme.colors.muted,
            foreground: theme.colors.foreground,
          },
          accent: {
            DEFAULT: theme.colors.accent,
            foreground: theme.colors.primary,
          },
          popover: {
            DEFAULT: theme.colors.background,
            foreground: theme.colors.foreground,
          },
          card: {
            DEFAULT: theme.colors.background,
            foreground: theme.colors.foreground,
          },
        },
        borderRadius: {
          lg: theme.borderRadius.lg,
          md: theme.borderRadius.md,
          sm: theme.borderRadius.sm,
        },
        fontFamily: {
          sans: [theme.fonts.sans],
          serif: [theme.fonts.serif],
          mono: [theme.fonts.mono],
        },
        spacing: {
          xs: theme.spacing.xs,
          sm: theme.spacing.sm,
          md: theme.spacing.md,
          lg: theme.spacing.lg,
          xl: theme.spacing.xl,
        },
      },
    },
  };
}

// Export default Tailwind config
export const defaultTailwindConfig = generateTailwindConfig({
  name: 'Default',
  colors: {
    primary: 'hsl(222.2 84% 4.9%)',
    secondary: 'hsl(210 40% 98%)',
    accent: 'hsl(210 40% 96%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    muted: 'hsl(210 40% 96%)',
    border: 'hsl(214.3 31.8% 91.4%)',
    input: 'hsl(214.3 31.8% 91.4%)',
    ring: 'hsl(222.2 84% 4.9%)',
  },
  fonts: {
    sans: 'Inter, sans-serif',
    serif: 'Georgia, serif',
    mono: 'Monaco, monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
  },
});`
    }
  ]
};
export default themingBlueprint;
