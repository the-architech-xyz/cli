/**
 * Team Settings Page
 * 
 * Simple team settings management interface
 */

'use client';

import { useState } from 'react';
import { useTeam, useUpdateTeam } from '@/lib/teams/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export function TeamSettingsPage({ teamId }: { teamId: string }) {
  const { data: team, isLoading } = useTeam(teamId);
  const updateTeam = useTeamsUpdate();
  const { toast } = useToast();
  
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateTeam.mutateAsync({
        id: teamId,
        name,
        description,
      });
      
      toast({
        title: 'Settings updated',
        description: 'Team settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Loading team settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Settings</CardTitle>
        <CardDescription>Manage your team's basic information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description"
              rows={4}
            />
          </div>
          
          <Button type="submit" disabled={updateTeam.isPending}>
            {updateTeam.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
