/**
 * Lock File Service
 *
 * Handles reading and writing lock files to disk.
 * Provides lock file reuse logic for reproducible builds.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
export class LockFileService {
    logger;
    lockFileName;
    constructor(logger, lockFileName = 'genome.lock') {
        this.logger = logger;
        this.lockFileName = lockFileName;
    }
    /**
     * Get the path to the lock file
     */
    getLockFilePath(projectRoot) {
        return path.join(projectRoot, this.lockFileName);
    }
    /**
     * Read lock file from disk
     *
     * @param projectRoot - Root directory of the project
     * @returns Lock file if it exists, null otherwise
     */
    async readLockFile(projectRoot) {
        const lockFilePath = this.getLockFilePath(projectRoot);
        try {
            const content = await fs.readFile(lockFilePath, 'utf-8');
            const lockFile = JSON.parse(content);
            this.logger.debug('Lock file read successfully', {
                path: lockFilePath,
                version: lockFile.version,
                moduleCount: lockFile.modules.length
            });
            return lockFile;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.debug('No lock file found', { path: lockFilePath });
                return null;
            }
            this.logger.warn('Failed to read lock file', {
                path: lockFilePath,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    /**
     * Write lock file to disk
     *
     * @param projectRoot - Root directory of the project
     * @param lockFile - Lock file to write
     */
    async writeLockFile(projectRoot, lockFile) {
        const lockFilePath = this.getLockFilePath(projectRoot);
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(lockFilePath), { recursive: true });
            // Write lock file with pretty formatting
            const content = JSON.stringify(lockFile, null, 2) + '\n';
            await fs.writeFile(lockFilePath, content, 'utf-8');
            this.logger.info('Lock file written successfully', {
                path: lockFilePath,
                version: lockFile.version,
                moduleCount: lockFile.modules.length,
                executionPlanLength: lockFile.executionPlan.length
            });
        }
        catch (error) {
            throw new Error(`Failed to write lock file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if lock file exists and is valid
     *
     * @param projectRoot - Root directory of the project
     * @returns true if lock file exists and is valid
     */
    async lockFileExists(projectRoot) {
        const lockFilePath = this.getLockFilePath(projectRoot);
        try {
            await fs.access(lockFilePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Compute genome hash for comparison
     *
     * @param genome - V2 genome
     * @returns SHA-256 hash of the genome
     */
    computeGenomeHash(genome) {
        // Normalize genome by sorting keys for consistent hashing
        const normalized = JSON.stringify(genome, Object.keys(genome).sort());
        return createHash('sha256').update(normalized).digest('hex');
    }
    /**
     * Check if existing lock file matches the current genome
     *
     * @param projectRoot - Root directory of the project
     * @param genome - Current V2 genome
     * @returns true if lock file exists and genome hash matches
     */
    async isLockFileValid(projectRoot, genome) {
        const lockFile = await this.readLockFile(projectRoot);
        if (!lockFile) {
            return false;
        }
        const currentHash = this.computeGenomeHash(genome);
        const isValid = lockFile.genomeHash === currentHash;
        if (isValid) {
            this.logger.info('Lock file is valid and matches current genome', {
                genomeHash: currentHash,
                resolvedAt: lockFile.resolvedAt
            });
        }
        else {
            this.logger.info('Lock file exists but genome has changed', {
                lockFileHash: lockFile.genomeHash,
                currentHash
            });
        }
        return isValid;
    }
    /**
     * Delete lock file
     *
     * @param projectRoot - Root directory of the project
     */
    async deleteLockFile(projectRoot) {
        const lockFilePath = this.getLockFilePath(projectRoot);
        try {
            await fs.unlink(lockFilePath);
            this.logger.debug('Lock file deleted', { path: lockFilePath });
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                this.logger.warn('Failed to delete lock file', {
                    path: lockFilePath,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
}
//# sourceMappingURL=lock-file-service.js.map