import { z } from 'zod';

export const QuestionIdParamSchema = z.object({
  question_id: z.string().nonempty('question_id is required'),
});

export type QuestionIdParamDTO = z.infer<typeof QuestionIdParamSchema>; 