/**
 * File Path Resolution Strategy
 *
 * Handles direct file path inputs (relative or absolute).
 * This is the highest priority strategy - if user provides a path, use it directly.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
export class FilePathStrategy {
    resolver;
    name = 'file-path';
    constructor(resolver) {
        this.resolver = resolver;
    }
    /**
     * Check if input looks like a file path
     */
    canHandle(input) {
        return input.includes('/') ||
            input.includes('\\') ||
            input.endsWith('.genome.ts') ||
            input.endsWith('.ts') ||
            input.startsWith('.') ||
            input.startsWith('~') ||
            path.isAbsolute(input);
    }
    /**
     * Resolve as file path
     */
    async resolve(input) {
        if (!this.canHandle(input)) {
            return null;
        }
        // Resolve to absolute path
        const absolutePath = path.resolve(process.cwd(), input);
        // Verify file exists
        try {
            const stats = await fs.stat(absolutePath);
            if (!stats.isFile()) {
                throw new Error(`Path exists but is not a file: ${absolutePath}`);
            }
            // Verify it's a .genome.ts file
            if (!absolutePath.endsWith('.genome.ts') && !absolutePath.endsWith('.ts')) {
                throw new Error(`File must be a .genome.ts file: ${absolutePath}`);
            }
            // Extract metadata
            const metadata = await this.resolver.extractMetadata(absolutePath);
            return {
                name: path.basename(absolutePath, '.genome.ts').replace(/^\d+-/, ''),
                path: absolutePath,
                source: 'file-path',
                metadata
            };
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Genome file not found: ${absolutePath}\n` +
                    `Tip: Make sure the file path is correct and the file exists.`);
            }
            throw error;
        }
    }
}
//# sourceMappingURL=file-path-strategy.js.map