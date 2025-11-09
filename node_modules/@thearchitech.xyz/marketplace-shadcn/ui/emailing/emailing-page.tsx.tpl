/**
 * Main Emailing Page
 * 
 * Orchestrates emailing components instead of generating everything inline
 */

'use client';

import { EmailComposer } from '@/components/emailing/EmailComposer';
import { EmailList } from '@/components/emailing/EmailList';
import { TemplateManager } from '@/components/emailing/TemplateManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, BarChart3, FileText } from 'lucide-react';

export default function EmailingPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Email Management</h1>
        <p className="text-muted-foreground">
          Compose and manage your emails
        </p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Email List
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <EmailComposer />
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <EmailList />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
