"use client";
import AddCards from "@/components/AddCard/AddCard";
import AdvisorProfileForm from "@/components/AdvisorProfileForm/AdvisorProfileForm";
import HeaderText from "@/components/HeaderText/HeaderText";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useUserData from "@/lib/hooks/useUserData";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import { missingProfileFields } from "@/lib/user/profileStatus";
import {
  emailSchema,
  nameSchema,
  EMPLOYMENT_TYPES,
  getIncomeRangesForEmployment,
  getIncomeLabel,
  EmploymentTypeValue,
} from "@/schemas/userInfoSchema";
import {
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
} from "@/store/userApi";
import {
  Briefcase,
  Check,
  CircleCheck,
  CircleDashed,
  IdCard,
  Landmark,
  Loader2,
  Mail,
  Phone,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { cn } from "@/lib/utils/index";
import AffiliateActivity from "./AffiliateActivity";

const personalSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

type PersonalField = keyof typeof personalSchema.shape;

// Empty is allowed (the field is optional); anything typed must be valid.
function validatePersonal(field: PersonalField, value: string): string | undefined {
  if (!value.trim()) return undefined;
  const result = personalSchema.shape[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0].message;
}

type Status = { done: number; total: number };

function StatusBadge({ done, total }: Status) {
  const complete = done === total;
  return (
    <span
      title={complete ? "Complete" : `${done} of ${total} done`}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap max-md:px-1.5",
        complete
          ? "bg-secondary-success/15 text-secondary-success"
          : "bg-primary-orange/15 text-primary-orange"
      )}
    >
      {complete ? (
        <CircleCheck className="size-3.5" />
      ) : (
        <CircleDashed className="size-3.5" />
      )}
      <span className="max-md:hidden">
        {complete ? "Complete" : `In Progress (${done} of ${total})`}
      </span>
      {!complete && <span className="md:hidden">{`${done}/${total}`}</span>}
    </span>
  );
}

function SectionCard({
  icon,
  title,
  status,
  onEdit,
  editing,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  status: Status;
  onEdit: () => void;
  editing: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.03] p-4 max-md:p-3">
      <div className="flex items-center gap-3 flex-wrap max-md:flex-nowrap max-md:gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-primary-orange max-md:hidden">
          {icon}
        </div>
        <h2 className="text-base font-medium text-white mr-auto max-md:truncate max-md:pl-1 max-md:text-[15px]">{title}</h2>
        <div className="flex shrink-0 items-center gap-3">
          <StatusBadge {...status} />
          {!editing && (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-semibold text-white/80 hover:text-white cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3 max-md:mt-3 max-md:gap-2">{children}</div>
    </section>
  );
}

function Tile({
  label,
  adornment,
  highlight,
  children,
}: {
  label: string;
  adornment?: React.ReactNode;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/[0.04] px-4 py-3",
        highlight && "border-t-2 border-primary-orange/70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">
          {label}
        </p>
        {adornment}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  adornment,
  highlight,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  adornment?: React.ReactNode;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 max-md:px-3.5",
        highlight && "border-l-2 border-primary-orange/70"
      )}
    >
      <span className="shrink-0 text-white/50">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
      {adornment}
    </div>
  );
}

