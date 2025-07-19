import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6),
});

export type LoginDTO = z.infer<typeof LoginSchema>; 