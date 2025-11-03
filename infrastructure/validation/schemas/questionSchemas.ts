import { z } from 'zod';

export const createQuestionSchema = z.object({
  title: z.string().min(10),
  content: z.string().min(20),
  parent: z.object({
    id: z.string(),
    type: z.enum(['question', 'answer']),
  }).optional(),
});

export const updateQuestionSchema = z.object({
  title: z.string().min(10).optional(),
  content: z.string().min(20).optional(),
});
