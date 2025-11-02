import { z } from 'zod';
import { updateAnswerSchema } from '../../../infrastructure/validation/schemas/answerSchemas';

export const UpdateAnswerSchema = updateAnswerSchema;

export type UpdateAnswerDTO = z.infer<typeof UpdateAnswerSchema>;
