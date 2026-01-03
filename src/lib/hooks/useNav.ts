import { useRouter } from "next/navigation";
import { ROUTES } from "../constants/routes";

const useNav = () => {
  const router = useRouter();

  const goToChat = () => router.push(ROUTES.CHAT);

  const goToSignIn = () => router.replace(ROUTES.SIGN_IN);

  const goToCardCategory = () => router.replace(ROUTES.CHOOSE_CARD);

  const navigateToProfile = () => router.replace(ROUTES.PROFILE);

  return { goToChat, goToSignIn, goToCardCategory, navigateToProfile };
};

export default useNav;
