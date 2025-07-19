import { z } from "zod";

export const createAnswerSchema = z.object({
  content: z.string().min(10),
});

export const updateAnswerSchema = z.object({
  content: z.string().min(10),
}); 