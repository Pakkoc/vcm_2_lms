import { z } from 'zod';

export const RoleEnum = z.enum(['learner', 'instructor']);

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).+$/),
  role: RoleEnum,
  name: z.string().min(2).max(20),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/),
  termsAgreed: z.literal(true),
});

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  redirectTo: z.string().min(1),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;


