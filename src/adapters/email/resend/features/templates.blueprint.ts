/**
 * Resend Templates Feature
 * 
 * Adds advanced email template system with React components
 */

import { Blueprint } from '../../../../types/adapter.js';

const templatesBlueprint: Blueprint = {
  id: 'resend-templates',
  name: 'Resend Templates',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['react-email']
    },
    {
      type: 'INSTALL_PACKAGES',
      packages: ['handlebars'],
      condition: '{{#if (eq module.parameters.template-engine "handlebars")}}'
    },
    {
      type: 'INSTALL_PACKAGES',
      packages: ['mjml'],
      condition: '{{#if (eq module.parameters.template-engine "mjml")}}'
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/email/templates/template-manager.ts',
      content: `import { Resend } from 'resend';
import { render } from 'react-email';
{{#if (eq module.parameters.template-engine "handlebars")}}
import Handlebars from 'handlebars';
{{else if (eq module.parameters.template-engine "mjml")}}
import mjml from 'mjml';
{{/if}}

// Template configuration
export interface TemplateConfig {
  name: string;
  subject: string;
  template: string;
  variables?: Record<string, any>;
}

// Template manager
export class TemplateManager {
  private resend: Resend;
  
  constructor(resend: Resend) {
    this.resend = resend;
  }

  async sendTemplate(
    to: string | string[],
    templateName: string,
    variables: Record<string, any> = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = await this.getTemplate(templateName);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const renderedContent = await this.renderTemplate(template, variables);
      
      const result = await this.resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
        to,
        subject: template.subject,
        html: renderedContent.html,
        text: renderedContent.text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Template send error:', error);
      return { success: false, error: error.message };
    }
  }

  async getTemplate(templateName: string): Promise<TemplateConfig | null> {
    try {
      // Load template from file system or database
      const template = await import(\`./templates/\${templateName}.ts\`);
      return template.default;
    } catch (error) {
      console.error('Template load error:', error);
      return null;
    }
  }

  async renderTemplate(
    template: TemplateConfig,
    variables: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    try {
      {{#if (eq module.parameters.template-engine "handlebars")}}
      // Handlebars rendering
      const handlebarsTemplate = Handlebars.compile(template.template);
      const html = handlebarsTemplate(variables);
      const text = this.htmlToText(html);
      {{else if (eq module.parameters.template-engine "mjml")}}
      // MJML rendering
      const mjmlResult = mjml(template.template, {
        variables: variables
      });
      const html = mjmlResult.html;
      const text = this.htmlToText(html);
      {{else}}
      // React Email rendering
      const ReactEmailComponent = await import(\`./templates/\${template.name}.tsx\`);
      const html = await render(ReactEmailComponent.default, variables);
      const text = this.htmlToText(html);
      {{/if}}

      return { html, text };
    } catch (error) {
      console.error('Template render error:', error);
      throw error;
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async listTemplates(): Promise<string[]> {
    try {
      // List available templates
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const templatesDir = path.join(process.cwd(), 'src/lib/email/templates');
      const files = await fs.readdir(templatesDir);
      
      return files
        .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
        .map(file => file.replace(/\.(ts|tsx)$/, ''));
    } catch (error) {
      console.error('List templates error:', error);
      return [];
    }
  }

  async validateTemplate(templateName: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const template = await this.getTemplate(templateName);
      if (!template) {
        return { valid: false, errors: ['Template not found'] };
      }

      const errors: string[] = [];
      
      if (!template.subject) {
        errors.push('Subject is required');
      }
      
      if (!template.template) {
        errors.push('Template content is required');
      }

      // Test rendering with sample data
      try {
        await this.renderTemplate(template, {});
      } catch (error) {
        errors.push(\`Rendering error: \${error.message}\`);
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }
}

// Template utilities
export class TemplateUtils {
  static generatePreviewData(templateName: string): Record<string, any> {
    // Generate sample data for template preview
    const commonData = {
      userName: 'John Doe',
      userEmail: 'john@example.com',
      companyName: 'Your Company',
      appName: 'Your App',
      currentYear: new Date().getFullYear(),
    };

    switch (templateName) {
      case 'welcome':
        return {
          ...commonData,
          loginUrl: 'https://yourapp.com/login',
        };
      case 'password-reset':
        return {
          ...commonData,
          resetUrl: 'https://yourapp.com/reset-password?token=abc123',
        };
      case 'newsletter':
        return {
          ...commonData,
          articles: [
            { title: 'Article 1', summary: 'Summary 1' },
            { title: 'Article 2', summary: 'Summary 2' },
          ],
        };
      default:
        return commonData;
    }
  }

  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization
    return html
      .replace(/<script[^>]*>.*?<\\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\\/iframe>/gi, '')
      .replace(/on\\w+="[^"]*"/gi, '');
  }

  static extractTextContent(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/email/templates/base-template.ts',
      content: `// Base template configuration
export interface BaseTemplateConfig {
  name: string;
  subject: string;
  description: string;
  category: 'transactional' | 'marketing' | 'notification';
  variables: string[];
}

// Common template variables
export const COMMON_VARIABLES = {
  userName: 'string',
  userEmail: 'string',
  companyName: 'string',
  appName: 'string',
  currentYear: 'number',
  supportEmail: 'string',
  unsubscribeUrl: 'string',
};

// Template categories
export const TEMPLATE_CATEGORIES = {
  transactional: {
    name: 'Transactional',
    description: 'Emails sent as part of user actions (welcome, password reset, etc.)',
    templates: ['welcome', 'password-reset', 'email-verification', 'order-confirmation'],
  },
  marketing: {
    name: 'Marketing',
    description: 'Promotional emails and newsletters',
    templates: ['newsletter', 'promotion', 'announcement', 'product-update'],
  },
  notification: {
    name: 'Notification',
    description: 'System notifications and alerts',
    templates: ['security-alert', 'maintenance-notice', 'account-suspended'],
  },
};

// Template validation rules
export const TEMPLATE_VALIDATION_RULES = {
  requiredFields: ['name', 'subject', 'template'],
  maxSubjectLength: 78,
  maxTemplateSize: 1024 * 1024, // 1MB
  allowedHtmlTags: [
    'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'br', 'hr', 'strong', 'em', 'ul', 'ol', 'li',
    'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot'
  ],
  requiredTextVersion: true,
};

// Template metadata
export interface TemplateMetadata {
  createdAt: string;
  updatedAt: string;
  version: string;
  author: string;
  tags: string[];
  previewUrl?: string;
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'docs/integrations/resend-templates.md',
      content: `# Resend Templates Integration Guide

## Overview

This guide shows how to integrate Resend email templates with your application.

## Prerequisites

- Resend account with API key
- React Email or template engine configured
- Understanding of email template best practices

## Basic Setup

### 1. Environment Variables

\`\`\`bash
# .env.local
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourapp.com"
TEMPLATE_ENGINE="react-email" # or "handlebars" or "mjml"
\`\`\`

### 2. Template Structure

\`\`\`typescript
// src/lib/email/templates/welcome.ts
export default {
  name: 'welcome',
  subject: 'Welcome to {{appName}}!',
  template: \`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome</title>
    </head>
    <body>
      <h1>Welcome, {{userName}}!</h1>
      <p>Thank you for joining {{appName}}.</p>
      <a href="{{loginUrl}}">Get Started</a>
    </body>
    </html>
  \`,
  variables: ['userName', 'appName', 'loginUrl']
};
\`\`\`

## Usage Examples

### Basic Template Sending

\`\`\`typescript
// src/lib/email/email-service.ts
import { Resend } from 'resend';
import { TemplateManager } from './templates/template-manager';

const resend = new Resend(process.env.RESEND_API_KEY);
const templateManager = new TemplateManager(resend);

export class EmailService {
  static async sendWelcomeEmail(userEmail: string, userName: string) {
    return await templateManager.sendTemplate(
      userEmail,
      'welcome',
      {
        userName,
        appName: 'Your App',
        loginUrl: 'https://yourapp.com/login'
      }
    );
  }

  static async sendPasswordResetEmail(userEmail: string, resetToken: string) {
    return await templateManager.sendTemplate(
      userEmail,
      'password-reset',
      {
        userName: 'User',
        resetUrl: \`https://yourapp.com/reset-password?token=\${resetToken}\`
      }
    );
  }
}
\`\`\`

### React Email Templates

\`\`\`typescript
// src/lib/email/templates/welcome.tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

interface WelcomeEmailProps {
  userName: string;
  appName: string;
  loginUrl: string;
}

export default function WelcomeEmail({ userName, appName, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={title}>Welcome to {appName}!</Text>
          <Text style={text}>Hello {userName},</Text>
          <Text style={text}>
            Thank you for joining {appName}. We're excited to have you on board!
          </Text>
          <Button style={button} href={loginUrl}>
            Get Started
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const title = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
};

const text = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#484848',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 20px',
};
\`\`\`

### Handlebars Templates

\`\`\`typescript
// src/lib/email/templates/newsletter.ts
export default {
  name: 'newsletter',
  subject: '{{appName}} Newsletter - {{date}}',
  template: \`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Newsletter</title>
    </head>
    <body>
      <h1>{{appName}} Newsletter</h1>
      <p>Hello {{userName}},</p>
      
      {{#each articles}}
      <div class="article">
        <h2>{{title}}</h2>
        <p>{{summary}}</p>
        <a href="{{url}}">Read More</a>
      </div>
      {{/each}}
      
      <p>
        <a href="{{unsubscribeUrl}}">Unsubscribe</a>
      </p>
    </body>
    </html>
  \`,
  variables: ['userName', 'appName', 'date', 'articles', 'unsubscribeUrl']
};
\`\`\`

## API Integration

### Template Management API

\`\`\`typescript
// src/app/api/email/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TemplateManager } from '@/lib/email/templates/template-manager';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const templateManager = new TemplateManager(resend);

export async function GET(req: NextRequest) {
  try {
    const templates = await templateManager.listTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { to, templateName, variables } = await req.json();
    
    if (!to || !templateName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await templateManager.sendTemplate(to, templateName, variables);
    
    if (result.success) {
      return NextResponse.json({ messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
\`\`\`

### Template Validation API

\`\`\`typescript
// src/app/api/email/templates/[name]/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TemplateManager } from '@/lib/email/templates/template-manager';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const templateManager = new TemplateManager(resend);

export async function POST(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const result = await templateManager.validateTemplate(params.name);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
\`\`\`

## UI Components

### Template Preview Component

\`\`\`typescript
// src/components/email/TemplatePreview.tsx
'use client';

import { useState, useEffect } from 'react';
import { TemplateUtils } from '@/lib/email/templates/template-manager';

interface TemplatePreviewProps {
  templateName: string;
}

export function TemplatePreview({ templateName }: TemplatePreviewProps) {
  const [preview, setPreview] = useState<{ html: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generatePreview();
  }, [templateName]);

  const generatePreview = async () => {
    try {
      const response = await fetch(\`/api/email/templates/\${templateName}/preview\`);
      const data = await response.json();
      
      if (response.ok) {
        setPreview(data);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading preview...</div>;
  if (!preview) return <div>Preview not available</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">HTML Preview</h3>
        <div 
          className="border rounded-lg p-4 bg-white"
          dangerouslySetInnerHTML={{ __html: preview.html }}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Text Version</h3>
        <div className="border rounded-lg p-4 bg-gray-50">
          <pre className="whitespace-pre-wrap text-sm">{preview.text}</pre>
        </div>
      </div>
    </div>
  );
}
\`\`\`

## Best Practices

1. **Always provide text versions** of HTML emails
2. **Test templates** across different email clients
3. **Use responsive design** for mobile compatibility
4. **Validate templates** before sending
5. **Implement proper error handling** for failed sends

## Common Patterns

### Template Inheritance

\`\`\`typescript
// Base template
export const baseTemplate = \`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{title}}</title>
</head>
<body>
  <header>
    <h1>{{appName}}</h1>
  </header>
  <main>
    {{content}}
  </main>
  <footer>
    <p>&copy; {{currentYear}} {{companyName}}</p>
  </footer>
</body>
</html>
\`;

// Specific template
export const welcomeTemplate = baseTemplate.replace('{{content}}', \`
  <h2>Welcome, {{userName}}!</h2>
  <p>Thank you for joining us.</p>
\`);
\`\`\`

### Template Caching

\`\`\`typescript
// Cache compiled templates for better performance
const templateCache = new Map();

export class CachedTemplateManager extends TemplateManager {
  async renderTemplate(template: TemplateConfig, variables: Record<string, any>) {
    const cacheKey = \`\${template.name}-\${JSON.stringify(variables)}\`;
    
    if (templateCache.has(cacheKey)) {
      return templateCache.get(cacheKey);
    }

    const result = await super.renderTemplate(template, variables);
    templateCache.set(cacheKey, result);
    
    return result;
  }
}
\`\`\`
`
    }
  ]
};export default templatesBlueprint;
