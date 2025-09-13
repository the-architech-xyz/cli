/**
 * Next.js Middleware Feature
 * 
 * Adds middleware for auth, redirects, and more to Next.js
 */

import { Blueprint } from '../../../../types/adapter.js';

const middlewareBlueprint: Blueprint = {
  id: 'nextjs-middleware',
  name: 'Next.js Middleware',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'middleware.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Middleware configuration
const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply middleware in order
  let response = NextResponse.next();
  
  // 1. Security headers
  response = addSecurityHeaders(response);
  
  // 2. Rate limiting
  response = await applyRateLimit(request, response);
  
  // 3. Authentication
  response = await handleAuthentication(request, response, pathname);
  
  // 4. Redirects
  response = handleRedirects(request, response, pathname);
  
  // 5. Logging
  logRequest(request, response);
  
  return response;
}

// Security headers middleware
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

// Rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function applyRateLimit(
  request: NextRequest, 
  response: NextResponse
): Promise<NextResponse> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // 100 requests per window
  
  const current = rateLimitStore.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return response;
  }
  
  if (current.count >= maxRequests) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
      },
    });
  }
  
  current.count++;
  return response;
}

// Authentication middleware
async function handleAuthentication(
  request: NextRequest,
  response: NextResponse,
  pathname: string
): Promise<NextResponse> {
  // Protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    try {
      const token = await getToken({ req: request });
      
      if (!token) {
        const loginUrl = new URL('/auth/signin', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Add user info to headers for API routes
      response.headers.set('x-user-id', token.sub || '');
      response.headers.set('x-user-email', token.email || '');
    } catch (error) {
      console.error('Auth middleware error:', error);
      const loginUrl = new URL('/auth/signin', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Redirect authenticated users away from auth pages
  const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  if (isAuthRoute) {
    try {
      const token = await getToken({ req: request });
      
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Auth redirect error:', error);
    }
  }
  
  return response;
}

// Redirects middleware
function handleRedirects(
  request: NextRequest,
  response: NextResponse,
  pathname: string
): NextResponse {
  // Custom redirects
  const redirects: Record<string, string> = {
    '/home': '/',
    '/login': '/auth/signin',
    '/register': '/auth/signup',
  };
  
  if (redirects[pathname]) {
    return NextResponse.redirect(new URL(redirects[pathname], request.url));
  }
  
  // Trailing slash handling
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }
  
  return response;
}

// Logging middleware
function logRequest(request: NextRequest, response: NextResponse): void {
  if (process.env.NODE_ENV === 'development') {
    const { pathname, search } = request.nextUrl;
    const method = request.method;
    const status = response.status;
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    
    console.log(\`\${method} \${pathname}\${search} - \${status} - \${userAgent}\`);
  }
}

export { config };`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/middleware/auth.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Auth middleware utilities
export class AuthMiddleware {
  static async requireAuth(
    request: NextRequest,
    redirectTo: string = '/auth/signin'
  ): Promise<NextResponse | null> {
    try {
      const token = await getToken({ req: request });
      
      if (!token) {
        const url = new URL(redirectTo, request.url);
        url.searchParams.set('callbackUrl', request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
      
      return null; // User is authenticated
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  static async requireRole(
    request: NextRequest,
    requiredRole: string,
    redirectTo: string = '/unauthorized'
  ): Promise<NextResponse | null> {
    try {
      const token = await getToken({ req: request });
      
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
      
      const userRole = token.role || 'user';
      
      if (userRole !== requiredRole && userRole !== 'admin') {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      
      return null; // User has required role
    } catch (error) {
      console.error('Role middleware error:', error);
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  static async requirePermissions(
    request: NextRequest,
    requiredPermissions: string[],
    redirectTo: string = '/unauthorized'
  ): Promise<NextResponse | null> {
    try {
      const token = await getToken({ req: request });
      
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
      
      const userPermissions = token.permissions || [];
      
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      
      return null; // User has required permissions
    } catch (error) {
      console.error('Permission middleware error:', error);
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  static addUserToHeaders(
    request: NextRequest,
    response: NextResponse
  ): NextResponse {
    getToken({ req: request }).then(token => {
      if (token) {
        response.headers.set('x-user-id', token.sub || '');
        response.headers.set('x-user-email', token.email || '');
        response.headers.set('x-user-role', token.role || 'user');
      }
    });
    
    return response;
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/middleware/redirects.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';

// Redirect configuration
export interface RedirectRule {
  from: string | RegExp;
  to: string;
  status?: 301 | 302 | 307 | 308;
  permanent?: boolean;
}

// Default redirect rules
export const defaultRedirects: RedirectRule[] = [
  {
    from: '/home',
    to: '/',
    status: 301,
  },
  {
    from: '/login',
    to: '/auth/signin',
    status: 301,
  },
  {
    from: '/register',
    to: '/auth/signup',
    status: 301,
  },
  {
    from: '/dashboard',
    to: '/dashboard/overview',
    status: 302,
  },
];

// Redirect middleware utilities
export class RedirectMiddleware {
  static applyRedirects(
    request: NextRequest,
    redirects: RedirectRule[] = defaultRedirects
  ): NextResponse | null {
    const { pathname } = request.nextUrl;
    
    for (const redirect of redirects) {
      if (this.matchesPath(pathname, redirect.from)) {
        const url = new URL(redirect.to, request.url);
        
        // Preserve query parameters
        request.nextUrl.searchParams.forEach((value, key) => {
          url.searchParams.set(key, value);
        });
        
        return NextResponse.redirect(url, redirect.status || 301);
      }
    }
    
    return null; // No redirect needed
  }

  private static matchesPath(pathname: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return pathname === pattern || pathname.startsWith(pattern + '/');
    }
    
    return pattern.test(pathname);
  }

  static handleTrailingSlash(
    request: NextRequest,
    removeTrailingSlash: boolean = true
  ): NextResponse | null {
    const { pathname } = request.nextUrl;
    
    if (removeTrailingSlash && pathname.length > 1 && pathname.endsWith('/')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(0, -1);
      return NextResponse.redirect(url, 301);
    }
    
    if (!removeTrailingSlash && pathname.length > 1 && !pathname.endsWith('/')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname + '/';
      return NextResponse.redirect(url, 301);
    }
    
    return null;
  }

  static handleWwwRedirect(
    request: NextRequest,
    addWww: boolean = false
  ): NextResponse | null {
    const { hostname } = request.nextUrl;
    
    if (addWww && !hostname.startsWith('www.')) {
      const url = request.nextUrl.clone();
      url.hostname = 'www.' + hostname;
      return NextResponse.redirect(url, 301);
    }
    
    if (!addWww && hostname.startsWith('www.')) {
      const url = request.nextUrl.clone();
      url.hostname = hostname.slice(4);
      return NextResponse.redirect(url, 301);
    }
    
    return null;
  }

  static handleHttpsRedirect(
    request: NextRequest,
    forceHttps: boolean = true
  ): NextResponse | null {
    if (forceHttps && request.nextUrl.protocol === 'http:') {
      const url = request.nextUrl.clone();
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    }
    
    return null;
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/middleware/security.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';

// Security headers configuration
export interface SecurityHeaders {
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'X-XSS-Protection'?: string;
  'Content-Security-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'Permissions-Policy'?: string;
}

// Default security headers
export const defaultSecurityHeaders: SecurityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Content Security Policy
export const defaultCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Security middleware utilities
export class SecurityMiddleware {
  static addSecurityHeaders(
    response: NextResponse,
    customHeaders: SecurityHeaders = {}
  ): NextResponse {
    const headers = { ...defaultSecurityHeaders, ...customHeaders };
    
    // Add CSP if not provided
    if (!headers['Content-Security-Policy']) {
      headers['Content-Security-Policy'] = defaultCSP;
    }
    
    // Apply headers
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value);
      }
    });
    
    return response;
  }

  static blockSuspiciousRequests(
    request: NextRequest
  ): NextResponse | null {
    const { pathname, search } = request.nextUrl;
    const userAgent = request.headers.get('user-agent') || '';
    
    // Block common attack patterns
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript protocol
      /vbscript:/i, // VBScript protocol
    ];
    
    const fullPath = pathname + search;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fullPath) || pattern.test(userAgent)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    
    // Block suspicious user agents
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
    ];
    
    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    
    return null; // Request is safe
  }

  static validateOrigin(
    request: NextRequest,
    allowedOrigins: string[] = []
  ): NextResponse | null {
    const origin = request.headers.get('origin');
    
    if (!origin) {
      return null; // No origin header (same-origin request)
    }
    
    if (allowedOrigins.length === 0) {
      return null; // No restrictions
    }
    
    if (!allowedOrigins.includes(origin)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    return null; // Origin is allowed
  }

  static addCorsHeaders(
    response: NextResponse,
    allowedOrigins: string[] = ['*']
  ): NextResponse {
    const origin = response.headers.get('origin');
    
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    
    return response;
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/unauthorized/page.tsx',
      content: `export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Unauthorized Access
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this resource.
          </p>
        </div>
        <div className="mt-8">
          <a
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}`
    }
  ]
};
export default middlewareBlueprint;
