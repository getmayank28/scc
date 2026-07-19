"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPLOYMENT_TYPES,
  getIncomeLabel,
  getIncomeRangesForEmployment,
  type EmploymentTypeValue,
  type IncomeRangeValue,
} from "@/schemas/userInfoSchema";

// Radix Select items can't carry an empty-string value; use a sentinel for
// "no filter" and translate back to "" in state.
const NOT_SPECIFIED = "not_specified";

export interface ProfileFieldsState {
  employmentType: EmploymentTypeValue | "";
  salaryRange: IncomeRangeValue | "";
  onEmploymentChange: (v: EmploymentTypeValue | "") => void;
  onSalaryChange: (v: IncomeRangeValue | "") => void;
  // Spread into the recommend request body; empty when nothing selected so the
  // API skips the income filter.
  profileBody: {
    employmentType?: EmploymentTypeValue;
    salaryRange?: IncomeRangeValue;
  };
}

export function useProfileFields(): ProfileFieldsState {
  const [employmentType, setEmploymentType] = useState<
    EmploymentTypeValue | ""
  >("");
  const [salaryRange, setSalaryRange] = useState<IncomeRangeValue | "">("");

  return {
    employmentType,
    salaryRange,
    onEmploymentChange: (v) => {
      setEmploymentType(v);
      // Income brackets differ per employment type — a stale pick would be
      // invalid for the new type.
      setSalaryRange("");
    },
    onSalaryChange: setSalaryRange,
    profileBody: {
      ...(employmentType ? { employmentType } : {}),
      ...(salaryRange ? { salaryRange } : {}),
    },
  };
}

export function ProfileFields({
  employmentType,
  salaryRange,
  onEmploymentChange,
  onSalaryChange,
}: ProfileFieldsState) {
  const incomeRanges = employmentType
    ? getIncomeRangesForEmployment(employmentType)
    : [];

  return (
    <>
      <div className="space-y-2">
        <Label className="text-white font-semibold">Employment type</Label>
        <Select
          value={employmentType || NOT_SPECIFIED}
          onValueChange={(v) =>
            onEmploymentChange(
              v === NOT_SPECIFIED ? "" : (v as EmploymentTypeValue),
            )
          }
        >
          <SelectTrigger className="h-12 text-white">
            <SelectValue placeholder="Select employment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NOT_SPECIFIED}>
              Not specified (skip eligibility)
            </SelectItem>
            {EMPLOYMENT_TYPES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {incomeRanges.length > 0 && (
        <div className="space-y-2">
          <Label className="text-white font-semibold">
            {getIncomeLabel(employmentType as EmploymentTypeValue)}
          </Label>
          <Select
            value={salaryRange || undefined}
            onValueChange={(v) => onSalaryChange(v as IncomeRangeValue)}
          >
            <SelectTrigger className="h-12 text-white">
              <SelectValue placeholder="Select income range" />
            </SelectTrigger>
            <SelectContent>
              {incomeRanges.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
