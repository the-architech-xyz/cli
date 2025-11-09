'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTeamsUpdate } from '@/lib/teams-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, Save } from 'lucide-react';
import type { Team, TeamSettingsFormData } from '@/lib/teams-management';

const teamSettingsSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  allowMemberInvites: z.boolean(),
  requireApprovalForJoins: z.boolean(),
  allowPublicVisibility: z.boolean(),
  maxMembers: z.number().positive().optional(),
  notifications: z.object({
    email: z.boolean(),
    inApp: z.boolean(),
    weeklyDigest: z.boolean(),
  }),
});

type TeamSettingsFormValues = z.infer<typeof teamSettingsSchema>;

interface TeamSettingsProps {
  team: Team;
  onSuccess?: () => void;
  className?: string;
}

export function TeamSettings({ team, onSuccess, className }: TeamSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateTeam = useTeamsUpdate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TeamSettingsFormValues>({
    resolver: zodResolver(teamSettingsSchema),
    defaultValues: {
      name: team.name,
      description: team.description || '',
      allowMemberInvites: team.settings.allowMemberInvites,
      requireApprovalForJoins: team.settings.requireApprovalForJoins,
      allowPublicVisibility: team.settings.allowPublicVisibility,
      maxMembers: team.settings.maxMembers,
      notifications: team.settings.notifications,
    },
  });

  const onSubmit = async (data: TeamSettingsFormValues) => {
    setIsSubmitting(true);
    try {
      await updateTeam.mutateAsync({
        id: team.id,
        name: data.name,
        description: data.description,
        settings: {
          allowMemberInvites: data.allowMemberInvites,
          requireApprovalForJoins: data.requireApprovalForJoins,
          allowPublicVisibility: data.allowPublicVisibility,
          maxMembers: data.maxMembers,
          notifications: data.notifications,
        },
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Team Settings
        </CardTitle>
        <CardDescription>
          Manage your team's configuration and preferences
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {updateTeam.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {updateTeam.error.message || 'Failed to update team settings'}
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Team"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this team about?"
                rows={3}
                {...register('description')}
              />
            </div>
          </div>

          {/* Team Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Team Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowMemberInvites">Allow Member Invites</Label>
                  <p className="text-sm text-muted-foreground">
                    Let team members invite others to join
                  </p>
                </div>
                <Switch
                  id="allowMemberInvites"
                  checked={watch('allowMemberInvites')}
                  onCheckedChange={(checked) => setValue('allowMemberInvites', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireApprovalForJoins">Require Approval for Joins</Label>
                  <p className="text-sm text-muted-foreground">
                    New members need approval before joining
                  </p>
                </div>
                <Switch
                  id="requireApprovalForJoins"
                  checked={watch('requireApprovalForJoins')}
                  onCheckedChange={(checked) => setValue('requireApprovalForJoins', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowPublicVisibility">Public Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow this team to be discovered publicly
                  </p>
                </div>
                <Switch
                  id="allowPublicVisibility"
                  checked={watch('allowPublicVisibility')}
                  onCheckedChange={(checked) => setValue('allowPublicVisibility', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Maximum Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="50"
                  {...register('maxMembers', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited members
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive team updates via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={watch('notifications.email')}
                  onCheckedChange={(checked) => setValue('notifications.email', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inAppNotifications">In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications within the application
                  </p>
                </div>
                <Switch
                  id="inAppNotifications"
                  checked={watch('notifications.inApp')}
                  onCheckedChange={(checked) => setValue('notifications.inApp', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of team activity
                  </p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={watch('notifications.weeklyDigest')}
                  onCheckedChange={(checked) => setValue('notifications.weeklyDigest', checked)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
