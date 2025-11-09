'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Code, 
  Image, 
  Settings,
  Database,
  Shield,
  Palette
} from 'lucide-react';
import { useState } from 'react';

interface ProjectStructureProps {
  structure: {
    name: string;
    type: 'file' | 'directory';
    children?: ProjectStructureProps['structure'][];
    description?: string;
    size?: string;
  };
}

const fileIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'tsx': Code,
  'ts': Code,
  'js': Code,
  'jsx': Code,
  'css': Palette,
  'json': Settings,
  'md': File,
  'png': Image,
  'jpg': Image,
  'svg': Image,
  'db': Database,
  'sql': Database,
  'env': Shield,
  'config': Settings,
  'default': File
};

function getFileIcon(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || 'default';
  return fileIcons[extension] || fileIcons.default;
}

function StructureItem({ 
  item, 
  level = 0, 
  isExpanded = false, 
  onToggle 
}: { 
  item: ProjectStructureProps['structure']; 
  level?: number; 
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const [expanded, setExpanded] = useState(isExpanded);
  const isDirectory = item.type === 'directory';
  const hasChildren = item.children && item.children.length > 0;
  const IconComponent = isDirectory ? (expanded ? FolderOpen : Folder) : getFileIcon(item.name);
  
  const handleClick = () => {
    if (isDirectory && hasChildren) {
      setExpanded(!expanded);
      onToggle?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="select-none"
    >
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer transition-colors ${
          isDirectory ? 'font-medium' : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory && hasChildren && (
          <span className="text-gray-400 text-sm">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!isDirectory && hasChildren && (
          <span className="w-3" />
        )}
        
        <IconComponent className={`w-4 h-4 ${isDirectory ? 'text-blue-500' : 'text-gray-500'}`} />
        
        <span className="text-sm">{item.name}</span>
        
        {item.description && (
          <Badge variant="outline" className="text-xs ml-auto">
            {item.description}
          </Badge>
        )}
        
        {item.size && (
          <span className="text-xs text-gray-400 ml-2">
            {item.size}
          </span>
        )}
      </div>
      
      {isDirectory && hasChildren && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {item.children?.map((child, index) => (
            <StructureItem
              key={`${child.name}-${index}`}
              item={child}
              level={level + 1}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export function ProjectStructure({ structure }: ProjectStructureProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* File Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            File Structure
          </CardTitle>
          <CardDescription>
            Organized project files and directories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="project-structure-tree bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <StructureItem item={structure} isExpanded={true} />
          </div>
        </CardContent>
      </Card>

      {/* Architecture Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Architecture
          </CardTitle>
          <CardDescription>
            Key architectural patterns and concepts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded">
                <Code className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">App Router</h4>
                <p className="text-sm text-blue-700">Next.js 15+ App Router for modern routing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded">
                <Palette className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-purple-900">Component Library</h4>
                <p className="text-sm text-purple-700">Shadcn/UI components with Tailwind CSS</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded">
                <Database className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">Database Layer</h4>
                <p className="text-sm text-green-700">Type-safe database operations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <div className="p-2 bg-red-100 rounded">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-red-900">Authentication</h4>
                <p className="text-sm text-red-700">Secure user authentication system</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
