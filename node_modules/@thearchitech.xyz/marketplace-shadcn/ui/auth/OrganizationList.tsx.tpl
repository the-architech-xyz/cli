'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  Settings, 
  Users, 
  Crown, 
  Shield, 
  User,
  MoreVertical,
  Trash2,
  Edit,
  UserPlus,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient, useSession } from '@/lib/auth/client';  // Better Auth native
import type { Organization } from '@/lib/auth/types';  // From tech-stack

interface OrganizationListProps {
  onCreateOrganization?: () => void;
  onManageOrganization?: (org: Organization) => void;
  className?: string;
}

export function OrganizationList({ 
  onCreateOrganization, 
  onManageOrganization, 
  className 
}: OrganizationListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { useOrganizations } = useAuthService();
  const { 
    getOrganizations, 
    createOrganization, 
    deleteOrganization, 
    leaveOrganization 
  } = useOrganizations?.() || {};

  const { data: organizations = [], isLoading, error: queryError } = getOrganizations?.() || {};

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await createOrganization?.mutateAsync({ name: newOrgName.trim() });
      setNewOrgName('');
      setIsCreateDialogOpen(false);
      onCreateOrganization?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteOrganization = async (org: Organization) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteOrganization?.mutateAsync(org.id);
    } catch (err) {
      console.error('Failed to delete organization:', err);
    }
  };

  const handleLeaveOrganization = async (org: Organization) => {
    if (!confirm(`Are you sure you want to leave "${org.name}"?`)) {
      return;
    }

    try {
      await leaveOrganization?.mutateAsync(org.id);
    } catch (err) {
      console.error('Failed to leave organization:', err);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'member':
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      case 'member':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Organizations</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Organizations</h2>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Failed to load organizations</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Organizations</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  disabled={isCreating}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrganization}
                  disabled={!newOrgName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organizations</h3>
            <p className="text-muted-foreground mb-4">
              You're not a member of any organizations yet.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {organizations.map((org) => (
              <motion.div
                key={org.id}
                initial=${ opacity: 0, y: 20 }
                animate=${ opacity: 1, y: 0 }
                exit=${ opacity: 0, y: -20 }
                transition=${ duration: 0.2 }
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{org.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {org.slug}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={getRoleBadgeVariant(org.role)}>
                          {getRoleIcon(org.role)}
                          <span className="ml-1 capitalize">{org.role}</span>
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onManageOrganization?.(org)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Manage
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onManageOrganization?.(org)}>
                              <Users className="w-4 h-4 mr-2" />
                              Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onManageOrganization?.(org)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Invite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {org.role === 'owner' ? (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteOrganization(org)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Organization
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleLeaveOrganization(org)}
                                className="text-red-600"
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave Organization
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
