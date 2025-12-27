import { z } from 'zod';

export const createQuestionSchema = z.object({
  title: z.string().min(10),
  content: z.string().min(20),
  parent: z
    .object({
      id: z.string(),
      type: z.enum(['question', 'answer']),
    })
    .optional(),
  thumbnailKey: z.string().trim().min(1).optional(),
});

export const updateQuestionSchema = z.object({
  title: z.string().min(10).optional(),
  content: z.string().min(20).optional(),
  thumbnailKey: z.string().trim().min(1).optional(),
  removeThumbnail: z.boolean().optional(),
});
