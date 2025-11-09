import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as path from 'path';
import { MarketplaceService } from '../marketplace-service.js';

const readFileMock = vi.fn();

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

describe('MarketplaceService.loadTemplate (namespaces)', () => {
  beforeEach(() => {
    readFileMock.mockReset();
  });

  it('loads template from specific namespace when available', async () => {
    readFileMock.mockResolvedValueOnce('namespace-template');

    const context: any = {
      marketplace: {
        namespaces: {
          'components.ui.shadcn': '/mock/ui-marketplace-shadcn',
        },
        core: '/mock/core-marketplace',
        ui: {
          default: 'shadcn',
          shadcn: '/mock/ui-marketplace-shadcn',
        },
      },
      module: { id: 'ui/shadcn-ui' },
    };

    const templatePath = 'components/ui/shadcn/ui/auth/LoginPage.tsx.tpl';
    const content = await MarketplaceService.loadTemplate('ui/shadcn-ui', templatePath, context);

    expect(content).toBe('namespace-template');
    expect(readFileMock).toHaveBeenCalledWith(
      path.join('/mock/ui-marketplace-shadcn', 'ui/auth/LoginPage.tsx.tpl'),
      'utf-8'
    );
  });

  it('falls back to core components namespace when specific namespace missing', async () => {
    readFileMock.mockResolvedValueOnce('core-template');

    const context: any = {
      marketplace: {
        namespaces: {
          'components.core': '/mock/core-marketplace',
        },
        core: '/mock/core-marketplace',
        ui: { default: '', },
      },
      module: { id: 'features/auth' },
    };

    const templatePath = 'components/core/auth/email/WelcomeEmail.tsx.tpl';
    const content = await MarketplaceService.loadTemplate('features/auth', templatePath, context);

    expect(content).toBe('core-template');
    expect(readFileMock).toHaveBeenCalledWith(
      path.join('/mock/core-marketplace', 'auth/email/WelcomeEmail.tsx.tpl'),
      'utf-8'
    );
  });

  it('supports legacy ui/ paths via namespace fallback', async () => {
    readFileMock.mockResolvedValueOnce('legacy-template');

    const context: any = {
      marketplace: {
        namespaces: {
          'components.ui.shadcn': '/mock/ui-marketplace-shadcn',
        },
        core: '/mock/core-marketplace',
        ui: {
          default: 'shadcn',
          shadcn: '/mock/ui-marketplace-shadcn',
        },
      },
      module: { id: 'ui/shadcn-ui' },
    };

    const templatePath = 'ui/common/Button.tsx.tpl';
    const content = await MarketplaceService.loadTemplate('ui/shadcn-ui', templatePath, context);

    expect(content).toBe('legacy-template');
    expect(readFileMock).toHaveBeenCalledWith(
      path.join('/mock/ui-marketplace-shadcn', 'common/Button.tsx.tpl'),
      'utf-8'
    );
  });
});
