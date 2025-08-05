import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(val => parseInt(val, 10)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(val => parseInt(val, 10)),
  sortBy: z
    .enum(['createdAt', 'likes', 'answers', 'views'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
});

export type PaginationQueryDTO = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
