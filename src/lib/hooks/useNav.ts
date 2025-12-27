import { useRouter } from "next/navigation";
import { ROUTES } from "../constants/routes";

const useNav = () => {
  const router = useRouter();

  const goToChat = () => router.push(ROUTES.CHAT);

  const goToSignIn = () => router.replace(ROUTES.SIGN_IN);

  return { goToChat, goToSignIn };
};

export default useNav;
