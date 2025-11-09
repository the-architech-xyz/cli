'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamsList } from '@/components/teams/TeamsList';
import { CreateTeamForm } from '@/components/teams/CreateTeamForm';
import { TeamsDashboard } from '@/components/teams/TeamsDashboard';
import { 
  Users, 
  Plus, 
  BarChart3, 
  Settings,
  Home
} from 'lucide-react';

export default function TeamsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleCreateTeam = () => {
    setShowCreateForm(true);
  };

  const handleTeamCreated = (team: any) => {
    setShowCreateForm(false);
    // Optionally redirect to the new team or refresh the list
  };

  const handleViewTeam = (team: any) => {
    setSelectedTeam(team);
    // Navigate to team detail page or open team modal
  };

  const handleEditTeam = (team: any) => {
    // Open edit team modal or navigate to edit page
    console.log('Edit team:', team);
  };

  const handleDeleteTeam = (team: any) => {
    if (confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
      // Handle team deletion
      console.log('Delete team:', team);
    }
  };

  if (showCreateForm) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <CreateTeamForm
          onSuccess={handleTeamCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">
          Manage your teams and collaborate with others
        </p>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Teams
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <TeamsList
            onCreateTeam={handleCreateTeam}
            onViewTeam={handleViewTeam}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <TeamsDashboard />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Team Settings</h3>
            <p className="text-muted-foreground">
              Global team settings and preferences will be available here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
