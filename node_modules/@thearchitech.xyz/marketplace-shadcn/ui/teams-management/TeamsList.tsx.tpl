'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useTeamsList } from '@/lib/teams-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Search, 
  Plus, 
  Settings, 
  Eye, 
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Team } from '@/lib/teams-management';

interface TeamsListProps {
  className?: string;
  onCreateTeam?: () => void;
  onViewTeam?: (team: Team) => void;
  onEditTeam?: (team: Team) => void;
  onDeleteTeam?: (team: Team) => void;
}

export function TeamsList({ 
  className, 
  onCreateTeam, 
  onViewTeam, 
  onEditTeam, 
  onDeleteTeam 
}: TeamsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: teams, isLoading, error, refetch } = useTeamsList({
    search: searchTerm || undefined
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load teams. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams
            </CardTitle>
            <CardDescription>
              Manage your teams and collaborate with others
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {onCreateTeam && (
              <Button onClick={onCreateTeam}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Teams Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No teams found matching your search' : 'No teams yet'}
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{team.name}</div>
                          {team.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {team.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{team.memberCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Owner
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(team.createdAt), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.isActive ? 'default' : 'secondary'}>
                        {team.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewTeam && (
                            <DropdownMenuItem onClick={() => onViewTeam(team)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Team
                            </DropdownMenuItem>
                          )}
                          {onEditTeam && (
                            <DropdownMenuItem onClick={() => onEditTeam(team)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Team
                            </DropdownMenuItem>
                          )}
                          {onDeleteTeam && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteTeam(team)}
                                className="text-destructive focus:text-destructive"
                              >
                                Delete Team
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button onClick={loadMore} variant="outline">
              Load More Teams
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && teams.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team to start collaborating with others
            </p>
            {onCreateTeam && (
              <Button onClick={onCreateTeam}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
