/**
 * CommandRunner Tests
 * 
 * Tests for the command execution system that handles
 * running external commands and managing their lifecycle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandRunner } from '../../../src/core/cli/command-runner';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawn: vi.fn()
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn()
}));

describe('CommandRunner', () => {
  let commandRunner: CommandRunner;
  let mockExecSync: any;
  let mockSpawn: any;
  let mockExistsSync: any;

  beforeEach(async () => {
    commandRunner = new CommandRunner('npm', { verbose: false });
    const childProcess = await import('child_process');
    const fs = await import('fs');
    mockExecSync = childProcess.execSync;
    mockSpawn = childProcess.spawn;
    mockExistsSync = fs.existsSync;
  });

  describe('constructor', () => {
    it('should initialize with specified package manager', () => {
      const runner = new CommandRunner('yarn', { verbose: true });
      expect(runner.getPackageManager()).toBe('yarn');
    });

    it('should auto-detect package manager when auto is specified', () => {
      // Mock npm as available
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('npm')) return Buffer.from('8.0.0');
        throw new Error('Command not found');
      });

      const runner = new CommandRunner('auto');
      expect(runner.getPackageManager()).toBe('npm');
    });
  });

  describe('getPackageManager', () => {
    it('should return the current package manager', () => {
      expect(commandRunner.getPackageManager()).toBe('npm');
    });
  });

  describe('getCreateCommand', () => {
    it('should return create command for npm', () => {
      const createCommand = commandRunner.getCreateCommand();
      expect(createCommand).toEqual(['npx', 'create-next-app@latest']);
    });
  });

  describe('execCommand', () => {
    it('should execute a command successfully', async () => {
      // Mock successful spawn
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      const result = await commandRunner.execCommand(['echo', 'test'], {
        cwd: '/tmp',
        env: { TEST: 'value' }
      });

      expect(result.code).toBe(0);
      // Check that spawn was called with the correct command and options
      expect(mockSpawn).toHaveBeenCalledWith('echo', ['test'], expect.objectContaining({
        cwd: '/tmp',
        env: expect.objectContaining({ TEST: 'value' }),
        stdio: 'inherit'
      }));
    });

    it('should handle command failures', async () => {
      // Mock failed spawn
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      await expect(commandRunner.execCommand(['invalid-command'], {
        cwd: '/tmp'
      })).rejects.toThrow('Command failed: invalid-command');
    });
  });

  describe('getVersion', () => {
    it('should get package manager version', async () => {
      // Mock version command
      const mockChildProcess = {
        stdout: { on: vi.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('8.0.0'));
          }
        }), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      const version = await commandRunner.getVersion();
      expect(version).toBe('8.0.0');
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      // Mock project creation
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      const result = await commandRunner.createProject('test-project', 'nextjs');
      expect(result.code).toBe(0);
    });
  });

  describe('install', () => {
    it('should install packages', async () => {
      // Mock package installation
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      const result = await commandRunner.install(['react', 'react-dom']);
      expect(result.code).toBe(0);
    });

    it('should install dev dependencies', async () => {
      // Mock dev package installation
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      const result = await commandRunner.install(['typescript'], true);
      expect(result.code).toBe(0);
    });
  });

  describe('runScript', () => {
    it('should run a script', async () => {
      // Mock script execution
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      const result = await commandRunner.runScript('build');
      expect(result.code).toBe(0);
    });
  });

  describe('exec', () => {
    it('should execute a tool', async () => {
      // Mock tool execution
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      const result = await commandRunner.exec('git', ['init']);
      expect(result.code).toBe(0);
    });
  });

  describe('initProject', () => {
    it('should initialize a project', async () => {
      // Mock project initialization
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockChildProcess;
        })
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      const result = await commandRunner.initProject('/tmp/test-project', 'nextjs', {
        typescript: true,
        tailwind: true
      });
      expect(result.code).toBe(0);
    });
  });

  describe('Package Manager Detection', () => {
    it('should detect npm when available', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('npm')) return Buffer.from('8.0.0');
        throw new Error('Command not found');
      });

      const runner = new CommandRunner('auto');
      expect(runner.getPackageManager()).toBe('npm');
    });

    it('should detect yarn when available', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('yarn')) return Buffer.from('1.22.0');
        throw new Error('Command not found');
      });

      const runner = new CommandRunner('auto');
      expect(runner.getPackageManager()).toBe('yarn');
    });

    it('should detect pnpm when available', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('pnpm')) return Buffer.from('7.0.0');
        throw new Error('Command not found');
      });

      const runner = new CommandRunner('auto');
      expect(runner.getPackageManager()).toBe('pnpm');
    });

    it('should detect bun when available', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('bun')) return Buffer.from('0.5.0');
        throw new Error('Command not found');
      });

      const runner = new CommandRunner('auto');
      expect(runner.getPackageManager()).toBe('bun');
    });
  });

  describe('Error Handling', () => {
    it('should handle spawn errors gracefully', async () => {
      // Mock spawn error
      mockSpawn.mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      await expect(commandRunner.execCommand(['echo', 'test'])).rejects.toThrow('Spawn failed');
    });

    it('should handle command timeouts', async () => {
      // Mock timeout
      const mockChildProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Timeout')), 10);
          }
          return mockChildProcess;
        }),
        kill: vi.fn()
      };

      mockSpawn.mockReturnValue(mockChildProcess);

      await expect(commandRunner.execCommand(['sleep', '10'], {
        cwd: '/tmp'
      })).rejects.toThrow('Timeout');
    });
  });
}); 