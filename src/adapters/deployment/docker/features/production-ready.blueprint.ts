/**
 * Docker Production Ready Feature Blueprint
 * 
 * Production-ready configuration with security and monitoring
 */

import { Blueprint } from '../../../../types/adapter.js';

const productionReadyBlueprint: Blueprint = {
  id: 'docker-production-ready',
  name: 'Production Ready',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'Dockerfile.production',
      content: `# Production-ready Dockerfile for {{project.name}}
# Optimized for security, performance, and monitoring

# Use distroless base image for security
FROM gcr.io/distroless/nodejs18-debian11 AS base

# Dependencies stage
FROM node:{{module.parameters.nodeVersion}}-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production --frozen-lockfile && \\
    npm cache clean --force

# Builder stage
FROM node:{{module.parameters.nodeVersion}}-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV NEXT_BUILD_OPTIMIZE 1

RUN npm run build

# Production stage with security hardening
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["server.js"]`
    },
    {
      type: 'CREATE_FILE',
      path: 'docker-compose.production.yml',
      content: `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    env_file:
      - .env.production
    restart: unless-stopped
    {{#if module.parameters.monitoring}}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    {{/if}}
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    {{#if module.parameters.security}}
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    {{/if}}
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    {{#if module.parameters.security}}
    security_opt:
      - no-new-privileges:true
    {{/if}}

  # Database service
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: {{project.name}}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    {{#if module.parameters.security}}
    security_opt:
      - no-new-privileges:true
    {{/if}}
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'

  # Redis service
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    {{#if module.parameters.security}}
    security_opt:
      - no-new-privileges:true
    {{/if}}
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.1'

  {{#if module.parameters.monitoring}}
  # Monitoring with Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
  {{/if}}

volumes:
  postgres_data:
  redis_data:
  {{#if module.parameters.monitoring}}
  prometheus_data:
  grafana_data:
  {{/if}}`
    },
    {
      type: 'CREATE_FILE',
      path: 'nginx.conf',
      content: `events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;

    server {
        listen 80;
        server_name _;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;

        # Hide nginx version
        server_tokens off;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Static files caching
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://app;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://app;
        }

        # Main application
        location / {
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'prometheus.yml',
      content: `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: '{{project.name}}'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']
    scrape_interval: 10s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:9121']
    scrape_interval: 10s`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/deploy-production.sh',
      content: `#!/bin/bash

# Production deployment script for {{project.name}}

set -e

echo "🚀 Deploying {{project.name}} to production..."

# Check if required environment variables are set
if [ -z "\$DB_PASSWORD" ]; then
    echo "❌ DB_PASSWORD environment variable is required"
    exit 1
fi

if [ -z "\$GRAFANA_PASSWORD" ]; then
    echo "❌ GRAFANA_PASSWORD environment variable is required"
    exit 1
fi

# Build production image
echo "🐳 Building production Docker image..."
docker build -f Dockerfile.production -t {{project.name}}:production .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Start production services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost:3000/api/health; then
    echo "✅ Application is healthy"
else
    echo "❌ Application health check failed"
    exit 1
fi

echo "🎉 Production deployment completed successfully!"
echo "📊 Application: http://localhost:3000"
echo "📈 Grafana: http://localhost:3001 (admin/\$GRAFANA_PASSWORD)"
echo "🔍 Prometheus: http://localhost:9090"`
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:build:production',
      command: 'docker build -f Dockerfile.production -t {{project.name}}:production .'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:deploy:production',
      command: 'bash scripts/deploy-production.sh'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:compose:production',
      command: 'docker-compose -f docker-compose.production.yml up -d'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:stop:production',
      command: 'docker-compose -f docker-compose.production.yml down'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'docker:logs:production',
      command: 'docker-compose -f docker-compose.production.yml logs -f'
    }
  ]
};
export default productionReadyBlueprint;
