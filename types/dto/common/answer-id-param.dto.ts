import { z } from 'zod';

export const AnswerIdParamSchema = z.object({
  answer_id: z.string().nonempty('answer_id is required'),
});

export type AnswerIdParamDTO = z.infer<typeof AnswerIdParamSchema>;
