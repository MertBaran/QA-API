import { z } from 'zod';

export const CreateQuestionSchema = z.object({
  title: z.string().min(10),
  content: z.string().min(20),
  parent: z.object({
    id: z.string(),
    type: z.enum(['question', 'answer']),
  }).optional(),
});

export type CreateQuestionDTO = z.infer<typeof CreateQuestionSchema>;
