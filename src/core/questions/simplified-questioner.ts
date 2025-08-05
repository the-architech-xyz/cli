/**
 * Simplified Questioner - Smart Defaults Edition
 * 
 * Uses smart defaults to minimize configuration questions.
 * Provides a magical user experience instead of overwhelming configuration.
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { 
  ProjectRecommendation, 
  ProjectConfig, 
  CustomizationQuestion,
  ValidationResult,
  ValidationError
} from '../../types/smart-questions.js';
import { getSmartDefaults, hasSmartDefaults, getPluginDefaults } from './smart-defaults.js';
import { DynamicQuestioner } from './dynamic-questioner.js';

// Add the DynamicCustomizationQuestion interface
interface DynamicCustomizationQuestion extends CustomizationQuestion {
  validate?: (input: any) => string | true;
  name: string; // Add name field for inquirer compatibility
}

export class SimplifiedQuestioner {
  private dynamicQuestioner: DynamicQuestioner;

  constructor() {
    this.dynamicQuestioner = new DynamicQuestioner();
  }

  /**
   * Present recommendation with smart defaults summary
   */
  async presentRecommendationWithDefaults(recommendation: ProjectRecommendation): Promise<boolean> {
    console.log('\n🎯 I\'ll create a project with these features:\n');
    
    // Display tech stack recommendations
    this.displayTechStack(recommendation.techStack);
    
    // Display project info
    console.log(`\n📊 Project: ${recommendation.description}`);
    console.log(`⏱️  Estimated time: ${recommendation.estimatedTime}`);
    console.log(`🎯 Confidence: ${Math.round(recommendation.confidence * 100)}%`);
    
    // Show smart defaults summary
    const selectedPlugins = this.extractPluginsFromTechStack(recommendation.techStack);
    const smartDefaults = getSmartDefaults(recommendation.projectType as any, selectedPlugins);
    
    if (Object.keys(smartDefaults).length > 0) {
      console.log('\n⚙️  Smart defaults will be applied:');
      for (const [pluginId, defaults] of Object.entries(smartDefaults)) {
        console.log(`   ${chalk.blue(pluginId)}: ${Object.keys(defaults).join(', ')}`);
      }
    }
    
    // Ask for confirmation
    const { accepted } = await inquirer.prompt([
      {
        type: 'list',
        name: 'accepted',
        message: '\nWhat would you like to do?',
        choices: [
          {
            name: '✅ Looks perfect, let\'s build it!',
            value: true,
            description: 'Proceed with smart defaults'
          },
          {
            name: '⚙️  Customize some options',
            value: false,
            description: 'Modify the configuration'
          }
        ],
        default: true
      }
    ]);
    
    return accepted;
  }

  /**
   * Ask minimal customization questions using smart defaults
   */
  async askMinimalQuestions(recommendation: ProjectRecommendation): Promise<Record<string, any>> {
    const customizations: Record<string, any> = {};
    
    // Check if we're in non-interactive mode
    const isNonInteractive = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (isNonInteractive) {
      console.log('📝 Configuring plugins without smart defaults:\n');
      return customizations; // Return empty customizations in non-interactive mode
    }
    
    // Extract selected plugins from tech stack
    const selectedPlugins = this.extractPluginsFromTechStack(recommendation.techStack);
    
    if (selectedPlugins.length === 0) {
      return customizations;
    }
    
    // Apply smart defaults first
    const smartDefaults = getSmartDefaults(recommendation.projectType as any, selectedPlugins);
    Object.assign(customizations, this.flattenDefaults(smartDefaults));
    
    // Only ask questions for plugins without smart defaults
    const pluginsWithoutDefaults = selectedPlugins.filter(pluginId => 
      !hasSmartDefaults(recommendation.projectType as any, pluginId)
    );
    
    if (pluginsWithoutDefaults.length > 0) {
      console.log('\n📝 Configuring your plugins:\n');
      
      // Generate dynamic questions for plugins without smart defaults
      const questions = this.generateProjectQuestions(recommendation);
      
      if (questions.length > 0) {
        const answers = await inquirer.prompt(questions);
        Object.assign(customizations, answers);
      }
    }
    
    return customizations;
  }

  /**
   * Extract plugin IDs from tech stack recommendation
   */
  private extractPluginsFromTechStack(techStack: ProjectRecommendation['techStack']): string[] {
    const plugins: string[] = [];
    
    // Extract plugin IDs from tech stack
    if (techStack.database?.name) plugins.push(techStack.database.name);
    if (techStack.auth?.name) plugins.push(techStack.auth.name);
    if (techStack.ui?.name) plugins.push(techStack.ui.name);
    if (techStack.deployment?.name) plugins.push(techStack.deployment.name);
    if (techStack.testing?.name) plugins.push(techStack.testing.name);
    if (techStack.email?.name) plugins.push(techStack.email.name);
    if (techStack.payment?.name) plugins.push(techStack.payment.name);
    if (techStack.monitoring?.name) plugins.push(techStack.monitoring.name);
    
    return plugins;
  }

  /**
   * Flatten smart defaults into a flat configuration object
   */
  private flattenDefaults(smartDefaults: Record<string, Record<string, any>>): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const [pluginId, defaults] of Object.entries(smartDefaults)) {
      for (const [key, value] of Object.entries(defaults)) {
        flattened[`${pluginId}.${key}`] = value;
      }
    }
    
    return flattened;
  }

  /**
   * Generate project-specific questions (not plugin-related)
   */
  private generateProjectQuestions(recommendation: ProjectRecommendation): DynamicCustomizationQuestion[] {
    const questions: DynamicCustomizationQuestion[] = [];
    
    // Add project-specific questions that aren't covered by plugins
    if (recommendation.projectType === 'blog') {
      questions.push({
        id: 'blogFeatures',
        type: 'confirm',
        message: 'Do you want comments on your blog posts?',
        description: 'Allow readers to comment on your articles',
        default: true,
        category: 'blog',
        name: 'commentsOnBlogPosts'
      });
      
      questions.push({
        id: 'newsletter',
        type: 'confirm',
        message: 'Do you want a newsletter signup?',
        description: 'Collect email addresses for your newsletter',
        default: true,
        category: 'blog',
        name: 'newsletterSignup'
      });
    }
    
    if (recommendation.projectType === 'ecommerce') {
      questions.push({
        id: 'inventoryManagement',
        type: 'confirm',
        message: 'Do you need inventory management?',
        description: 'Track stock levels and low stock alerts',
        default: true,
        category: 'ecommerce',
        name: 'inventoryManagement'
      });
      
      questions.push({
        id: 'shippingCalculator',
        type: 'confirm',
        message: 'Do you need shipping calculator?',
        description: 'Calculate shipping costs based on weight and location',
        default: true,
        category: 'ecommerce',
        name: 'shippingCalculator'
      });
    }
    
    return questions;
  }

  /**
   * Display tech stack recommendations
   */
  private displayTechStack(techStack: ProjectRecommendation['techStack']): void {
    const categories = [
      { key: 'database', icon: '📊', name: 'Database' },
      { key: 'auth', icon: '🔐', name: 'Authentication' },
      { key: 'ui', icon: '🎨', name: 'UI Library' },
      { key: 'deployment', icon: '🚀', name: 'Deployment' },
      { key: 'testing', icon: '🧪', name: 'Testing' },
      { key: 'email', icon: '📧', name: 'Email' },
      { key: 'payment', icon: '💳', name: 'Payment' },
      { key: 'monitoring', icon: '📈', name: 'Monitoring' }
    ];

    for (const category of categories) {
      const tech = techStack[category.key as keyof typeof techStack];
      if (tech) {
        console.log(`${category.icon} ${category.name}: ${chalk.blue(tech.name)} (${Math.round(tech.confidence * 100)}%)`);
        console.log(`   ${tech.reason}`);
      }
    }
  }
} 