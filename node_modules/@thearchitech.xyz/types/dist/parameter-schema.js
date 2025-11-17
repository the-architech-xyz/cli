/**
 * Enhanced Parameter Schema - V1 "Perfect Isolated Kits"
 *
 * Defines the structure for dynamic parameters with default values
 * to simplify architech.yaml files for users.
 */
/**
 * Parameter resolver utility for handling defaults and validation
 */
export class ParameterResolver {
    /**
     * Resolve parameters with defaults from schema
     */
    static resolveParameters(userParams, schema) {
        const resolved = {};
        // Process each parameter in the schema
        for (const [key, definition] of Object.entries(schema)) {
            if (userParams[key] !== undefined) {
                // User provided a value
                resolved[key] = userParams[key];
            }
            else if (definition.default !== undefined) {
                // Use default value
                resolved[key] = definition.default;
            }
            else if (definition.required) {
                // Required parameter missing
                throw new Error(`Required parameter '${key}' is missing and has no default value`);
            }
            // Optional parameter without default - leave undefined
        }
        return resolved;
    }
    /**
     * Validate parameters against schema
     */
    static validateParameters(params, schema) {
        const errors = [];
        for (const [key, value] of Object.entries(params)) {
            const definition = schema[key];
            if (!definition) {
                errors.push(`Unknown parameter: ${key}`);
                continue;
            }
            // Type validation
            if (!this.validateType(value, definition.type)) {
                errors.push(`Parameter '${key}' must be of type ${definition.type}, got ${typeof value}`);
            }
            // Choice validation for select types
            if (definition.type === 'select' && definition.choices && !definition.choices.includes(value)) {
                errors.push(`Parameter '${key}' must be one of: ${definition.choices.join(', ')}`);
            }
            // Custom validation
            if (definition.validation && !definition.validation(value)) {
                errors.push(`Parameter '${key}' failed custom validation`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate parameter type
     */
    static validateType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'boolean':
                return typeof value === 'boolean';
            case 'number':
                return typeof value === 'number';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'select':
                return typeof value === 'string';
            default:
                return true;
        }
    }
}
