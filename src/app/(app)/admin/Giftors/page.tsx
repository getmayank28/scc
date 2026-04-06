"use client"
import { useState } from "react";
import AddedGiftors from "./AddedGiftors";
import RemoveGiftor from "./RemoveGiftor";

const Giftors = () => {
  const [showRemoveModal, setShowRemoveModal] = useState<{
    id: string;
    name: string;
  } | null>(null);


  return (
    <div>
      <AddedGiftors
        onRemoveGiftor={(giftor: { id: string; name: string; }) => setShowRemoveModal(giftor)}
      />

      <RemoveGiftor giftor={showRemoveModal} open={!!showRemoveModal} onChange={() => setShowRemoveModal(null)} />

    </div>
  );
};

export default Giftors;
