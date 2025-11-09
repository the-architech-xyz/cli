'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Play, 
  ExternalLink, 
  CheckCircle, 
  ArrowRight,
  Code,
  Database,
  Palette,
  Shield,
  Zap
} from 'lucide-react';
import { useState } from 'react';

const steps = [
  {
    id: 1,
    title: 'Install Dependencies',
    description: 'Install all required packages and dependencies',
    command: 'npm install',
    icon: Terminal,
    color: 'bg-blue-100 text-blue-600',
    details: 'This will install all the packages defined in your package.json file, including React, Next.js, and all the UI components.'
  },
  {
    id: 2,
    title: 'Start Development Server',
    description: 'Launch the development server to see your app',
    command: 'npm run dev',
    icon: Play,
    color: 'bg-green-100 text-green-600',
    details: 'This starts the Next.js development server on http://localhost:3000. The app will automatically reload when you make changes.'
  },
  {
    id: 3,
    title: 'Open in Browser',
    description: 'View your application in the browser',
    command: 'http://localhost:3000',
    icon: ExternalLink,
    color: 'bg-purple-100 text-purple-600',
    details: 'Open your browser and navigate to the local development URL to see your application running.'
  }
];

const features = [
  {
    title: 'Customize Components',
    description: 'Modify UI components in src/components/ui/',
    icon: Palette,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    title: 'Add Pages',
    description: 'Create new pages in src/app/',
    icon: Code,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'Configure Database',
    description: 'Set up your database connection',
    icon: Database,
    color: 'bg-green-100 text-green-600'
  },
  {
    title: 'Setup Authentication',
    description: 'Configure user authentication',
    icon: Shield,
    color: 'bg-red-100 text-red-600'
  }
];

export function QuickStartGuide() {
  const [activeStep, setActiveStep] = useState(0);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative"
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                activeStep === index ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setActiveStep(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${step.color}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      Step {step.id}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="mb-4">
                  {step.description}
                </CardDescription>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded text-sm font-mono">
                    <span className="text-gray-500">$</span>
                    <span className="flex-1">{step.command}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(step.command);
                      }}
                      className="h-6 px-2"
                    >
                      {copiedCommand === step.command ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        'Copy'
                      )}
                    </Button>
                  </div>
                  
                  {activeStep === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-gray-600 bg-blue-50 p-3 rounded"
                    >
                      {step.details}
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-300 transform -translate-y-1/2">
                <ArrowRight className="w-4 h-4 text-gray-400 absolute -right-1 -top-1.5" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation & Resources</CardTitle>
          <CardDescription>
            Learn more about the technologies used in your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-black rounded">
                <Code className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium">Next.js Docs</h4>
                <p className="text-sm text-gray-600">React framework documentation</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
            
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-600 rounded">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium">Shadcn/UI</h4>
                <p className="text-sm text-gray-600">Component library docs</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
            
            <a
              href="https://tailwindcss.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-cyan-500 rounded">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium">Tailwind CSS</h4>
                <p className="text-sm text-gray-600">Utility-first CSS framework</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
