/**
 * TypeORM Entity Management Feature
 * 
 * Adds advanced entity management with decorators and relationships
 */

import { Blueprint } from '../../../../types/adapter.js';

const entityManagementBlueprint: Blueprint = {
  id: 'typeorm-entity-management',
  name: 'TypeORM Entity Management',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/entities/BaseEntity.ts',
      content: `import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/entities/Product.ts',
      content: `{{#if module.parameters.relationships}}
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Category } from './Category';
import { OrderItem } from './OrderItem';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isAvailable: boolean;

  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems: OrderItem[];
}
{{else}}
import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isAvailable: boolean;
}
{{/if}}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/repositories/BaseRepository.ts',
      content: `import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { BaseEntity } from '../entities/BaseEntity';

export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }
}`
    }
  ]
};
export default entityManagementBlueprint;
