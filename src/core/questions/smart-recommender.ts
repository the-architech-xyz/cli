/**
 * Smart Recommender - Agent-Driven Intelligence
 * 
 * The brain of the simplified question system.
 * Now agent-driven: queries domain agents for real-time recommendations.
 */

import { 
  ProjectRecommendation, 
  TechStackRecommendation, 
  TechRecommendation,
  ProjectContext, 
  ProjectType,
  KeywordAnalysis,
  PROJECT_TYPE_KEYWORDS,
  FEATURE_KEYWORDS
} from '../../types/smart-questions.js';
import { UIAgent } from '../../agents/ui-agent.js';
import { DBAgent } from '../../agents/db-agent.js';
import { AuthAgent } from '../../agents/auth-agent.js';
import { OrchestratorAgent } from '../../agents/orchestrator-agent.js';
import { IAgent } from '../../types/agents.js';

export class SmartRecommender {
  private uiAgent: UIAgent;
  private dbAgent: DBAgent;
  private authAgent: AuthAgent;

  constructor() {
    this.uiAgent = new UIAgent();
    this.dbAgent = new DBAgent();
    this.authAgent = new AuthAgent();
  }

  /**
   * Generate a smart recommendation based on user input
   * Now agent-driven: queries domain agents for real-time recommendations
   */
  async getRecommendation(userInput: string): Promise<ProjectRecommendation> {
    // Step 1: Analyze user input
    const context = this.analyzeUserInput(userInput);
    
    // Step 2: Generate tech stack recommendations using agents
    const techStack = await this.generateTechStackAgentDriven(context);
    
    // Step 3: Calculate confidence and complexity
    const confidence = this.calculateConfidence(context);
    const complexity = this.determineComplexity(context);
    
    // Step 4: Determine questions remaining
    const questionsRemaining = this.calculateQuestionsRemaining(context);
    
    // Step 5: Generate description
    const description = this.generateDescription(context);
    
    // Step 6: Calculate estimated time
    const estimatedTime = this.calculateEstimatedTime(complexity, context.features.length);
    
    return {
      projectType: context.type,
      features: context.features,
      techStack,
      estimatedTime,
      questionsRemaining,
      confidence,
      description,
      complexity
    };
  }

  /**
   * Analyze user input to determine project context
   */
  private analyzeUserInput(input: string): ProjectContext {
    const normalizedInput = input.toLowerCase().trim();
    
    // Analyze project type
    const typeAnalysis = this.analyzeProjectType(normalizedInput);
    
    // Extract features
    const features = this.extractFeaturesWithAutoAdd(normalizedInput, typeAnalysis.projectType);
    
    // Determine complexity
    const complexity = this.determineComplexity({
      type: typeAnalysis.projectType,
      features,
      description: input
    });
    
    // Determine user expertise
    const userExpertise = this.determineUserExpertise(normalizedInput);
    
    // Extract requirements
    const requirements = this.extractRequirements(normalizedInput);
    
    return {
      type: typeAnalysis.projectType,
      complexity,
      features,
      requirements,
      description: input,
      userExpertise
    };
  }

