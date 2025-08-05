import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6),
  rememberMe: z.boolean().optional().default(false),
  captchaToken: z.string().min(1, 'reCAPTCHA doğrulaması gerekli'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;
