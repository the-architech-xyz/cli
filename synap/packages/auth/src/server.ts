import { betterAuth } from "better-auth";



/**
 * Better Auth Server Configuration
 * 
 * This is the ADAPTER layer - universal Better Auth SDK configuration.
 * Framework-specific wiring (Next.js, Express, etc.) is handled by connectors.
 */
export const auth = betterAuth({
  
  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  

  
  // Email verification
  emailVerification: {
    sendOnSignUp: true,
  },
  

  

  // Session management
  session: {
    expiresIn: 604800, // seconds
    updateAge: 86400, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 minutes
    },
  },

  // Security settings
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    storage: 'memory',
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'synap_auth',
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },

  // Plugins
  plugins: [
    
    
  ],
});

// Export inferred types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;

