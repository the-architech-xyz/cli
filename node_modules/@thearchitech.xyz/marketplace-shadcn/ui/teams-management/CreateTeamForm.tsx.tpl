'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTeamsCreate } from '@/lib/teams-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Users, Settings } from 'lucide-react';
import type { CreateTeamFormData } from '@/lib/teams-management';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Team slug is required'),
  allowMemberInvites: z.boolean().default(true),
  requireApprovalForJoins: z.boolean().default(false),
  allowPublicVisibility: z.boolean().default(false),
  maxMembers: z.number().positive().optional(),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

interface CreateTeamFormProps {
  onSuccess?: (team: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function CreateTeamForm({ onSuccess, onCancel, className }: CreateTeamFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTeam = useTeamsCreate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      allowMemberInvites: true,
      requireApprovalForJoins: false,
      allowPublicVisibility: false,
    },
  });

  const watchedName = watch('name');

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    setValue('slug', generateSlug(name));
  };

  const onSubmit = async (data: CreateTeamFormValues) => {
    setIsSubmitting(true);
    try {
      const team = await createTeam.mutateAsync(data);
      onSuccess?.(team);
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Team
        </CardTitle>
        <CardDescription>
          Set up a new team to collaborate with others
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {createTeam.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {createTeam.error.message || 'Failed to create team'}
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Team"
                {...register('name')}
                onChange={handleNameChange}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this team about?"
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Team URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">yourdomain.com/teams/</span>
                <Input
                  id="slug"
                  placeholder="my-awesome-team"
                  {...register('slug')}
                />
              </div>
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This will be your team's unique URL identifier
              </p>
            </div>
          </div>

          {/* Team Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Team Settings
            </h3>

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
                <Label htmlFor="maxMembers">Maximum Members (Optional)</Label>
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Team
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
