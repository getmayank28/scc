import { useState } from "react";

const useSignInControl = () => {
  const [showModal, setShowModal] = useState(false);
  return { showModal, setShowModal };
};

export default useSignInControl;
