/**
 * Success Validator
 * 
 * Final quality gate that validates the output of a successful generation
 * Ensures that generated projects are not just "created" but "ready to use"
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { Logger } from '../infrastructure/logging/index.js';

const execAsync = promisify(exec);

export interface ValidationResult {
  isSuccess: boolean;
  errors: string[];
  warnings: string[];
  details: {
    filesValidated: number;
    filesMissing: string[];
    buildSuccess: boolean;
    buildErrors: string[];
    installSuccess: boolean;
    installErrors: string[];
  };
}

export interface FileValidationResult {
  exists: boolean;
  isFile: boolean;
  size: number;
  error?: string;
}

export class SuccessValidator {
  constructor() {
    // Logger is static, no need to instantiate
  }

  /**
   * Main validation method that performs all post-generation checks
   */
  async validate(projectPath: string, expectedFiles: string[]): Promise<ValidationResult> {
    const result: ValidationResult = {
      isSuccess: true,
      errors: [],
      warnings: [],
      details: {
        filesValidated: 0,
        filesMissing: [],
        buildSuccess: false,
        buildErrors: [],
        installSuccess: false,
        installErrors: []
      }
    };

    Logger.info('🔍 Starting post-generation validation...', {
      operation: 'success_validation',
      projectPath,
      expectedFiles: expectedFiles.length
    });

    try {
      // 1. Validate file existence
      const fileValidation = await this.validateFileExistence(projectPath, expectedFiles);
      result.details.filesValidated = fileValidation.validatedFiles;
      result.details.filesMissing = fileValidation.missingFiles;
      
      if (fileValidation.missingFiles.length > 0) {
        result.errors.push(`Missing files: ${fileValidation.missingFiles.join(', ')}`);
        result.isSuccess = false;
      }

      // 2. Validate package.json exists
      const packageJsonPath = join(projectPath, 'package.json');
      if (!existsSync(packageJsonPath)) {
        result.errors.push('package.json not found - project structure invalid');
        result.isSuccess = false;
      }

      // 3. Validate build process (only if files are valid)
      if (result.isSuccess) {
        const buildValidation = await this.validateBuild(projectPath);
        result.details.installSuccess = buildValidation.installSuccess;
        result.details.buildSuccess = buildValidation.buildSuccess;
        result.details.installErrors = buildValidation.installErrors;
        result.details.buildErrors = buildValidation.buildErrors;

        if (!buildValidation.installSuccess) {
          result.errors.push(`Dependency installation failed: ${buildValidation.installErrors.join(', ')}`);
          result.isSuccess = false;
        }

        if (!buildValidation.buildSuccess) {
          result.errors.push(`Build validation failed: ${buildValidation.buildErrors.join(', ')}`);
          result.isSuccess = false;
        }
      }

      // 4. Log results
      if (result.isSuccess) {
        Logger.info('✅ Post-generation validation completed successfully', {
          operation: 'success_validation',
          filesValidated: result.details.filesValidated,
          buildSuccess: result.details.buildSuccess
        });
      } else {
        Logger.error('❌ Post-generation validation failed', {
          operation: 'success_validation',
          errors: result.errors,
          warnings: result.warnings
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      Logger.error(`❌ Validation process failed: ${errorMessage}`, {
        operation: 'success_validation'
      });

      return {
        isSuccess: false,
        errors: [`Validation process failed: ${errorMessage}`],
        warnings: [],
        details: {
          filesValidated: 0,
          filesMissing: expectedFiles,
          buildSuccess: false,
          buildErrors: [errorMessage],
          installSuccess: false,
          installErrors: [errorMessage]
        }
      };
    }
  }

  /**
   * Validate that expected files actually exist on disk
   */
  private async validateFileExistence(projectPath: string, expectedFiles: string[]): Promise<{
    validatedFiles: number;
    missingFiles: string[];
  }> {
    const missingFiles: string[] = [];
    let validatedFiles = 0;

    Logger.info(`📁 Validating ${expectedFiles.length} expected files...`, {
      operation: 'file_validation'
    });

    for (const filePath of expectedFiles) {
      const fullPath = join(projectPath, filePath);
      const validation = this.validateFile(fullPath);
      
      if (validation.exists && validation.isFile) {
        validatedFiles++;
        Logger.debug(`✅ File validated: ${filePath} (${validation.size} bytes)`, {
          operation: 'file_validation'
        });
      } else {
        missingFiles.push(filePath);
        Logger.warn(`❌ File missing: ${filePath}`, {
          operation: 'file_validation'
        });
      }
    }

    return { validatedFiles, missingFiles };
  }

  /**
   * Validate a single file
   */
  private validateFile(filePath: string): FileValidationResult {
    try {
      if (!existsSync(filePath)) {
        return { exists: false, isFile: false, size: 0, error: 'File does not exist' };
      }

      const stats = statSync(filePath);
      const result: FileValidationResult = {
        exists: true,
        isFile: stats.isFile(),
        size: stats.size
      };
      
      if (!stats.isFile()) {
        result.error = 'Path exists but is not a file';
      }
      
      return result;
    } catch (error) {
      return {
        exists: false,
        isFile: false,
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate that the project can be built successfully
   * This is the ultimate test - the project must be functional
   */
  private async validateBuild(projectPath: string): Promise<{
    installSuccess: boolean;
    buildSuccess: boolean;
    installErrors: string[];
    buildErrors: string[];
  }> {
    const result = {
      installSuccess: false,
      buildSuccess: false,
      installErrors: [] as string[],
      buildErrors: [] as string[]
    };

    Logger.info('🔨 Starting build validation...', {
      operation: 'build_validation',
      projectPath
    });

    try {
      // Step 1: Install dependencies
      Logger.info('📦 Installing dependencies...', {
        operation: 'build_validation'
      });

      try {
        const installResult = await execAsync('npm install', {
          cwd: projectPath,
          timeout: 120000 // 2 minutes timeout
        });

        result.installSuccess = true;
        Logger.info('✅ Dependencies installed successfully', {
          operation: 'build_validation'
        });

      } catch (installError) {
        result.installSuccess = false;
        const errorMessage = installError instanceof Error ? installError.message : 'Unknown install error';
        result.installErrors.push(errorMessage);
        
        Logger.error(`❌ Dependency installation failed: ${errorMessage}`, {
          operation: 'build_validation'
        });
        
        // Don't proceed to build if install failed
        return result;
      }

      // Step 2: Build the project
      Logger.info('🏗️ Building project...', {
        operation: 'build_validation'
      });

      try {
        const buildResult = await execAsync('npm run build', {
          cwd: projectPath,
          timeout: 180000 // 3 minutes timeout
        });

        result.buildSuccess = true;
        Logger.info('✅ Project built successfully', {
          operation: 'build_validation'
        });

      } catch (buildError) {
        result.buildSuccess = false;
        const errorMessage = buildError instanceof Error ? buildError.message : 'Unknown build error';
        result.buildErrors.push(errorMessage);
        
        Logger.error(`❌ Build failed: ${errorMessage}`, {
          operation: 'build_validation'
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown build validation error';
      Logger.error(`❌ Build validation process failed: ${errorMessage}`, {
        operation: 'build_validation'
      });

      result.installErrors.push(errorMessage);
      result.buildErrors.push(errorMessage);
      return result;
    }
  }

  /**
   * Get validation summary for logging
   */
  getValidationSummary(result: ValidationResult): string {
    if (result.isSuccess) {
      return `✅ Validation successful: ${result.details.filesValidated} files validated, build successful`;
    } else {
      const errorCount = result.errors.length;
      const warningCount = result.warnings.length;
      return `❌ Validation failed: ${errorCount} errors, ${warningCount} warnings`;
    }
  }
}
