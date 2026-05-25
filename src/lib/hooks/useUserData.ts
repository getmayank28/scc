import { useSession } from "next-auth/react";
import { AUTH_STATE } from "../constants/auth";
import { useGetUserByIdQuery } from "@/store/userApi";
import { useMemo } from "react";

const useUserData = () => {
  const session = useSession();
  const isUserAuthenticated = session?.status === AUTH_STATE.AUTHENTICATED;
  const userId = session?.data?.user?._id || null;

  const { data, isLoading: isUserDataLoading } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });

  const displayName = data?.name || session?.data?.user?.name || null;
  const name = data?.name || null;
  const email = data?.email || null;
  const firstName = useMemo(() => {
    const firstName = displayName?.split(" ")?.at(0);
    const formattedName = firstName
      ? firstName.slice(0, 1)?.toUpperCase() + firstName.slice(1)?.toLowerCase()
      : undefined;

    return formattedName;
  }, [displayName]);

  const nameInitials = useMemo(() => {
    let initials = "";
    displayName?.split(" ")?.forEach((word: string) => {
      initials = initials + word?.slice(0, 1)?.toUpperCase() || "";
    });
    return initials;
  }, [displayName]);

  return {
    isUserAuthenticated,
    name,
    email,
    userId,
    firstName,
    nameInitials,
    isUserDataLoading,
  };
};

export default useUserData;
