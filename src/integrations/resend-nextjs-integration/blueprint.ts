import { Blueprint } from '../../types/adapter.js';

const resendNextjsIntegrationBlueprint: Blueprint = {
  id: 'resend-nextjs-integration',
  name: 'Resend Next.js Integration',
  description: 'Complete email integration for Next.js applications',
  version: '1.0.0',
  actions: [
    // Install Resend packages
    {
      type: 'INSTALL_PACKAGES',
      packages: ['resend'],
      isDev: false
    },
    // Add environment variables
    {
      type: 'ADD_ENV_VAR',
      key: 'RESEND_API_KEY',
      value: 're_...',
      description: 'Resend API key for sending emails'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'RESEND_FROM_EMAIL',
      value: 'noreply@yourdomain.com',
      description: 'Default from email address'
    },
    // PURE MODIFIER: Enhance email server with Next.js API routes
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/email/server.ts',
      condition: '{{#if integration.features.apiRoutes}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js API route handlers for email functionality
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text, from } = await request.json();

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject' },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: result.data?.id,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}`
          }
        ]
      }
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/email/webhooks/route.ts',
      condition: '{{#if integration.features.webhooks}}',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook } from '@/lib/email/webhooks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('resend-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const result = await handleWebhook(body, signature);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/email/templates/route.ts',
      condition: '{{#if integration.features.templates}}',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplates, createEmailTemplate } from '@/lib/email/templates';

export async function GET(request: NextRequest) {
  try {
    const templates = await getEmailTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, subject, html, text } = await request.json();

    if (!name || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject, html' },
        { status: 400 }
      );
    }

    const template = await createEmailTemplate({
      name,
      subject,
      html,
      text,
    });

    return NextResponse.json({ 
      success: true, 
      template,
      message: 'Template created successfully' 
    });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}`
    },
    // Server-side utilities
    {
      type: 'CREATE_FILE',
      path: 'src/lib/email/server.ts',
      condition: '{{#if integration.features.apiRoutes}}',
      content: `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: options.from || process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      tags: options.tags,
    });

    return {
      success: true,
      messageId: result.data?.id,
      error: result.error,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendBulkEmails(emails: EmailOptions[]) {
  const results = [];
  
  for (const email of emails) {
    const result = await sendEmail(email);
    results.push({ email, result });
  }
  
  return results;
}

export { resend };
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/email/client.ts',
      condition: '{{#if integration.features.apiRoutes}}',
      content: `// Client-side email utilities

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export async function sendEmail(data: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getEmailTemplates() {
  try {
    const response = await fetch('/api/email/templates');
    const data = await response.json();
    return data.templates || [];
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return [];
  }
}

export async function createEmailTemplate(template: {
  name: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const response = await fetch('/api/email/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/email/templates.ts',
      condition: '{{#if integration.features.templates}}',
      content: `// Email template management

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for demo purposes
// In production, use a database
const templates: EmailTemplate[] = [];

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return templates;
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  return templates.find(t => t.id === id) || null;
}

export async function createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
  const newTemplate: EmailTemplate = {
    id: Math.random().toString(36).substr(2, 9),
    ...template,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  templates.push(newTemplate);
  return newTemplate;
}

