import { z } from 'zod';
import { BookmarkTargetType } from '../../../models/interfaces/IBookmarkModel';

// Add Bookmark Schema
export const AddBookmarkSchema = z.object({
  targetType: z.enum([
    'question',
    'answer',
    'note',
    'article',
    'comment',
  ] as const),
  targetId: z.string().min(1, 'Target ID is required'),
  targetData: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    author: z.string().optional(),
    authorId: z.string().optional(),
    created_at: z.string().min(1, 'Created at is required'),
    url: z.string().url().optional(),
  }),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
});

export type AddBookmarkDTO = z.infer<typeof AddBookmarkSchema>;

// Update Bookmark Schema
export const UpdateBookmarkSchema = z.object({
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateBookmarkDTO = z.infer<typeof UpdateBookmarkSchema>;

// Create Collection Schema
export const CreateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(50, 'Collection name too long'),
  description: z.string().max(200, 'Description too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
  isPublic: z.boolean().optional().default(false),
});

export type CreateCollectionDTO = z.infer<typeof CreateCollectionSchema>;

// Update Collection Schema
export const UpdateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(50, 'Collection name too long')
    .optional(),
  description: z.string().max(200, 'Description too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateCollectionDTO = z.infer<typeof UpdateCollectionSchema>;

// Bookmark Response Schema
export const BookmarkResponseSchema = z.object({
  _id: z.string(),
  user_id: z.string(),
  target_type: z.enum([
    'question',
    'answer',
    'note',
    'article',
    'comment',
  ] as const),
  target_id: z.string(),
  target_data: z.object({
    title: z.string(),
    content: z.string(),
    author: z.string().optional(),
    authorId: z.string().optional(),
    created_at: z.string(),
    url: z.string().optional(),
  }),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  is_public: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BookmarkResponseDTO = z.infer<typeof BookmarkResponseSchema>;

// Collection Response Schema
export const CollectionResponseSchema = z.object({
  _id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  is_public: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CollectionResponseDTO = z.infer<typeof CollectionResponseSchema>;

// Bookmark Stats Response Schema
export const BookmarkStatsResponseSchema = z.object({
  total: z.number(),
  byType: z.record(
    z.enum(['question', 'answer', 'note', 'article', 'comment'] as const),
    z.number()
  ),
  recent: z.array(BookmarkResponseSchema),
});

export type BookmarkStatsResponseDTO = z.infer<
  typeof BookmarkStatsResponseSchema
>;
