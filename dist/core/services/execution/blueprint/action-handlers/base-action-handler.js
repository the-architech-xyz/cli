/**
 * Base Action Handler
 *
 * Abstract base class for all specialized action handlers.
 * Implements the "Specialized Workers" pattern in the Executor-Centric architecture.
 */
export class BaseActionHandler {
    /**
     * Check if this handler can handle the given action
     */
    canHandle(action) {
        return action.type === this.getSupportedActionType();
    }
    /**
     * Validate action parameters
     */
    validateAction(action) {
        if (!action.type) {
            return { valid: false, error: 'Action type is required' };
        }
        return { valid: true };
    }
    /**
     * Process template strings with context
     */
    processTemplate(template, context) {
        // Simple template processing - replace {{variable}} with context values
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = this.getContextValue(context, key.trim());
            return value !== undefined ? String(value) : match;
        });
    }
    /**
     * Get value from context by key path (e.g., 'project.name' -> context.project.name)
     */
    getContextValue(context, keyPath) {
        const keys = keyPath.split('.');
        let value = context;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
}
//# sourceMappingURL=base-action-handler.js.map