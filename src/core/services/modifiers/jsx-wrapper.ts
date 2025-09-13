/**
 * JSX Wrapper Modifier
 * 
 * Pure modifier that wraps JSX components with providers or other components.
 * Completely agnostic to what it's wrapping - all business logic comes from blueprint parameters.
 */

import { BasePureModifier } from './pure-modifier.js';
import { Project, SourceFile, JsxElement, JsxSelfClosingElement, JsxOpeningElement } from 'ts-morph';

export interface JSXWrapperParams {
  targetComponent: string;      // Component to wrap
  wrapperComponent: {
    name: string;               // Wrapper component name
    importFrom: string;         // Import path
    props?: Record<string, any>; // Props to pass
  };
  wrapStrategy: 'provider' | 'hoc' | 'wrapper';
}

export class JSXWrapper extends BasePureModifier {
  getName(): string {
    return 'jsx-wrapper';
  }
  
  getDescription(): string {
    return 'Wraps JSX components with providers or other components';
  }
  
  validateParams(params: any): boolean {
    if (!params || typeof params !== 'object') {
      return false;
    }
    
    const { targetComponent, wrapperComponent, wrapStrategy } = params;
    
    // Validate targetComponent
    if (typeof targetComponent !== 'string' || !targetComponent.trim()) {
      return false;
    }
    
    // Validate wrapperComponent
    if (!wrapperComponent || typeof wrapperComponent !== 'object') {
      return false;
    }
    
    if (typeof wrapperComponent.name !== 'string' || !wrapperComponent.name.trim()) {
      return false;
    }
    
    if (typeof wrapperComponent.importFrom !== 'string' || !wrapperComponent.importFrom.trim()) {
      return false;
    }
    
    if (wrapperComponent.props !== undefined && typeof wrapperComponent.props !== 'object') {
      return false;
    }
    
    // Validate wrapStrategy
    if (!['provider', 'hoc', 'wrapper'].includes(wrapStrategy)) {
      return false;
    }
    
    return true;
  }
  
  async transform(filePath: string, params: JSXWrapperParams): Promise<void> {
    try {
      await this.validateFile(filePath);
      
      const content = await this.readFile(filePath);
      const project = new Project();
      const sourceFile = project.createSourceFile(filePath, content, { overwrite: true });
      
      // Add the import for the wrapper component
      this.addWrapperImport(sourceFile, params.wrapperComponent);
      
      // Find and wrap the target component
      this.wrapTargetComponent(sourceFile, params);
      
      // Write the modified content back
      const modifiedContent = sourceFile.getFullText();
      await this.writeFile(filePath, modifiedContent);
      
    } catch (error) {
      this.handleError(error as Error, filePath, this.getName());
    }
  }
  
  private addWrapperImport(sourceFile: SourceFile, wrapperComponent: JSXWrapperParams['wrapperComponent']): void {
    // Extract the base component name (e.g., 'Sentry' from 'Sentry.Provider')
    const baseComponentName = wrapperComponent.name.split('.')[0];
    
    if (!baseComponentName) {
      throw new Error('Invalid wrapper component name');
    }
    
    // Check if import already exists
    const existingImports = sourceFile.getImportDeclarations();
    const existingImport = existingImports.find(imp => 
      imp.getModuleSpecifierValue() === wrapperComponent.importFrom
    );
    
    if (existingImport) {
      // Add to existing import
      const namedImports = existingImport.getNamedImports();
      const hasComponent = namedImports.some(imp => imp.getName() === baseComponentName);
      
      if (!hasComponent) {
        existingImport.addNamedImport({ name: baseComponentName });
      }
    } else {
      // Create new import
      sourceFile.addImportDeclaration({
        namedImports: [{ name: baseComponentName }],
        moduleSpecifier: wrapperComponent.importFrom
      });
    }
  }
  
