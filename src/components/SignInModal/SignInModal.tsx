import SignInSection from "../SignInSection/SignInSection";
import { Modal } from "../ui/modal";

const SignInModal = ({open}:{open:boolean}) => {
  return (
    <Modal open={open}>
      <SignInSection />
    </Modal>
  );
};

export default SignInModal;
