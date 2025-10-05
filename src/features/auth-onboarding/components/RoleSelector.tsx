"use client";

import { type Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { SIGNUP_ROLE_OPTIONS, type SignupFormValues } from "@/lib/validation/auth";

export type RoleSelectorProps = {
  control: Control<SignupFormValues>;
  disabled?: boolean;
};

export const RoleSelector = ({ control, disabled = false }: RoleSelectorProps) => (
  <FormField
    control={control}
    name="role"
    render={({ field }) => (
      <FormItem>
        <FormLabel>역할 선택</FormLabel>
        <FormControl>
          <div className="grid gap-3 md:grid-cols-2">
            {SIGNUP_ROLE_OPTIONS.map((option) => {
              const isSelected = field.value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => field.onChange(option.value)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2",
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-slate-500">{option.description}</span>
                </button>
              );
            })}
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
