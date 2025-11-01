import { z } from 'zod';
import { createAnswerSchema } from '../../../infrastructure/validation/schemas/answerSchemas';

export const CreateAnswerSchema = createAnswerSchema;

export type CreateAnswerDTO = z.infer<typeof CreateAnswerSchema>;
