import { z } from 'zod';

export const ResetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>; 