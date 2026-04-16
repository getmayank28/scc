"use client";
import AddCards from "@/components/AddCard/AddCard";
import HeaderText from "@/components/HeaderText/HeaderText";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useUserData from "@/lib/hooks/useUserData";
import {
  emailVerificationSchema,
  usernameValidations,
} from "@/schemas/signUpSchema";
import {
  EMPLOYMENT_TYPES,
  getIncomeRangesForEmployment,
  getIncomeLabel,
  EmploymentTypeValue,
  IncomeRangeValue,
} from "@/schemas/userInfoSchema";
import {
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
} from "@/store/userApi";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";
import { cn } from "@/lib/utils/index";

const UserDataSchema = z.object({
  email: emailVerificationSchema,
  name: usernameValidations,
});

const Profile = () => {
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [employmentType, setEmploymentType] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingEmployment, setIsEditingEmployment] = useState(false);
  const { userId } = useUserData();

  const [errors, setErrors] = useState({
    name: "",
    email: "",
  });
  const [employmentErrors, setEmploymentErrors] = useState({
    employmentType: "",
    salaryRange: "",
  });

  const { data } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  const [updateUserInfo, { isLoading }] = useUpdateUserByIdMutation();
  const [updateEmploymentInfo, { isLoading: isEmploymentLoading }] = useUpdateUserByIdMutation();

  const incomeRanges = employmentType
    ? getIncomeRangesForEmployment(employmentType as EmploymentTypeValue)
    : [];
  const incomeLabel = employmentType
    ? getIncomeLabel(employmentType as EmploymentTypeValue)
    : "";
  const needsIncomeRange = employmentType && employmentType !== "student_unemployed";

  useEffect(() => {
    handleDataUpdate();
  }, [data?.name, data?.email, data?.employmentType, data?.salaryRange]);

  const handleDataUpdate = () => {
    if (data && !data?.name) {
      setIsEditing(true);
      setUserData({ name: "", email: data?.email });
      setErrors((prev) => ({ ...prev, name: "What should we call you" }));
    } else {
      setUserData({ name: data?.name, email: data?.email });
    }
    setEmploymentType(data?.employmentType || "");
    setSalaryRange(data?.salaryRange || "");
  };

  const handleUserSave = async () => {
    const queryParams = { id: userId, body: userData };
    const result = UserDataSchema.safeParse(userData);

    if (!result.success) {
      const emailErrors = result.error.format().email?._errors || [];
      const email = emailErrors.join(" ");

      const nameErrors = result.error.format().name?._errors || [];
      const name = nameErrors.join(" ");

      setErrors({ name, email });
      return;
    }
    try {
      await updateUserInfo(queryParams).unwrap();
      toast.success("Info successfully updated");
    } catch {
      toast.error("Failed to update info");
    } finally {
      setIsEditing(false);
    }
  };

  const handleEmploymentSave = async () => {
    const newErrors = { employmentType: "", salaryRange: "" };
    if (!employmentType) {
      newErrors.employmentType = "Please select your employment type";
    }
    if (needsIncomeRange && !salaryRange) {
      newErrors.salaryRange = "Please select your income range";
    }
    if (newErrors.employmentType || newErrors.salaryRange) {
      setEmploymentErrors(newErrors);
      return;
    }

    try {
      await updateEmploymentInfo({
        id: userId,
        body: {
          employmentType,
          salaryRange: needsIncomeRange ? salaryRange : undefined,
        },
      }).unwrap();
      toast.success("Employment info updated");
    } catch {
      toast.error("Failed to update employment info");
    } finally {
      setIsEditingEmployment(false);
    }
  };

  const employmentLabel = EMPLOYMENT_TYPES.find((t) => t.value === employmentType)?.label;
  const incomeRangeLabel = incomeRanges.find(
    (r) => r.value === salaryRange
  )?.label;

  return (
    <div className="flex flex-col p-20 max-md:p-4 h-screen bg-brown-background max-md:h-fit">
      <HeaderText
        containerClassName="items-start"
        title="Profile"
        titleVariant="h3"
        titleClassName="font-bold"
      />
      <div className="mt-6">
        <Typography variant="body" className="text-left font-bold opacity-100">
          Basic info
        </Typography>
        <div className="grid grid-cols-[3fr_3fr_1fr] max-md:grid-cols-1 max-md:gap-3 gap-5 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-[14px] text-white/80 font-semibold"
            >
              Name
            </Label>
            <Input
              disabled={!isEditing}
              id="name"
              type="text"
              placeholder="Enter your name"
              value={userData?.name}
              onChange={(e) => {
                setUserData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }));
              }}
              className={`h-12 text-white font-semibold
                    ${
                      errors.name
                        ? "border-destructive"
                        : "border-primary-orange"
                    }
                  `}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[14px]  text-white/80 font-semibold"
            >
              Email
            </Label>
            <Input
              disabled={true}
              id="email"
              type="text"
              placeholder="Enter your email"
              value={userData?.email}
              onChange={(e) => {
                setUserData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }));
              }}
              className={`h-12  font-semibold text-white border-secondary-orange
                    ${
                      errors.email
                        ? "border-destructive"
                        : "border-primary-orange"
                    }
                  `}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div className={`${errors?.name || errors?.email?'self-center':'self-end'} w-full`}>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  className="h-12 grow border-primary-orange"
                  variant="outline"
                  onClick={() => {
                    handleDataUpdate?.();
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isLoading}
                  className="h-12 grow border-primary-orange"
                  onClick={handleUserSave}
                >
                  {isLoading && (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  )}
                  Save
                </Button>
              </div>
            ) : (
              <Button
                className="self-end h-12 w-full"
                onClick={() => {
                  setIsEditing(true);
                }}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Employment & Income Section */}
      <div className="mt-6">
        <Typography variant="body" className="text-left font-bold opacity-100">
          Employment & Income
        </Typography>
        <div className="grid grid-cols-[3fr_3fr_1fr] max-md:grid-cols-1 max-md:gap-3 gap-5 mt-2">
          <div className="space-y-2">
            <Label className="text-[14px] text-white/80 font-semibold">
              Employment Type
            </Label>
            {isEditingEmployment ? (
              <Select
                value={employmentType}
                onValueChange={(v) => {
                  setEmploymentType(v);
                  setSalaryRange("");
                  setEmploymentErrors((prev) => ({ ...prev, employmentType: "", salaryRange: "" }));
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-full bg-brown-background text-white border-brown-border h-12!",
                    "data-[placeholder]:text-white/30",
                    employmentErrors.employmentType && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select your employment type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                disabled
                value={employmentLabel || "Not set"}
                className="h-12 text-white font-semibold border-primary-orange"
              />
            )}
            {employmentErrors.employmentType && (
              <p className="text-xs text-destructive">{employmentErrors.employmentType}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-[14px] text-white/80 font-semibold">
              {incomeLabel || "Income Range"}
            </Label>
            {isEditingEmployment && needsIncomeRange ? (
              <>
                <Select
                  value={salaryRange}
                  onValueChange={(v) => {
                    setSalaryRange(v as IncomeRangeValue);
                    setEmploymentErrors((prev) => ({ ...prev, salaryRange: "" }));
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full bg-brown-background text-white border-brown-border h-12!",
                      "data-[placeholder]:text-white/30",
                      employmentErrors.salaryRange && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select your income range" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {employmentErrors.salaryRange && (
                  <p className="text-xs text-destructive">{employmentErrors.salaryRange}</p>
                )}
              </>
            ) : (
              <Input
                disabled
                value={
                  employmentType === "student_unemployed"
                    ? "N/A"
                    : incomeRangeLabel || "Not set"
                }
                className="h-12 text-white font-semibold border-primary-orange"
              />
            )}
          </div>
          <div className="self-end w-full">
            {isEditingEmployment ? (
              <div className="flex gap-2">
                <Button
                  className="h-12 grow border-primary-orange"
                  variant="outline"
                  onClick={() => {
                    setEmploymentType(data?.employmentType || "");
                    setSalaryRange(data?.salaryRange || "");
                    setEmploymentErrors({ employmentType: "", salaryRange: "" });
                    setIsEditingEmployment(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isEmploymentLoading}
                  className="h-12 grow border-primary-orange"
                  onClick={handleEmploymentSave}
                >
                  {isEmploymentLoading && (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  )}
                  Save
                </Button>
              </div>
            ) : (
              <Button
                className="self-end h-12 w-full"
                onClick={() => setIsEditingEmployment(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 max-md:mt-10">
        <Typography variant="body" className="text-left font-bold opacity-100">
          Cards
        </Typography>
        <AddCards/>
        </div>
    </div>
  );
};

export default Profile;
