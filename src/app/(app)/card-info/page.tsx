"use client";
import HeaderText from "@/components/HeaderText/HeaderText";
import SearchSelect from "@/components/SearchInput/SearchInput";
import { Button } from "@/components/ui/button";
import { LoaderOne } from "@/components/ui/loader";
import { useChatCommunicationMutation } from "@/store/api";
import { useRef, useState } from "react";

const CardInfo = () => {
  const [selected, setSelected] = useState<{
    _id: string;
    name: string;
    bankName: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [communicateToBot, { isLoading }] = useChatCommunicationMutation();

  const handleSubmit = async () => {
    communicateToBot(`tell me everything about ${selected?.name}`);
  };

  return (
    <div className="flex flex-col p-20 h-screen">
      <HeaderText
        containerClassName="items-start"
        title="Know your card"
        titleVariant="h3"
        titleClassName="font-bold"
      />
      <div className="flex gap-2 mt-4">
        <SearchSelect
          searchInputRef={searchInputRef}
          query={query}
          setQuery={setQuery}
          selected={selected}
          setSelected={setSelected}
        />
        <Button
          disabled={!selected?.name}
          className="rounded-lg h-12 px-8"
          onClick={handleSubmit}
        >
          Add Card
        </Button>
      </div>
      {isLoading && <LoaderOne />}
    </div>
  );
};

export default CardInfo;
