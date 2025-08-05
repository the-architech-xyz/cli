/**
 * Better Auth Adapter - Enhanced Implementation
 * 
 * Comprehensive implementation of IAuthProvider for Better Auth.
 * Includes authentication setup, middleware generation, provider configuration,
 * and proper file management with rollback capabilities.
 */

import { IAuthProvider } from '../../interfaces/providers.js';
import { AgentContext, PluginResult, PluginMetadata, ParameterSchema, CoreCategory, ValidationResult, ValidationError } from '../../interfaces/base.js';
import fsExtra from 'fs-extra';
import * as path from 'path';

export class BetterAuthAdapter implements IAuthProvider {
  getMetadata(): PluginMetadata {
    return {
      name: "@architech/better-auth-adapter",
      version: "0.1.0",
      category: CoreCategory.AUTH,
      description: "Modern, secure authentication library with excellent Next.js integration",
      dependencies: ["@auth/core", "@auth/nextjs", "next-auth"],
      conflicts: ["@supabase/auth-helpers-nextjs", "firebase/auth"],
      requirements: [
        {
          type: "package",
          name: "next",
          description: "Next.js is required for Better Auth"
        }
      ],
      license: "MIT",
      repository: "https://github.com/nextauthjs/next-auth",
      documentation: "https://next-auth.js.org/",
      tags: ["auth", "authentication", "nextjs", "oauth", "security"],
      author: "The Architech Team"
    };
  }

  getParameterSchema(): ParameterSchema {
    return {
      parameters: [
        {
          id: "providers",
          name: "Authentication Providers",
          description: "Select authentication providers to enable",
          type: "array",
          required: true,
          default: ["credentials", "github"],
          enum: ["credentials", "github", "google", "discord", "twitter", "email", "magic-link"]
        },
        {
          id: "database",
          name: "Database",
          description: "Database for storing user sessions",
          type: "string",
          required: true,
          default: "drizzle",
          enum: ["drizzle", "prisma", "mongodb", "postgresql"]
        },
        {
          id: "sessionStrategy",
          name: "Session Strategy",
          description: "How to handle user sessions",
          type: "string",
          required: true,
          default: "jwt",
          enum: ["jwt", "database"]
        },
        {
          id: "secret",
          name: "Secret Key",
          description: "Secret key for JWT signing (auto-generated if empty)",
          type: "string",
          required: false
        },
        {
          id: "pages",
          name: "Custom Pages",
          description: "Enable custom sign-in/sign-up pages",
          type: "boolean",
          default: true
        },
        {
          id: "callbacks",
          name: "Enable Callbacks",
          description: "Enable auth callbacks for custom logic",
          type: "boolean",
          default: true
        }
      ],
      groups: [
        {
          id: "providers",
          name: "Authentication Providers",
          description: "Configure your authentication providers",
          order: 1
        },
        {
          id: "configuration",
          name: "Auth Configuration",
          description: "Configure authentication settings",
          order: 2
        }
      ]
    };
  }

