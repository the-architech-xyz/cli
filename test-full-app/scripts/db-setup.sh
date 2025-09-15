#!/bin/bash
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
