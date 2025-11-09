'use client';

// Account Settings Component

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface AccountSettingsProps {
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'friends';
      showEmail: boolean;
      showPhone: boolean;
      showLocation: boolean;
    };
    security: {
      twoFactorEnabled: boolean;
      loginAlerts: boolean;
      sessionTimeout: number;
    };
    preferences: {
      language: string;
      timezone: string;
      theme: 'light' | 'dark' | 'system';
    };
  };
  onUpdate: (section: string, data: any) => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
  success?: string;
  className?: string;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  settings,
  onUpdate,
  onDeleteAccount,
  isLoading = false,
  error,
  success,
  className = '',
}) => {
  const [activeSection, setActiveSection] = useState<string>('notifications');
  const [localSettings, setLocalSettings] = useState(settings);

  const handleNotificationChange = async (key: string, value: boolean) => {
    const newSettings = {
      ...localSettings.notifications,
      [key]: value,
    };
    setLocalSettings(prev => ({ ...prev, notifications: newSettings }));
    await onUpdate('notifications', newSettings);
  };

  const handlePrivacyChange = async (key: string, value: any) => {
    const newSettings = {
      ...localSettings.privacy,
      [key]: value,
    };
    setLocalSettings(prev => ({ ...prev, privacy: newSettings }));
    await onUpdate('privacy', newSettings);
  };

  const handleSecurityChange = async (key: string, value: any) => {
    const newSettings = {
      ...localSettings.security,
      [key]: value,
    };
    setLocalSettings(prev => ({ ...prev, security: newSettings }));
    await onUpdate('security', newSettings);
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    const newSettings = {
      ...localSettings.preferences,
      [key]: value,
    };
    setLocalSettings(prev => ({ ...prev, preferences: newSettings }));
    await onUpdate('preferences', newSettings);
  };

  const sections = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Notifications */}
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Settings</span>
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about updates and activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-600">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={localSettings.notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-gray-600">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={localSettings.notifications.push}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-gray-600">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={localSettings.notifications.sms}
                      onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-notifications">Marketing Emails</Label>
                      <p className="text-sm text-gray-600">
                        Receive promotional emails and updates
                      </p>
                    </div>
                    <Switch
                      id="marketing-notifications"
                      checked={localSettings.notifications.marketing}
                      onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy */}
          {activeSection === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Privacy Settings</span>
                </CardTitle>
                <CardDescription>
                  Control who can see your information and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profile-visibility">Profile Visibility</Label>
                    <Select
                      value={localSettings.privacy.profileVisibility}
                      onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-email">Show Email Address</Label>
                        <p className="text-sm text-gray-600">
                          Allow others to see your email address
                        </p>
                      </div>
                      <Switch
                        id="show-email"
                        checked={localSettings.privacy.showEmail}
                        onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-phone">Show Phone Number</Label>
                        <p className="text-sm text-gray-600">
                          Allow others to see your phone number
                        </p>
                      </div>
                      <Switch
                        id="show-phone"
                        checked={localSettings.privacy.showPhone}
                        onCheckedChange={(checked) => handlePrivacyChange('showPhone', checked)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-location">Show Location</Label>
                        <p className="text-sm text-gray-600">
                          Allow others to see your location
                        </p>
                      </div>
                      <Switch
                        id="show-location"
                        checked={localSettings.privacy.showLocation}
                        onCheckedChange={(checked) => handlePrivacyChange('showLocation', checked)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {localSettings.security.twoFactorEnabled && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Enabled
                        </Badge>
                      )}
                      <Switch
                        id="two-factor"
                        checked={localSettings.security.twoFactorEnabled}
                        onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="login-alerts">Login Alerts</Label>
                      <p className="text-sm text-gray-600">
                        Get notified when someone logs into your account
                      </p>
                    </div>
                    <Switch
                      id="login-alerts"
                      checked={localSettings.security.loginAlerts}
                      onCheckedChange={(checked) => handleSecurityChange('loginAlerts', checked)}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="session-timeout">Session Timeout</Label>
                    <Select
                      value={localSettings.security.sessionTimeout.toString()}
                      onValueChange={(value) => handleSecurityChange('sessionTimeout', parseInt(value))}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferences */}
          {activeSection === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize your experience and interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={localSettings.preferences.language}
                      onValueChange={(value) => handlePreferenceChange('language', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={localSettings.preferences.timezone}
                      onValueChange={(value) => handlePreferenceChange('timezone', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={localSettings.preferences.theme}
                      onValueChange={(value) => handlePreferenceChange('theme', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {onDeleteAccount && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-600">Delete Account</h3>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={onDeleteAccount}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
