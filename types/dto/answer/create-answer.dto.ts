import { z } from 'zod';

export const CreateAnswerSchema = z.object({
  content: z.string().min(10, 'content must be at least 10 characters'),
});

export type CreateAnswerDTO = z.infer<typeof CreateAnswerSchema>; 