  private wrapTargetComponent(sourceFile: SourceFile, params: JSXWrapperParams): void {
    const { targetComponent, wrapperComponent, wrapStrategy } = params;
    
    // Simple string replacement approach
    const content = sourceFile.getFullText();
    const wrapperProps = this.serializeJSXProps(wrapperComponent.props || {});
    
    // Find the target component and wrap it
    const targetRegex = new RegExp(`<${targetComponent}([^>]*)>`, 'g');
    const wrappedContent = content.replace(targetRegex, (match, attributes) => {
      return `<${wrapperComponent.name}${wrapperProps ? ` ${wrapperProps}` : ''}>\n  <${targetComponent}${attributes}>`;
    });
    
    // Close the wrapper
    const closingRegex = new RegExp(`</${targetComponent}>`, 'g');
    const finalContent = wrappedContent.replace(closingRegex, `  </${targetComponent}>\n</${wrapperComponent.name}>`);
    
    sourceFile.replaceWithText(finalContent);
  }
  
  private isTargetComponent(element: JsxElement | JsxSelfClosingElement, targetComponent: string): boolean {
    const openingElement = element.getKind() === 299 ? 
      (element as JsxElement).getOpeningElement() : 
      element as JsxSelfClosingElement;
    
    const tagName = openingElement.getTagNameNode();
    return tagName.getText() === targetComponent;
  }
  
  private wrapJSXElement(element: JsxElement, wrapperComponent: JSXWrapperParams['wrapperComponent'], wrapStrategy: string): void {
    const wrapperProps = this.serializeJSXProps(wrapperComponent.props || {});
    
    // Create the wrapper JSX element
    const wrapperElement = this.createWrapperJSXElement(wrapperComponent.name, wrapperProps, wrapStrategy);
    
    // Replace the target element with the wrapped version
    const targetElementText = element.getText();
    const wrappedElementText = this.createWrappedElement(wrapperElement, targetElementText, wrapStrategy);
    
    element.replaceWithText(wrappedElementText);
  }
  
  private wrapJSXSelfClosingElement(element: JsxSelfClosingElement, wrapperComponent: JSXWrapperParams['wrapperComponent'], wrapStrategy: string): void {
    const wrapperProps = this.serializeJSXProps(wrapperComponent.props || {});
    
    // Create the wrapper JSX element
    const wrapperElement = this.createWrapperJSXElement(wrapperComponent.name, wrapperProps, wrapStrategy);
    
    // Replace the target element with the wrapped version
    const targetElementText = element.getText();
    const wrappedElementText = this.createWrappedElement(wrapperElement, targetElementText, wrapStrategy);
    
    element.replaceWithText(wrappedElementText);
  }
  
  private createWrapperJSXElement(componentName: string, props: string, wrapStrategy: string): string {
    switch (wrapStrategy) {
      case 'provider':
        return `<${componentName}${props ? ` ${props}` : ''}>`;
        
      case 'hoc':
        return `<${componentName}${props ? ` ${props}` : ''}>`;
        
      case 'wrapper':
        return `<${componentName}${props ? ` ${props}` : ''}>`;
        
      default:
        throw new Error(`Unknown wrap strategy: ${wrapStrategy}`);
    }
  }
  
  private createWrappedElement(wrapperElement: string, targetElement: string, wrapStrategy: string): string {
    const tagName = this.extractTagName(wrapperElement);
    
    switch (wrapStrategy) {
      case 'provider':
        return `${wrapperElement}\n  ${targetElement}\n</${tagName}>`;
        
      case 'hoc':
        return `${wrapperElement}\n  ${targetElement}\n</${tagName}>`;
        
      case 'wrapper':
        return `${wrapperElement}\n  ${targetElement}\n</${tagName}>`;
        
      default:
        throw new Error(`Unknown wrap strategy: ${wrapStrategy}`);
    }
  }
  
  private extractTagName(element: string): string {
    const match = element.match(/<(\w+)/);
    return match?.[1] || 'div';
  }
  
  private serializeJSXProps(props: Record<string, any>): string {
    if (!props || Object.keys(props).length === 0) {
      return '';
    }
    
    const propStrings = Object.entries(props).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        return `${key}={${value}}`;
      } else if (typeof value === 'object') {
        return `${key}={${JSON.stringify(value)}}`;
      } else {
        return `${key}={${value}}`;
      }
    });
    
    return propStrings.join(' ');
  }
}
