import { useState } from "react";
import AddedLinks from "./AddedLinks";

const AdminLinks = () => {
    const [showEditModal, setShowEditModal] = useState<{name:string; id:string}|null>(null)
    const [showRemoveModal, setShowRemoveModal] = useState<{name:string; id:string}|null>(null)
  return <div>
    <AddedLinks onEditCard={(card)=> setShowEditModal(card)} onRemoveCard={(card)=> setShowRemoveModal(card)} />
  </div>;
};

export default AdminLinks;
