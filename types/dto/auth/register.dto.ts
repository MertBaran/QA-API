import { z } from 'zod';

export const RegisterSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).optional(),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>; 