#!/bin/bash
set -e

echo "Running database migrations..."

# Set database URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"

# Run migrations
npm run db:migrate

echo "Migration completed successfully!"
