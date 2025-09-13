import { Blueprint } from '../../types/adapter.js';

const resendShadcnIntegrationBlueprint: Blueprint = {
  id: 'resend-shadcn-integration',
  name: 'Resend Shadcn Integration',
  description: 'Beautiful email UI components using Shadcn/ui',
  version: '1.0.0',
  actions: [
    // Email Form Component
    {
      type: 'CREATE_FILE',
      path: 'src/components/email/EmailForm.tsx',
      condition: '{{#if integration.features.emailForm}}',
      content: `'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { sendEmail } from '@/lib/email/client';

const emailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
  from: z.string().email('Invalid from email').optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailFormProps {
  onSuccess?: (messageId: string) => void;
  onError?: (error: string) => void;
  defaultValues?: Partial<EmailFormData>;
}

export function EmailForm({ onSuccess, onError, defaultValues }: EmailFormProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      priority: 'normal',
      ...defaultValues,
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    setIsSending(true);
    setIsSuccess(false);
    setMessageId(null);

    try {
      const result = await sendEmail({
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
        from: data.from,
      });

      if (result.success) {
        setIsSuccess(true);
        setMessageId(result.messageId || '');
        form.reset();
        onSuccess?.(result.messageId || '');
      } else {
        onError?.(result.error || 'Failed to send email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="sender@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email subject"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Low</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="normal">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">Normal</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">High</Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="html"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTML Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter HTML email content..."
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Content (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter plain text email content..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSuccess && messageId && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Email sent successfully! Message ID: {messageId}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isSending}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
`
    },
    // Email Templates Component
    {
      type: 'CREATE_FILE',
      path: 'src/components/email/EmailTemplates.tsx',
      condition: '{{#if integration.features.emailTemplates}}',
      content: `'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, Eye, Copy } from 'lucide-react';
import { getEmailTemplates, createEmailTemplate } from '@/lib/email/client';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  createdAt: string;
  updatedAt: string;
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html: '',
    text: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const result = await createEmailTemplate(formData);
      if (result.success) {
        await loadTemplates();
        setIsDialogOpen(false);
        setFormData({ name: '', subject: '', html: '', text: '' });
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html: template.html,
      text: template.text || '',
    });
    setIsDialogOpen(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template);
  };

  const handleCopyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.html);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Welcome Email"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Welcome to {{appName}}!"
                />
              </div>
              <div>
                <Label htmlFor="html">HTML Content</Label>
                <Textarea
                  id="html"
                  value={formData.html}
                  onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                  rows={8}
                  placeholder="<div>Your HTML email content here...</div>"
                />
              </div>
              <div>
                <Label htmlFor="text">Text Content (optional)</Label>
                <Textarea
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  rows={4}
                  placeholder="Plain text version of your email..."
                />
              </div>
              <Button onClick={handleCreateTemplate} className="w-full">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Alert>
          <AlertDescription>
            No templates found. Create your first email template to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {template.subject}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="border rounded p-4 bg-white">
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.html }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
`
    },
    // Email Composer Component
    {
      type: 'CREATE_FILE',
      path: 'src/components/email/EmailComposer.tsx',
      condition: '{{#if integration.features.emailComposer}}',
      content: `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Save, Eye, Code } from 'lucide-react';

interface EmailComposerProps {
  onSend?: (email: { to: string; subject: string; html: string; text?: string }) => void;
  onSave?: (template: { name: string; subject: string; html: string; text?: string }) => void;
}

export function EmailComposer({ onSend, onSave }: EmailComposerProps) {
  const [activeTab, setActiveTab] = useState('compose');
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    html: '',
    text: '',
    template: '',
  });

  const [templateData, setTemplateData] = useState({
    name: '',
    subject: '',
    html: '',
    text: '',
  });

  const handleSend = async () => {
    if (!emailData.to || !emailData.subject || !emailData.html) return;

    setIsSending(true);
    try {
      await onSend?.({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = async () => {
    if (!templateData.name || !templateData.subject || !templateData.html) return;

    setIsSaving(true);
    try {
      await onSave?.(templateData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateChange = (template: string) => {
    if (template === 'welcome') {
      setEmailData({
        ...emailData,
        subject: 'Welcome to {{appName}}!',
        html: \`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to {{appName}}!</h1>
            <p>Hi {{userName}},</p>
            <p>Thank you for joining us! We're excited to have you on board.</p>
            <p>Get started by exploring our features and don't hesitate to reach out if you have any questions.</p>
            <p>Best regards,<br>The {{appName}} Team</p>
          </div>
        \`,
        text: 'Welcome to {{appName}}!\\n\\nHi {{userName}},\\n\\nThank you for joining us! We're excited to have you on board.\\n\\nGet started by exploring our features and don't hesitate to reach out if you have any questions.\\n\\nBest regards,\\nThe {{appName}} Team'
      });
    } else if (template === 'password-reset') {
      setEmailData({
        ...emailData,
        subject: 'Reset your {{appName}} password',
        html: \`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Password Reset Request</h1>
            <p>Hi {{userName}},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <p>Best regards,<br>The {{appName}} Team</p>
          </div>
        \`,
        text: 'Password Reset Request\\n\\nHi {{userName}},\\n\\nWe received a request to reset your password. Click the link below to reset it:\\n\\n{{resetLink}}\\n\\nIf you didn't request this, please ignore this email.\\n\\nThis link will expire in 1 hour.\\n\\nBest regards,\\nThe {{appName}} Team'
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Email Composer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  value={emailData.to}
                  onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <Label htmlFor="template">Template</Label>
                <Select onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="password-reset">Password Reset</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label htmlFor="html">HTML Content</Label>
              <Textarea
                id="html"
                value={emailData.html}
                onChange={(e) => setEmailData({ ...emailData, html: e.target.value })}
                rows={12}
                placeholder="Enter HTML email content..."
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="text">Text Content (optional)</Label>
              <Textarea
                id="text"
                value={emailData.text}
                onChange={(e) => setEmailData({ ...emailData, text: e.target.value })}
                rows={6}
                placeholder="Enter plain text email content..."
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSend} disabled={isSending || !emailData.to || !emailData.subject || !emailData.html}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Template
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Subject: {emailData.subject}</Badge>
                <Badge variant="outline">To: {emailData.to || 'Not specified'}</Badge>
              </div>
              <div className="border rounded p-4 bg-white min-h-[400px]">
                {emailData.html ? (
                  <div dangerouslySetInnerHTML={{ __html: emailData.html }} />
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p>No HTML content to preview</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
`
    },
    // Email Settings Component
    {
      type: 'CREATE_FILE',
      path: 'src/components/email/EmailSettings.tsx',
      condition: '{{#if integration.features.emailSettings}}',
      content: `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, TestTube, CheckCircle } from 'lucide-react';

interface EmailSettingsProps {
  onSave?: (settings: EmailSettings) => void;
  onTest?: (settings: EmailSettings) => void;
}

interface EmailSettings {
  apiKey: string;
  fromEmail: string;
  webhooks: boolean;
  analytics: boolean;
  rateLimit: number;
  retryAttempts: number;
  timeout: number;
}

export function EmailSettings({ onSave, onTest }: EmailSettingsProps) {
  const [settings, setSettings] = useState<EmailSettings>({
    apiKey: '',
    fromEmail: '',
    webhooks: true,
    analytics: true,
    rateLimit: 100,
    retryAttempts: 3,
    timeout: 30000,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResult({ success: true, message: 'Email settings are working correctly!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test email settings' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiKey">Resend API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="re_..."
              />
            </div>
            <div>
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                placeholder="noreply@example.com"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Features</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Webhooks</Label>
                <p className="text-sm text-muted-foreground">
                  Enable webhook handling for email events
                </p>
              </div>
              <Switch
                checked={settings.webhooks}
                onCheckedChange={(checked) => setSettings({ ...settings, webhooks: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Track email opens, clicks, and other metrics
                </p>
              </div>
              <Switch
                checked={settings.analytics}
                onCheckedChange={(checked) => setSettings({ ...settings, analytics: checked })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Advanced Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rateLimit">Rate Limit (per hour)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={settings.rateLimit}
                  onChange={(e) => setSettings({ ...settings, rateLimit: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div>
                <Label htmlFor="retryAttempts">Retry Attempts</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  value={settings.retryAttempts}
                  onChange={(e) => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) || 3 })}
                />
              </div>
              <div>
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={settings.timeout}
                  onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) || 30000 })}
                />
              </div>
            </div>
          </div>

          {testResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={isTesting}>
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`
    }
  ]
};

export const blueprint = resendShadcnIntegrationBlueprint;
