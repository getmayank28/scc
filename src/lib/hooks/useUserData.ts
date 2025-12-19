import { useSession } from "next-auth/react";
import { AUTH_STATE } from "../constants/auth";

const useUserData = () => {
  const session = useSession();
  const isUserAuthenticated = session?.status === AUTH_STATE.AUTHENTICATED;
  const name = session?.data?.user?.name || null;
  const email = session?.data?.user?.email || null;
  const userId = session?.data?.user?._id || null;

  return { isUserAuthenticated, name, email, userId };
};

export default useUserData;
