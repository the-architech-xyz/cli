'use client';

import { ReactNode } from 'react';
import { useAuth } from './use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, User, Settings } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({ 
  children, 
  title = "Welcome Back",
  subtitle = "Sign in to your account"
}: AuthLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left side - Auth form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                {title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {subtitle}
              </p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {children}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - User info (if logged in) */}
        {user && (
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
            <div className="max-w-md space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.name || user.email}!
                </h3>
                <p className="text-gray-600">
                  You're already signed in to your account
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/settings'}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={logout}
                    className="flex-1"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
