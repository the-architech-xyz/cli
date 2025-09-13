/**
 * Docker Multi-Stage Builds Feature Blueprint
 * 
 * Optimized multi-stage Docker builds for production
 */

import { Blueprint } from '../../../../types/adapter.js';

const multiStageBlueprint: Blueprint = {
  id: 'docker-multi-stage',
  name: 'Multi-Stage Builds',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'Dockerfile.optimized',
      content: `# Multi-stage Dockerfile for {{project.name}}
# Optimized for production with multiple build stages

# Base stage with common dependencies
FROM node:{{module.parameters.nodeVersion}} AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with optimizations
RUN npm ci --only=production --frozen-lockfile && \\
    npm cache clean --force

# Development dependencies stage
FROM base AS dev-deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Test stage
{{#if module.parameters.stages.includes('test')}}
FROM dev-deps AS test
WORKDIR /app

COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Run tests
RUN npm run test:ci

# Lint stage
{{#if module.parameters.stages.includes('lint')}}
FROM dev-deps AS lint
WORKDIR /app

COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Run linting
RUN npm run lint
{{/if}}

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build optimizations
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

{{#if module.parameters.optimization}}
# Enable build optimizations
ENV NEXT_BUILD_OPTIMIZE 1
{{/if}}

# Build the application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set up Next.js cache directory
RUN mkdir .next && \\
    chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]`
    },
    {
      type: 'CREATE_FILE',
      path: 'docker-compose.optimized.yml',
      content: `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.optimized
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    env_file:
      - .env.local
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  # Database service (optional)
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: {{project.name}}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'

  # Redis service (optional)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.1'

volumes:
  postgres_data:
  redis_data:`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/docker-optimized.sh',
      content: `#!/bin/bash

# Optimized Docker build script for {{project.name}}

set -e

echo "🐳 Building optimized Docker image for {{project.name}}..."

# Build with BuildKit for better caching
export DOCKER_BUILDKIT=1

# Build the optimized Docker image
docker build -f Dockerfile.optimized -t {{project.name}}:optimized .

echo "✅ Optimized Docker image built successfully!"

# Show image size
echo "📊 Image size:"
docker images {{project.name}}:optimized --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"

# Optional: Run the container locally
if [ "\$1" = "--run" ]; then
  echo "🚀 Starting optimized container..."
  docker run -p 3000:3000 --env-file .env.local {{project.name}}:optimized
fi

# Optional: Run with docker-compose
if [ "\$1" = "--compose" ]; then
  echo "🚀 Starting with docker-compose..."
  docker-compose -f docker-compose.optimized.yml up --build
fi

echo "🎉 Build complete!"
echo "To run the container: docker run -p 3000:3000 --env-file .env.local {{project.name}}:optimized"
echo "To run with compose: docker-compose -f docker-compose.optimized.yml up --build"`
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:build:optimized',
      command: 'docker build -f Dockerfile.optimized -t {{project.name}}:optimized .'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:run:optimized',
      command: 'docker run -p 3000:3000 --env-file .env.local {{project.name}}:optimized'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:compose:optimized',
      command: 'docker-compose -f docker-compose.optimized.yml up --build'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:stop:optimized',
      command: 'docker-compose -f docker-compose.optimized.yml down'
    }
  ]
};
export default multiStageBlueprint;
