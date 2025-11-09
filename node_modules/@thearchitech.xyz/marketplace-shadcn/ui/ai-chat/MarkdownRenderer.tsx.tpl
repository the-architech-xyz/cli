'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ExternalLink, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowCopy?: boolean;
  allowCollapse?: boolean;
}

interface CodeBlockProps {
  language: string;
  code: string;
  allowCopy?: boolean;
}

interface TableProps {
  headers: string[];
  rows: string[][];
}

function CodeBlock({ language, code, allowCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: 'Code copied',
        description: 'Code has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast({
        title: 'Copy failed',
        description: 'Failed to copy code to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative group">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span className="text-sm font-medium">{language}</span>
          </div>
          {allowCopy && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <pre
              ref={codeRef}
              className="p-4 text-sm overflow-x-auto"
              style=${
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              }
            >
              <code>{code}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function Table({ headers, rows }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border rounded-lg">
        <thead>
          <tr className="bg-muted">
            {headers.map((header, index) => (
              <th
                key={index}
                className="border border-border px-4 py-2 text-left font-medium"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-border px-4 py-2"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start p-0 h-auto font-semibold text-left"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2" />
          )}
          {title}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MarkdownRenderer({ 
  content, 
  className,
  allowCopy = true,
  allowCollapse = true 
}: MarkdownRendererProps) {
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const processMarkdown = (text: string): React.ReactNode[] => {
      const elements: React.ReactNode[] = [];
      let key = 0;

      // Split by code blocks first
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const parts = text.split(codeBlockRegex);

      for (let i = 0; i < parts.length; i += 3) {
        const beforeCode = parts[i];
        const language = parts[i + 1] || 'text';
        const code = parts[i + 2];

        // Process text before code block
        if (beforeCode) {
          const textElements = processText(beforeCode, key);
          elements.push(...textElements);
          key += textElements.length;
        }

        // Add code block
        if (code) {
          elements.push(
            <CodeBlock
              key={`code-${key++}`}
              language={language}
              code={code.trim()}
              allowCopy={allowCopy}
            />
          );
        }
      }

      return elements;
    };

    const processText = (text: string, startKey: number): React.ReactNode[] => {
      const elements: React.ReactNode[] = [];
      let key = startKey;

      // Process headers
      const headerRegex = /^(#{1,6})\s+(.+)$/gm;
      let lastIndex = 0;
      let match;

      while ((match = headerRegex.exec(text)) !== null) {
        // Add text before header
        if (match.index > lastIndex) {
          const beforeText = text.slice(lastIndex, match.index);
          elements.push(...processInlineText(beforeText, key));
          key += beforeText.split('\n').length;
        }

        // Add header
        const level = match[1].length;
        const headerText = match[2];
        const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements;
        
        elements.push(
          <HeaderTag
            key={`header-${key++}`}
            className={cn(
              'font-bold mt-6 mb-3',
              level === 1 && 'text-2xl',
              level === 2 && 'text-xl',
              level === 3 && 'text-lg',
              level === 4 && 'text-base',
              level === 5 && 'text-sm',
              level === 6 && 'text-xs'
            )}
          >
            {processInlineText(headerText, key)}
          </HeaderTag>
        );
        key += headerText.split('\n').length;
        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        elements.push(...processInlineText(remainingText, key));
      }

      return elements;
    };

    const processInlineText = (text: string, startKey: number): React.ReactNode[] => {
      const elements: React.ReactNode[] = [];
      let key = startKey;

      // Process links
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(text)) !== null) {
        // Add text before link
        if (match.index > lastIndex) {
          const beforeText = text.slice(lastIndex, match.index);
          elements.push(beforeText);
        }

        // Add link
        elements.push(
          <a
            key={`link-${key++}`}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {match[1]}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        elements.push(remainingText);
      }

      // Process bold and italic
      const processedElements = elements.map((element, index) => {
        if (typeof element === 'string') {
          return processBoldItalic(element, key + index);
        }
        return element;
      });

      return processedElements.flat();
    };

    const processBoldItalic = (text: string, startKey: number): React.ReactNode[] => {
      const elements: React.ReactNode[] = [];
      let key = startKey;

      // Process bold text
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(text)) !== null) {
        // Add text before bold
        if (match.index > lastIndex) {
          const beforeText = text.slice(lastIndex, match.index);
          elements.push(beforeText);
        }

        // Add bold text
        elements.push(
          <strong key={`bold-${key++}`} className="font-semibold">
            {match[1]}
          </strong>
        );
        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        elements.push(remainingText);
      }

      return elements;
    };

    const processed = processMarkdown(content);
    setProcessedContent(processed);
  }, [content, allowCopy]);

  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      {processedContent.map((element, index) => (
        <React.Fragment key={index}>
          {element}
        </React.Fragment>
      ))}
    </div>
  );
}