  /**
   * Analyze project type based on keywords
   */
  private analyzeProjectType(input: string): KeywordAnalysis {
    let bestMatch: ProjectType = 'custom';
    let bestScore = 0;
    let matchedKeywords: string[] = [];
    
    // Check each project type
    for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
      const score = this.calculateKeywordScore(input, keywords);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = type as ProjectType;
        matchedKeywords = keywords.filter(keyword => 
          input.includes(keyword)
        );
      }
    }
    
    // Extract features from input
    const features = this.extractFeatures(input);
    
    // Determine complexity
    const complexity = this.determineComplexity({
      type: bestMatch,
      features,
      description: input
    });
    
    return {
      projectType: bestMatch,
      confidence: Math.min(bestScore / 10, 1), // Normalize to 0-1
      keywords: matchedKeywords,
      features,
      complexity
    };
  }

  /**
   * Extract features from user input
   */
  private extractFeatures(input: string): string[] {
    const features: string[] = [];
    
    // Check each feature category
    for (const [feature, keywords] of Object.entries(FEATURE_KEYWORDS)) {
      const hasFeature = keywords.some(keyword => 
        input.includes(keyword)
      );
      
      if (hasFeature) {
        features.push(feature);
      }
    }
    
    return features;
  }

  /**
   * Extract features with automatic additions based on project type
   */
  private extractFeaturesWithAutoAdd(input: string, projectType: ProjectType): string[] {
    const features = this.extractFeatures(input);
    
    // Add automatic features based on project type
    if (projectType === 'ecommerce') {
      if (!features.includes('payments')) features.push('payments');
      if (!features.includes('database')) features.push('database');
      if (!features.includes('authentication')) features.push('authentication');
    }
    
    // Blog projects automatically get database and email
    if (projectType === 'blog') {
      if (!features.includes('database')) features.push('database');
      if (!features.includes('authentication')) features.push('authentication');
    }
    
    // SaaS projects automatically get payments, database, and monitoring
    if (projectType === 'saas') {
      if (!features.includes('payments')) features.push('payments');
      if (!features.includes('database')) features.push('database');
      if (!features.includes('authentication')) features.push('authentication');
      if (!features.includes('monitoring')) features.push('monitoring');
    }
    
    // Dashboard projects automatically get monitoring
    if (projectType === 'dashboard') {
      if (!features.includes('database')) features.push('database');
      if (!features.includes('authentication')) features.push('authentication');
      if (!features.includes('monitoring')) features.push('monitoring');
    }
    
    return features;
  }

  /**
   * Extract requirements from user input
   */
  private extractRequirements(input: string): string[] {
    const requirements: string[] = [];
    
    // Simple requirement extraction based on keywords
    if (input.includes('fast') || input.includes('performance')) {
      requirements.push('performance');
    }
    
    if (input.includes('secure') || input.includes('security')) {
      requirements.push('security');
    }
    
    if (input.includes('scalable') || input.includes('scale')) {
      requirements.push('scalability');
    }
    
    if (input.includes('modern') || input.includes('latest')) {
      requirements.push('modern-tech');
    }
    
    return requirements;
  }

  /**
   * Determine project complexity
   */
  private determineComplexity(context: { type: ProjectType; features: string[]; description: string }): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0;
    
    // Base complexity by project type
    const typeComplexity: Record<ProjectType, number> = {
      'landing-page': 1,
      'portfolio': 1,
      'blog': 2,
      'api': 2,
      'fullstack': 3,
      'ecommerce': 4,
      'dashboard': 4,
      'saas': 5,
      'custom': 3
    };
    
    complexityScore += typeComplexity[context.type];
    
    // Add complexity for features
    const featureComplexity: Record<string, number> = {
      'payments': 2,
      'authentication': 1,
      'database': 1,
      'email': 1,
      'monitoring': 2,
      'testing': 1,
      'deployment': 1
    };
    
    for (const feature of context.features) {
      complexityScore += featureComplexity[feature] || 0;
    }
    
    // Determine final complexity
    if (complexityScore <= 2) return 'simple';
    if (complexityScore <= 4) return 'medium';
    return 'complex';
  }

  /**
   * Determine user expertise level
   */
  private determineUserExpertise(input: string): 'beginner' | 'intermediate' | 'expert' {
    const expertKeywords = ['expert', 'advanced', 'complex', 'enterprise', 'scalable'];
    const beginnerKeywords = ['simple', 'basic', 'quick', 'learn', 'tutorial', 'demo'];
    
    const expertScore = this.calculateKeywordScore(input, expertKeywords);
    const beginnerScore = this.calculateKeywordScore(input, beginnerKeywords);
    
    if (expertScore > beginnerScore && expertScore > 0) return 'expert';
    if (beginnerScore > expertScore && beginnerScore > 0) return 'beginner';
    return 'intermediate';
  }

  /**
   * Generate tech stack recommendations using agents
   */
  private async generateTechStackAgentDriven(context: ProjectContext): Promise<TechStackRecommendation> {
    // Query each domain agent for recommendations
    const [uiRecommendations, dbRecommendations, authRecommendations] = await Promise.all([
      this.uiAgent.getRecommendations(context),
      this.dbAgent.getRecommendations(context),
      this.authAgent.getRecommendations(context)
    ]);

    // Build tech stack recommendation from agent responses
    const techStack: TechStackRecommendation = {
      // Core technologies (required)
      database: this.selectBestRecommendation(dbRecommendations, 'database'),
      auth: this.selectBestRecommendation(authRecommendations, 'auth'),
      ui: this.selectBestRecommendation(uiRecommendations, 'ui')
    };

    // Optional technologies based on features and complexity
    if (context.features.includes('email') || context.type === 'saas') {
      const emailRecommendation = await this.getEmailRecommendation(context);
      if (emailRecommendation) {
        techStack.email = emailRecommendation;
      }
    }

    if (context.complexity === 'complex' || context.features.includes('monitoring')) {
      const monitoringRecommendation = await this.getMonitoringRecommendation(context);
      if (monitoringRecommendation) {
        techStack.monitoring = monitoringRecommendation;
      }
    }

    if (context.features.includes('payments') || context.type === 'ecommerce') {
      const paymentRecommendation = await this.getPaymentRecommendation(context);
      if (paymentRecommendation) {
        techStack.payment = paymentRecommendation;
      }
    }

    // Always include testing for modern projects
    const testingRecommendation = await this.getTestingRecommendation(context);
    if (testingRecommendation) {
      techStack.testing = testingRecommendation;
    }

    // Include deployment for all projects
    const deploymentRecommendation = await this.getDeploymentRecommendation(context);
    if (deploymentRecommendation) {
      techStack.deployment = deploymentRecommendation;
    }

    return techStack;
  }

  /**
   * Select the best recommendation from a list based on confidence
   */
  private selectBestRecommendation(recommendations: TechRecommendation[], category: string): TechRecommendation {
    if (recommendations.length === 0) {
      // Fallback to default recommendations if no agent recommendations
      const defaults: Record<string, TechRecommendation> = {
        database: { name: 'drizzle', reason: 'TypeScript-first ORM with excellent performance', confidence: 0.8 },
        auth: { name: 'better-auth', reason: 'Modern, secure authentication with excellent Next.js integration', confidence: 0.8 },
        ui: { name: 'shadcn-ui', reason: 'Beautiful, accessible components with excellent design system', confidence: 0.8 }
      };
      return defaults[category] || { name: 'default', reason: 'Default recommendation', confidence: 0.5 };
    }

    // Return the highest confidence recommendation
    return recommendations.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Get email service recommendation
   */
  private async getEmailRecommendation(context: ProjectContext): Promise<TechRecommendation | undefined> {
    // Use UI agent for email recommendations
    const uiRecommendations = await this.uiAgent.getRecommendations(context);
    const emailRecommendations = uiRecommendations.filter(rec => 
      ['resend', 'sendgrid', 'mailgun'].includes(rec.name)
    );
    
    return emailRecommendations.length > 0 ? emailRecommendations[0] : undefined;
  }

  /**
   * Get monitoring service recommendation
   */
  private async getMonitoringRecommendation(context: ProjectContext): Promise<TechRecommendation | undefined> {
    // Use UI agent for monitoring recommendations
    const uiRecommendations = await this.uiAgent.getRecommendations(context);
    const monitoringRecommendations = uiRecommendations.filter(rec => 
      ['sentry', 'google-analytics', 'mixpanel'].includes(rec.name)
    );
    
    return monitoringRecommendations.length > 0 ? monitoringRecommendations[0] : undefined;
  }

  /**
   * Get payment service recommendation
   */
  private async getPaymentRecommendation(context: ProjectContext): Promise<TechRecommendation | undefined> {
    // Use UI agent for payment recommendations
    const uiRecommendations = await this.uiAgent.getRecommendations(context);
    const paymentRecommendations = uiRecommendations.filter(rec => 
      ['stripe', 'paypal', 'square'].includes(rec.name)
    );
    
    return paymentRecommendations.length > 0 ? paymentRecommendations[0] : undefined;
  }

  /**
   * Get testing framework recommendation
   */
  private async getTestingRecommendation(context: ProjectContext): Promise<TechRecommendation | undefined> {
    // Use UI agent for testing recommendations
    const uiRecommendations = await this.uiAgent.getRecommendations(context);
    const testingRecommendations = uiRecommendations.filter(rec => 
      ['vitest', 'jest', 'playwright'].includes(rec.name)
    );
    
    return testingRecommendations.length > 0 ? testingRecommendations[0] : {
      name: 'vitest',
      reason: 'Fast testing framework for modern projects',
      confidence: 0.8
    };
  }

  /**
   * Get deployment platform recommendation
   */
  private async getDeploymentRecommendation(context: ProjectContext): Promise<TechRecommendation | undefined> {
    // Use UI agent for deployment recommendations
    const uiRecommendations = await this.uiAgent.getRecommendations(context);
    const deploymentRecommendations = uiRecommendations.filter(rec => 
      ['railway', 'vercel', 'netlify', 'docker'].includes(rec.name)
    );
    
    return deploymentRecommendations.length > 0 ? deploymentRecommendations[0] : {
      name: 'railway',
      reason: 'Full-stack deployment platform with excellent developer experience',
      confidence: 0.8
    };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(context: ProjectContext): number {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence for clear project types
    if (context.type !== 'custom') {
      confidence += 0.2;
    }
    
    // Increase confidence for specific features
    if (context.features.length > 0) {
      confidence += Math.min(context.features.length * 0.05, 0.1);
    }
    
    // Decrease confidence for complex projects
    if (context.complexity === 'complex') {
      confidence -= 0.1;
    }
    
    return Math.min(Math.max(confidence, 0.5), 0.95);
  }

  /**
   * Calculate number of questions remaining
   */
  private calculateQuestionsRemaining(context: ProjectContext): number {
    let questions = 2; // Base questions (project name, confirmation)
    
    // Add questions for features that need customization
    const customizationFeatures = ['payments', 'email', 'monitoring'];
    for (const feature of context.features) {
      if (customizationFeatures.includes(feature)) {
        questions += 1;
      }
    }
    
    // Add questions for complex projects
    if (context.complexity === 'complex') {
      questions += 1;
    }
    
    return Math.min(questions, 5); // Cap at 5 questions
  }

  /**
   * Generate project description
   */
  private generateDescription(context: ProjectContext): string {
    const descriptions: Record<ProjectType, string> = {
      blog: 'A modern blog with content management',
      ecommerce: 'An e-commerce store with payment processing',
      dashboard: 'A data dashboard with analytics',
      api: 'A REST API with authentication',
      fullstack: 'A full-stack web application',
      saas: 'A SaaS platform with subscriptions',
      portfolio: 'A personal portfolio website',
      'landing-page': 'A marketing landing page',
      custom: 'A custom web application'
    };
    
    let description = descriptions[context.type];
    
    // Add feature descriptions
    if (context.features.includes('payments')) {
      description += ' and payment processing';
    }
    
    if (context.features.includes('email')) {
      description += ' with email notifications';
    }
    
    if (context.features.includes('monitoring')) {
      description += ' and performance monitoring';
    }
    
    return description;
  }

  /**
   * Calculate estimated time
   */
  private calculateEstimatedTime(complexity: 'simple' | 'medium' | 'complex', featureCount: number): string {
    const baseTimes: Record<'simple' | 'medium' | 'complex', number> = {
      simple: 2,
      medium: 3,
      complex: 5
    };
    
    const baseTime = baseTimes[complexity];
    const featureTime = Math.min(featureCount * 0.5, 2);
    const totalMinutes = Math.round(baseTime + featureTime);
    
    return `${totalMinutes} minutes`;
  }

  /**
   * Calculate keyword score for matching
   */
  private calculateKeywordScore(input: string, keywords: string[]): number {
    let score = 0;
    
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        score += 1;
        // Bonus for exact matches
        if (input.includes(` ${keyword} `) || input.startsWith(keyword) || input.endsWith(keyword)) {
          score += 0.5;
        }
      }
    }
    
    return score;
  }
} 