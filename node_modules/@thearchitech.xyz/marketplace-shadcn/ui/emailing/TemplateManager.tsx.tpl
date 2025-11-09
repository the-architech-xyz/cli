'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '@/lib/emailing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import type { EmailTemplate, TemplateFormData } from '@/lib/emailing';

const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  htmlContent: z.string().optional(),
  variables: z.array(z.string()).default([]),
  category: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateManagerProps {
  className?: string;
}

export function TemplateManager({ className }: TemplateManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newVariable, setNewVariable] = useState('');

  const { templates, isLoading, error, refetch } = useTemplates({ 
    isActive: true,
    category: selectedCategory === 'all' ? undefined : selectedCategory
  });
  
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      variables: [],
    },
  });

  const watchedVariables = watch('variables') || [];

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

  const handleCreateTemplate = async (data: TemplateFormValues) => {
    try {
      await createTemplate.mutateAsync(data);
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async (data: TemplateFormValues) => {
    if (!editingTemplate) return;
    
    try {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        ...data,
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      reset();
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    reset({
      name: template.name,
      subject: template.subject,
      content: template.content,
      htmlContent: template.htmlContent || '',
      variables: template.variables || [],
      category: template.category || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await deleteTemplate.mutateAsync(template.id);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    reset();
  };

  const addVariable = () => {
    if (newVariable.trim() && !watchedVariables.includes(newVariable.trim())) {
      setValue('variables', [...watchedVariables, newVariable.trim()]);
      setNewVariable('');
    }
  };

  const removeVariable = (index: number) => {
    setValue('variables', watchedVariables.filter((_, i) => i !== index));
  };

  const copyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.content);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load templates. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
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
              <FileText className="h-5 w-5" />
              Template Manager
            </CardTitle>
            <CardDescription>
              Create and manage email templates
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleCloseDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate 
                    ? 'Update your email template details below.'
                    : 'Fill in the details to create a new email template.'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(editingTemplate ? handleUpdateTemplate : handleCreateTemplate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      placeholder="Welcome Email"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Input
                      id="category"
                      placeholder="Marketing, Transactional, etc."
                      {...register('category')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="Welcome to our platform!"
                    {...register('subject')}
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your email content here..."
                    rows={6}
                    {...register('content')}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="htmlContent">HTML Content (Optional)</Label>
                  <Textarea
                    id="htmlContent"
                    placeholder="<p>HTML version of your email...</p>"
                    rows={4}
                    {...register('htmlContent')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Variables</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add variable (e.g., [NAME])"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                    />
                    <Button type="button" onClick={addVariable} variant="outline">
                      Add
                    </Button>
                  </div>
                  {watchedVariables.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchedVariables.map((variable, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {variable}
                          <button
                            type="button"
                            onClick={() => removeVariable(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                    {(createTemplate.isPending || updateTemplate.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No templates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{template.subject}</TableCell>
                        <TableCell>
                          {template.category ? (
                            <Badge variant="outline">{template.category}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {template.variables && template.variables.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {template.variables.slice(0, 2).map((variable, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                              {template.variables.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.variables.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(template.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyTemplate(template)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
