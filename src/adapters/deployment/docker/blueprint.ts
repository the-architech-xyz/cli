/**
 * Docker Deployment Blueprint
 * 
 * Sets up Docker containerization for web applications
 * Creates Dockerfile, docker-compose.yml, and deployment configuration
 */

import { Blueprint } from '../../../types/adapter.js';

export const dockerBlueprint: Blueprint = {
  id: 'docker-base-setup',
  name: 'Docker Base Setup',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'Dockerfile',
      content: `# Use the official Node.js image as base
FROM node:{{module.parameters.nodeVersion}} AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown appuser:nodejs .next

COPY --from=builder --chown=appuser:nodejs /app/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs /app/.next/static ./.next/static

USER appuser

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]`
    },
    {
      type: 'CREATE_FILE',
      path: '.dockerignore',
      content: `# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Web Application
.next/
out/

# Production
build
dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore
README.md

# Docker
Dockerfile
docker-compose.yml
.dockerignore`
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:build',
      command: 'docker build -t {{project.name}}:latest .'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:run',
      command: 'docker run -p 3000:3000 --env-file .env.local {{project.name}}:latest'
    }
  ]
};
