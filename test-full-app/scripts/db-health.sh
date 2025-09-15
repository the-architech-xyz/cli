#!/bin/bash
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
