"use client";

import { Button } from "@/components/ui/button";
import { useGetPartnersQuery } from "@/store/admin";
import { Edit, X } from "lucide-react";
import { useState } from "react";
import AddPartner from "./AddPartner";
import Typography from "@/components/Typography/Typography";
import { PartnerType } from "@/types/partner";

type Partner = {
  _id: string;
  name: string;
  slug: string;
  type: "affiliate_network" | "bank" | "direct";
  baseUrl?: string;
  active: boolean;
};

const AddedPartners = ({
  onEditPartner,
  onRemovePartner,
}: {
  onEditPartner: (partner: {   
      id: string;
    name: string;
    type: PartnerType;
    baseUrl?: string;
    active: boolean;}) => void;
  onRemovePartner: (partner: { id: string; name: string }) => void;
}) => {
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);

  const { data, isLoading } = useGetPartnersQuery();

  return (
    <div className="flex flex-col justify-start gap-4 p-10">
      {/* HEADER */}
      <div className="flex justify-between gap-2">
        <Typography variant="h4" className="text-left">
          Partners
        </Typography>

        <Button
          className="text-sm"
          onClick={() => setShowAddPartnerModal(true)}
        >
          Add new partner
        </Button>
      </div>

      {/* LOADING */}
      {isLoading && <p className="text-white">Loading...</p>}

      {/* LIST */}
      <div className="grid grid-cols-4 gap-3">
        {data?.map((partner: Partner) => (
          <div
            key={partner._id}
            className="w-xs max-w-sm bg-brown-sidebar p-3 border-2 border-brown-border rounded"
          >
            {/* NAME */}
            <div className="flex justify-between">
              <Typography
                variant="body"
                className="text-sm font-semibold opacity-100"
              >
                Name
              </Typography>
              <Typography
                variant="body"
                className="text-sm font-bold opacity-100"
              >
                {partner.name}
              </Typography>
            </div>

            {/* SLUG */}
            <div className="flex justify-between">
              <Typography
                variant="body"
                className="text-sm font-semibold opacity-100"
              >
                Slug
              </Typography>
              <Typography
                variant="body"
                className="text-sm font-bold opacity-100"
              >
                {partner.slug}
              </Typography>
            </div>

            {/* TYPE */}
            <div className="flex justify-between">
              <Typography
                variant="body"
                className="text-sm font-semibold opacity-100"
              >
                Type
              </Typography>
              <Typography
                variant="body"
                className="text-sm font-bold opacity-100"
              >
                {partner.type}
              </Typography>
            </div>

            {/* BASE URL */}
            <div className="flex justify-between">
              <Typography
                variant="body"
                className="text-sm font-semibold opacity-100"
              >
                Base url
              </Typography>
              <Typography
                variant="body"
                className="text-sm font-bold opacity-100"
              >
                {partner.baseUrl || "null"}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography
                variant="body"
                className="text-sm font-semibold opacity-100"
              >
                Status
              </Typography>
              <Typography
              variant="body"
              className={`text-xs font-medium opacity-100 ${
                partner.active ? "text-green-400" : "text-red-400"
              }`}
            >
              {partner.active ? "Active" : "Inactive"}
            </Typography>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 justify-end mt-2">
              <Button
                size="sm"
                onClick={() =>
                  onEditPartner({
                    id: partner._id,
                    name: partner.name,
                    type: partner.type,
                    baseUrl:partner.baseUrl,
                    active:partner.active
                  })
                }
              >
                <Edit size={16} />
              </Button>

              <Button
                size="sm"
                onClick={() =>
                  onRemovePartner({
                    id: partner._id,
                    name: partner.name,
                  })
                }
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {!isLoading && !data?.length && (
        <p className="text-gray-400">No partners found</p>
      )}

      {/* MODAL */}
      <AddPartner
        open={showAddPartnerModal}
        onChange={() => setShowAddPartnerModal(false)}
      />
    </div>
  );
};

export default AddedPartners;
