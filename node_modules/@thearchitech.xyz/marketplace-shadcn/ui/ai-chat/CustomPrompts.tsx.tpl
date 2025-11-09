'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  Star, 
  StarOff,
  Tag,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Lightbulb,
  Code,
  MessageSquare,
  Zap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CustomPrompt, CustomPromptCategory } from '@/types/ai-chat';

export interface CustomPromptsProps {
  className?: string;
  onPromptSelect?: (prompt: string) => void;
  onPromptCreate?: (prompt: CustomPrompt) => void;
  onPromptUpdate?: (id: string, prompt: CustomPrompt) => void;
  onPromptDelete?: (id: string) => void;
  onCategoryCreate?: (category: CustomPromptCategory) => void;
  onCategoryUpdate?: (id: string, category: CustomPromptCategory) => void;
  onCategoryDelete?: (id: string) => void;
  initialPrompts?: CustomPrompt[];
  initialCategories?: CustomPromptCategory[];
}

export function CustomPrompts({
  className,
  onPromptSelect,
  onPromptCreate,
  onPromptUpdate,
  onPromptDelete,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  initialPrompts = [],
  initialCategories = [],
}: CustomPromptsProps) {
  const [prompts, setPrompts] = useState<CustomPrompt[]>(initialPrompts);
  const [categories, setCategories] = useState<CustomPromptCategory[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    tags: [] as string[],
  });

  // Filter prompts based on search and category
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(prompt =>
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory);
    }

    return filtered;
  }, [prompts, searchQuery, selectedCategory]);

  // Group prompts by category
  const groupedPrompts = useMemo(() => {
    const groups: Record<string, CustomPrompt[]> = {};
    
    filteredPrompts.forEach(prompt => {
      const category = prompt.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(prompt);
    });

    return groups;
  }, [filteredPrompts]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.content.trim()) {
      return;
    }

    const promptData: CustomPrompt = {
      id: editingPrompt?.id || Date.now().toString(),
      name: formData.name.trim(),
      content: formData.content.trim(),
      category: formData.category || undefined,
      tags: formData.tags,
      createdAt: editingPrompt?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingPrompt) {
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? promptData : p));
      onPromptUpdate?.(editingPrompt.id, promptData);
      setIsEditDialogOpen(false);
    } else {
      setPrompts(prev => [...prev, promptData]);
      onPromptCreate?.(promptData);
      setIsCreateDialogOpen(false);
    }

    // Reset form
    setFormData({ name: '', content: '', category: '', tags: [] });
    setEditingPrompt(null);
  }, [formData, editingPrompt, onPromptCreate, onPromptUpdate]);

  // Handle prompt actions
  const handlePromptSelect = useCallback((prompt: CustomPrompt) => {
    onPromptSelect?.(prompt.content);
  }, [onPromptSelect]);

  const handlePromptEdit = useCallback((prompt: CustomPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      content: prompt.content,
      category: prompt.category || '',
      tags: prompt.tags || [],
    });
    setIsEditDialogOpen(true);
  }, []);

  const handlePromptDelete = useCallback((promptId: string) => {
    setPrompts(prev => prev.filter(p => p.id !== promptId));
    onPromptDelete?.(promptId);
  }, [onPromptDelete]);

  const handlePromptCopy = useCallback((prompt: CustomPrompt) => {
    navigator.clipboard.writeText(prompt.content);
  }, []);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const handleTagAdd = useCallback((tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
    }
  }, [formData.tags]);

  const handleTagRemove = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || 'bg-gray-100 text-gray-800';
  };

  const getPromptIcon = (prompt: CustomPrompt) => {
    if (prompt.content.includes('code') || prompt.content.includes('```')) {
      return <Code className="h-4 w-4" />;
    }
    if (prompt.content.includes('creative') || prompt.content.includes('story')) {
      return <Lightbulb className="h-4 w-4" />;
    }
    if (prompt.content.includes('chat') || prompt.content.includes('conversation')) {
      return <MessageSquare className="h-4 w-4" />;
    }
    return <Zap className="h-4 w-4" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Custom Prompts</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
          
          {selectedCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Clear Category
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Prompts List */}
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {Object.keys(groupedPrompts).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No prompts found' : 'No prompts yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create your first custom prompt to get started'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Prompt
                </Button>
              )}
            </div>
          ) : (
            Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
              <div key={category} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCategoryToggle(category)}
                    className="p-0 h-auto"
                  >
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                  <Badge className={getCategoryColor(category)}>
                    {category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {categoryPrompts.length} prompt{categoryPrompts.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Category Prompts */}
                {expandedCategories.has(category) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryPrompts.map((prompt) => (
                      <Card key={prompt.id} className="group hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getPromptIcon(prompt)}
                              <CardTitle className="text-sm">{prompt.name}</CardTitle>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePromptSelect(prompt)}>
                                  <MessageSquare className="h-3 w-3 mr-2" />
                                  Use Prompt
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePromptCopy(prompt)}>
                                  <Copy className="h-3 w-3 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handlePromptEdit(prompt)}>
                                  <Edit3 className="h-3 w-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePromptDelete(prompt.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {prompt.content}
                          </p>
                          {prompt.tags && prompt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {prompt.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingPrompt(null);
          setFormData({ name: '', content: '', category: '', tags: [] });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="Enter prompt name..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Enter prompt content..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="">No Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleTagRemove(tag)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add tag and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagAdd(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingPrompt(null);
                setFormData({ name: '', content: '', category: '', tags: [] });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim() || !formData.content.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {editingPrompt ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CustomPrompts;