export async function updateEmailTemplate(id: string, updates: Partial<Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailTemplate | null> {
  const template = templates.find(t => t.id === id);
  if (!template) return null;
  
  Object.assign(template, updates, { updatedAt: new Date() });
  return template;
}

export async function deleteEmailTemplate(id: string): Promise<boolean> {
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  templates.splice(index, 1);
  return true;
}

// Pre-built email templates
export const defaultTemplates = {
  welcome: {
    name: 'Welcome Email',
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
    text: \`Welcome to {{appName}}!\\n\\nHi {{userName}},\\n\\nThank you for joining us! We're excited to have you on board.\\n\\nGet started by exploring our features and don't hesitate to reach out if you have any questions.\\n\\nBest regards,\\nThe {{appName}} Team\`
  },
  passwordReset: {
    name: 'Password Reset',
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
    text: \`Password Reset Request\\n\\nHi {{userName}},\\n\\nWe received a request to reset your password. Click the link below to reset it:\\n\\n{{resetLink}}\\n\\nIf you didn't request this, please ignore this email.\\n\\nThis link will expire in 1 hour.\\n\\nBest regards,\\nThe {{appName}} Team\`
  }
};
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/email/webhooks.ts',
      condition: '{{#if integration.features.webhooks}}',
      content: `import crypto from 'crypto';

export interface WebhookEvent {
  type: string;
  data: any;
  created_at: string;
}

export interface WebhookResult {
  success: boolean;
  error?: string;
}

export async function handleWebhook(body: string, signature: string): Promise<WebhookResult> {
  try {
    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }

    const event: WebhookEvent = JSON.parse(body);
    
    // Process different event types
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(event.data);
        break;
      case 'email.delivered':
        await handleEmailDelivered(event.data);
        break;
      case 'email.bounced':
        await handleEmailBounced(event.data);
        break;
      case 'email.complained':
        await handleEmailComplained(event.data);
        break;
      case 'email.opened':
        await handleEmailOpened(event.data);
        break;
      case 'email.clicked':
        await handleEmailClicked(event.data);
        break;
      default:
        console.log('Unknown webhook event type:', event.type);
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('RESEND_WEBHOOK_SECRET not set, skipping signature verification');
    return true; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

async function handleEmailSent(data: any) {
  console.log('Email sent:', data.email_id);
  // Log to database, update analytics, etc.
}

async function handleEmailDelivered(data: any) {
  console.log('Email delivered:', data.email_id);
  // Update delivery status in database
}

async function handleEmailBounced(data: any) {
  console.log('Email bounced:', data.email_id, data.reason);
  // Handle bounce, update user status, etc.
}

async function handleEmailComplained(data: any) {
  console.log('Email complained:', data.email_id);
  // Handle complaint, update user preferences, etc.
}

async function handleEmailOpened(data: any) {
  console.log('Email opened:', data.email_id);
  // Track open rate, update analytics
}

async function handleEmailClicked(data: any) {
  console.log('Email clicked:', data.email_id, data.link);
  // Track click rate, update analytics
}
`
    },
    // Middleware
    {
      type: 'CREATE_FILE',
      path: 'src/middleware.ts',
      condition: '{{#if integration.features.middleware}}',
      content: `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting for email endpoints
const emailRateLimit = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to email API routes
  if (pathname.startsWith('/api/email/')) {
    const ip = request.ip || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max 100 requests per window

    const userLimit = emailRateLimit.get(ip);
    
    if (!userLimit || now > userLimit.resetTime) {
      emailRateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    } else if (userLimit.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    } else {
      userLimit.count++;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/email/:path*',
  ],
};
`
    },
    // Admin Panel Components
    {
      type: 'CREATE_FILE',
      path: 'src/components/email/EmailPreview.tsx',
      condition: '{{#if integration.features.adminPanel}}',
      content: `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailPreviewProps {
  template?: {
    name: string;
    subject: string;
    html: string;
    text?: string;
  };
  onSend?: (data: { to: string; subject: string; html: string; text?: string }) => void;
}

export function EmailPreview({ template, onSend }: EmailPreviewProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState(template?.subject || '');
  const [html, setHtml] = useState(template?.html || '');
  const [text, setText] = useState(template?.text || '');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!to || !subject || !html) return;
    
    setIsSending(true);
    try {
      if (onSend) {
        await onSend({ to, subject, html, text });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>
          <div>
            <Label htmlFor="html">HTML Content</Label>
            <Textarea
              id="html"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={10}
              placeholder="HTML email content"
            />
          </div>
          <div>
            <Label htmlFor="text">Text Content (optional)</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Plain text email content"
            />
          </div>
          <Button 
            onClick={handleSend} 
            disabled={!to || !subject || !html || isSending}
            className="w-full"
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/email/EmailAnalytics.tsx',
      condition: '{{#if integration.features.analytics}}',
      content: `'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmailStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}

interface EmailAnalyticsProps {
  stats: EmailStats;
}

export function EmailAnalytics({ stats }: EmailAnalyticsProps) {
  const deliveryRate = stats.totalSent > 0 ? (stats.delivered / stats.totalSent) * 100 : 0;
  const openRate = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;
  const clickRate = stats.delivered > 0 ? (stats.clicked / stats.delivered) * 100 : 0;
  const bounceRate = stats.totalSent > 0 ? (stats.bounced / stats.totalSent) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{deliveryRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.delivered.toLocaleString()} delivered
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.opened.toLocaleString()} opened
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clickRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.clicked.toLocaleString()} clicked
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{bounceRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.bounced.toLocaleString()} bounced
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.complained}</div>
          <Badge variant={stats.complained > 0 ? 'destructive' : 'secondary'}>
            {stats.complained > 0 ? 'Action Required' : 'Clean'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
`
    },
    // Admin Pages
    {
      type: 'CREATE_FILE',
      path: 'src/app/admin/emails/page.tsx',
      condition: '{{#if integration.features.adminPanel}}',
      content: `import { EmailPreview } from '@/components/email/EmailPreview';
import { EmailAnalytics } from '@/components/email/EmailAnalytics';
import { sendEmail } from '@/lib/email/client';

// Mock data - replace with real data fetching
const mockStats = {
  totalSent: 1250,
  delivered: 1180,
  opened: 890,
  clicked: 234,
  bounced: 45,
  complained: 2,
};

export default function EmailsPage() {
  const handleSendEmail = async (data: { to: string; subject: string; html: string; text?: string }) => {
    try {
      const result = await sendEmail(data);
      if (result.success) {
        alert('Email sent successfully!');
      } else {
        alert(\`Failed to send email: \${result.error}\`);
      }
    } catch (error) {
      alert(\`Error: \${error}\`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Email Management</h1>
        <p className="text-muted-foreground">
          Send emails and manage your email campaigns
        </p>
      </div>

      <div className="mb-8">
        <EmailAnalytics stats={mockStats} />
      </div>

      <EmailPreview onSend={handleSendEmail} />
    </div>
  );
}
`
    }
  ]
};

export const blueprint = resendNextjsIntegrationBlueprint;
