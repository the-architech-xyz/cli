import { ITestingProvider } from '../../interfaces/providers.js';
import { AgentContext, PluginResult, PluginMetadata, ParameterSchema, CoreCategory } from '../../interfaces/base.js';

export class VitestAdapter implements ITestingProvider {
  getMetadata(): PluginMetadata {
    return {
      name: "@architech/vitest-adapter",
      version: "0.1.0",
      category: CoreCategory.TESTING,
      description: "Vitest testing adapter",
      dependencies: ["vitest", "@vitest/ui"]
    };
  }

  getParameterSchema(): ParameterSchema {
    return { parameters: [] };
  }

  async setup(context: AgentContext): Promise<void> {}
  async configureTestEnvironment(context: AgentContext): Promise<void> {}
  async generateTestFiles(context: AgentContext): Promise<void> {}
  async setupCoverage(context: AgentContext): Promise<void> {}
  async configureMocking(context: AgentContext): Promise<void> {}
  async setupE2E(context: AgentContext): Promise<void> {}

  async execute(context: AgentContext): Promise<PluginResult> {
    return { success: true };
  }

  async rollback(context: AgentContext): Promise<void> {}
} 