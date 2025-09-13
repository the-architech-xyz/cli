/**
 * TypeORM Base Blueprint
 * 
 * Sets up TypeORM with minimal configuration
 * Advanced features are available as separate features
 */

import { Blueprint } from '../../../types/adapter.js';

export const typeormBlueprint: Blueprint = {
  id: 'typeorm-base-setup',
  name: 'TypeORM Base Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['typeorm', 'reflect-metadata', '{{module.parameters.databaseType}}']
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.database_config}}/typeorm.ts',
      content: `import { DataSource } from 'typeorm';
import 'reflect-metadata';

// Database configuration
const AppDataSource = new DataSource({
  type: '{{module.parameters.databaseType}}',
  url: process.env.DATABASE_URL,
  synchronize: {{module.parameters.synchronize}},
  logging: {{module.parameters.logging}},
  entities: [__dirname + '/entities/*.ts'],
  migrations: [__dirname + '/migrations/*.ts'],
  subscribers: [__dirname + '/subscribers/*.ts'],
});

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Get database connection
export const getDataSource = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return AppDataSource;
};

export default AppDataSource;`
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.database_config}}/entities/User.ts',
      content: `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}`
    }
  ]
};