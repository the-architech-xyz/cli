/**
 * Better Auth Admin Panel Feature Blueprint
 * 
 * Adds admin utilities and management functions for Better Auth
 */

import { Blueprint } from '../../../../types/adapter.js';

const adminPanelBlueprint: Blueprint = {
  id: 'better-auth-admin-panel',
  name: 'Better Auth Admin Panel',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/auth/admin.ts',
      content: `import { auth } from './config';

// Admin utilities for Better Auth
export class AdminManager {
  static async getAllUsers(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    try {
      // This would typically query your database directly
      // For Better Auth, you might need to implement custom queries
      const users = await auth.api.listUsers({
        limit: options?.limit || 50,
        offset: options?.offset || 0,
      });

      return { success: true, users };
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserById(userId: string) {
    try {
      const user = await auth.api.getUser({ userId });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, user };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateUser(userId: string, updates: {
    email?: string;
    name?: string;
    role?: string;
    emailVerified?: boolean;
    disabled?: boolean;
  }) {
    try {
      const user = await auth.api.updateUser({
        userId,
        ...updates,
      });

      return { success: true, user };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteUser(userId: string) {
    try {
      await auth.api.deleteUser({ userId });
      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserSessions(userId: string) {
    try {
      // Better Auth doesn't have a direct API for this
      // You might need to implement custom session tracking
      const sessions = await auth.api.listSessions({ userId });
      return { success: true, sessions };
    } catch (error) {
      console.error('Get user sessions error:', error);
      return { success: false, error: error.message };
    }
  }

  static async revokeUserSessions(userId: string) {
    try {
      await auth.api.revokeAllSessions({ userId });
      return { success: true };
    } catch (error) {
      console.error('Revoke user sessions error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getSystemStats() {
    try {
      // Implement custom stats based on your database
      const stats = {
        totalUsers: 0, // Query from your database
        activeUsers: 0, // Users with recent activity
        verifiedUsers: 0, // Users with verified emails
        newUsersToday: 0, // Users created today
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Get system stats error:', error);
      return { success: false, error: error.message };
    }
  }

  static async exportUsers(format: 'csv' | 'json' = 'json') {
    try {
      const users = await this.getAllUsers({ limit: 10000 });
      
      if (!users.success) {
        return users;
      }

      if (format === 'csv') {
        const csv = this.convertToCSV(users.users);
        return { success: true, data: csv, format: 'csv' };
      } else {
        return { success: true, data: users.users, format: 'json' };
      }
    } catch (error) {
      console.error('Export users error:', error);
      return { success: false, error: error.message };
    }
  }

  private static convertToCSV(users: any[]): string {
    if (!users.length) return '';

    const headers = Object.keys(users[0]).join(',');
    const rows = users.map(user => 
      Object.values(user).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? '"' + value + '"' 
          : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

// Role management utilities
export class RoleManager {
  static async assignRole(userId: string, role: string) {
    try {
      const user = await auth.api.updateUser({
        userId,
        role,
      });

      return { success: true, user };
    } catch (error) {
      console.error('Assign role error:', error);
      return { success: false, error: error.message };
    }
  }

  static async removeRole(userId: string) {
    try {
      const user = await auth.api.updateUser({
        userId,
        role: null,
      });

      return { success: true, user };
    } catch (error) {
      console.error('Remove role error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUsersByRole(role: string) {
    try {
      // This would typically require a custom database query
      // Better Auth doesn't have built-in role filtering
      const users = await auth.api.listUsers();
      const filteredUsers = users.filter(user => user.role === role);

      return { success: true, users: filteredUsers };
    } catch (error) {
      console.error('Get users by role error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Audit log utilities
export class AuditLogger {
  static async logAction(action: string, details: {
    userId?: string;
    adminId?: string;
    targetUserId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const logEntry = {
        action,
        timestamp: new Date().toISOString(),
        ...details,
      };

      // Store in your audit log system
      console.log('Audit log:', logEntry);
      
      return { success: true, logEntry };
    } catch (error) {
      console.error('Audit log error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAuditLogs(options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      // Implement audit log retrieval from your storage
      const logs = [];
      
      return { success: true, logs };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return { success: false, error: error.message };
    }
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'docs/integrations/better-auth-admin-panel.md',
      content: `# Better Auth Admin Panel Integration Guide

## Overview

This guide shows how to integrate Better Auth admin utilities with your admin dashboard and database.

## Prerequisites

- Better Auth configured
- Database for storing user data
- Admin authentication system

## Basic Setup

### 1. Environment Variables

\`\`\`bash
# .env.local
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Admin configuration
ADMIN_EMAIL="admin@yourapp.com"
ADMIN_ROLE="admin"
\`\`\`

## Integration Examples

### With Database (Drizzle/Prisma)

\`\`\`typescript
// src/lib/db/admin.ts
import { db } from './index';
import { users, auditLogs } from './schema';
import { eq, desc, count, gte, lte } from 'drizzle-orm';
import { AdminManager, RoleManager, AuditLogger } from '@/lib/auth/admin';

export class DatabaseAdminManager extends AdminManager {
  static async getAllUsers(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    try {
      let query = db.select().from(users);
      
      if (options?.search) {
        query = query.where(
          or(
            like(users.email, \`%\${options.search}%\`),
            like(users.name, \`%\${options.search}%\`)
          )
        );
      }
      
      const result = await query
        .limit(options?.limit || 50)
        .offset(options?.offset || 0)
        .orderBy(desc(users.createdAt));

      return { success: true, users: result };
    } catch (error) {
      console.error('Database get all users error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getSystemStats() {
    try {
      const [totalUsers] = await db.select({ count: count() }).from(users);
      
      const [activeUsers] = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.lastLoginAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));

      const [verifiedUsers] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.emailVerified, true));

      const [newUsersToday] = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

      const stats = {
        totalUsers: totalUsers.count,
        activeUsers: activeUsers.count,
        verifiedUsers: verifiedUsers.count,
        newUsersToday: newUsersToday.count,
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Get system stats error:', error);
      return { success: false, error: error.message };
    }
  }
}

export class DatabaseAuditLogger extends AuditLogger {
  static async logAction(action: string, details: {
    userId?: string;
    adminId?: string;
    targetUserId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const logEntry = {
        action,
        timestamp: new Date(),
        ...details,
      };

      await db.insert(auditLogs).values(logEntry);
      
      return { success: true, logEntry };
    } catch (error) {
      console.error('Database audit log error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAuditLogs(options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      let query = db.select().from(auditLogs);
      
      if (options?.userId) {
        query = query.where(eq(auditLogs.userId, options.userId));
      }
      
      if (options?.action) {
        query = query.where(eq(auditLogs.action, options.action));
      }
      
      if (options?.startDate) {
        query = query.where(gte(auditLogs.timestamp, new Date(options.startDate)));
      }
      
      if (options?.endDate) {
        query = query.where(lte(auditLogs.timestamp, new Date(options.endDate)));
      }
      
      const logs = await query
        .limit(options?.limit || 100)
        .offset(options?.offset || 0)
        .orderBy(desc(auditLogs.timestamp));

      return { success: true, logs };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return { success: false, error: error.message };
    }
  }
}
\`\`\`

## API Routes

### Admin Users Route

\`\`\`typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdminManager } from '@/lib/db/admin';
import { requireAdmin } from '@/lib/auth/middleware';

export const GET = requireAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || undefined;

    const result = await DatabaseAdminManager.getAllUsers({
      limit,
      offset,
      search,
    });

    if (result.success) {
      return NextResponse.json({ users: result.users });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
});

export const POST = requireAdmin(async (req: NextRequest) => {
  try {
    const { userId, updates } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await DatabaseAdminManager.updateUser(userId, updates);

    if (result.success) {
      return NextResponse.json({ user: result.user });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
});
\`\`\`

### Admin Stats Route

\`\`\`typescript
// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdminManager } from '@/lib/db/admin';
import { requireAdmin } from '@/lib/auth/middleware';

export const GET = requireAdmin(async (req: NextRequest) => {
  try {
    const result = await DatabaseAdminManager.getSystemStats();

    if (result.success) {
      return NextResponse.json({ stats: result.stats });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
});
\`\`\`

## Middleware

### Admin Authentication Middleware

\`\`\`typescript
// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from './config';

export function requireAdmin(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const session = await auth();
      
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      return handler(req, ...args);
    } catch (error) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
  };
}

export function requireRole(role: string) {
  return function(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      try {
        const session = await auth();
        
        if (!session?.user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== role) {
          return NextResponse.json({ error: \`\${role} access required\` }, { status: 403 });
        }

        return handler(req, ...args);
      } catch (error) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    };
  };
}
\`\`\`

## UI Components

### Admin Dashboard Component

\`\`\`typescript
// src/components/admin/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  newUsersToday: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
          <CardDescription>All registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
          <CardDescription>Users active in last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verified Users</CardTitle>
          <CardDescription>Users with verified emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.verifiedUsers || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New Users Today</CardTitle>
          <CardDescription>Users registered today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.newUsersToday || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}
\`\`\`

## Best Practices

1. **Always validate admin permissions** before allowing access
2. **Log all admin actions** for audit purposes
3. **Implement rate limiting** for admin endpoints
4. **Use database transactions** for critical operations
5. **Implement proper error handling** and user feedback

## Common Patterns

### Admin Route Protection

\`\`\`typescript
// Protect admin routes
export const GET = requireAdmin(async (req: NextRequest) => {
  // Admin-only logic here
});

// Protect specific role routes
export const POST = requireRole('super-admin')(async (req: NextRequest) => {
  // Super admin only logic here
});
\`\`\`

### Audit Logging

\`\`\`typescript
// Log admin actions
await DatabaseAuditLogger.logAction('user.updated', {
  adminId: session.user.id,
  targetUserId: userId,
  metadata: { changes: updates }
});
\`\`\`
`
    }
  ]
};
export default adminPanelBlueprint;
