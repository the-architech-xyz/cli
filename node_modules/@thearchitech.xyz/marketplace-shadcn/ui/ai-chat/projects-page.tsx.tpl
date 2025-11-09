// AI Projects Page Component

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy,
  ExternalLink,
  Calendar,
  User,
  MessageSquare,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AIProject {
  id: string;
  name: string;
  description: string;
  type: 'chat' | 'completion' | 'embedding' | 'image' | 'custom';
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  lastActivity: Date;
  tags: string[];
  isPublic: boolean;
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
  }>;
}

interface ProjectsPageProps {
  projects: AIProject[];
  onCreateProject: (project: Omit<AIProject, 'id' | 'createdAt' | 'updatedAt' | 'lastActivity'>) => void;
  onUpdateProject: (id: string, updates: Partial<AIProject>) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onOpenProject: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onDuplicateProject,
  onOpenProject,
  isLoading = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'lastActivity'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || project.type === filterType;
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'completion':
        return <Zap className="w-4 h-4" />;
      case 'embedding':
        return <Copy className="w-4 h-4" />;
      case 'image':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'bg-blue-100 text-blue-800';
      case 'completion':
        return 'bg-green-100 text-green-800';
      case 'embedding':
        return 'bg-purple-100 text-purple-800';
      case 'image':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cost);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Projects</h1>
          <p className="text-gray-600">
            Manage your AI projects and experiments
          </p>
        </div>
        <Button onClick={() => onCreateProject({
          name: 'New Project',
          description: '',
          type: 'chat',
          status: 'draft',
          messageCount: 0,
          totalTokens: 0,
          totalCost: 0,
          tags: [],
          isPublic: false,
          collaborators: [],
        })}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Types</option>
          <option value="chat">Chat</option>
          <option value="completion">Completion</option>
          <option value="embedding">Embedding</option>
          <option value="image">Image</option>
          <option value="custom">Custom</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field as any);
            setSortOrder(order as any);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="updatedAt-desc">Last Updated</option>
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="lastActivity-desc">Last Activity</option>
        </select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first AI project'
              }
            </p>
            <Button onClick={() => onCreateProject({
              name: 'New Project',
              description: '',
              type: 'chat',
              status: 'draft',
              messageCount: 0,
              totalTokens: 0,
              totalCost: 0,
              tags: [],
              isPublic: false,
              collaborators: [],
            })}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(project.type)}`}>
                      {getTypeIcon(project.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getTypeColor(project.type)}>
                          {project.type}
                        </Badge>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onOpenProject(project.id)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateProject(project.id, {})}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicateProject(project.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteProject(project.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-2">
                  {project.description || 'No description provided'}
                </CardDescription>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Messages</p>
                    <p className="font-medium">{project.messageCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tokens</p>
                    <p className="font-medium">{project.totalTokens.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cost</p>
                    <p className="font-medium">{formatCost(project.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Activity</p>
                    <p className="font-medium">{formatDate(project.lastActivity)}</p>
                  </div>
                </div>
                
                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Created {formatDate(project.createdAt)}</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onOpenProject(project.id)}
                  >
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};