  async validate(context: AgentContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check if Next.js is installed
    const packageJsonPath = path.join(context.workspacePath, 'package.json');
    if (await fsExtra.pathExists(packageJsonPath)) {
      const packageJson = await fsExtra.readJson(packageJsonPath);
      if (!packageJson.dependencies?.next) {
        errors.push({
          field: "dependencies",
          message: "Next.js is required for Better Auth",
          code: "MISSING_NEXTJS",
          severity: "error"
        });
      }
    }

    // Validate providers selection
    const providers = context.answers.providers || [];
    if (providers.length === 0) {
      errors.push({
        field: "providers",
        message: "At least one authentication provider must be selected",
        code: "NO_PROVIDERS",
        severity: "error"
      });
    }

    // Check for conflicts
    if (await fsExtra.pathExists(packageJsonPath)) {
      const packageJson = await fsExtra.readJson(packageJsonPath);
      if (packageJson.dependencies?.["@supabase/auth-helpers-nextjs"]) {
        errors.push({
          field: "dependencies",
          message: "Supabase Auth is installed and may conflict with Better Auth",
          code: "CONFLICTING_AUTH",
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

  async setup(context: AgentContext): Promise<void> {
    // Install dependencies
    await context.runStep('install-auth', 'npm install @auth/core @auth/nextjs next-auth');
    
    // Install provider-specific dependencies
    const providers = context.answers.providers || [];
    if (providers.includes('github')) {
      await context.runStep('install-github', 'npm install @auth/github-provider');
    }
    if (providers.includes('google')) {
      await context.runStep('install-google', 'npm install @auth/google-provider');
    }
  }

  async getClientMethods(context: AgentContext): Promise<string[]> {
    return [
      'signIn',
      'signOut', 
      'getSession',
      'getProviders',
      'useSession',
      'signInWithRedirect',
      'signOutWithRedirect'
    ];
  }

  async getServerMethods(context: AgentContext): Promise<string[]> {
    return [
      'getServerSession',
      'auth',
      'signIn',
      'signOut',
      'getProviders'
    ];
  }

  async generateMiddleware(context: AgentContext): Promise<void> {
    const middlewarePath = path.join(context.workspacePath, 'middleware.ts');
    const middlewareContent = this.generateMiddlewareContent(context.answers);
    await fsExtra.writeFile(middlewarePath, middlewareContent);
    
    context.log('Auth middleware generated successfully', 'info');
  }

  async configureProviders(context: AgentContext): Promise<void> {
    const authConfigPath = path.join(context.workspacePath, 'lib/auth.ts');
    await fsExtra.ensureDir(path.dirname(authConfigPath));
    
    const authConfigContent = this.generateAuthConfig(context.answers);
    await fsExtra.writeFile(authConfigPath, authConfigContent);
    
    context.log('Auth configuration generated successfully', 'info');
  }

  async setupSession(context: AgentContext): Promise<void> {
    const sessionPath = path.join(context.workspacePath, 'lib/session.ts');
    await fsExtra.ensureDir(path.dirname(sessionPath));
    
    const sessionContent = this.generateSessionConfig(context.answers);
    await fsExtra.writeFile(sessionPath, sessionContent);
    
    context.log('Session configuration generated successfully', 'info');
  }

  async generateAuthComponents(context: AgentContext): Promise<void> {
    const componentsDir = path.join(context.workspacePath, 'components/auth');
    await fsExtra.ensureDir(componentsDir);

    // Generate sign-in component
    const signInPath = path.join(componentsDir, 'sign-in.tsx');
    const signInContent = this.generateSignInComponent(context.answers);
    await fsExtra.writeFile(signInPath, signInContent);

    // Generate sign-out component
    const signOutPath = path.join(componentsDir, 'sign-out.tsx');
    const signOutContent = this.generateSignOutComponent(context.answers);
    await fsExtra.writeFile(signOutPath, signOutContent);

    // Generate user menu component
    const userMenuPath = path.join(componentsDir, 'user-menu.tsx');
    const userMenuContent = this.generateUserMenuComponent(context.answers);
    await fsExtra.writeFile(userMenuPath, userMenuContent);
    
    context.log('Auth components generated successfully', 'info');
  }

  async execute(context: AgentContext): Promise<PluginResult> {
    const startTime = Date.now();
    const artifacts: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      context.log('Starting Better Auth setup...', 'info');

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
      await this.setup(context);
      await this.configureProviders(context);
      await this.setupSession(context);
      await this.generateMiddleware(context);
      await this.generateAuthComponents(context);

      // Add generated files to artifacts
      artifacts.push(
        'lib/auth.ts',
        'lib/session.ts',
        'middleware.ts',
        'components/auth/sign-in.tsx',
        'components/auth/sign-out.tsx',
        'components/auth/user-menu.tsx'
      );

      context.log('Better Auth setup completed successfully', 'info');

      return {
        success: true,
        artifacts,
        warnings,
        errors,
        dependencies: ["@auth/core", "@auth/nextjs", "next-auth"],
        scripts: {
          "auth:setup": "npx @auth/nextjs setup",
          "auth:generate": "npx @auth/nextjs generate"
        },
        configs: {
          "auth": {
            providers: context.answers.providers || ["credentials", "github"],
            sessionStrategy: context.answers.sessionStrategy || "jwt",
            database: context.answers.database || "drizzle"
          }
        },
        duration: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.log(`Better Auth setup failed: ${errorMessage}`, 'error');
      
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
    context.log('Rolling back Better Auth setup...', 'info');
    
    const filesToRemove = [
      'lib/auth.ts',
      'lib/session.ts',
      'middleware.ts',
      'components/auth'
    ];

    for (const file of filesToRemove) {
      const filePath = path.join(context.workspacePath, file);
      if (await fsExtra.pathExists(filePath)) {
        await fsExtra.remove(filePath);
      }
    }

    // Remove dependencies
    await context.runStep('remove-deps', 'npm uninstall @auth/core @auth/nextjs next-auth');
    
    context.log('Better Auth rollback completed', 'info');
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateAuthConfig(config: any): string {
    const providers = config.providers || ["credentials", "github"];
    const sessionStrategy = config.sessionStrategy || "jwt";
    const database = config.database || "drizzle";

    let providerImports = '';
    let providerConfigs = '';

    if (providers.includes('github')) {
      providerImports += `import GitHub from "next-auth/providers/github";\n`;
      providerConfigs += `
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),`;
    }

    if (providers.includes('google')) {
      providerImports += `import Google from "next-auth/providers/google";\n`;
      providerConfigs += `
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),`;
    }

    if (providers.includes('credentials')) {
      providerImports += `import Credentials from "next-auth/providers/credentials";\n`;
      providerConfigs += `
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your authentication logic here
        if (credentials?.email === "admin@example.com" && credentials?.password === "password") {
          return {
            id: "1",
            email: "admin@example.com",
            name: "Admin User",
          };
        }
        return null;
      }
    }),`;
    }

    return `import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
${providerImports}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [${providerConfigs}
  ],
  session: {
    strategy: "${sessionStrategy}",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
});
`;
  }

  private generateSessionConfig(config: any): string {
    return `import { getServerSession } from "next-auth";
import { authConfig } from "./auth.config";

export function getSession() {
  return getServerSession(authConfig);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}
`;
  }

  private generateMiddlewareContent(config: any): string {
    return `import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
`;
  }

  private generateSignInComponent(config: any): string {
    return `"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch (error) {
      console.error(\`\${provider} sign in error:\`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleProviderSignIn("github")}
              disabled={isLoading}
            >
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleProviderSignIn("google")}
              disabled={isLoading}
            >
              Continue with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;
  }

  private generateSignOutComponent(config: any): string {
    return `"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOut() {
  return (
    <Button
      variant="outline"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign Out
    </Button>
  );
}
`;
  }

  private generateUserMenuComponent(config: any): string {
    return `"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOut } from "./sign-out";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <Button variant="outline" asChild>
        <a href="/auth/signin">Sign In</a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
            <AvatarFallback>{session.user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/profile">Profile</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/settings">Settings</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOut />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
`;
  }
} 