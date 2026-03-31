"use client";

import TabBar from "@/components/Tab/Tab";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { useGetAllAvailableCardsQuery, useGetAllLinksQuery } from "@/store/admin";
import { Edit, X } from "lucide-react";
import { useMemo, useState } from "react";
import AddCard from "../cards/AddCard";


const tabs = [
  {
    label: 'Card links',
    value: 'card-links',
  },
  {
    label: 'Bank links',
    value: 'bank-links',
  },
  {
    label: 'Fallback link',
    value: 'fallback-link',
  },
]

const AddedLinks = ({ onEditCard, onRemoveCard }: { onEditCard: (card: { id: string; name: string; }) => void; onRemoveCard: (card: { id: string; name: string; }) => void }) => {
  const [selectedValue, setSelectedValue] = useState("card-links")
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const { data } = useGetAllLinksQuery({type:'card'});


  const filterData = useMemo(() => {
    if (selectedValue === 'card-links') return data
    return data?.filter((card: { bankName: string }) => card?.bankName === selectedValue)
  }, [selectedValue, data])

  return (
    <div className="flex flex-col justify-start gap-4 p-10">
      <div className="flex justify-between gap-2">
        <Typography variant="h4" className="text-left">Added Cards</Typography>
        <Button className="text-sm" onClick={() => setShowAddCardModal(true)}> Add new card</Button>
      </div>
      <TabBar value={selectedValue} tabs={tabs} onChange={(value) => setSelectedValue(value)} />
      <div className="grid grid-cols-5 gap-2 ">
        {filterData?.map((card: { _id: string; name: string; bankName: string; }) => (
          <div
            key={card?._id}
            className="flex flex-col justify-center bg-brown-sidebar w-full p-2 border-2 border-brown-border"
          >
            <Typography variant="caption" className="text-left text-sm opacity-100 font-semibold">
              {card?.name}
            </Typography>
            <Typography variant="caption" className="text-left">{card?.bankName}</Typography>
            <div className="flex gap-2 justify-end py-1">
              <Button onClick={() => onEditCard({ name: card?.name, id: card?._id })}> <Edit /></Button>
              <Button onClick={() => onRemoveCard({ name: card?.name, id: card?._id })}> <X /></Button>
            </div>
          </div>
        ))}
      </div>
      <AddCard open={showAddCardModal} onChange={() => setShowAddCardModal(false)} />
    </div>
  );
};

export default AddedLinks;
