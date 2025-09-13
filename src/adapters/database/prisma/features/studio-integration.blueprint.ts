/**
 * Prisma Studio Integration Feature
 * 
 * Adds database management interface and admin tools
 */

import { Blueprint } from '../../../../types/adapter.js';

const studioIntegrationBlueprint: Blueprint = {
  id: 'prisma-studio-integration',
  name: 'Prisma Studio Integration',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/studio-manager.ts',
      content: `import { execSync } from 'child_process';
import { spawn } from 'child_process';

// Prisma Studio management utilities
export class StudioManager {
  private static studioProcess: any = null;
  private static isRunning = false;

  static async startStudio(port: number = 5555, host: string = 'localhost'): Promise<void> {
    if (this.isRunning) {
      console.log('Prisma Studio is already running');
      return;
    }

    try {
      console.log('🚀 Starting Prisma Studio on http://' + host + ':' + port);
      
      this.studioProcess = spawn('npx', ['prisma', 'studio', '--port', port.toString(), '--host', host], {
        stdio: 'inherit',
        detached: false,
      });

      this.isRunning = true;

      this.studioProcess.on('close', (code: number) => {
        console.log('Prisma Studio stopped with code:', code);
        this.isRunning = false;
        this.studioProcess = null;
      });

      this.studioProcess.on('error', (error: Error) => {
        console.error('Failed to start Prisma Studio:', error);
        this.isRunning = false;
        this.studioProcess = null;
      });

      // Wait a moment to ensure it started
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (this.isRunning) {
        console.log('✅ Prisma Studio started successfully');
        console.log('📱 Open http://' + host + ':' + port + ' in your browser');
      }
    } catch (error) {
      console.error('❌ Failed to start Prisma Studio:', error);
      this.isRunning = false;
      this.studioProcess = null;
      throw error;
    }
  }

  static async stopStudio(): Promise<void> {
    if (!this.isRunning || !this.studioProcess) {
      console.log('Prisma Studio is not running');
      return;
    }

    try {
      console.log('🛑 Stopping Prisma Studio...');
      this.studioProcess.kill();
      this.isRunning = false;
      this.studioProcess = null;
      console.log('✅ Prisma Studio stopped successfully');
    } catch (error) {
      console.error('❌ Failed to stop Prisma Studio:', error);
      throw error;
    }
  }

  static getStudioStatus(): { isRunning: boolean; url?: string } {
    return {
      isRunning: this.isRunning,
      url: this.isRunning ? 'http://localhost:5555' : undefined,
    };
  }

  static getStudioUrl(port: number = 5555, host: string = 'localhost'): string {
    return 'http://' + host + ':' + port;
  }

  // Studio configuration
  static async generateStudioConfig(): Promise<void> {
    try {
      console.log('🔄 Generating Prisma Studio configuration...');
      
      // Create studio config file
      const config = {
        port: 5555,
        host: 'localhost',
        browser: 'default',
        {{#if module.parameters.custom-theme}}
        theme: {
          primary: '#0070f3',
          secondary: '#7928ca',
          accent: '#f81ce5',
          neutral: '#1a1a1a',
          'base-100': '#ffffff',
          'base-200': '#f5f5f5',
          'base-300': '#e5e5e5',
        },
        {{/if}}
        {{#if module.parameters.user-management}}
        auth: {
          enabled: true,
          users: [
            {
              username: 'admin',
              password: 'admin123',
              role: 'admin',
            },
          ],
        },
        {{/if}}
      };

      const fs = await import('fs/promises');
      await fs.writeFile(
        'prisma-studio.config.json',
        JSON.stringify(config, null, 2)
      );

      console.log('✅ Studio configuration generated');
    } catch (error) {
      console.error('❌ Failed to generate studio config:', error);
      throw error;
    }
  }

  // Studio widget for embedding
  static generateStudioWidget(port: number = 5555): string {
    return \`
      <div id="prisma-studio-widget" style="width: 100%; height: 600px; border: 1px solid #ccc; border-radius: 8px;">
        <iframe 
          src="http://localhost:\${port}" 
          width="100%" 
          height="100%" 
          frameborder="0"
          style="border-radius: 8px;"
        >
        </iframe>
      </div>
    \`;
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/database/studio-widget.tsx',
      content: `'use client';

import React, { useState, useEffect } from 'react';
import { StudioManager } from '@/lib/db/studio-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function StudioWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [port, setPort] = useState(5555);
  const [host, setHost] = useState('localhost');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = () => {
    const status = StudioManager.getStudioStatus();
    setIsRunning(status.isRunning);
  };

  const startStudio = async () => {
    setIsLoading(true);
    setError('');
    try {
      await StudioManager.startStudio(port, host);
      setIsRunning(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopStudio = async () => {
    setIsLoading(true);
    setError('');
    try {
      await StudioManager.stopStudio();
      setIsRunning(false);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateConfig = async () => {
    setIsLoading(true);
    setError('');
    try {
      await StudioManager.generateStudioConfig();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const openStudio = () => {
    const url = StudioManager.getStudioUrl(port, host);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prisma Studio</h1>
          <p className="text-muted-foreground">
            Database management interface
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isRunning ? 'default' : 'secondary'}>
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
        </div>
      </div>

      {/* Studio Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Studio Controls</CardTitle>
          <CardDescription>Start, stop, and configure Prisma Studio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Host</label>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Port</label>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="5555"
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            {!isRunning ? (
              <Button onClick={startStudio} disabled={isLoading}>
                {isLoading ? 'Starting...' : 'Start Studio'}
              </Button>
            ) : (
              <Button onClick={stopStudio} disabled={isLoading} variant="destructive">
                {isLoading ? 'Stopping...' : 'Stop Studio'}
              </Button>
            )}
            
            {isRunning && (
              <Button onClick={openStudio} variant="outline">
                Open Studio
              </Button>
            )}
            
            <Button onClick={generateConfig} disabled={isLoading} variant="outline">
              Generate Config
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Studio Status */}
      <Card>
        <CardHeader>
          <CardTitle>Studio Status</CardTitle>
          <CardDescription>Current Prisma Studio status and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={isRunning ? 'default' : 'secondary'}>
                {isRunning ? 'Running' : 'Stopped'}
              </Badge>
            </div>
            
            {isRunning && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">URL:</span>
                  <span className="text-sm font-mono">
                    {StudioManager.getStudioUrl(port, host)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Host:</span>
                  <span className="text-sm">{host}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Port:</span>
                  <span className="text-sm">{port}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Studio Features */}
      <Card>
        <CardHeader>
          <CardTitle>Studio Features</CardTitle>
          <CardDescription>Available features in Prisma Studio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Data Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• View and edit records</li>
                <li>• Create new records</li>
                <li>• Delete records</li>
                <li>• Bulk operations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Schema Visualization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• View database schema</li>
                <li>• Explore relationships</li>
                <li>• Understand data structure</li>
                <li>• Navigate between models</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Studio Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Studio Tips</CardTitle>
          <CardDescription>Best practices for using Prisma Studio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Use Studio for development and testing, not production</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Always backup your data before making bulk changes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Use the schema view to understand your data relationships</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Configure custom themes and authentication for team use</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/admin/database/page.tsx',
      content: `import { StudioWidget } from '@/components/database/studio-widget';

export default function DatabaseAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <StudioWidget />
    </div>
  );
}`
    }
  ]
};
export default studioIntegrationBlueprint;
