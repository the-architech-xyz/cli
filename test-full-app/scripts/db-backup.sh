#!/bin/bash
set -e

echo "Starting database backup..."

# Set password for pg_dump
export PGPASSWORD="postgres"

# Create backup
pg_dump -h localhost -p 5432 -U postgres -d myapp > backup_$(date +%Y%m%d_%H%M%S).sql

echo "Backup completed successfully!"
