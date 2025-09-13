/**
 * Better Auth OAuth Providers Feature
 * 
 * Adds OAuth providers (Google, GitHub, Discord, Twitter) to Better Auth
 */

import { Blueprint } from '../../../../types/adapter.js';

const oauthProvidersBlueprint: Blueprint = {
  id: 'better-auth-oauth-providers',
  name: 'Better Auth OAuth Providers',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/auth/oauth-config.ts',
      content: `// OAuth Providers Configuration
export const oauthProviders = {
  {{#each module.parameters.providers}}
  {{this}}: {
    clientId: process.env.{{toUpperCase this}}_CLIENT_ID!,
    clientSecret: process.env.{{toUpperCase this}}_CLIENT_SECRET!,
  },
  {{/each}}
};`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/auth/oauth-setup.ts',
      content: `import { oauthProviders } from './oauth-config';

// OAuth setup instructions
export const oauthSetupInstructions = {
  {{#each module.parameters.providers}}
  {{this}}: {
    name: '{{toUpperCase this}}',
    setupUrl: '{{#if (eq this "google")}}https://console.developers.google.com/{{else if (eq this "github")}}https://github.com/settings/applications/new{{else if (eq this "discord")}}https://discord.com/developers/applications{{else if (eq this "twitter")}}https://developer.twitter.com/en/portal/dashboard{{/if}}',
    redirectUri: '{{#if (eq this "google")}}http://localhost:3000/api/auth/callback/google{{else if (eq this "github")}}http://localhost:3000/api/auth/callback/github{{else if (eq this "discord")}}http://localhost:3000/api/auth/callback/discord{{else if (eq this "twitter")}}http://localhost:3000/api/auth/callback/twitter{{/if}}',
  },
  {{/each}}
};`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/auth/OAuthButtons.tsx',
      content: `import { authClient } from '@/lib/auth/client';

interface OAuthButtonsProps {
  mode: 'signin' | 'signup';
}

export function OAuthButtons({ mode }: OAuthButtonsProps) {
  const handleOAuth = (provider: string) => {
    authClient.signIn.social({
      provider: provider as any,
      callbackURL: '/dashboard',
    });
  };

  return (
    <div className="space-y-3">
      {{#each module.parameters.providers}}
      <button
        onClick={() => handleOAuth('{{this}}')}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          {{#if (eq this "google")}}
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          {{else if (eq this "github")}}
          <path fill="#333" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          {{else if (eq this "discord")}}
          <path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          {{else if (eq this "twitter")}}
          <path fill="#1DA1F2" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          {{/if}}
        </svg>
        Continue with {{toUpperCase this}}
      </button>
      {{/each}}
    </div>
  );
}`
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'OAUTH_PROVIDERS',
      value: '{{#each module.parameters.providers}}{{toUpperCase this}},{{/each}}',
      description: 'Comma-separated list of OAuth providers'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'OAUTH_CLIENT_IDS',
      value: '{{#each module.parameters.providers}}{{toUpperCase this}}_CLIENT_ID="your-{{this}}-client-id",{{/each}}',
      description: 'OAuth client IDs for each provider'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'OAUTH_CLIENT_SECRETS',
      value: '{{#each module.parameters.providers}}{{toUpperCase this}}_CLIENT_SECRET="your-{{this}}-client-secret",{{/each}}',
      description: 'OAuth client secrets for each provider'
    }
  ]
};
export default oauthProvidersBlueprint;
