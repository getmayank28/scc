import { useState } from "react";
import AddedLinks from "./AddedLinks";
import RemoveLink from "./RemoveLink";

const AdminLinks = () => {
    const [showRemoveModal, setShowRemoveModal] = useState<{name:string; id:string}|null>(null)
  return <div>
    
    <RemoveLink link={showRemoveModal} open={!!showRemoveModal} onChange={() => setShowRemoveModal(null)} />

    <AddedLinks onRemoveCard={(card)=> setShowRemoveModal(card)} />
  </div>;
};

export default AdminLinks;
