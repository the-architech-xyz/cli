/**
 * Enhanced Parameter Schema - V1 "Perfect Isolated Kits"
 *
 * Defines the structure for dynamic parameters with default values
 * to simplify architech.yaml files for users.
 */
export interface ParameterDefinition {
    type: 'string' | 'boolean' | 'number' | 'select' | 'array' | 'object';
    required: boolean;
    default?: any;
    choices?: string[];
    description: string;
    validation?: (value: any) => boolean;
}
export interface AdapterParameterSchema {
    [key: string]: ParameterDefinition;
}
/**
 * Parameter resolver utility for handling defaults and validation
 */
export declare class ParameterResolver {
    /**
     * Resolve parameters with defaults from schema
     */
    static resolveParameters(userParams: Record<string, any>, schema: AdapterParameterSchema): Record<string, any>;
    /**
     * Validate parameters against schema
     */
    static validateParameters(params: Record<string, any>, schema: AdapterParameterSchema): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Validate parameter type
     */
    private static validateType;
}
