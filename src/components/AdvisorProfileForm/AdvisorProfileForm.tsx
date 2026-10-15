"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils/index";
import {
  EMPLOYMENT_TYPES,
  getIncomeRangesForEmployment,
  getIncomeLabel,
  EmploymentTypeValue,
  IncomeRangeValue,
} from "@/schemas/userInfoSchema";
import { useUpdateProfileInfoMutation } from "@/store/userApi";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

type Source = "advisor_gate" | "profile_page";

// Every option visible at once as a tappable tile — one tap instead of
// open-dropdown-then-pick.
function OptionGroup({
  name,
  value,
  options,
  invalid,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup
      name={name}
      value={value}
      onValueChange={onChange}
      className="grid grid-cols-2 max-sm:grid-cols-1 gap-2"
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
              checked
                ? "border-primary-orange bg-primary-orange/10 text-white"
                : "border-white/10 text-white/80 hover:border-white/25",
              invalid && !checked && "border-destructive/60"
            )}
          >
            <RadioGroupItem id={id} value={option.value} />
            {option.label}
          </label>
        );
      })}
    </RadioGroup>
  );
}

// Employment type + income: the two answers the AI Advisor's eligibility
// filter needs. Shown as a popup on entering the advisor and inline on the
// profile page.
export default function AdvisorProfileForm({
  source,
  initialEmploymentType = "",
  initialSalaryRange = "",
  submitLabel = "Save",
  onSaved,
  onCancel,
}: {
  source: Source;
  initialEmploymentType?: string;
  initialSalaryRange?: string;
  submitLabel?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { data: session, update } = useSession();
  const userId = session?.user?._id;
  const [employmentType, setEmploymentType] = useState(initialEmploymentType);
  const [salaryRange, setSalaryRange] = useState(initialSalaryRange);
  const [errors, setErrors] = useState<{ employmentType?: string; salaryRange?: string }>({});
  const [updateProfileInfo, { isLoading }] = useUpdateProfileInfoMutation();

  const incomeRanges = employmentType
    ? getIncomeRangesForEmployment(employmentType as EmploymentTypeValue)
    : [];
  const incomeLabel = employmentType
    ? getIncomeLabel(employmentType as EmploymentTypeValue)
    : "";
  const needsIncomeRange = !!employmentType && employmentType !== "student_unemployed";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!employmentType) newErrors.employmentType = "Please select what describes you best";
    if (needsIncomeRange && !salaryRange) newErrors.salaryRange = "Please select your income range";
    if (newErrors.employmentType || newErrors.salaryRange) {
      setErrors(newErrors);
      trackEvent(EventName.ADVISOR_PROFILE_FAILED, { source, reason: "validation_error" });
      return;
    }
    if (!userId) return;

    trackEvent(EventName.ADVISOR_PROFILE_SUBMITTED, {
      source,
      employmentType,
      hasSalaryRange: needsIncomeRange,
    });
    try {
      await updateProfileInfo({
        id: userId,
        body: {
          employmentType: employmentType as EmploymentTypeValue,
          salaryRange: needsIncomeRange ? (salaryRange as IncomeRangeValue) : undefined,
        },
      }).unwrap();
      // Refresh the JWT so hasAdvisorProfile / profileIncomplete pick this up.
      await update();
      trackEvent(EventName.ADVISOR_PROFILE_SUCCEEDED, { source });
      toast.success("Saved");
      onSaved?.();
    } catch {
      toast.error("Failed to save. Please try again.");
      trackEvent(EventName.ADVISOR_PROFILE_FAILED, { source, reason: "update_error" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-white/80">
          What describes you best?
        </legend>
        <OptionGroup
          name="employmentType"
          value={employmentType}
          options={EMPLOYMENT_TYPES}
          invalid={!!errors.employmentType}
          onChange={(v) => {
            setEmploymentType(v);
            setSalaryRange("");
            setErrors({});
          }}
        />
        {errors.employmentType && (
          <p className="text-destructive text-xs">{errors.employmentType}</p>
        )}
      </fieldset>

      {needsIncomeRange && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-white/80">{incomeLabel}</legend>
          <p className="mb-1 text-xs text-white/40">Approximate range is fine</p>
          <OptionGroup
            name="salaryRange"
            value={salaryRange}
            options={incomeRanges}
            invalid={!!errors.salaryRange}
            onChange={(v) => {
              setSalaryRange(v);
              setErrors((prev) => ({ ...prev, salaryRange: undefined }));
            }}
          />
          {errors.salaryRange && (
            <p className="text-destructive text-xs">{errors.salaryRange}</p>
          )}
        </fieldset>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="h-12 grow border-primary-orange"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="h-12 grow">
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
