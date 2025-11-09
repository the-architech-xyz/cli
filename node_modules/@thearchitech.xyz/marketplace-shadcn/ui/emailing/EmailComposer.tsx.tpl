'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSendEmail, useTemplates } from '@/lib/emailing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Mail, Users } from 'lucide-react';

const emailComposerSchema = z.object({
  to: z.string().email('Please enter a valid email address'),
  from: z.string().email('Please enter a valid sender email'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  htmlContent: z.string().optional(),
  templateId: z.string().optional()
});

type EmailComposerFormData = z.infer<typeof emailComposerSchema>;

export function EmailComposer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userContext, canSendEmails, isAuthenticated } = useEmailContext();
  const sendEmail = useSendEmail();
  const { data: templates } = useTemplates({ isActive: true });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<EmailComposerFormData>({
    resolver: zodResolver(emailComposerSchema),
    defaultValues: {
      from: 'noreply@yourcompany.com'
    }
  });

  const selectedTemplateId = watch('templateId');

  // Load template content when template is selected
  React.useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setValue('subject', template.subject || '');
        setValue('content', template.content || '');
        setValue('htmlContent', template.htmlContent || '');
      }
    }
  }, [selectedTemplateId, templates, setValue]);

  const onSubmit = async (data: EmailComposerFormData) => {
    if (!isAuthenticated) {
      alert('Please sign in to send emails');
      return;
    }

    if (!canSendEmails) {
      alert('You do not have permission to send emails');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendEmail.mutateAsync({
        to: data.to,
        from: data.from,
        subject: data.subject,
        content: data.content,
        htmlContent: data.htmlContent,
        templateId: data.templateId
      });
      
      // Reset form on success
      setValue('to', '');
      setValue('subject', '');
      setValue('content', '');
      setValue('htmlContent', '');
      setValue('templateId', '');
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Email Composer</CardTitle>
          <CardDescription>Please sign in to compose and send emails</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            You need to be signed in to use the email composer.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!canSendEmails) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Email Composer</CardTitle>
          <CardDescription>You don't have permission to send emails</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Contact your organization administrator for email permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Compose Email
        </CardTitle>
        <CardDescription>
          Create and send emails with template support
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {sendEmail.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {sendEmail.error.message || 'Failed to send email'}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="email"
                placeholder="sender@company.com"
                {...register('from')}
              />
              {errors.from && (
                <p className="text-sm text-red-600">{errors.from.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                {...register('to')}
              />
              {errors.to && (
                <p className="text-sm text-red-600">{errors.to.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template (Optional)</Label>
            <Select onValueChange={(value) => setValue('templateId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No template</SelectItem>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
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
              rows={8}
              {...register('content')}
            />
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValue('to', '');
                setValue('subject', '');
                setValue('content', '');
                setValue('htmlContent', '');
                setValue('templateId', '');
              }}
            >
              Clear
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