const Profile = () => {
  const { userId } = useUserData();
  const { update } = useSession();
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingEmployment, setIsEditingEmployment] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const { data } = useGetUserByIdQuery(userId, { skip: !userId });
  const [updateUser, { isLoading: isSavingPersonal }] = useUpdateUserByIdMutation();

  const missing = data ? missingProfileFields(data) : [];

  useEffect(() => {
    if (data) trackEvent(EventName.PROFILE_COMPLETION_VIEWED, { missing });
    // Once per load, not on every edit.
  }, [!!data]);

  if (!data) {
    return <div className="min-h-screen bg-brown-background" />;
  }

  const employmentType = data.employmentType as EmploymentTypeValue | undefined;
  const isStudent = employmentType === "student_unemployed";
  const employmentLabel = EMPLOYMENT_TYPES.find((t) => t.value === employmentType)?.label;
  const incomeLabel = employmentType
    ? getIncomeRangesForEmployment(employmentType).find((r) => r.value === data.salaryRange)?.label
    : undefined;
  const hasIncome = isStudent || !!incomeLabel;

  const personalStatus = {
    done: 1 + (data.name ? 1 : 0) + (data.email ? 1 : 0),
    total: 3,
  };
  const employmentStatus = {
    done: (employmentType ? 1 : 0) + (employmentType && hasIncome ? 1 : 0),
    total: 2,
  };

  const startPersonalEdit = () => {
    setDraft({ name: data.name ?? "", email: data.email ?? "" });
    setErrors({});
    setIsEditingPersonal(true);
  };

  const savePersonal = async () => {
    // Only validate and send what the user actually filled in.
    const body: { name?: string; email?: string } = {};
    const newErrors: typeof errors = {};
    for (const field of ["name", "email"] as const) {
      const value = draft[field].trim();
      if (!value || value === (data[field] ?? "")) continue;
      const error = validatePersonal(field, value);
      if (error) newErrors[field] = error;
      else body[field] = personalSchema.shape[field].parse(value);
    }
    if (newErrors.name || newErrors.email) {
      setErrors(newErrors);
      return;
    }
    if (!body.name && !body.email) {
      setIsEditingPersonal(false);
      return;
    }
    try {
      await updateUser({ id: userId, body }).unwrap();
      // Refresh the JWT so the avatar's "incomplete" dot updates.
      await update();
      for (const field of Object.keys(body) as ("name" | "email")[]) {
        trackEvent(EventName.PROFILE_COMPLETION_SAVED, { field });
      }
      toast.success("Details saved");
      setIsEditingPersonal(false);
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Failed to save");
    }
  };

  const hasInvalidDraft =
    !!validatePersonal("name", draft.name) || !!validatePersonal("email", draft.email);

  const personalField = (
    field: PersonalField,
    placeholder: string,
    type = "text"
  ) => (
    <>
      <Input
        type={type}
        value={draft[field]}
        placeholder={placeholder}
        aria-invalid={!!errors[field]}
        onChange={(e) => {
          const value = e.target.value;
          setDraft((prev) => ({ ...prev, [field]: value }));
          setErrors((prev) => ({ ...prev, [field]: validatePersonal(field, value) }));
        }}
        onKeyDown={(e) => e.key === "Enter" && !hasInvalidDraft && savePersonal()}
        className={cn(
          "h-9 text-sm text-white border-white/15 bg-black/20",
          errors[field] && "border-destructive"
        )}
      />
      {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field]}</p>}
    </>
  );

  const missingPrompt = (text: string) => (
    <button
      type="button"
      onClick={startPersonalEdit}
      className="text-sm font-medium text-primary-orange hover:underline cursor-pointer"
    >
      {text}
    </button>
  );

  return (
    <div className="flex flex-col p-20 max-md:px-4 max-md:pt-20 max-md:pb-28 min-h-screen bg-brown-background">
      <HeaderText
        containerClassName="items-start"
        title="Profile"
        titleVariant="h3"
        titleClassName="font-bold"
      />

      <div className="mt-6 grid grid-cols-[2fr_3fr] max-lg:grid-cols-1 gap-4">
        <SectionCard
          icon={<IdCard className="size-4" />}
          title="Personal Details"
          status={personalStatus}
          onEdit={startPersonalEdit}
          editing={isEditingPersonal}
        >
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl bg-white/[0.04]">
            <DetailRow
              icon={<User className="size-4" />}
              label="Full name"
              highlight={!data.name}
            >
              {isEditingPersonal
                ? personalField("name", "What should we call you?")
                : data.name
                  ? <p className="truncate text-sm font-medium text-white">{data.name}</p>
                  : missingPrompt("+ Add your name")}
            </DetailRow>

            <DetailRow
              icon={<Mail className="size-4" />}
              label="Email"
              highlight={!data.email}
            >
              {isEditingPersonal
                ? personalField("email", "you@example.com", "email")
                : data.email
                  ? <p className="text-sm font-medium text-white break-all">{data.email}</p>
                  : missingPrompt("+ Add your email")}
            </DetailRow>

            <DetailRow
              icon={<Phone className="size-4" />}
              label="Phone number"
              adornment={
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                  OTP Bound
                </span>
              }
            >
              <p className="text-sm font-medium text-white">
                +91 {data.phoneNumber?.replace(/(\d{5})(\d{5})/, "$1 $2")}
              </p>
            </DetailRow>
          </div>

          {isEditingPersonal ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-9 grow border-white/20"
                onClick={() => setIsEditingPersonal(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-9 grow"
                disabled={isSavingPersonal || hasInvalidDraft}
                onClick={savePersonal}
              >
                {isSavingPersonal && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          icon={<Landmark className="size-4" />}
          title="Employment & Income"
          status={employmentStatus}
          onEdit={() => setIsEditingEmployment(true)}
          editing={isEditingEmployment}
        >
          {isEditingEmployment ? (
            <div className="rounded-xl bg-white/[0.04] p-4">
              <AdvisorProfileForm
                source="profile_page"
                initialEmploymentType={data.employmentType}
                initialSalaryRange={data.salaryRange}
                onSaved={() => setIsEditingEmployment(false)}
                onCancel={() => setIsEditingEmployment(false)}
              />
            </div>
          ) : (
            <>
            {/* Phones: two slim rows, like Personal Details. */}
            <div className="hidden divide-y divide-white/5 overflow-hidden rounded-xl bg-white/[0.04] max-md:block">
              <DetailRow
                icon={<Briefcase className="size-4" />}
                label="Employment type"
                highlight={!employmentType}
                adornment={
                  <button
                    type="button"
                    onClick={() => setIsEditingEmployment(true)}
                    className="shrink-0 text-xs font-semibold text-primary-orange cursor-pointer"
                  >
                    {employmentType ? "Change" : "Set"}
                  </button>
                }
              >
                <p className="truncate text-sm font-medium text-white">{employmentLabel ?? "Not set yet"}</p>
              </DetailRow>
              <DetailRow
                icon={<Wallet className="size-4" />}
                label={isStudent ? "Income range" : "Monthly income"}
                highlight={!hasIncome}
                adornment={
                  !isStudent && (
                    <button
                      type="button"
                      onClick={() => setIsEditingEmployment(true)}
                      className="shrink-0 text-xs font-semibold text-primary-orange cursor-pointer"
                    >
                      {incomeLabel ? "Update" : "Set"}
                    </button>
                  )
                }
              >
                <p className="truncate text-sm font-medium text-white">
                  {isStudent ? "Not needed for students" : incomeLabel ?? "Not set yet"}
                </p>
              </DetailRow>
            </div>

            <div className="grid grid-cols-2 max-md:hidden gap-3">
              <Tile
                label="Employment type"
                highlight={!employmentType}
                adornment={
                  employmentType ? (
                    <Check className="size-4 text-white/70" />
                  ) : (
                    <span className="text-base font-bold leading-none text-primary-orange">!</span>
                  )
                }
              >
                <p className="text-base font-medium text-white">
                  {employmentLabel ?? "Not set yet"}
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditingEmployment(true)}
                  className="mt-2 text-xs font-semibold text-primary-orange hover:underline cursor-pointer"
                >
                  {employmentType ? "Change employment type →" : "Set employment type →"}
                </button>
              </Tile>

              <Tile
                label="Income range"
                highlight={!hasIncome}
                adornment={
                  hasIncome ? (
                    <Check className="size-4 text-white/70" />
                  ) : (
                    <span className="text-base font-bold leading-none text-primary-orange">!</span>
                  )
                }
              >
                {isStudent ? (
                  <>
                    <p className="text-base font-medium text-white">Not needed</p>
                    <p className="mt-1 text-xs text-white/60">Students don&apos;t need an income range.</p>
                  </>
                ) : incomeLabel ? (
                  <>
                    <p className="text-base font-semibold text-primary-orange">{incomeLabel}</p>
                    <p className="mt-1 text-xs text-white/60">{getIncomeLabel(employmentType!)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-medium text-white/80">Not set yet</p>
                    <p className="mt-1 text-xs text-white/60">
                      Add it so we only suggest cards you can get.
                    </p>
                  </>
                )}
                {!isStudent && (
                  <button
                    type="button"
                    onClick={() => setIsEditingEmployment(true)}
                    className="mt-2 text-xs font-semibold text-primary-orange hover:underline cursor-pointer"
                  >
                    {incomeLabel ? "Update income range →" : "Set income range →"}
                  </button>
                )}
              </Tile>
            </div>
            </>
          )}

          <p className="hidden px-1 text-[11px] leading-relaxed text-white/45 max-md:block">
            Your income range keeps the AI Advisor from suggesting cards you&apos;re unlikely to get.
          </p>
          <div className="mt-auto flex gap-3 rounded-xl bg-white/[0.03] px-4 py-3 max-md:hidden">
            <TrendingUp className="size-4 shrink-0 text-primary-orange" />
            <p className="text-xs leading-relaxed text-white/80">
              <span className="font-semibold text-white">Why this matters: </span>
              Premium cards have minimum income requirements. Setting your range keeps
              the AI Advisor from recommending cards you&apos;re unlikely to be approved for.
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <AffiliateActivity />
      </div>

      <div className="mt-8">
        <Typography variant="body" className="text-left font-bold opacity-100">
          Cards
        </Typography>
        <AddCards />
      </div>
    </div>
  );
};

export default Profile;
