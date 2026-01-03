import { useSignInControl } from "@/contexts/SignInContext";
import SignInSection from "../SignInSection/SignInSection";
import { Modal } from "../ui/modal";
import useNav from "@/lib/hooks/useNav";

const SignInModal = () => {
  const { showModal, closeSignUpModal } = useSignInControl();
  const { goToCardCategory } = useNav();

  const handleSkipSingIn = () => {
    goToCardCategory();
    closeSignUpModal()
  };

  return (
    <Modal open={showModal} className="bg-transparent border-none">
      <SignInSection showSkip onSkip={handleSkipSingIn} />
    </Modal>
  );
};

export default SignInModal;
