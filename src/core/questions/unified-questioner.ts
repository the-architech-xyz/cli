/**
 * Unified Questioner - Simplified with Smart Defaults
 *
 * Presents recommendations and asks minimal customization questions.
 * Now uses smart defaults to provide a magical user experience.
 */

import inquirer from 'inquirer';
import { ProjectRecommendation } from '../../types/smart-questions.js';
import { SimplifiedQuestioner } from './simplified-questioner.js';

export class UnifiedQuestioner {
  private simplifiedQuestioner: SimplifiedQuestioner;

  constructor() {
    this.simplifiedQuestioner = new SimplifiedQuestioner();
  }

  /**
   * Present recommendation to user and get confirmation
   */
  async presentRecommendation(recommendation: ProjectRecommendation): Promise<boolean> {
    // Check if we're in non-interactive mode (--yes flag)
    const isNonInteractive = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (isNonInteractive) {
      console.log('\n🎯 Using non-interactive mode with smart defaults...\n');
      return true; // Auto-accept in non-interactive mode
    }
    
    return this.simplifiedQuestioner.presentRecommendationWithDefaults(recommendation);
  }

  /**
   * Ask customization questions based on recommendation
   * Now uses smart defaults to minimize questions
   */
  async askCustomizationQuestions(recommendation: ProjectRecommendation): Promise<Record<string, any>> {
    // Check if we're in non-interactive mode (--yes flag)
    const isNonInteractive = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (isNonInteractive) {
      console.log('📝 Configuring plugins without smart defaults:\n');
      // Return empty customizations in non-interactive mode
      return {};
    }
    
    return this.simplifiedQuestioner.askMinimalQuestions(recommendation);
  }

  /**
   * Handle customization rejection
   */
  async handleCustomizationRejection(recommendation: ProjectRecommendation): Promise<ProjectRecommendation> {
    // Check if we're in non-interactive mode
    const isNonInteractive = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (isNonInteractive) {
      console.log('⚙️  Using default configuration in non-interactive mode...\n');
      return recommendation; // Return original recommendation
    }
    
    console.log('\n⚙️  Let\'s customize your recommendations:\n');
    
    // Allow user to modify tech stack
    const { database, auth, ui } = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'Choose your database:',
        choices: [
          { name: 'Drizzle + Neon (Recommended)', value: 'drizzle' },
          { name: 'Prisma + Supabase', value: 'prisma' },
          { name: 'MongoDB + Mongoose', value: 'mongodb' }
        ],
        default: 'drizzle'
      },
      {
        type: 'list',
        name: 'auth',
        message: 'Choose your authentication:',
        choices: [
          { name: 'Better Auth (Recommended)', value: 'better-auth' },
          { name: 'Clerk', value: 'clerk' },
          { name: 'NextAuth.js', value: 'nextauth' }
        ],
        default: 'better-auth'
      },
      {
        type: 'list',
        name: 'ui',
        message: 'Choose your UI library:',
        choices: [
          { name: 'Shadcn UI (Recommended)', value: 'shadcn-ui' },
          { name: 'Material-UI (MUI)', value: 'mui' },
          { name: 'Chakra UI', value: 'chakra-ui' }
        ],
        default: 'shadcn-ui'
      }
    ]);
    
    // Update recommendation with user choices
    const updatedRecommendation = { ...recommendation };
    updatedRecommendation.techStack.database.name = database;
    updatedRecommendation.techStack.auth.name = auth;
    updatedRecommendation.techStack.ui.name = ui;
    
    return updatedRecommendation;
  }
} 