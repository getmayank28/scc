"use client";
import HeaderText from "@/components/HeaderText/HeaderText";
import SearchSelect from "@/components/SearchInput/SearchInput";
import { Button } from "@/components/ui/button";
import { joinTextMessagesByMid } from "@/lib/utils/content";
import { useChatCommunicationMutation } from "@/store/api";
import { BaseMessage, MESSAGE_TYPE } from "@/types/chatMessages";
import { useRef, useState } from "react";
import ContentRenderer from "./ContentRender";
import { MultiStepChatLoader } from "@/components/MultiStepChatLoader/MultiStepChatLoader";
import useSocket from "@/lib/hooks/useSocket";
import NoCardData from "./NoDataAnim";

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
  const [cardName, setCardName] = useState("");
  const { createChatSessionToken } = useSocket();

  const [communicateToBot, { isLoading }] = useChatCommunicationMutation();

  const handleSubmit = async () => {
    setCardDetails(null);
    const token = await createChatSessionToken();
    const data = await communicateToBot({
      message: `tell me everything about ${selected?.name}`,
      token: token,
    });
    const content = joinTextMessagesByMid(data?.data?.messages);
    // @ts-expect-error this is ok
    const selectedMessage = content?.find((msg) => msg?.type === MESSAGE_TYPE.TEXT)
    setCardDetails(selectedMessage as BaseMessage);
    setCardName(selected?.name as string);
  };

  return (
    <div className="flex h-full bg-brown-background flex-col max-md:px-4 max-md:pt-20 p-20 max-md:pb-0 min-h-screen">
      <HeaderText
        containerClassName="items-start"
        title="Start your search"
        content="Get credit card rewards, perks, fees in seconds"
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
          disabled={!selected?.name || isLoading}
          className="rounded-lg h-12 px-8 bg-primary-orange/70 max-md:px-4"
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
      {!cardDetails?.content && !isLoading && <NoCardData />}
    </div>
  );
};

export default CardInfo;
