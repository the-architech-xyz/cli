import { Blueprint } from '../../types/adapter.js';

export const blueprint: Blueprint = {
  id: 'better-auth-nextjs-integration',
  name: 'Better Auth Next.js Integration',
  description: 'Complete Next.js integration for Better Auth',
  version: '2.0.0',
  actions: [
    // Add Next.js specific environment variables
    {
      type: 'ADD_ENV_VAR',
      key: 'BETTER_AUTH_SECRET',
      value: 'your-secret-key',
      description: 'Better Auth secret key for JWT signing'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'BETTER_AUTH_URL',
      value: 'http://localhost:3000',
      description: 'Better Auth base URL'
    },
    
    // PURE MODIFIER: Enhance the auth config with Next.js specific features
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/auth/config.ts',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js specific auth handler
export async function authHandler(request: NextRequest) {
  try {
    const response = await auth.handler(request);
    return response;
  } catch (error) {
    console.error('Auth handler error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Next.js specific middleware
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check authentication for protected routes
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;
  
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Create Next.js API route for auth
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/auth/[...all]/route.ts',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'authHandler', from: '@/lib/auth/config', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function GET(request: NextRequest) {
  return authHandler(request);
}

export async function POST(request: NextRequest) {
  return authHandler(request);
}

export async function PUT(request: NextRequest) {
  return authHandler(request);
}

export async function DELETE(request: NextRequest) {
  return authHandler(request);
}

export async function PATCH(request: NextRequest) {
  return authHandler(request);
}`
          }
        ]
      },
      condition: '{{#if integration.features.apiRoutes}}'
    },
    
    // PURE MODIFIER: Create Next.js middleware
    {
      type: 'ENHANCE_FILE',
      path: 'src/middleware.ts',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'authMiddleware', from: '@/lib/auth/config', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};`
          }
        ]
      },
      condition: '{{#if integration.features.middleware}}'
    },

    // PURE MODIFIER: Create Next.js auth components
    {
      type: 'ENHANCE_FILE',
      path: 'src/components/auth/auth-provider.tsx',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'createContext', from: 'react', type: 'import' },
          { name: 'useContext', from: 'react', type: 'import' },
          { name: 'useEffect', from: 'react', type: 'import' },
          { name: 'useState', from: 'react', type: 'import' },
          { name: 'auth', from: '@/lib/auth/config', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
      content: `'use client';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthResult {
  user?: User;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await auth.api.getSession({
          headers: new Headers()
        });
        setUser(session?.user || null);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await auth.api.signInEmail({
        body: { email, password }
      });
      
      if (result?.user) {
        setUser(result.user);
      }
      
      return result || { error: 'Sign in failed' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
    try {
      const result = await auth.api.signUpEmail({
        body: { email, password, name }
      });
      
      if (result?.user) {
        setUser(result.user);
      }
      
      return result || { error: 'Sign up failed' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Sign up failed' };
    }
  };

  const signOut = async () => {
    try {
      await auth.api.signOut({
        headers: new Headers()
      });
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}`
          }
        ]
      },
      condition: '{{#if integration.features.uiComponents}}'
    },

    // PURE MODIFIER: Create Next.js API route for auth (from better-auth-nextjs-api-routes)
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/auth/[...all]/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'toNextJsHandler', from: 'better-auth/next-js', type: 'import' },
          { name: 'authHandler', from: '@/lib/auth/config', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export const { GET, POST } = toNextJsHandler(authHandler);`
          }
        ]
      },
      condition: '{{#if integration.features.apiRoutes}}'
    }
  ]
};
