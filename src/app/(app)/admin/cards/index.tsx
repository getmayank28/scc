"use client";

import ShowCards from "./showCards";
import { useState } from "react";
import EditCard from "./EditCard";
import RemoveCard from "./RemoveCard";


const AdminCardModule = () => {
  const [showEditModal, setShowEditModal] = useState<{name:string; id:string}|null>(null)
  const [showRemoveModal, setShowRemoveModal] = useState<{name:string; id:string}|null>(null)
  return (
    <div>
      <ShowCards onEditCard={(card)=> setShowEditModal(card)} onRemoveCard={(card)=> setShowRemoveModal(card)} />
      <EditCard card={showEditModal} open={!!showEditModal} onChange={() => setShowEditModal(null)}/>
      <RemoveCard card={showRemoveModal} open={!!showRemoveModal} onChange={() => setShowRemoveModal(null)}/>
    </div>
  );
};

export default AdminCardModule;
