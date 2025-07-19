import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>; 