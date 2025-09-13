import { Blueprint } from '../../types/adapter.js';

export const blueprint: Blueprint = {
  id: 'shadcn-nextjs-integration',
  name: 'Shadcn Next.js Integration',
  description: 'Complete Next.js integration for Shadcn/ui',
  version: '2.0.0',
  actions: [
    // Install additional Shadcn packages for Next.js
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge', 'tailwindcss-animate'],
      isDev: false
    },
    
    // PURE MODIFIER: Enhance Tailwind config with Shadcn theme
    {
      type: 'ENHANCE_FILE',
      path: 'tailwind.config.js',
      modifier: 'js-config-merger',
      params: {
        exportName: 'module.exports',
        propertiesToMerge: {
          plugins: ['tailwindcss-animate'],
          content: [
            './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
            './src/components/**/*.{js,ts,jsx,tsx,mdx}',
            './src/app/**/*.{js,ts,jsx,tsx,mdx}',
          ],
          theme: {
            extend: {
              borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
              },
              colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                  DEFAULT: 'hsl(var(--card))',
                  foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                  DEFAULT: 'hsl(var(--popover))',
                  foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                  DEFAULT: 'hsl(var(--primary))',
                  foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                  DEFAULT: 'hsl(var(--secondary))',
                  foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                  DEFAULT: 'hsl(var(--muted))',
                  foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                  DEFAULT: 'hsl(var(--accent))',
                  foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                  DEFAULT: 'hsl(var(--destructive))',
                  foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                  '1': 'hsl(var(--chart-1))',
                  '2': 'hsl(var(--chart-2))',
                  '3': 'hsl(var(--chart-3))',
                  '4': 'hsl(var(--chart-4))',
                  '5': 'hsl(var(--chart-5))',
                },
              },
            },
          },
        },
        mergeStrategy: 'deep'
      }
    },
    
    // PURE MODIFIER: Enhance TypeScript config with path mapping
    {
      type: 'ENHANCE_FILE',
      path: 'tsconfig.json',
      modifier: 'json-object-merger',
      params: {
        path: ['compilerOptions'],
        propertiesToMerge: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*']
          }
        },
        mergeStrategy: 'deep'
      }
    },
    
    // PURE MODIFIER: Enhance globals.css with Shadcn CSS variables
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/globals.css',
      modifier: 'ts-module-enhancer',
      params: {
        statementsToAppend: [
          {
            type: 'raw',
            content: `@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Enhance components.json with Next.js specific configuration
    {
      type: 'ENHANCE_FILE',
      path: 'components.json',
      modifier: 'json-object-merger',
      params: {
        path: [],
        propertiesToMerge: {
          style: 'default',
          rsc: true,
          tsx: true,
          tailwind: {
            config: 'tailwind.config.js',
            css: 'src/app/globals.css',
            baseColor: 'slate',
            cssVariables: true,
            prefix: ''
          },
          aliases: {
            components: '@/components',
            utils: '@/lib/utils'
          }
        },
        mergeStrategy: 'deep'
      }
    }
  ]
};