FROM postgres:15-alpine

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
