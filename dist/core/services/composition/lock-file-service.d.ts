/**
 * Lock File Service
 *
 * Handles reading and writing lock files to disk.
 * Provides lock file reuse logic for reproducible builds.
 */
import type { LockFile, V2Genome } from '@thearchitech.xyz/types';
export interface Logger {
    info: (msg: string, meta?: any) => void;
    debug: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
}
export declare class LockFileService {
    private logger;
    private lockFileName;
    constructor(logger: Logger, lockFileName?: string);
    /**
     * Get the path to the lock file
     */
    getLockFilePath(projectRoot: string): string;
    /**
     * Read lock file from disk
     *
     * @param projectRoot - Root directory of the project
     * @returns Lock file if it exists, null otherwise
     */
    readLockFile(projectRoot: string): Promise<LockFile | null>;
    /**
     * Write lock file to disk
     *
     * @param projectRoot - Root directory of the project
     * @param lockFile - Lock file to write
     */
    writeLockFile(projectRoot: string, lockFile: LockFile): Promise<void>;
    /**
     * Check if lock file exists and is valid
     *
     * @param projectRoot - Root directory of the project
     * @returns true if lock file exists and is valid
     */
    lockFileExists(projectRoot: string): Promise<boolean>;
    /**
     * Compute genome hash for comparison
     *
     * @param genome - V2 genome
     * @returns SHA-256 hash of the genome
     */
    computeGenomeHash(genome: V2Genome): string;
    /**
     * Check if existing lock file matches the current genome
     *
     * @param projectRoot - Root directory of the project
     * @param genome - Current V2 genome
     * @returns true if lock file exists and genome hash matches
     */
    isLockFileValid(projectRoot: string, genome: V2Genome): Promise<boolean>;
    /**
     * Delete lock file
     *
     * @param projectRoot - Root directory of the project
     */
    deleteLockFile(projectRoot: string): Promise<void>;
}
