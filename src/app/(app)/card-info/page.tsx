"use client";
import HeaderText from "@/components/HeaderText/HeaderText";
import SearchSelect from "@/components/SearchInput/SearchInput";
import { Button } from "@/components/ui/button";
import { joinTextMessagesByMid } from "@/lib/utils/content";
import { useChatCommunicationMutation } from "@/store/api";
import { BaseMessage } from "@/types/chatMessages";
import { useRef, useState } from "react";
import ContentRenderer from "./ContentRender";
import { MultiStepChatLoader } from "@/components/MultiStepChatLoader/MultiStepChatLoader";

const loadingStates = [
  {
    text: "Looking for card details",
  },
  {
    text: "Fetching card issuer data",
  },
  {
    text: "Retrieving rewards and benefits",
  },
  {
    text: "Loading fees and APR details",
  },
  {
    text: "Parsing eligibility requirements",
  },
  {
    text: "Normalizing card features",
  },
  {
    text: "Validating card information",
  },
  {
    text: "Finalizing card details",
  },
];

const CardInfo = () => {
  const [selected, setSelected] = useState<{
    _id: string;
    name: string;
    bankName: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [cardDetails, setCardDetails] = useState<BaseMessage | null>(null);
  const [cardName, setCardName] = useState("")

  const [communicateToBot, { isLoading }] = useChatCommunicationMutation();

  const handleSubmit = async () => {
    setCardDetails(null);
    const data = await communicateToBot(
      `tell me everything about ${selected?.name}`
    );
    const content = joinTextMessagesByMid(data?.data?.messages);
    setCardDetails(content?.at(0) as BaseMessage);
    setCardName(selected?.name as string)
  };

  return (
    <div className="flex flex-col p-20 h-screen">
      <HeaderText
        containerClassName="items-start"
        title="Card explore"
        content="Get any card deatils in a blink"
        contentVariant="caption"
        titleVariant="h3"
        titleClassName="font-bold"
      />
      <div className="flex gap-2 mt-4 mb-2">
        <SearchSelect
          searchInputRef={searchInputRef}
          query={query}
          setQuery={setQuery}
          selected={selected}
          setSelected={setSelected}
          onClearInput={() => {
            setQuery("");
            setSelected(null);
          }}
        />
        <Button
          disabled={!selected?.name}
          className="rounded-lg h-12 px-8"
          onClick={handleSubmit}
        >
         Search
        </Button>
      </div>
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center">
          <MultiStepChatLoader loadingStates={loadingStates} />
        </div>
      )}
      {cardDetails?.content && (
        <ContentRenderer
          name={cardName as string}
          content={cardDetails?.content}
        />
      )}
    </div>
  );
};

export default CardInfo;
