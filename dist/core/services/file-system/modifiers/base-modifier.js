/**
 * Base Modifier - Abstract Base Class for All Modifiers
 *
 * Provides a standardized interface and common functionality for all modifiers.
 * All specific modifiers should extend this class to ensure consistency.
 */
export class BaseModifier {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    /**
     * Validate parameters against the schema
     */
    validateParams(params) {
        const schema = this.getParamsSchema();
        const errors = [];
        // Basic validation - can be enhanced with a proper JSON schema validator
        if (schema.required) {
            for (const field of schema.required) {
                if (!(field in params)) {
                    errors.push(`Required parameter '${field}' is missing`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Check if this modifier supports the given file type
     */
    supportsFileType(filePath) {
        const supportedTypes = this.getSupportedFileTypes();
        const extension = filePath.split('.').pop()?.toLowerCase();
        if (!extension)
            return false;
        return supportedTypes.includes(extension) || supportedTypes.includes('*');
    }
    /**
     * Read file content from VFS or disk
     */
    async readFile(filePath) {
        return await this.engine.readFile(filePath);
    }
    /**
     * Write file content to VFS
     */
    async writeFile(filePath, content) {
        await this.engine.overwriteFile(filePath, content);
    }
    /**
     * Modify TypeScript file using AST
     */
    async modifyTsFile(filePath, modificationFunction) {
        try {
            const result = await this.engine.modifyTsFile(filePath, modificationFunction);
            if (result.success) {
                return {
                    success: true,
                    message: `Successfully modified ${filePath}`
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Unknown error during modification'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Merge JSON content
     */
    async mergeJsonFile(filePath, contentToMerge) {
        try {
            const result = await this.engine.mergeJsonFile(filePath, contentToMerge);
            if (result.success) {
                return {
                    success: true,
                    message: `Successfully merged JSON content into ${filePath}`
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Unknown error during JSON merge'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
//# sourceMappingURL=base-modifier.js.map