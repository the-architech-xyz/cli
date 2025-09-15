version: '3.8'

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
