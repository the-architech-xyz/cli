'use client';

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
