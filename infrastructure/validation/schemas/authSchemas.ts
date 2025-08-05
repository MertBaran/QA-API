import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6),
  role: z.enum(['user', 'admin']).optional(),
});

export const loginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6),
  rememberMe: z.boolean().optional().default(false),
  captchaToken: z.string().min(1, 'reCAPTCHA doğrulaması gerekli'),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6),
});

export const editProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  website: z.string().url().optional(),
  place: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(100).optional(),
  about: z.string().min(1).max(500).optional(),
});
