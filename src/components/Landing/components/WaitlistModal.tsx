import { Modal } from "@/components/ui/modal";
import WaitlistForm from "./WaitlistForm";
import { useWaitlistControl } from "@/contexts/WaitlistContext";

const WaitlistModal = () => {
  const { showModal } = useWaitlistControl();
  return (
    <Modal open={showModal} className="bg-transparent border-none max-md:p-0">
      <WaitlistForm />
    </Modal>
  );
};

export default WaitlistModal;
