"use client";
import AddCards from "@/components/AddCard/AddCard";
import HeaderText from "@/components/HeaderText/HeaderText";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useUserData from "@/lib/hooks/useUserData";
import {
  emailVerificationSchema,
  usernameValidations,
} from "@/schemas/signUpSchema";
import {
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
} from "@/store/userApi";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

const UserDataSchema = z.object({
  email: emailVerificationSchema,
  name: usernameValidations,
});

const Profile = () => {
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [isEditing, setIsEditing] = useState(false);
  const { userId } = useUserData();

  const [errors, setErrors] = useState({
    name: "",
    email: "",
  });
  const { data } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  const [updateUserInfo, { isLoading }] = useUpdateUserByIdMutation();

  useEffect(() => {
    handleDataUpdate();
  }, [data?.name, data?.email]);

  const handleDataUpdate = () => {
    if(data && !data?.name){
      setIsEditing(true)
      setUserData({ name: '', email: data?.email });
      setErrors(prev => ({...prev, name:"What should we call you"}))
    }else{
      setUserData({ name: data?.name, email: data?.email });
    }
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

  return (
    <div className="flex flex-col p-20 h-screen">
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
        <div className="grid grid-cols-[3fr_3fr_1fr] gap-5 mt-2">
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
      <div className="mt-6">
        <Typography variant="body" className="text-left font-bold opacity-100">
          Cards
        </Typography>
        <AddCards/>
        </div>
    </div>
  );
};

export default Profile;
