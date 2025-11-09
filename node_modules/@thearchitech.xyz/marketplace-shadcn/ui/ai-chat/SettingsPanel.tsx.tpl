'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Palette, 
  Zap, 
  MessageSquare, 
  Volume2, 
  VolumeX,
  Monitor,
  Moon,
  Sun,
  Smartphone,
  Globe,
  Shield,
  Bell,
  Keyboard,
  Mouse,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ChatSettings, ChatUIConfig, ModelProvider } from '@/types/ai-chat';

export interface SettingsPanelProps {
  className?: string;
  settings: ChatSettings;
  uiConfig: ChatUIConfig;
  onSettingsChange?: (settings: ChatSettings) => void;
  onUIConfigChange?: (config: ChatUIConfig) => void;
  onReset?: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  availableModels?: string[];
  availableProviders?: ModelProvider[];
}

export function SettingsPanel({
  className,
  settings,
  uiConfig,
  onSettingsChange,
  onUIConfigChange,
  onReset,
  onExport,
  onImport,
  availableModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-sonnet', 'claude-3-opus'],
  availableProviders = ['openai', 'anthropic', 'google', 'azure'],
}: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
  const [localUIConfig, setLocalUIConfig] = useState<ChatUIConfig>(uiConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalSettings(settings);
    setLocalUIConfig(uiConfig);
  }, [settings, uiConfig]);

  // Check for changes
  useEffect(() => {
    const settingsChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
    const uiConfigChanged = JSON.stringify(localUIConfig) !== JSON.stringify(uiConfig);
    setHasChanges(settingsChanged || uiConfigChanged);
  }, [localSettings, localUIConfig, settings, uiConfig]);

  // Handle settings changes
  const handleSettingsChange = useCallback((updates: Partial<ChatSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
    setError(null);
  }, []);

  const handleUIConfigChange = useCallback((updates: Partial<ChatUIConfig>) => {
    setLocalUIConfig(prev => ({ ...prev, ...updates }));
    setError(null);
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSettingsChange?.(localSettings);
      await onUIConfigChange?.(localUIConfig);
      setSuccess('Settings saved successfully');
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [localSettings, localUIConfig, onSettingsChange, onUIConfigChange]);

  // Reset to defaults
  const handleReset = useCallback(async () => {
    try {
      await onReset?.();
      setSuccess('Settings reset to defaults');
      setShowResetDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    }
  }, [onReset]);

  // Export settings
  const handleExport = useCallback(async () => {
    try {
      await onExport?.();
      setSuccess('Settings exported successfully');
      setShowExportDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export settings');
    }
  }, [onExport]);

  // Import settings
  const handleImport = useCallback(async (file: File) => {
    try {
      await onImport?.(file);
      setSuccess('Settings imported successfully');
      setShowImportDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import settings');
    }
  }, [onImport]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetDialog(true)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto"
            onClick={clearMessages}
          >
            ×
          </Button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">{success}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto"
            onClick={clearMessages}
          >
            ×
          </Button>
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* Chat Settings */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={localSettings.model}
                    onValueChange={(value) => handleSettingsChange({ model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature: {localSettings.temperature}</Label>
                  <Slider
                    value={[localSettings.temperature]}
                    onValueChange={([value]) => handleSettingsChange({ temperature: value })}
                    min={0}
                    max={2}
                    step={0.1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="maxTokens">Max Tokens: {localSettings.maxTokens}</Label>
                <Slider
                  value={[localSettings.maxTokens]}
                  onValueChange={([value]) => handleSettingsChange({ maxTokens: value })}
                  min={100}
                  max={4000}
                  step={100}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Short</span>
                  <span>Long</span>
                </div>
              </div>

              <div>
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={localSettings.systemPrompt}
                  onChange={(e) => handleSettingsChange({ systemPrompt: e.target.value })}
                  placeholder="Enter system prompt..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theme & Layout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Theme</Label>
                  <Select
                    value={localUIConfig.theme.name}
                    onValueChange={(value) => handleUIConfigChange({
                      theme: { ...localUIConfig.theme, name: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          <span>Default</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <span>Dark</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <span>Light</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="minimal">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          <span>Minimal</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Layout</Label>
                  <Select
                    value={localUIConfig.layout.sidebarWidth}
                    onValueChange={(value) => handleUIConfigChange({
                      layout: { ...localUIConfig.layout, sidebarWidth: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="240px">Compact</SelectItem>
                      <SelectItem value="280px">Normal</SelectItem>
                      <SelectItem value="320px">Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Display Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTimestamps">Show Timestamps</Label>
                    <Switch
                      id="showTimestamps"
                      checked={localUIConfig.features.showTimestamps}
                      onCheckedChange={(checked) => handleUIConfigChange({
                        features: { ...localUIConfig.features, showTimestamps: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showStatus">Show Message Status</Label>
                    <Switch
                      id="showStatus"
                      checked={localUIConfig.features.showStatus}
                      onCheckedChange={(checked) => handleUIConfigChange({
                        features: { ...localUIConfig.features, showStatus: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTokenCount">Show Token Count</Label>
                    <Switch
                      id="showTokenCount"
                      checked={localUIConfig.features.showTokenCount}
                      onCheckedChange={(checked) => handleUIConfigChange({
                        features: { ...localUIConfig.features, showTokenCount: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCost">Show Cost</Label>
                    <Switch
                      id="showCost"
                      checked={localUIConfig.features.showCost}
                      onCheckedChange={(checked) => handleUIConfigChange({
                        features: { ...localUIConfig.features, showCost: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableAnimations">Enable Animations</Label>
                    <Switch
                      id="enableAnimations"
                      checked={localUIConfig.features.enableAnimations}
                      onCheckedChange={(checked) => handleUIConfigChange({
                        features: { ...localUIConfig.features, enableAnimations: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableSounds">Enable Sounds</Label>
                    <Switch
                      id="enableSounds"
                      checked={localUIConfig.features.enableSounds}
                      onCheckedChange={(checked) => handleUIConfigChange({
                        features: { ...localUIConfig.features, enableSounds: checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Advanced Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxMessageLength">Max Message Length: {localUIConfig.limits.maxMessageLength}</Label>
                    <Slider
                      value={[localUIConfig.limits.maxMessageLength]}
                      onValueChange={([value]) => handleUIConfigChange({
                        limits: { ...localUIConfig.limits, maxMessageLength: value }
                      })}
                      min={100}
                      max={5000}
                      step={100}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAttachments">Max Attachments: {localUIConfig.limits.maxAttachments}</Label>
                    <Slider
                      value={[localUIConfig.limits.maxAttachments]}
                      onValueChange={([value]) => handleUIConfigChange({
                        limits: { ...localUIConfig.limits, maxAttachments: value }
                      })}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxFileSize">Max File Size: {Math.round(localUIConfig.limits.maxFileSize / (1024 * 1024))}MB</Label>
                  <Slider
                    value={[localUIConfig.limits.maxFileSize / (1024 * 1024)]}
                    onValueChange={([value]) => handleUIConfigChange({
                      limits: { ...localUIConfig.limits, maxFileSize: value * 1024 * 1024 }
                    })}
                    min={1}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Accessibility</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="highContrast">High Contrast Mode</Label>
                    <Switch
                      id="highContrast"
                      checked={localUIConfig.features.highContrast || false}
                      onCheckedChange={(checked) => handleUIConfigChange({
                        features: { ...localUIConfig.features, highContrast: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="reducedMotion">Reduce Motion</Label>
                    <Switch
                      id="reducedMotion"
                      checked={localUIConfig.features.reducedMotion || false}
                      onCheckedChange={(checked) => handleUIConfigChange({
                        features: { ...localUIConfig.features, reducedMotion: checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Settings */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Import/Export</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowExportDialog(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowImportDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Storage</h4>
                <div className="text-sm text-muted-foreground">
                  <p>Settings are stored locally in your browser.</p>
                  <p>Export your settings to back them up or transfer them to another device.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reset all settings to their default values? 
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your current settings to a JSON file. You can import this file later to restore your settings.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExport}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import settings from a previously exported JSON file.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImport(file);
                }
              }}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SettingsPanel;
