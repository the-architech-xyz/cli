/**
 * Module Classifier Service
 *
 * Responsible for classifying modules by type and enforcing hierarchical execution order.
 */
import { Module } from '@thearchitech.xyz/marketplace';
export interface ModuleClassification {
    frameworks: Module[];
    adapters: Module[];
    connectors: Module[];
    features: Module[];
}
export declare class ModuleClassifier {
    /**
     * Classify modules by type based on ID convention
     */
    classifyModulesByType(modules: Module[]): ModuleClassification;
    /**
     * Get module type from ID
     */
    getModuleType(moduleId: string): "framework" | "adapter" | "connector" | "feature";
    /**
     * Enforce hierarchical execution order: Framework -> Adapters -> Connectors -> Features
     */
    enforceHierarchicalOrder(executionPlan: any, classification: ModuleClassification): any;
}
