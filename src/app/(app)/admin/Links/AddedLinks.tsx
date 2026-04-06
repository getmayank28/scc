"use client";

import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import {
  useGetAllLinksQuery,
} from "@/store/admin";
import { X } from "lucide-react";
import { useState } from "react";
import AddLink from "./AddLink";

type EntityRef = {
  _id: string;
  name: string;
};

type LinkItem = {
  _id: string;
  cardId?: EntityRef;
  bankId?: EntityRef;
  partnerId?: EntityRef;
  url: string;
  type: string;
  priority: number;
  active: boolean;
  name?: string; // link title
  title?: string; // fallback if used
};

const AddedLinks = ({
  onRemoveCard,
}: {
  onRemoveCard: (card: { id: string; name: string }) => void;
}) => {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const { data } = useGetAllLinksQuery({ type: "card" }) as {
    data?: LinkItem[];
  };

  return (
    <div className="flex flex-col justify-start gap-4 p-10">
      <div className="flex justify-between gap-2">
        <Typography variant="h4" className="text-left">
          Links
        </Typography>
        <Button className="text-sm" onClick={() => setShowAddCardModal(true)}>
          Add new link
        </Button>
      </div>
      <div className="flex gap-4 flex-wrap">
        {!data?.length &&(
           <Typography
           variant="caption"
           className="text-left text-sm font-semibold"
         >
          No link found
         </Typography>
        )}
        {data?.map((item: LinkItem) => {
          const source: EntityRef | undefined = item.cardId ?? item.bankId;

          if (!source) return null; // safety guard


          return (
            <div
              key={item._id}
              className="flex min-w-[280px] max-w-[280px] flex-col justify-center bg-brown-sidebar w-full p-2 border-2 border-brown-border"
            >
              <div>
                {/* Card / Bank Name */}
                <Typography
                  variant="caption"
                  className="text-left text-sm font-semibold"
                >
                  {source.name}
                </Typography>


                {/* Partner */}
                {item.partnerId && (
                  <Typography variant="caption" className="text-left break-all text-sm opacity-100">
                    Partner: {item.partnerId.name}
                  </Typography>
                )}
              </div>

              {/* URL */}
              <Typography
                variant="caption"
                className="text-left break-all text-sm opacity-100"
              >
                Link: {item.url}
              </Typography>

              {/* Meta */}
              <Typography variant="caption" className="text-left break-all text-sm opacity-100">
                Type: {item.type}
              </Typography>

              <Typography variant="caption" className="text-left break-all text-sm opacity-100">
                 Priority: {item.priority}
              </Typography>

              {/* Actions */}
              <div className="flex gap-2 justify-end py-1">
                {/* <Button
                  onClick={() =>
                    onEditCard({
                      name: source.name,
                      id: item._id,
                    })
                  }
                >
                  <Edit />
                </Button> */}

                <Button
                  onClick={() =>
                    onRemoveCard({
                      name: source.name,
                      id: item._id,
                    })
                  }
                >
                  <X />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <AddLink
        open={showAddCardModal}
        onChange={() => setShowAddCardModal(false)}
      />
    </div>
  );
};

export default AddedLinks;
