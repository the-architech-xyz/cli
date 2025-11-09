import { ReactNode } from 'react';
import { useAuth } from './use-auth';
import AuthGuard from './AuthGuard';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  roles?: string[];
  permissions?: string[];
}

export default function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/unauthorized',
  roles = [],
  permissions = []
}: ProtectedRouteProps) {
  const { user } = useAuth();

  // Check if user has required roles
  const hasRequiredRole = roles.length === 0 || 
    (user && roles.some(role => user.roles?.includes(role)));

  // Check if user has required permissions
  const hasRequiredPermissions = permissions.length === 0 || 
    (user && permissions.every(permission => user.permissions?.includes(permission)));

  const isAuthorized = hasRequiredRole && hasRequiredPermissions;

  if (!isAuthorized) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Unauthorized</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this resource
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
}
