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
  website: z.union([z.string().url(), z.literal('')]).optional(),
  place: z.union([z.string().max(100), z.literal('')]).optional(),
  title: z.union([z.string().max(100), z.literal('')]).optional(),
  about: z.union([z.string().max(500), z.literal('')]).optional(),
});

// Password validation regex: min 8 chars, uppercase, lowercase, number, special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;

export const requestPasswordChangeSchema = z.object({
  oldPassword: z.string().optional(), // Optional for Google users
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

export const verifyPasswordChangeCodeSchema = z.object({
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});

export const confirmPasswordChangeSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  verificationToken: z.string().min(1, 'Verification token is required'),
});
