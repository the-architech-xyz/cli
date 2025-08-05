import { IAuthProvider } from '../../interfaces/providers.js';
import { AgentContext, PluginResult, PluginMetadata, ParameterSchema, CoreCategory } from '../../interfaces/base.js';

export class NextAuthAdapter implements IAuthProvider {
  getMetadata(): PluginMetadata {
    return {
      name: "@architech/nextauth-adapter",
      version: "0.1.0",
      category: CoreCategory.AUTH,
      description: "NextAuth.js adapter",
      dependencies: ["next-auth"]
    };
  }

  getParameterSchema(): ParameterSchema {
    return { parameters: [] };
  }

  async setup(context: AgentContext): Promise<void> {}
  async getClientMethods(context: AgentContext): Promise<string[]> { return []; }
  async getServerMethods(context: AgentContext): Promise<string[]> { return []; }
  async generateMiddleware(context: AgentContext): Promise<void> {}
  async configureProviders(context: AgentContext): Promise<void> {}
  async setupSession(context: AgentContext): Promise<void> {}
  async generateAuthComponents(context: AgentContext): Promise<void> {}

  async execute(context: AgentContext): Promise<PluginResult> {
    return { success: true };
  }

  async rollback(context: AgentContext): Promise<void> {}
} 