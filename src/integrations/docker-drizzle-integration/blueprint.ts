import { Blueprint } from '../../types/adapter.js';

const dockerDrizzleIntegrationBlueprint: Blueprint = {
  id: 'docker-drizzle-integration',
  name: 'Docker Drizzle Integration',
  description: 'Complete Docker containerization for Drizzle ORM with database services',
  version: '1.0.0',
  actions: [
    // Database Docker Compose
    {
      type: 'CREATE_FILE',
      path: 'docker-compose.database.yml',
      condition: '{{#if integration.features.postgresService}}',
      content: `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres-db
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-myapp}
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - database-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-postgres} -d \${POSTGRES_DB:-myapp}"]
      interval: 30s
      timeout: 10s
      retries: 5

  migration:
    build:
      context: .
      dockerfile: database/Dockerfile.migration
    container_name: drizzle-migration
    environment:
      DATABASE_URL: postgresql://\${POSTGRES_USER:-postgres}:\${POSTGRES_PASSWORD:-postgres}@postgres:5432/\${POSTGRES_DB:-myapp}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - database-network
    restart: "no"
    command: ["npm", "run", "db:migrate"]

volumes:
  postgres_data:
    driver: local

networks:
  database-network:
    driver: bridge
`
    },
    {
      type: 'CREATE_FILE',
      path: 'database/Dockerfile.postgres',
      condition: '{{#if integration.features.postgresService}}',
      content: `FROM postgres:15-alpine

# Install additional tools
RUN apk add --no-cache postgresql-contrib

# Create backup directory
RUN mkdir -p /backup && chown postgres:postgres /backup

# Expose port
EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD pg_isready -U postgres -d myapp || exit 1

# Start PostgreSQL
CMD ["postgres"]
`
    },
    {
      type: 'CREATE_FILE',
      path: 'database/Dockerfile.migration',
      condition: '{{#if integration.features.migrationService}}',
      content: `FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Default command
CMD ["npm", "run", "db:migrate"]
`
    },
    {
      type: 'CREATE_FILE',
      path: 'database/init.sql',
      condition: '{{#if integration.features.postgresService}}',
      content: `-- Database initialization script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- Set up logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Reload configuration
SELECT pg_reload_conf();
`
    },
    {
      type: 'CREATE_FILE',
      path: 'database/seed.sql',
      condition: '{{#if integration.features.seedData}}',
      content: `-- Database seed data
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at) VALUES
(1, 'admin@example.com', 'Admin User', 'admin', true, NOW(), NOW()),
(2, 'user@example.com', 'Regular User', 'user', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/db-setup.sh',
      condition: '{{#if integration.features.postgresService}}',
      content: `#!/bin/bash
set -e

echo "Setting up database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1; then
  echo "Error: PostgreSQL is not running"
  exit 1
fi

# Create database if it doesn't exist
createdb -h localhost -p 5432 -U postgres myapp 2>/dev/null || true

# Run migrations
npm run db:migrate

echo "Database setup completed successfully!"
`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/db-migrate.sh',
      condition: '{{#if integration.features.migrationService}}',
      content: `#!/bin/bash
set -e

echo "Running database migrations..."

# Set database URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"

# Run migrations
npm run db:migrate

echo "Migration completed successfully!"
`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/db-backup.sh',
      condition: '{{#if integration.features.backupService}}',
      content: `#!/bin/bash
set -e

echo "Starting database backup..."

# Set password for pg_dump
export PGPASSWORD="postgres"

# Create backup
pg_dump -h localhost -p 5432 -U postgres -d myapp > backup_$(date +%Y%m%d_%H%M%S).sql

echo "Backup completed successfully!"
`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/db-health.sh',
      condition: '{{#if integration.features.postgresService}}',
      content: `#!/bin/bash
set -e

echo "Checking database health..."

# Set password for psql
export PGPASSWORD="postgres"

# Check if database is accessible
if ! psql -h localhost -p 5432 -U postgres -d myapp -c "SELECT 1;" >/dev/null 2>&1; then
  echo "Error: Cannot connect to database"
  exit 1
fi

echo "Database connection: OK"

# Check database size
DB_SIZE=$(psql -h localhost -p 5432 -U postgres -d myapp -t -c "SELECT pg_size_pretty(pg_database_size('myapp'));" | tr -d ' ')
echo "Database size: $DB_SIZE"

echo "Database health check completed!"
`
    }
  ]
};

export const blueprint = dockerDrizzleIntegrationBlueprint;