"use client"
import { useState } from "react";
import AddedPartners from "./AddedPartners";
import RemovePartner from "./RemovePartner";
import EditPartner from "./EditPartner";
import { PartnerType } from "@/types/partner";

const Partners = () => {
  const [showEditModal, setShowEditModal] = useState<{
    id: string;
    name: string;
    type: PartnerType;
    baseUrl?: string;
    active: boolean;
  } | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState<{
    id: string;
    name: string;
  } | null>(null);


  return (
    <div>
      <AddedPartners
      // @ts-expect-error some this
        onEditPartner={(partner: { id: string; name: string; }) => setShowEditModal(partner)}
        onRemovePartner={(partner: { id: string; name: string; }) => setShowRemoveModal(partner)}
      />
      <EditPartner partner={showEditModal} open={!!showEditModal} onChange={() => setShowEditModal(null)} />

      <RemovePartner partner={showRemoveModal} open={!!showRemoveModal} onChange={() => setShowRemoveModal(null)} />

    </div>
  );
};

export default Partners;
