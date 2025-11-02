import { z } from 'zod';

export const CreateQuestionSchema = z.object({
  title: z.string().min(10),
  content: z.string().min(20),
  parentContentId: z.string().optional(),
});

export type CreateQuestionDTO = z.infer<typeof CreateQuestionSchema>;
