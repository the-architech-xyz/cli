/**
 * Sequelize Associations Feature Blueprint
 * 
 * Advanced model relationships and associations
 */

import { Blueprint } from '../../../../types/adapter.js';

const associationsBlueprint: Blueprint = {
  id: 'sequelize-associations',
  name: 'Model Associations',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/database/associations.ts',
      content: `import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../config.js';

// Base Model class with common functionality
export class BaseModel extends Model {
  public id!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Common associations
  static associations: {
    // Will be populated by subclasses
  };
}

// User Model
export class User extends BaseModel {
  public id!: number;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public password!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    posts: Association<User, Post>;
    comments: Association<User, Comment>;
    profile: Association<User, Profile>;
  };

  // Instance methods
  public get fullName(): string {
    return \`\${this.firstName} \${this.lastName}\`;
  }

  public async getPosts(): Promise<Post[]> {
    return await this.getPosts();
  }

  public async getComments(): Promise<Comment[]> {
    return await this.getComments();
  }
}

// Post Model
export class Post extends BaseModel {
  public id!: number;
  public title!: string;
  public content!: string;
  public published!: boolean;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    author: Association<Post, User>;
    comments: Association<Post, Comment>;
    tags: Association<Post, Tag>;
  };

  // Instance methods
  public async getAuthor(): Promise<User | null> {
    return await this.getAuthor();
  }

  public async getComments(): Promise<Comment[]> {
    return await this.getComments();
  }

  public async getTags(): Promise<Tag[]> {
    return await this.getTags();
  }
}

// Comment Model
export class Comment extends BaseModel {
  public id!: number;
  public content!: string;
  public userId!: number;
  public postId!: number;
  public parentId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    author: Association<Comment, User>;
    post: Association<Comment, Post>;
    parent: Association<Comment, Comment>;
    replies: Association<Comment, Comment>;
  };

  // Instance methods
  public async getAuthor(): Promise<User | null> {
    return await this.getAuthor();
  }

  public async getPost(): Promise<Post | null> {
    return await this.getPost();
  }

  public async getReplies(): Promise<Comment[]> {
    return await this.getReplies();
  }
}

// Profile Model
export class Profile extends BaseModel {
  public id!: number;
  public bio?: string;
  public avatar?: string;
  public website?: string;
  public location?: string;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    user: Association<Profile, User>;
  };

  // Instance methods
  public async getUser(): Promise<User | null> {
    return await this.getUser();
  }
}

// Tag Model
export class Tag extends BaseModel {
  public id!: number;
  public name!: string;
  public slug!: string;
  public color?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    posts: Association<Tag, Post>;
  };

  // Instance methods
  public async getPosts(): Promise<Post[]> {
    return await this.getPosts();
  }
}

// Initialize models
User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true
});

Post.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Post',
  tableName: 'posts',
  timestamps: true
});

Comment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Comment',
  tableName: 'comments',
  timestamps: true
});

Profile.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Profile',
  tableName: 'profiles',
  timestamps: true
});

Tag.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 50]
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 50]
    }
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  }
}, {
  sequelize,
  modelName: 'Tag',
  tableName: 'tags',
  timestamps: true
});

// Define associations
export function defineAssociations() {
  // User associations
  User.hasMany(Post, {
    foreignKey: 'userId',
    as: 'posts'
  });
  
  User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments'
  });
  
  User.hasOne(Profile, {
    foreignKey: 'userId',
    as: 'profile'
  });

  // Post associations
  Post.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author'
  });
  
  Post.hasMany(Comment, {
    foreignKey: 'postId',
    as: 'comments'
  });
  
  Post.belongsToMany(Tag, {
    through: 'PostTags',
    foreignKey: 'postId',
    otherKey: 'tagId',
    as: 'tags'
  });

  // Comment associations
  Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author'
  });
  
  Comment.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post'
  });
  
  Comment.belongsTo(Comment, {
    foreignKey: 'parentId',
    as: 'parent'
  });
  
  Comment.hasMany(Comment, {
    foreignKey: 'parentId',
    as: 'replies'
  });

  // Profile associations
  Profile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // Tag associations
  Tag.belongsToMany(Post, {
    through: 'PostTags',
    foreignKey: 'tagId',
    otherKey: 'postId',
    as: 'posts'
  });
}

// Export all models
export const models = {
  User,
  Post,
  Comment,
  Profile,
  Tag
};

export default models;`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/database/query-helpers.ts',
      content: `import { Op, WhereOptions, Order } from 'sequelize';
import { User, Post, Comment, Profile, Tag } from './associations.js';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

export class QueryHelpers {
  /**
   * Build pagination options
   */
  static buildPagination(options: PaginationOptions) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = options.offset || (page - 1) * limit;

    return { limit, offset, page };
  }

  /**
   * Build sort options
   */
  static buildSort(options: SortOptions[]): Order {
    return options.map(option => [option.field, option.direction]);
  }

  /**
   * Build search conditions
   */
  static buildSearch(fields: string[], searchTerm: string): WhereOptions {
    if (!searchTerm) return {};

    return {
      [Op.or]: fields.map(field => ({
        [field]: {
          [Op.iLike]: \`%\${searchTerm}%\`
        }
      }))
    };
  }

  /**
   * Build date range conditions
   */
  static buildDateRange(field: string, startDate?: Date, endDate?: Date): WhereOptions {
    const conditions: WhereOptions = {};

    if (startDate) {
      conditions[field] = {
        ...conditions[field],
        [Op.gte]: startDate
      };
    }

    if (endDate) {
      conditions[field] = {
        ...conditions[field],
        [Op.lte]: endDate
      };
    }

    return conditions;
  }

  /**
   * Build include options for eager loading
   */
  static buildIncludes(associations: string[]) {
    return associations.map(association => ({
      association,
      required: false
    }));
  }
}

export class UserQueries {
  /**
   * Find users with pagination and search
   */
  static async findUsers(options: {
    search?: string;
    page?: number;
    limit?: number;
    sort?: SortOptions[];
    include?: string[];
  } = {}) {
    const { limit, offset } = QueryHelpers.buildPagination(options);
    const where: WhereOptions = {};
    const order = options.sort ? QueryHelpers.buildSort(options.sort) : [['createdAt', 'DESC']];
    const include = options.include ? QueryHelpers.buildIncludes(options.include) : [];

    if (options.search) {
      Object.assign(where, QueryHelpers.buildSearch(['firstName', 'lastName', 'email'], options.search));
    }

    return await User.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include
    });
  }

  /**
   * Find user by ID with associations
   */
  static async findUserById(id: number, include: string[] = []) {
    return await User.findByPk(id, {
      include: QueryHelpers.buildIncludes(include)
    });
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string) {
    return await User.findOne({
      where: { email }
    });
  }

  /**
   * Get user's posts
   */
  static async getUserPosts(userId: number, options: {
    published?: boolean;
    page?: number;
    limit?: number;
  } = {}) {
    const { limit, offset } = QueryHelpers.buildPagination(options);
    const where: WhereOptions = { userId };

    if (options.published !== undefined) {
      where.published = options.published;
    }

    return await Post.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { association: 'author', required: false },
        { association: 'tags', required: false }
      ]
    });
  }
}

export class PostQueries {
  /**
   * Find posts with pagination and filters
   */
  static async findPosts(options: {
    search?: string;
    published?: boolean;
    userId?: number;
    tagId?: number;
    page?: number;
    limit?: number;
    sort?: SortOptions[];
  } = {}) {
    const { limit, offset } = QueryHelpers.buildPagination(options);
    const where: WhereOptions = {};
    const order = options.sort ? QueryHelpers.buildSort(options.sort) : [['createdAt', 'DESC']];

    if (options.search) {
      Object.assign(where, QueryHelpers.buildSearch(['title', 'content'], options.search));
    }

    if (options.published !== undefined) {
      where.published = options.published;
    }

    if (options.userId) {
      where.userId = options.userId;
    }

    const include: any[] = [
      { association: 'author', required: false },
      { association: 'tags', required: false }
    ];

    if (options.tagId) {
      include.push({
        association: 'tags',
        where: { id: options.tagId },
        required: true
      });
    }

    return await Post.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include
    });
  }

  /**
   * Find post by ID with associations
   */
  static async findPostById(id: number) {
    return await Post.findByPk(id, {
      include: [
        { association: 'author', required: false },
        { association: 'comments', required: false, include: [
          { association: 'author', required: false }
        ]},
        { association: 'tags', required: false }
      ]
    });
  }

  /**
   * Get post comments
   */
  static async getPostComments(postId: number, options: {
    page?: number;
    limit?: number;
    includeReplies?: boolean;
  } = {}) {
    const { limit, offset } = QueryHelpers.buildPagination(options);
    const where: WhereOptions = { postId };

    if (!options.includeReplies) {
      where.parentId = null;
    }

    return await Comment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'ASC']],
      include: [
        { association: 'author', required: false },
        { association: 'replies', required: false, include: [
          { association: 'author', required: false }
        ]}
      ]
    });
  }
}

export class TagQueries {
  /**
   * Find tags with pagination
   */
  static async findTags(options: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { limit, offset } = QueryHelpers.buildPagination(options);
    const where: WhereOptions = {};

    if (options.search) {
      Object.assign(where, QueryHelpers.buildSearch(['name', 'slug'], options.search));
    }

    return await Tag.findAndCountAll({
      where,
      limit,
      offset,
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get popular tags
   */
  static async getPopularTags(limit: number = 10) {
    return await Tag.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        {
          association: 'posts',
          attributes: [],
          required: true
        }
      ],
      group: ['Tag.id'],
      having: sequelize.literal('COUNT("posts"."id") > 0')
    });
  }
}

export { Op };
export default QueryHelpers;`
    }
  ]
};
export default associationsBlueprint;
