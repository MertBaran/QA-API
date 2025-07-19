import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).optional(),
});

export const loginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6),
}); 