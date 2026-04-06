"use client"
import { useState } from "react";
import AddedPortals from "./AddedPortals";
import RemovePortal from "./RemoveGiftor";

const Portals = () => {
  const [showRemoveModal, setShowRemoveModal] = useState<{
    id: string;
    name: string;
  } | null>(null);


  return (
    <div>
      <AddedPortals
        onRemovePortal={(portal: { id: string; name: string; }) => setShowRemoveModal(portal)}
      />

      <RemovePortal portal={showRemoveModal} open={!!showRemoveModal} onChange={() => setShowRemoveModal(null)} />

    </div>
  );
};

export default Portals;
