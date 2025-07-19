import { z } from 'zod';

export const UpdateAnswerSchema = z.object({
  content: z.string().min(10, 'content must be at least 10 characters'),
});

export type UpdateAnswerDTO = z.infer<typeof UpdateAnswerSchema>; 