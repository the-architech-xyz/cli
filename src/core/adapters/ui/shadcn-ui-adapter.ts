/**
 * Shadcn/UI Adapter - Enhanced Implementation
 * 
 * Comprehensive implementation of IUIProvider for Shadcn/UI.
 * Includes component generation, theme configuration, styling setup,
 * and proper file management with rollback capabilities.
 */

import { IUIProvider } from '../../interfaces/providers.js';
import { AgentContext, PluginResult, PluginMetadata, ParameterSchema, CoreCategory, ValidationResult, ValidationError } from '../../interfaces/base.js';
import fsExtra from 'fs-extra';
import * as path from 'path';

export class ShadcnUIAdapter implements IUIProvider {
  getMetadata(): PluginMetadata {
    return {
      name: "@architech/shadcn-ui-adapter",
      version: "0.1.0",
      category: CoreCategory.UI,
      description: "Beautifully designed components that you can copy and paste into your apps",
      dependencies: ["@radix-ui/react-slot", "class-variance-authority", "clsx", "tailwind-merge", "lucide-react"],
      conflicts: ["@chakra-ui/react", "@mui/material"],
      requirements: [
        {
          type: "package",
          name: "tailwindcss",
          description: "Tailwind CSS is required for Shadcn/UI"
        }
      ],
      license: "MIT",
      repository: "https://github.com/shadcn/ui",
      documentation: "https://ui.shadcn.com/",
      tags: ["ui", "components", "tailwind", "radix", "design-system"],
      author: "The Architech Team"
    };
  }

