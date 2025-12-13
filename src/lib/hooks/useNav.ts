import { useRouter } from "next/navigation";
import { ROUTES } from "../constants/routes";

const useNav = () => {
  const router = useRouter();

  const goToChat = () => router.push(ROUTES.CHAT);

  return { goToChat };
};

export default useNav;
