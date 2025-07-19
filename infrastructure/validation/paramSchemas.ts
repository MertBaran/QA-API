import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().nonempty('id is required')
});

export const userIdParamSchema = idParamSchema;
export const questionIdParamSchema = z.object({
  question_id: z.string().nonempty('question_id is required')
});
export const answerIdParamSchema = z.object({
  answer_id: z.string().nonempty('answer_id is required')
}); 