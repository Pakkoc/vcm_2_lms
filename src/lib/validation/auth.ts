import { z } from "zod";

export const PASSWORD_POLICY = {
  minLength: 8,
  requireLetters: true,
  requireNumbers: true,
  requireSpecialCharacters: true,
} as const;

const PASSWORD_REGEXP = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;
const PHONE_REGEXP = /^010-\d{4}-\d{4}$/;

export const RoleEnum = z.enum(["learner", "instructor"]);

export const passwordSchema = z
  .string()
  .min(PASSWORD_POLICY.minLength, `비밀번호는 최소 ${PASSWORD_POLICY.minLength}자 이상이어야 합니다.`)
  .regex(PASSWORD_REGEXP, "영문, 숫자, 특수문자를 모두 포함해야 합니다.");

export const phoneSchema = z
  .string()
  .regex(PHONE_REGEXP, "휴대폰 번호는 010-XXXX-XXXX 형식이어야 합니다.");

export const signupFormSchema = z
  .object({
    email: z.string().email("올바른 이메일 주소를 입력하세요."),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: RoleEnum,
    name: z
      .string()
      .min(2, "이름은 최소 2자 이상이어야 합니다.")
      .max(20, "이름은 20자를 초과할 수 없습니다."),
    phone: phoneSchema,
    termsAgreed: z.literal(true, {
      errorMap: () => ({ message: "약관에 동의해야 가입을 진행할 수 있습니다." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "비밀번호가 일치하지 않습니다.",
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const SIGNUP_ROLE_OPTIONS: Array<{ value: SignupFormValues["role"]; label: string; description: string }> = [
  {
    value: "learner",
    label: "Learner",
    description: "코스를 수강하고 과제를 제출하며 피드백을 확인합니다.",
  },
  {
    value: "instructor",
    label: "Instructor",
    description: "코스와 과제를 생성하고 제출물을 채점하며 학습자를 관리합니다.",
  },
];

export const PASSWORD_REQUIREMENT_SUMMARY = "영문, 숫자, 특수문자를 포함한 최소 8자";
