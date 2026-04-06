"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import Typography from "@/components/Typography/Typography";
import AddPortal from "./AddPortal";
import { useGetPortalsQuery } from "@/store/admin";

type Portal = {
  _id: string;
  name: string;
  websiteUrl: string;
  portalType: string;
  affiliateLink?: string | null;
  status: "active" | "inactive";
  slug: string;
};

const AddedPortals = ({
  onRemovePortal,
}: {
  onRemovePortal: (portal: { id: string; name: string }) => void;
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading } = useGetPortalsQuery({});

  return (
    <div className="flex flex-col justify-start gap-4 p-10">
      {/* HEADER */}
      <div className="flex justify-between gap-2">
        <Typography variant="h4">Portals</Typography>

        <Button onClick={() => setShowAddModal(true)}>
          Add Portal
        </Button>
      </div>

      {/* LOADING */}
      {isLoading && <p className="text-white">Loading...</p>}

      {/* LIST */}
      <div className="flex gap-4 flex-wrap">
        {data?.map((portal: Portal) => (
          <div
            key={portal._id}
            className="w-xs max-w-sm bg-brown-sidebar p-3 border-2 border-brown-border rounded"
          >
            {/* NAME */}
            <div className="flex justify-between">
              <Typography variant="body" className="text-sm font-semibold">
                Name
              </Typography>
              <Typography variant="body" className="text-sm font-bold">
                {portal.name}
              </Typography>
            </div>

            {/* SLUG */}
            <div className="flex justify-between">
              <Typography variant="body" className="text-sm font-semibold">
                Slug
              </Typography>
              <Typography variant="body" className="text-sm font-bold">
                {portal.slug}
              </Typography>
            </div>

            {/* WEBSITE */}
            <div className="flex justify-between">
              <Typography variant="body" className="text-sm font-semibold">
                Website
              </Typography>
              <Typography variant="body" className="text-sm font-bold truncate max-w-[150px]">
                {portal.websiteUrl}
              </Typography>
            </div>

            {/* TYPE */}
            <div className="flex justify-between">
              <Typography variant="body" className="text-sm font-semibold">
                Type
              </Typography>
              <Typography variant="body" className="text-sm font-bold capitalize">
                {portal.portalType}
              </Typography>
            </div>

            {/* AFFILIATE LINK */}
            <div className="flex justify-between">
              <Typography variant="body" className="text-sm font-semibold">
                Affiliate
              </Typography>
              <Typography variant="body" className="text-sm font-bold truncate max-w-[150px]">
                {portal.affiliateLink || "N/A"}
              </Typography>
            </div>

            {/* STATUS */}
            <div className="flex justify-between">
              <Typography variant="body" className="text-sm font-semibold">
                Status
              </Typography>
              <Typography variant="body"
                className={`text-xs font-medium ${
                  portal.status === "active"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {portal.status}
              </Typography>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 justify-end mt-2">
              <Button
                size="sm"
                onClick={() =>
                  onRemovePortal({
                    id: portal._id,
                    name: portal.name,
                  })
                }
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY */}
      {!isLoading && !data?.length && (
        <p className="text-gray-400">No portals found</p>
      )}

      {/* MODAL */}
      <AddPortal
        open={showAddModal}
        onChange={() => setShowAddModal(false)}
      />
    </div>
  );
};

export default AddedPortals;