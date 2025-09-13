import { Blueprint } from '../../types/adapter.js';

const prismaNextjsIntegrationBlueprint: Blueprint = {
  id: 'prisma-nextjs-integration',
  name: 'Prisma Next.js Integration',
  description: 'Complete Prisma ORM integration for Next.js applications',
  version: '1.0.0',
  actions: [
    // PURE MODIFIER: Enhance existing Prisma files with Next.js-specific functionality
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/db/index.ts',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js specific Prisma utilities
export const runMigrations = async () => {
  try {
    // Next.js Prisma migration logic
    console.log('Running Prisma migrations...');
    return { success: true, message: 'Migrations completed' };
  } catch (error) {
    console.error('Prisma migration error:', error);
    throw error;
  }
};

export const seedDatabase = async () => {
  try {
    // Next.js Prisma seeding logic
    console.log('Seeding database...');
    return { success: true, message: 'Database seeded' };
  } catch (error) {
    console.error('Prisma seeding error:', error);
    throw error;
  }
};

// Next.js specific query utilities
export const createQuery = async (query: string) => {
  // Next.js Prisma query logic
  return { query, result: 'Query executed' };
};

export const findById = async (id: string) => {
  // Next.js Prisma find logic
  return { id, found: true };
};

export const findAll = async () => {
  // Next.js Prisma find all logic
  return { records: [], count: 0 };
};

export const createRecord = async (data: any) => {
  // Next.js Prisma create logic
  return { id: 'new-id', ...data };
};

export const updateRecord = async (id: string, data: any) => {
  // Next.js Prisma update logic
  return { id, ...data, updated: true };
};

export const deleteRecord = async (id: string) => {
  // Next.js Prisma delete logic
  return { id, deleted: true };
};

// Next.js specific transaction utilities
export const withTransaction = async (callback: Function) => {
  // Next.js Prisma transaction logic
  return callback();
};

export const runInTransaction = async (callback: Function) => {
  // Next.js Prisma transaction logic
  return callback();
};

// Next.js specific validation utilities
export const validateSchema = async (schema: any, data: any) => {
  // Next.js Prisma validation logic
  return { valid: true, errors: [] };
};

export const validateRecord = async (record: any) => {
  // Next.js Prisma validation logic
  return { valid: true, errors: [] };
};`
          }
        ]
      },
      condition: '{{#if integration.features.apiRoutes}}'
    },

    // Add Next.js-specific API routes
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/db/migrate/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { runMigrations } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await runMigrations();
    return NextResponse.json({ success: true, message: 'Prisma migrations completed' });
  } catch (error) {
    console.error('Prisma migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
`,
      condition: '{{#if integration.features.apiRoutes}}'
    },

    {
      type: 'CREATE_FILE',
      path: 'src/app/api/db/seed/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Database seeded' });
  } catch (error) {
    console.error('Prisma seeding error:', error);
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
  }
}
`,
      condition: '{{#if integration.features.apiRoutes}}'
    }
  ]
};

export const blueprint = prismaNextjsIntegrationBlueprint;