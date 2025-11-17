import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as path from 'path';
import { MarketplaceService } from '../marketplace-service.js';

const readFileMock = vi.hoisted(() => vi.fn());

// Mock fs/promises used inside MarketplaceService
vi.mock('fs/promises', () => ({
  readFile: readFileMock,
  readdir: vi.fn(),
  stat: vi.fn(),
  access: vi.fn(),
}));

// Mock MarketplaceRegistry to avoid hitting disk
vi.mock('../marketplace-registry.js', () => ({
  MarketplaceRegistry: {
    getCoreMarketplacePath: vi.fn().mockResolvedValue('/mock/core-marketplace'),
    getUIMarketplacePath: vi.fn().mockResolvedValue('/mock/ui-marketplace'),
    setMarketplacePath: vi.fn(),
    marketplaceExists: vi.fn().mockResolvedValue(true),
  },
}));

describe('MarketplaceService.loadTemplate (UI marketplace handling)', () => {

  it('loads UI template from active marketplace root when template starts with ui/', async () => {
    readFileMock.mockImplementation((filePath: string) => {
      if (filePath === '/mock/ui-marketplace-shadcn/manifest.json') {
        return Promise.resolve(JSON.stringify({
          components: {
            LoginPage: {
              path: './ui/auth/LoginPage.tsx.tpl'
            }
          }
        }));
      }
      if (filePath === '/mock/ui-marketplace-shadcn/ui/auth/LoginPage.tsx.tpl') {
        return Promise.resolve('ui-template');
      }
      return Promise.reject(new Error('not found'));
    });

    const context: any = {
      marketplace: {
        core: '/mock/core-marketplace',
        ui: {
          default: 'shadcn',
          root: '/mock/ui-marketplace-shadcn',
        },
      },
      module: { id: 'ui/shadcn-ui' },
    };

    const templatePath = 'ui/auth/LoginPage.tsx.tpl';
    const content = await MarketplaceService.loadTemplate('ui/shadcn-ui', templatePath, context);

    expect(content).toBe('ui-template');
  });

  it('loads template from components/ui/ using same marketplace root', async () => {
    readFileMock.mockImplementation((filePath: string) => {
      if (filePath === '/mock/ui-marketplace-tamagui/manifest.json') {
        return Promise.resolve(JSON.stringify({
          components: {
            Dashboard: {
              path: './ui/screens/Dashboard.tsx.tpl'
            }
          }
        }));
      }
      if (filePath === '/mock/ui-marketplace-tamagui/ui/screens/Dashboard.tsx.tpl') {
        return Promise.resolve('ui-template');
      }
      return Promise.reject(new Error('not found'));
    });

    const context: any = {
      marketplace: {
        core: '/mock/core-marketplace',
        ui: {
          default: 'tamagui',
          root: '/mock/ui-marketplace-tamagui',
        },
      },
      module: { id: 'ui/tamagui' },
    };

    const templatePath = 'components/ui/screens/Dashboard.tsx.tpl';
    const content = await MarketplaceService.loadTemplate('ui/tamagui', templatePath, context);

    expect(content).toBe('ui-template');
  });

  it('falls back to core marketplace when template is not part of UI marketplace', async () => {
    readFileMock.mockImplementation((filePath: string) => {
      if (filePath === '/mock/core-marketplace/features/auth/templates/components/core/auth/email/WelcomeEmail.tsx.tpl') {
        return Promise.resolve('core-template');
      }
      if (filePath.endsWith('manifest.json')) {
        return Promise.resolve(JSON.stringify({ components: {} }));
      }
      return Promise.reject(new Error('not found'));
    });

    const context: any = {
      marketplace: {
        core: '/mock/core-marketplace',
        ui: { default: '', root: '' },
      },
      module: { id: 'features/auth' },
    };

    const templatePath = 'components/core/auth/email/WelcomeEmail.tsx.tpl';
    const content = await MarketplaceService.loadTemplate('features/auth', templatePath, context);

    expect(content).toBe('core-template');
  });
});
