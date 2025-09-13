import { Blueprint } from '../../types/adapter.js';

const drizzleNextjsIntegrationBlueprint: Blueprint = {
  id: 'drizzle-nextjs-integration',
  name: 'Drizzle Next.js Integration',
  description: 'Complete Drizzle ORM integration for Next.js applications',
  version: '2.0.0',
  actions: [
    // PURE MODIFIER: Enhance the database index with Next.js specific utilities
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
            content: `// Next.js specific database utilities
export const runMigrations = async () => {
  try {
    // Next.js migration logic
    console.log('Running database migrations...');
    // Add your migration logic here
    return { success: true, message: 'Migrations completed' };
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

export const seedDatabase = async () => {
  try {
    // Next.js seeding logic
    console.log('Seeding database...');
    // Add your seeding logic here
    return { success: true, message: 'Database seeded' };
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
};

// Next.js specific query utilities
export const createQuery = async (query: string) => {
  // Next.js query logic
  return { query, result: 'Query executed' };
};

export const findById = async (id: string) => {
  // Next.js find logic
  return { id, found: true };
};

export const findAll = async () => {
  // Next.js find all logic
  return { records: [], count: 0 };
};

export const createRecord = async (data: any) => {
  // Next.js create logic
  return { id: 'new-id', ...data };
};

export const updateRecord = async (id: string, data: any) => {
  // Next.js update logic
  return { id, ...data, updated: true };
};

export const deleteRecord = async (id: string) => {
  // Next.js delete logic
  return { id, deleted: true };
};

// Next.js specific transaction utilities
export const withTransaction = async (callback: Function) => {
  // Next.js transaction logic
  return callback();
};

export const runInTransaction = async (callback: Function) => {
  // Next.js transaction logic
  return callback();
};

// Next.js specific validation utilities
export const validateSchema = async (schema: any, data: any) => {
  // Next.js validation logic
  return { valid: true, errors: [] };
};

export const validateRecord = async (record: any) => {
  // Next.js validation logic
  return { valid: true, errors: [] };
};`
          }
        ]
      },
      condition: '{{#if integration.features.apiRoutes}}'
    },

    // PURE MODIFIER: Create Next.js API route for migrations
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/db/migrate/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' },
          { name: 'runMigrations', from: '@/lib/db', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  try {
    await runMigrations();
    return NextResponse.json({ success: true, message: 'Migrations completed' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}`
          }
        ]
      },
      condition: '{{#if integration.features.apiRoutes}}'
    },

    // PURE MODIFIER: Create Next.js API route for seeding
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/db/seed/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',
      params: {
        importsToAdd: [
          { name: 'NextRequest', from: 'next/server', type: 'import' },
          { name: 'NextResponse', from: 'next/server', type: 'import' },
          { name: 'seedDatabase', from: '@/lib/db', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Database seeded' });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
  }
}`
          }
        ]
      },
      condition: '{{#if integration.features.apiRoutes}}'
    }
  ]
};

export const blueprint = drizzleNextjsIntegrationBlueprint;