import { z } from 'zod';

const baseAnswerSchema = z.object({
  content: z.string().min(5),
});

export const createAnswerSchema = baseAnswerSchema;
export const updateAnswerSchema = baseAnswerSchema;
