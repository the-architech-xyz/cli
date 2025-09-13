/**
 * Drizzle Relations Feature Blueprint
 * 
 * Adds comprehensive relationship management for Drizzle ORM
 */

import { Blueprint } from '../../../../types/adapter.js';

const relationsBlueprint: Blueprint = {
  id: 'drizzle-relations',
  name: 'Drizzle Relations',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/relations.ts',
      content: `import { relations } from 'drizzle-orm';
import { users, posts, comments, categories, postCategories } from './schema';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

// Post relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  categories: many(postCategories),
}));

// Comment relations
export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

// Category relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(postCategories),
}));

// Post-Category junction table relations
export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.postId],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}));

// Export all relations
export const allRelations = {
  users: usersRelations,
  posts: postsRelations,
  comments: commentsRelations,
  categories: categoriesRelations,
  postCategories: postCategoriesRelations,
};`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/query-builders.ts',
      content: `import { db } from './index';
import { users, posts, comments, categories, postCategories } from './schema';
import { eq, and, or, desc, asc, count, like, inArray } from 'drizzle-orm';

// Query builders for common relationship queries
export class RelationshipQueries {
  // Get user with all their posts
  static async getUserWithPosts(userId: string) {
    return await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        posts: {
          orderBy: desc(posts.createdAt),
        },
      },
    });
  }

  // Get post with author and comments
  static async getPostWithDetails(postId: string) {
    return await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: {
        author: true,
        comments: {
          with: {
            author: true,
          },
          orderBy: asc(comments.createdAt),
        },
        categories: {
          with: {
            category: true,
          },
        },
      },
    });
  }

  // Get posts by category
  static async getPostsByCategory(categoryId: string, limit = 10, offset = 0) {
    return await db.query.posts.findMany({
      where: eq(posts.published, true),
      with: {
        author: true,
        categories: {
          where: eq(postCategories.categoryId, categoryId),
          with: {
            category: true,
          },
        },
      },
      limit,
      offset,
      orderBy: desc(posts.createdAt),
    });
  }

  // Get user's posts with comment counts
  static async getUserPostsWithStats(userId: string) {
    return await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        published: posts.published,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        commentCount: count(comments.id),
      })
      .from(posts)
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(posts.authorId, userId))
      .groupBy(posts.id)
      .orderBy(desc(posts.createdAt));
  }

  // Search posts with author info
  static async searchPosts(query: string, limit = 10, offset = 0) {
    return await db.query.posts.findMany({
      where: and(
        eq(posts.published, true),
        or(
          like(posts.title, \`%\${query}%\`),
          like(posts.content, \`%\${query}%\`)
        )
      ),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          with: {
            category: true,
          },
        },
      },
      limit,
      offset,
      orderBy: desc(posts.createdAt),
    });
  }

  // Get category with post counts
  static async getCategoriesWithPostCounts() {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        postCount: count(postCategories.postId),
      })
      .from(categories)
      .leftJoin(postCategories, eq(categories.id, postCategories.categoryId))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));
  }

  // Get recent activity (posts and comments)
  static async getRecentActivity(limit = 20) {
    const recentPosts = await db.query.posts.findMany({
      where: eq(posts.published, true),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      limit: Math.ceil(limit / 2),
      orderBy: desc(posts.createdAt),
    });

    const recentComments = await db.query.comments.findMany({
      with: {
        author: {
          columns: {
            id: true,
            name: true,
          },
        },
        post: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
      limit: Math.ceil(limit / 2),
      orderBy: desc(comments.createdAt),
    });

    // Combine and sort by date
    const activity = [...recentPosts, ...recentComments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return activity;
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    const [postCount] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.authorId, userId));

    const [commentCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.authorId, userId));

    const [publishedPostCount] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.published, true)));

    return {
      totalPosts: postCount.count,
      publishedPosts: publishedPostCount.count,
      totalComments: commentCount.count,
    };
  }

  // Bulk operations
  static async assignCategoriesToPost(postId: string, categoryIds: string[]) {
    const categoryAssignments = categoryIds.map(categoryId => ({
      postId,
      categoryId,
    }));

    return await db.insert(postCategories).values(categoryAssignments);
  }

  static async removeCategoriesFromPost(postId: string, categoryIds: string[]) {
    return await db
      .delete(postCategories)
      .where(
        and(
          eq(postCategories.postId, postId),
          inArray(postCategories.categoryId, categoryIds)
        )
      );
  }

  // Advanced queries
  static async getPopularPosts(days = 30, limit = 10) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        createdAt: posts.createdAt,
        commentCount: count(comments.id),
      })
      .from(posts)
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(
        and(
          eq(posts.published, true),
          eq(posts.createdAt, cutoffDate)
        )
      )
      .groupBy(posts.id)
      .orderBy(desc(count(comments.id)))
      .limit(limit);
  }

  static async getUsersWithMostPosts(limit = 10) {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        postCount: count(posts.id),
      })
      .from(users)
      .leftJoin(posts, eq(users.id, posts.authorId))
      .groupBy(users.id)
      .orderBy(desc(count(posts.id)))
      .limit(limit);
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'docs/integrations/drizzle-relations.md',
      content: `# Drizzle Relations Integration Guide

## Overview

This guide shows how to use Drizzle ORM relations effectively in your application.

## Prerequisites

- Drizzle ORM configured
- Database schema with relationships
- Understanding of SQL relationships

## Basic Setup

### 1. Schema Definition

\`\`\`typescript
// src/lib/db/schema.ts
import { pgTable, text, timestamp, uuid, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  slug: text('slug').notNull().unique(),
  published: boolean('published').default(false),
  authorId: uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  postId: uuid('post_id').notNull().references(() => posts.id),
  authorId: uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
});

export const postCategories = pgTable('post_categories', {
  postId: uuid('post_id').notNull().references(() => posts.id),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
});
\`\`\`

### 2. Relations Definition

\`\`\`typescript
// src/lib/db/relations.ts
import { relations } from 'drizzle-orm';
import { users, posts, comments, categories, postCategories } from './schema';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  categories: many(postCategories),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(postCategories),
}));

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.postId],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}));
\`\`\`

## Usage Examples

### Basic Queries with Relations

\`\`\`typescript
// Get user with posts
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    posts: {
      orderBy: desc(posts.createdAt),
    },
  },
});

// Get post with author and comments
const postWithDetails = await db.query.posts.findFirst({
  where: eq(posts.id, postId),
  with: {
    author: true,
    comments: {
      with: {
        author: true,
      },
      orderBy: asc(comments.createdAt),
    },
    categories: {
      with: {
        category: true,
      },
    },
  },
});
\`\`\`

### Advanced Queries

\`\`\`typescript
// Get posts by category with author info
const postsByCategory = await db.query.posts.findMany({
  where: eq(posts.published, true),
  with: {
    author: {
      columns: {
        id: true,
        name: true,
        email: true,
      },
    },
    categories: {
      where: eq(postCategories.categoryId, categoryId),
      with: {
        category: true,
      },
    },
  },
  limit: 10,
  offset: 0,
  orderBy: desc(posts.createdAt),
});

// Search posts with relationships
const searchResults = await db.query.posts.findMany({
  where: and(
    eq(posts.published, true),
    or(
      like(posts.title, \`%\${query}%\`),
      like(posts.content, \`%\${query}%\`)
    )
  ),
  with: {
    author: {
      columns: {
        id: true,
        name: true,
      },
    },
    categories: {
      with: {
        category: true,
      },
    },
  },
  limit: 10,
  orderBy: desc(posts.createdAt),
});
\`\`\`

### Complex Aggregations

\`\`\`typescript
// Get user statistics
const userStats = await db
  .select({
    id: users.id,
    name: users.name,
    postCount: count(posts.id),
    commentCount: count(comments.id),
  })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))
  .leftJoin(comments, eq(users.id, comments.authorId))
  .where(eq(users.id, userId))
  .groupBy(users.id);

// Get popular posts by comment count
const popularPosts = await db
  .select({
    id: posts.id,
    title: posts.title,
    commentCount: count(comments.id),
  })
  .from(posts)
  .leftJoin(comments, eq(posts.id, comments.postId))
  .where(eq(posts.published, true))
  .groupBy(posts.id)
  .orderBy(desc(count(comments.id)))
  .limit(10);
\`\`\`

## API Integration

### API Routes with Relations

\`\`\`typescript
// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, params.id),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          with: {
            author: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: asc(comments.createdAt),
        },
        categories: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
\`\`\`

### React Components with Relations

\`\`\`typescript
// src/components/PostCard.tsx
'use client';

import { useState, useEffect } from 'react';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  categories: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    comments: number;
  };
}

export function PostCard({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(\`/api/posts/\${postId}\`);
      const data = await response.json();
      
      if (response.ok) {
        setPost(data.post);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <article className="border rounded-lg p-6">
      <h2 className="text-xl font-bold mb-2">{post.title}</h2>
      <p className="text-gray-600 mb-4">{post.content}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>By {post.author.name}</span>
        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>
      
      {post.categories.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {post.categories.map(({ category }) => (
              <span
                key={category.id}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
\`\`\`

## Best Practices

1. **Use selective columns** to avoid over-fetching data
2. **Implement proper indexing** on foreign key columns
3. **Use transactions** for complex operations involving multiple tables
4. **Cache frequently accessed data** to improve performance
5. **Use pagination** for large result sets

## Performance Tips

### Optimize Queries

\`\`\`typescript
// Good: Select only needed columns
const users = await db.query.users.findMany({
  columns: {
    id: true,
    name: true,
    email: true,
  },
  with: {
    posts: {
      columns: {
        id: true,
        title: true,
        createdAt: true,
      },
      limit: 5, // Limit related data
    },
  },
});

// Avoid: Fetching all columns
const users = await db.query.users.findMany({
  with: {
    posts: true, // This fetches all post columns
  },
});
\`\`\`

### Use Indexes

\`\`\`typescript
// Add indexes for better performance
export const posts = pgTable('posts', {
  // ... columns
}, (table) => ({
  authorIdIdx: index('posts_author_id_idx').on(table.authorId),
  publishedIdx: index('posts_published_idx').on(table.published),
  createdAtIdx: index('posts_created_at_idx').on(table.createdAt),
}));
\`\`\`

## Common Patterns

### Nested Relations

\`\`\`typescript
// Get deeply nested data
const postWithNestedData = await db.query.posts.findFirst({
  where: eq(posts.id, postId),
  with: {
    author: true,
    comments: {
      with: {
        author: true,
      },
    },
    categories: {
      with: {
        category: true,
      },
    },
  },
});
\`\`\`

### Conditional Relations

\`\`\`typescript
// Only load relations when needed
const posts = await db.query.posts.findMany({
  with: {
    author: true,
    // Only load comments for published posts
    comments: posts.published ? {
      with: {
        author: true,
      },
    } : undefined,
  },
});
\`\`\`
`
    }
  ]
};
export default relationsBlueprint;
