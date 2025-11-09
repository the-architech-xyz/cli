/**
 * Team Metrics Component
 * 
 * Simple team metrics and statistics display
 */

'use client';

import { useTeamStats } from '@/lib/teams/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Activity } from 'lucide-react';

export function TeamMetrics({ teamId }: { teamId: string }) {
  const { data: stats, isLoading } = useTeamStats(teamId);

  if (isLoading) {
    return <div>Loading team metrics...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.memberCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Active team members
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projects</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.projectCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Active projects
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activityScore || 0}%</div>
          <p className="text-xs text-muted-foreground">
            Team activity score
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
