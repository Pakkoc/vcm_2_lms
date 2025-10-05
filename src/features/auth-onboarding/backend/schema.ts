import { z } from "zod";
import { RoleEnum, passwordSchema, phoneSchema } from "@/lib/validation/auth";

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  role: RoleEnum,
  name: z.string().min(2).max(20),
  phone: phoneSchema,
  termsAgreed: z.literal(true),
});

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  redirectTo: z.string().min(1),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