  getParameterSchema(): ParameterSchema {
    return {
      parameters: [
        {
          id: "theme",
          name: "Theme",
          description: "Choose your theme preference",
          type: "string",
          required: true,
          default: "system",
          enum: ["light", "dark", "system"]
        },
        {
          id: "components",
          name: "Components",
          description: "Select components to install",
          type: "array",
          required: true,
          default: ["button", "card", "input", "label"],
          enum: [
            "button", "card", "input", "label", "select", "textarea", 
            "checkbox", "radio-group", "switch", "tabs", "dialog", 
            "dropdown-menu", "navigation-menu", "breadcrumb", "pagination"
          ]
        },
        {
          id: "colorScheme",
          name: "Color Scheme",
          description: "Choose your color scheme",
          type: "string",
          default: "slate",
          enum: ["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "green", "blue", "yellow", "violet"]
        },
        {
          id: "radius",
          name: "Border Radius",
          description: "Border radius for components",
          type: "string",
          default: "0.5rem",
          enum: ["none", "sm", "default", "md", "lg", "xl"]
        },
        {
          id: "cssVariables",
          name: "CSS Variables",
          description: "Use CSS variables for theming",
          type: "boolean",
          default: true
        }
      ],
      groups: [
        {
          id: "theme",
          name: "Theme Configuration",
          description: "Configure your design system theme",
          order: 1
        },
        {
          id: "components",
          name: "Component Selection",
          description: "Choose which components to install",
          order: 2
        }
      ]
    };
  }

  async validate(context: AgentContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check if Tailwind CSS is installed
    const packageJsonPath = path.join(context.workspacePath, 'package.json');
    if (await fsExtra.pathExists(packageJsonPath)) {
      const packageJson = await fsExtra.readJson(packageJsonPath);
      if (!packageJson.dependencies?.tailwindcss && !packageJson.devDependencies?.tailwindcss) {
        errors.push({
          field: "dependencies",
          message: "Tailwind CSS is required for Shadcn/UI",
          code: "MISSING_TAILWIND",
          severity: "error"
        });
      }
    }

    // Validate components selection
    const components = context.answers.components || [];
    if (components.length === 0) {
      errors.push({
        field: "components",
        message: "At least one component must be selected",
        code: "NO_COMPONENTS",
        severity: "error"
      });
    }

    // Check for conflicts
    if (await fsExtra.pathExists(packageJsonPath)) {
      const packageJson = await fsExtra.readJson(packageJsonPath);
      if (packageJson.dependencies?.["@chakra-ui/react"]) {
        errors.push({
          field: "dependencies",
          message: "Chakra UI is installed and may conflict with Shadcn/UI",
          code: "CONFLICTING_UI",
          severity: "error"
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  async install(context: AgentContext): Promise<void> {
    // Install dependencies
    await context.runStep('install-deps', 'npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react');
    
    // Install Tailwind CSS if not present
    const packageJsonPath = path.join(context.workspacePath, 'package.json');
    if (await fsExtra.pathExists(packageJsonPath)) {
      const packageJson = await fsExtra.readJson(packageJsonPath);
      if (!packageJson.dependencies?.tailwindcss && !packageJson.devDependencies?.tailwindcss) {
        await context.runStep('install-tailwind', 'npm install -D tailwindcss postcss autoprefixer');
        await context.runStep('init-tailwind', 'npx tailwindcss init -p');
      }
    }
  }

  async getComponents(context: AgentContext): Promise<string[]> {
    return context.answers.components || ["button", "card", "input", "label"];
  }

  async getThemeConfig(context: AgentContext): Promise<Record<string, any>> {
    return {
      theme: context.answers.theme || "system",
      colorScheme: context.answers.colorScheme || "slate",
      radius: context.answers.radius || "0.5rem",
      cssVariables: context.answers.cssVariables !== false
    };
  }

  async generateComponent(context: AgentContext, name: string, props?: any): Promise<string> {
    const componentPath = path.join(context.workspacePath, 'components/ui', `${name}.tsx`);
    await fsExtra.ensureDir(path.dirname(componentPath));

    const componentContent = this.generateComponentContent(name, props);
    await fsExtra.writeFile(componentPath, componentContent);
    
    context.log(`Component ${name} generated successfully`, 'info');
    return componentPath;
  }

  async configureStyling(context: AgentContext): Promise<void> {
    // Update Tailwind config
    const tailwindConfigPath = path.join(context.workspacePath, 'tailwind.config.js');
    if (await fsExtra.pathExists(tailwindConfigPath)) {
      const configContent = this.generateTailwindConfig(context.answers);
      await fsExtra.writeFile(tailwindConfigPath, configContent);
    }

    // Update global CSS
    const globalCssPath = path.join(context.workspacePath, 'app/globals.css');
    if (await fsExtra.pathExists(globalCssPath)) {
      const cssContent = this.generateGlobalCSS(context.answers);
      await fsExtra.writeFile(globalCssPath, cssContent);
    }
  }

  async setupDesignSystem(context: AgentContext): Promise<void> {
    // Create components.json
    const componentsJsonPath = path.join(context.workspacePath, 'components.json');
    const componentsJson = this.generateComponentsJson(context.answers);
    await fsExtra.writeFile(componentsJsonPath, JSON.stringify(componentsJson, null, 2));

    // Create lib/utils.ts
    const utilsPath = path.join(context.workspacePath, 'lib/utils.ts');
    await fsExtra.ensureDir(path.dirname(utilsPath));
    const utilsContent = this.generateUtilsContent();
    await fsExtra.writeFile(utilsPath, utilsContent);
  }

  async execute(context: AgentContext): Promise<PluginResult> {
    const startTime = Date.now();
    const artifacts: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      context.log('Starting Shadcn/UI setup...', 'info');

      // Validate configuration
      const validation = await this.validate(context);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.message),
          warnings: validation.warnings,
          artifacts: [],
          duration: Date.now() - startTime
        };
      }

      // Execute setup steps
      await this.install(context);
      await this.setupDesignSystem(context);
      await this.configureStyling(context);

      // Generate selected components
      const components = await this.getComponents(context);
      for (const component of components) {
        await this.generateComponent(context, component);
        artifacts.push(`components/ui/${component}.tsx`);
      }

      // Add generated files to artifacts
      artifacts.push(
        'components.json',
        'lib/utils.ts',
        'tailwind.config.js',
        'app/globals.css'
      );

      context.log('Shadcn/UI setup completed successfully', 'info');

      return {
        success: true,
        artifacts,
        warnings,
        errors,
        dependencies: ["@radix-ui/react-slot", "class-variance-authority", "clsx", "tailwind-merge", "lucide-react"],
        scripts: {
          "ui:add": "npx shadcn@latest add",
          "ui:init": "npx shadcn@latest init"
        },
        configs: {
          "shadcn": {
            theme: context.answers.theme || "system",
            colorScheme: context.answers.colorScheme || "slate",
            radius: context.answers.radius || "0.5rem"
          }
        },
        duration: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.log(`Shadcn/UI setup failed: ${errorMessage}`, 'error');
      
      return {
        success: false,
        errors: [errorMessage],
        warnings,
        artifacts: [],
        duration: Date.now() - startTime
      };
    }
  }

  async rollback(context: AgentContext): Promise<void> {
    context.log('Rolling back Shadcn/UI setup...', 'info');
    
    const filesToRemove = [
      'components.json',
      'lib/utils.ts',
      'components/ui',
      'tailwind.config.js'
    ];

    for (const file of filesToRemove) {
      const filePath = path.join(context.workspacePath, file);
      if (await fsExtra.pathExists(filePath)) {
        await fsExtra.remove(filePath);
      }
    }

    // Remove dependencies
    await context.runStep('remove-deps', 'npm uninstall @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react');
    
    context.log('Shadcn/UI rollback completed', 'info');
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateComponentContent(name: string, props?: any): string {
    switch (name) {
      case 'button':
        return `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
`;

      case 'card':
        return `import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
`;

      default:
        return `import * as React from "react"
import { cn } from "@/lib/utils"

export interface ${name.charAt(0).toUpperCase() + name.slice(1)}Props
  extends React.HTMLAttributes<HTMLDivElement> {}

const ${name.charAt(0).toUpperCase() + name.slice(1)} = React.forwardRef<
  HTMLDivElement,
  ${name.charAt(0).toUpperCase() + name.slice(1)}Props
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
${name.charAt(0).toUpperCase() + name.slice(1)}.displayName = "${name.charAt(0).toUpperCase() + name.slice(1)}"

export { ${name.charAt(0).toUpperCase() + name.slice(1)} }
`;
    }
  }

  private generateComponentsJson(config: any): any {
    return {
      "$schema": "https://ui.shadcn.com/schema.json",
      "style": "default",
      "rsc": true,
      "tsx": true,
      "tailwind": {
        "config": "tailwind.config.js",
        "css": "app/globals.css",
        "baseColor": config.colorScheme || "slate",
        "cssVariables": config.cssVariables !== false
      },
      "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils"
      }
    };
  }

  private generateUtilsContent(): string {
    return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;
  }

  private generateTailwindConfig(config: any): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
`;
  }

  private generateGlobalCSS(config: any): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
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
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
  }
} 