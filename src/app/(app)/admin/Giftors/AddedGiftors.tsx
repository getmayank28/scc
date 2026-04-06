"use client";

import { Button } from "@/components/ui/button";
import { useGetGiftorsQuery } from "@/store/admin"; // ✅ updated
import { X } from "lucide-react";
import { useState } from "react";
import Typography from "@/components/Typography/Typography";
import AddGiftor from "./AddGiftor";

type Giftor = {
  _id: string;
  name: string;
  url: string;
  slug:string;
  bankId: {
    _id: string;
    name: string;
  };
};

const AddedGiftors = ({
  onRemoveGiftor,
}: {
  onRemoveGiftor: (giftor: { id: string; name: string }) => void;
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading } = useGetGiftorsQuery({});

  return (
    <div className="flex flex-col justify-start gap-4 p-10">
      {/* HEADER */}
      <div className="flex justify-between gap-2">
        <Typography variant="h4">Giftors</Typography>

        <Button onClick={() => setShowAddModal(true)}>
          Add Giftor
        </Button>
      </div>

      {/* LOADING */}
      {isLoading && <p className="text-white">Loading...</p>}

      {/* LIST */}
      <div className="flex gap-4 flex-wrap">
        {data?.map((giftor: Giftor) => (
          <div
            key={giftor._id}
            className="w-xs max-w-sm bg-brown-sidebar p-3 border-2 border-brown-border rounded"
          >
            {/* NAME */}
            <div className="flex justify-between">
              <Typography variant="body" className="text-sm font-semibold">
                Name
              </Typography>
              <Typography  variant="body" className="text-sm font-bold">
                {giftor.name}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="body" className="text-sm font-semibold">
                Slug
              </Typography>
              <Typography  variant="body" className="text-sm font-bold">
                {giftor.slug}
              </Typography>
            </div>

            {/* BANK */}
            <div className="flex justify-between">
              <Typography  variant="body" className="text-sm font-semibold">
                Bank
              </Typography>
              <Typography  variant="body" className="text-sm font-bold">
                {giftor.bankId?.name || "N/A"}
              </Typography>
            </div>

            {/* URL */}
            <div className="flex justify-between">
              <Typography  variant="body" className="text-sm font-semibold">
                URL
              </Typography>
              <Typography  variant="body" className="text-sm font-bold">
                {giftor.url}
              </Typography>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 justify-end mt-2">
              {/* <Button
                size="sm"
                onClick={() =>
                  onEditGiftor({
                    id: giftor._id,
                    name: giftor.name,
                    url: giftor.url,
                    bankId: giftor.bankId?._id,
                  })
                }
              >
                <Edit size={16} />
              </Button> */}

              <Button
                size="sm"
                onClick={() =>
                  onRemoveGiftor({
                    id: giftor._id,
                    name: giftor.name,
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
        <p className="text-gray-400">No giftors found</p>
      )}

      {/* MODAL */}
      <AddGiftor
        open={showAddModal}
        onChange={() => setShowAddModal(false)}
      />
    </div>
  );
};

export default AddedGiftors;