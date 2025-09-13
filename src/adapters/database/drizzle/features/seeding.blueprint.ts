/**
 * Drizzle Seeding Feature
 * 
 * Adds data seeding and fixtures management to Drizzle
 */

import { Blueprint } from '../../../../types/adapter.js';

const seedingBlueprint: Blueprint = {
  id: 'drizzle-seeding',
  name: 'Drizzle Seeding',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['drizzle-kit'],
      isDev: true
    },
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@faker-js/faker'],
      isDev: true,
      condition: '{{#if module.parameters.faker}}'
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/seeds/seed-manager.ts',
      content: `import { db } from '../index';
import { users, posts, comments, categories, postCategories } from '../schema';
import { eq } from 'drizzle-orm';
{{#if module.parameters.faker}}
import { faker } from '@faker-js/faker';
{{/if}}

// Seed management utilities
export class SeedManager {
  static async runAllSeeds(): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...');
      
      // Clear existing data
      await this.clearDatabase();
      
      // Run seeds in order
      await this.seedCategories();
      await this.seedUsers();
      await this.seedPosts();
      await this.seedComments();
      await this.seedPostCategories();
      
      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  static async clearDatabase(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    
    // Delete in reverse order of dependencies
    await db.delete(postCategories);
    await db.delete(comments);
    await db.delete(posts);
    await db.delete(users);
    await db.delete(categories);
    
    console.log('✅ Database cleared');
  }

  static async seedCategories(): Promise<void> {
    console.log('📂 Seeding categories...');
    
    const categoriesData = [
      { name: 'Technology', description: 'Tech-related posts' },
      { name: 'Programming', description: 'Programming and development' },
      { name: 'Web Development', description: 'Frontend and backend development' },
      { name: 'Mobile Development', description: 'iOS and Android development' },
      { name: 'DevOps', description: 'Infrastructure and deployment' },
      { name: 'Design', description: 'UI/UX and graphic design' },
      { name: 'Business', description: 'Business and entrepreneurship' },
      { name: 'Lifestyle', description: 'Personal and lifestyle content' },
    ];

    await db.insert(categories).values(categoriesData);
    console.log('✅ Seeded ' + categoriesData.length + ' categories');
  }

  static async seedUsers(): Promise<void> {
    console.log('👥 Seeding users...');
    
    const usersData = [
      {
        email: 'john@example.com',
        name: 'John Doe',
        emailVerified: true,
      },
      {
        email: 'jane@example.com',
        name: 'Jane Smith',
        emailVerified: true,
      },
      {
        email: 'bob@example.com',
        name: 'Bob Johnson',
        emailVerified: false,
      },
      {
        email: 'alice@example.com',
        name: 'Alice Brown',
        emailVerified: true,
      },
      {
        email: 'charlie@example.com',
        name: 'Charlie Wilson',
        emailVerified: true,
      },
    ];

    await db.insert(users).values(usersData);
    console.log('✅ Seeded ' + usersData.length + ' users');
  }

  static async seedPosts(): Promise<void> {
    console.log('📝 Seeding posts...');
    
    const postsData = [
      {
        title: 'Getting Started with Next.js',
        content: 'Next.js is a React framework that provides a great developer experience...',
        authorId: 1,
      },
      {
        title: 'Understanding TypeScript',
        content: 'TypeScript brings static typing to JavaScript, making your code more robust...',
        authorId: 2,
      },
      {
        title: 'Database Design Best Practices',
        content: 'Good database design is crucial for application performance and maintainability...',
        authorId: 1,
      },
      {
        title: 'CSS Grid vs Flexbox',
        content: 'Both CSS Grid and Flexbox are powerful layout tools, but they serve different purposes...',
        authorId: 3,
      },
      {
        title: 'API Design Principles',
        content: 'Designing good APIs is essential for building scalable applications...',
        authorId: 4,
      },
    ];

    await db.insert(posts).values(postsData);
    console.log('✅ Seeded ' + postsData.length + ' posts');
  }

  static async seedComments(): Promise<void> {
    console.log('💬 Seeding comments...');
    
    const commentsData = [
      {
        content: 'Great article! Very helpful for beginners.',
        postId: 1,
        authorId: 2,
      },
      {
        content: 'I learned a lot from this. Thanks for sharing!',
        postId: 1,
        authorId: 3,
      },
      {
        content: 'TypeScript has really improved my development workflow.',
        postId: 2,
        authorId: 1,
      },
      {
        content: 'Could you provide more examples?',
        postId: 2,
        authorId: 4,
      },
      {
        content: 'Database design is so important. Great points here.',
        postId: 3,
        authorId: 5,
      },
    ];

    await db.insert(comments).values(commentsData);
    console.log('✅ Seeded ' + commentsData.length + ' comments');
  }

  static async seedPostCategories(): Promise<void> {
    console.log('🏷️ Seeding post categories...');
    
    const postCategoriesData = [
      { postId: 1, categoryId: 1 }, // Next.js - Technology
      { postId: 1, categoryId: 2 }, // Next.js - Programming
      { postId: 1, categoryId: 3 }, // Next.js - Web Development
      { postId: 2, categoryId: 2 }, // TypeScript - Programming
      { postId: 2, categoryId: 3 }, // TypeScript - Web Development
      { postId: 3, categoryId: 1 }, // Database - Technology
      { postId: 3, categoryId: 2 }, // Database - Programming
      { postId: 4, categoryId: 3 }, // CSS - Web Development
      { postId: 4, categoryId: 6 }, // CSS - Design
      { postId: 5, categoryId: 2 }, // API - Programming
      { postId: 5, categoryId: 3 }, // API - Web Development
    ];

    await db.insert(postCategories).values(postCategoriesData);
    console.log('✅ Seeded ' + postCategoriesData.length + ' post categories');
  }

  static async resetDatabase(): Promise<void> {
    console.log('🔄 Resetting database...');
    
    await this.clearDatabase();
    await this.runAllSeeds();
    
    console.log('✅ Database reset completed');
  }

  static async getSeedStatus(): Promise<{
    users: number;
    posts: number;
    comments: number;
    categories: number;
    postCategories: number;
  }> {
    const [userCount, postCount, commentCount, categoryCount, postCategoryCount] = await Promise.all([
      db.select().from(users).then(rows => rows.length),
      db.select().from(posts).then(rows => rows.length),
      db.select().from(comments).then(rows => rows.length),
      db.select().from(categories).then(rows => rows.length),
      db.select().from(postCategories).then(rows => rows.length),
    ]);

    return {
      users: userCount,
      posts: postCount,
      comments: commentCount,
      categories: categoryCount,
      postCategories: postCategoryCount,
    };
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/seed.js',
      content: `#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * Seed the database with sample data
 */

const { SeedManager } = require('../src/lib/db/seeds/seed-manager');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Get command line arguments
const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'seed':
        await SeedManager.runAllSeeds();
        break;
      case 'reset':
        await SeedManager.resetDatabase();
        break;
      case 'clear':
        await SeedManager.clearDatabase();
        break;
      case 'status':
        const status = await SeedManager.getSeedStatus();
        console.log('📊 Database Status:');
        console.log('  Users: ' + status.users);
        console.log('  Posts: ' + status.posts);
        console.log('  Comments: ' + status.comments);
        console.log('  Categories: ' + status.categories);
        console.log('  Post Categories: ' + status.postCategories);
        break;
      default:
        console.log('Available commands:');
        console.log('  seed     - Seed database with sample data');
        console.log('  reset    - Reset database and reseed');
        console.log('  clear    - Clear all data');
        console.log('  status   - Show database status');
        break;
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();`
    }
  ]
};export default seedingBlueprint;
