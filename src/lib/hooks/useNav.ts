import { useRouter } from "next/navigation";
import { ROUTES } from "../constants/routes";

const useNav = () => {
  const router = useRouter();

  const goToChat = () => router.push(`${ROUTES.CHAT}/new`);

  const goToSignIn = () => router.replace(ROUTES.SIGN_IN);

  const goToCardCategory = () => router.replace(ROUTES.CHOOSE_CARD);

  const navigateToProfile = () => router.replace(ROUTES.PROFILE);

  const goBack = () => router.back();

  const goToHome = () => router.push(ROUTES.LOGGED_IN_HOME);

  const goToSpendOptimizer = () => router.push(ROUTES.SPEND_OPTIMIZER);

  const goToProfile = () => router.push(ROUTES.PROFILE);

  return {
    goToChat,
    goBack,
    goToSignIn,
    goToCardCategory,
    navigateToProfile,
    goToHome,
    goToSpendOptimizer,
    goToProfile,
  };
};

export default useNav;
