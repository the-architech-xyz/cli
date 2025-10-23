/**
 * Module Classifier Service
 *
 * Responsible for classifying modules by type and enforcing hierarchical execution order.
 */
export class ModuleClassifier {
    /**
     * Classify modules by type based on ID convention
     */
    classifyModulesByType(modules) {
        const frameworks = [];
        const adapters = [];
        const connectors = [];
        const features = [];
        for (const module of modules) {
            const type = this.getModuleType(module.id);
            if (type === "framework") {
                frameworks.push(module);
            }
            else if (type === "connector") {
                connectors.push(module);
            }
            else if (type === "feature") {
                features.push(module);
            }
            else {
                adapters.push(module);
            }
        }
        return { frameworks, adapters, connectors, features };
    }
    /**
     * Get module type from ID
     */
    getModuleType(moduleId) {
        if (moduleId.startsWith("connectors/")) {
            return "connector";
        }
        if (moduleId.startsWith("features/")) {
            return "feature";
        }
        const category = moduleId.split("/")[0];
        if (category === "framework") {
            return "framework";
        }
        return "adapter";
    }
    /**
     * Enforce hierarchical execution order: Framework -> Adapters -> Connectors -> Features
     */
    enforceHierarchicalOrder(executionPlan, classification) {
        const newBatches = [];
        let batchNumber = 1;
        // 1. Framework batches (must be first)
        const frameworkBatches = executionPlan.batches.filter((batch) => batch.modules.every((m) => this.getModuleType(m.id) === "framework"));
        for (const batch of frameworkBatches) {
            newBatches.push({ ...batch, batchNumber: batchNumber++ });
        }
        // 2. Adapter batches (middle layer)
        const adapterBatches = executionPlan.batches.filter((batch) => batch.modules.every((m) => this.getModuleType(m.id) === "adapter"));
        for (const batch of adapterBatches) {
            newBatches.push({ ...batch, batchNumber: batchNumber++ });
        }
        // 3. Connector batches (technical bridges)
        const connectorBatches = executionPlan.batches.filter((batch) => batch.modules.some((m) => this.getModuleType(m.id) === "connector"));
        for (const batch of connectorBatches) {
            newBatches.push({ ...batch, batchNumber: batchNumber++ });
        }
        // 4. Feature batches (must be last, sequential)
        const featureBatches = executionPlan.batches.filter((batch) => batch.modules.some((m) => this.getModuleType(m.id) === "feature"));
        for (const batch of featureBatches) {
            // Force features to be sequential
            newBatches.push({
                ...batch,
                batchNumber: batchNumber++,
                canExecuteInParallel: false,
            });
        }
        return {
            ...executionPlan,
            batches: newBatches,
            totalBatches: newBatches.length,
        };
    }
}
//# sourceMappingURL=module-classifier.js.map