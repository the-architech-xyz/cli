'use client';

import { useTeamsList, useTeamAnalytics } from '@/lib/teams-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Activity,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface TeamsDashboardProps {
  className?: string;
}

export function TeamsDashboard({ className }: TeamsDashboardProps) {
  const { data: teams, isLoading: teamsLoading, error: teamsError } = useTeamsList();
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useTeamAnalytics('current-team-id');

  if (teamsError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load dashboard data. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{teams.length}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Teams you're part of
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {teams.reduce((sum, team) => sum + team.memberCount, 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Across all teams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {teams.filter(team => team.isActive).length}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {teams.filter(team => {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return new Date(team.createdAt) > monthAgo;
                  }).length}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                New teams created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Teams
            </CardTitle>
            <CardDescription>
              Your most recently updated teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No teams yet. Create your first team to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {teams.slice(0, 5).map((team) => (
                  <div key={team.id} className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.memberCount} members • Updated {new Date(team.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {team.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Analytics (if available) */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Team Analytics
              </CardTitle>
              <CardDescription>
                Performance metrics for your teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.memberCount}</div>
                    <div className="text-sm text-muted-foreground">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.activeMembers}</div>
                    <div className="text-sm text-muted-foreground">Active Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.newMembers}</div>
                    <div className="text-sm text-muted-foreground">New This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.activityScore}%</div>
                    <div className="text-sm text-muted-foreground">Activity Score</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
