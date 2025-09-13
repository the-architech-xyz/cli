/**
 * Prisma Base Blueprint
 * 
 * Sets up Prisma with minimal configuration
 * Advanced features are available as separate features
 */

import { Blueprint } from '../../../types/adapter.js';

export const prismaBlueprint: Blueprint = {
  id: 'prisma-base-setup',
  name: 'Prisma Base Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['prisma', '@prisma/client']
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.database_config}}/prisma.ts',
      content: `import { PrismaClient } from '@prisma/client';

// Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`
    },
    {
      type: 'CREATE_FILE',
      path: 'prisma/schema.prisma',
      content: `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "{{module.parameters.provider}}"
  url      = env("DATABASE_URL")
}

// Example model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}`
    }
  ]
};
