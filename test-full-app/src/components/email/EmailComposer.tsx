'use client';

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
