import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .min(5, '연락처를 5자 이상 입력해 주세요.')
  .max(20, '연락처는 20자 이내로 입력해 주세요.')
  .optional()
  .or(z.literal(''))
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  });

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요.'),
  phone: phoneSchema,
  avatarUrl: z
    .string()
    .trim()
    .url('올바른 URL 형식이 아닙니다.')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  // 공통/역할별 확장 필드
  bio: z.string().trim().max(500, '자기소개는 500자 이내로 입력해 주세요.').optional().or(z.literal('').transform(() => '')),
  websiteUrl: z.string().url('올바른 URL 형식이 아닙니다.').optional().or(z.literal('').transform(() => '')),
  contactHours: z.string().trim().max(100).optional().or(z.literal('').transform(() => '')),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  expertise: z.array(z.string().trim()).optional(),
  school: z.string().trim().max(100).optional().or(z.literal('').transform(() => '')),
  grade: z.string().trim().max(50).optional().or(z.literal('').transform(() => '')),
  major: z.string().trim().max(100).optional().or(z.literal('').transform(() => '')),
  interests: z.array(z.string().trim()).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
