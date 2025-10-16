/**
 * Sequential Execution Service
 *
 * Executes modules one by one in a predictable order while preserving
 * all analysis and planning intelligence.
 */
export class SequentialExecutionService {
    constructor() { }
    /**
     * Execute all batches sequentially
     */
    async executeBatches(plan, orchestrator, vfs) {
        const batchResults = [];
        const errors = [];
        console.log(`🚀 Executing ${plan.batches.length} batches sequentially`);
        for (let i = 0; i < plan.batches.length; i++) {
            const batch = plan.batches[i];
            if (!batch) {
                console.error(`❌ Batch ${i + 1} is undefined`);
                errors.push(`Batch ${i + 1} is undefined`);
                continue;
            }
            console.log(`🚀 Executing batch ${i + 1}/${plan.batches.length} (${batch.modules.length} modules)`);
            const batchResult = await this.executeBatch(batch, orchestrator, vfs);
            batchResults.push(batchResult);
            if (!batchResult.success) {
                errors.push(...batchResult.errors);
                console.error(`❌ Batch ${i + 1} failed: ${batchResult.errors.join(', ')}`);
                return { success: false, batchResults, errors };
            }
            console.log(`✅ Batch ${i + 1} completed successfully`);
        }
        console.log(`🎉 All batches executed successfully`);
        return { success: true, batchResults, errors };
    }
    /**
     * Execute a single batch sequentially
     */
    async executeBatch(batch, orchestrator, vfs) {
        const results = [];
        const errors = [];
        console.log(`  🔄 Executing ${batch.modules.length} modules sequentially`);
        for (let i = 0; i < batch.modules.length; i++) {
            const module = batch.modules[i];
            if (!module) {
                console.error(`    ❌ Module ${i + 1} is undefined`);
                errors.push(`Module ${i + 1} is undefined`);
                continue;
            }
            console.log(`    🔧 Executing module ${i + 1}/${batch.modules.length}: ${module.id}`);
            try {
                const result = await orchestrator.executeModule(module, vfs);
                results.push({
                    moduleId: module.id,
                    success: result.success,
                    error: result.error,
                    executedModules: [module]
                });
                if (!result.success) {
                    errors.push(`Module ${module.id} failed: ${result.error}`);
                    console.error(`    ❌ Module ${module.id} failed: ${result.error}`);
                    return { batchId: `batch-${batch.batchNumber}`, success: false, results, errors };
                }
                console.log(`    ✅ Module ${module.id} completed successfully`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Module ${module.id} failed: ${errorMessage}`);
                console.error(`    ❌ Module ${module.id} failed: ${errorMessage}`);
                return { batchId: `batch-${batch.batchNumber}`, success: false, results, errors };
            }
        }
        console.log(`  ✅ Batch completed successfully`);
        return { batchId: `batch-${batch.batchNumber}`, success: true, results, errors };
    }
}
//# sourceMappingURL=sequential-execution-service.js.map