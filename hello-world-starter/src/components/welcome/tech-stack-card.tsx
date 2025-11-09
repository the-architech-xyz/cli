'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Palette, 
  Database, 
  Shield, 
  Package, 
  RefreshCw,
  Server,
  TestTube,
  Globe,
  Zap
} from 'lucide-react';

interface TechStackCardProps {
  capability: {
    id: string;
    name: string;
    description: string;
    category: 'framework' | 'ui' | 'database' | 'auth' | 'deployment' | 'testing' | 'other';
    version?: string;
    icon?: string;
    color?: string;
  };
}

const categoryIcons = {
  framework: Code,
  ui: Palette,
  database: Database,
  auth: Shield,
  deployment: Server,
  testing: TestTube,
  other: Package
};

const categoryColors = {
  framework: 'bg-blue-100 text-blue-800',
  ui: 'bg-purple-100 text-purple-800',
  database: 'bg-green-100 text-green-800',
  auth: 'bg-red-100 text-red-800',
  deployment: 'bg-orange-100 text-orange-800',
  testing: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800'
};

export function TechStackCard({ capability }: TechStackCardProps) {
  const IconComponent = categoryIcons[capability.category] || Package;
  const colorClass = categoryColors[capability.category];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className="h-full tech-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{capability.name}</CardTitle>
                {capability.version && (
                  <Badge variant="secondary" className="text-xs">
                    v{capability.version}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="text-sm leading-relaxed">
            {capability.description}
          </CardDescription>
          
          <div className="mt-4 flex items-center justify-between">
            <Badge variant="outline" className={colorClass}>
              {capability.category}
            </Badge>
            
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-gray-400"
            >
              <Zap className="w-4 h-4" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
