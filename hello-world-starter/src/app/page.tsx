'use client';

import { motion } from 'framer-motion';
import { ProjectAnalyzer } from '@/lib/project-analyzer';
import { WelcomeLayout } from '@/components/welcome/welcome-layout';
import { TechStackCard } from '@/components/welcome/tech-stack-card';
import { ComponentShowcase } from '@/components/welcome/component-showcase';
import { ProjectStructure } from '@/components/welcome/project-structure';
import { QuickStartGuide } from '@/components/welcome/quick-start-guide';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Code, Palette, Database, Shield } from 'lucide-react';

// Project data from genome
const projectData = {
  name: 'hello-world-starter',
  description: 'A minimal, production-ready Next.js starter',
  version: '1.0.0',
  modules: [
    
    {
      id: 'adapters/ui/shadcn-ui',
      name: 'adapters/ui/shadcn-ui',
      description: 'Module: adapters/ui/shadcn-ui',
      version: 'latest'
    },
    
    {
      id: 'features/architech-welcome',
      name: 'features/architech-welcome',
      description: 'Module: features/architech-welcome',
      version: 'latest'
    }
    
  ]
};

export default function WelcomePage() {
  const analysis = ProjectAnalyzer.analyzeProject(projectData.modules);
  const projectStructure = ProjectAnalyzer.generateProjectStructure();
  
  // Transform analysis into capability objects for TechStackCard
  const capabilities = [
    ...analysis.technologies.map((tech, index) => ({
      id: `tech-${index}`,
      name: tech.charAt(0).toUpperCase() + tech.slice(1),
      description: `${tech.charAt(0).toUpperCase() + tech.slice(1)} technology stack`,
      category: tech === 'ui' ? 'ui' : tech === 'framework' ? 'framework' : 'other' as const,
    })),
    ...analysis.capabilities.map((cap, index) => ({
      id: `cap-${index}`,
      name: cap,
      description: `${cap} capability`,
      category: 'other' as const,
    })),
  ];

  return (
    <WelcomeLayout>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 py-12"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Generated with The Architech
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome to Your New App
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your modern application is ready! Explore the features and technologies that power your project.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button variant="outline" size="lg">
            View Documentation
          </Button>
        </motion.div>
      </motion.div>

      {/* Technology Stack */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="py-12"
      >
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Technology Stack</h2>
          <p className="text-gray-600">Powerful technologies working together</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
            >
              <TechStackCard capability={capability} />
            </motion.div>
          ))}
        </div>
      </motion.section>
      

      {/* Component Showcase */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="py-12"
      >
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Component Library</h2>
          <p className="text-gray-600">Beautiful, accessible components ready to use</p>
        </div>
        
        <ComponentShowcase />
      </motion.section>
      

      {/* Project Structure */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="py-12"
      >
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Project Structure</h2>
          <p className="text-gray-600">Well-organized codebase for maintainability</p>
        </div>
        
        <ProjectStructure structure={projectStructure} />
      </motion.section>
      

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="py-8 border-t border-gray-200"
      >
        <div className="text-center space-y-4">
          
          <p className="text-gray-600">
            Generated with ❤️ by{' '}
            <a 
              href="https://architech.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              The Architech
            </a>
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <a href="https://doc.thearchitech.xyz" className="hover:text-gray-700">Documentation</a>
            <a href="https://github.com/the-architech-xyz" className="hover:text-gray-700">GitHub</a>
            <a href="https://discord.gg/sxhdEEWups" className="hover:text-gray-700">Discord</a>
          </div>
          
        </div>
      </motion.footer>
    </WelcomeLayout>
  );
}
