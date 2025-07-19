import { z } from 'zod';

export const UpdateQuestionSchema = z.object({
  title: z.string().min(10).optional(),
  content: z.string().min(20).optional(),
});

export type UpdateQuestionDTO = z.infer<typeof UpdateQuestionSchema>; 