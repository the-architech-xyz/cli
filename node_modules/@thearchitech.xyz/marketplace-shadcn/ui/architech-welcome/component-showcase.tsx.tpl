'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle,
  Star,
  Heart,
  ThumbsUp
} from 'lucide-react';

export function ComponentShowcase() {
  return (
    <div className="space-y-8">
      {/* Buttons */}
      <Card className="component-showcase">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Buttons
          </CardTitle>
          <CardDescription>
            Various button styles and states
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card className="component-showcase">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Form Elements
          </CardTitle>
          <CardDescription>
            Input fields and form controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">I agree to the terms and conditions</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="notifications" />
            <Label htmlFor="notifications">Enable notifications</Label>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="component-showcase">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Badges
          </CardTitle>
          <CardDescription>
            Status indicators and labels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-green-100 text-green-800">Success</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
            <Badge className="bg-blue-100 text-blue-800">Info</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="component-showcase">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alerts
          </CardTitle>
          <CardDescription>
            Important messages and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is an informational alert.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Success! Your action was completed.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Warning: Please review your input.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Error: Something went wrong.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="component-showcase">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5" />
            Tabs
          </CardTitle>
          <CardDescription>
            Organized content sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="space-y-2">
                <h4 className="font-medium">Project Overview</h4>
                <p className="text-sm text-gray-600">
                  This is a comprehensive overview of your project's capabilities and features.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="features" className="mt-4">
              <div className="space-y-2">
                <h4 className="font-medium">Key Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Modern React with Next.js</li>
                  <li>• Beautiful UI components</li>
                  <li>• TypeScript support</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <div className="space-y-2">
                <h4 className="font-medium">Project Settings</h4>
                <p className="text-sm text-gray-600">
                  Configure your project settings and preferences here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
