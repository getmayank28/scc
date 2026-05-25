"use client";
import HeaderText from "@/components/HeaderText/HeaderText";
import SearchSelect from "@/components/SearchInput/SearchInput";
import { Button } from "@/components/ui/button";
import { joinTextMessagesByMid } from "@/lib/utils/content";
import { useChatCommunicationMutation, useLazyGetRedirectUrlQuery } from "@/store/api";
import { BaseMessage, MESSAGE_TYPE } from "@/types/chatMessages";
import { useEffect, useRef, useState } from "react";
import ContentRenderer from "./ContentRender";
import { MultiStepChatLoader } from "@/components/MultiStepChatLoader/MultiStepChatLoader";
import useSocket from "@/lib/hooks/useSocket";
import NoCardData from "./NoDataAnim";
import Typography from "@/components/Typography/Typography";
import useNav from "@/lib/hooks/useNav";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import ApplyButton from "./ApplyButton";
import { normalizeString } from "@/lib/utils";

const loadingStates = [
  { text: "Looking for card details" },
  { text: "Fetching card issuer data" },
  { text: "Retrieving rewards and benefits" },
  { text: "Loading fees and APR details" },
  { text: "Parsing eligibility requirements" },
  { text: "Normalizing card features" },
  { text: "Validating card information" },
  { text: "Finalizing card details" },
];

type SelectedCard = { _id: string; name: string; bankName: string; slug?: string } | null;

const ApplyCard = () => {
  const { track } = useAnalytics();
  const [selected, setSelected] = useState<SelectedCard>(null);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [cardDetails, setCardDetails] = useState<BaseMessage | null>(null);
  const [activeCard, setActiveCard] = useState<SelectedCard>(null);
  const [applyLink, setApplyLink] = useState<string | null>(null);
  const { createChatSessionToken } = useSocket();
  const [showAdvisorPopUp, setShowAdvisorPopUp] = useState(false);
  const { goToChat } = useNav();

  const [communicateToBot, { isLoading }] = useChatCommunicationMutation();
  const [getRedirectUrl] = useLazyGetRedirectUrlQuery();
  const hasShownRef = useRef(false);

  useEffect(() => {
    track(EventName.CARD_INFO_VIEWED, {});
  }, [track]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (cardDetails?.content && !isLoading && !hasShownRef.current) {
      timer = setTimeout(() => {
        track(EventName.CARD_INFO_ADVISOR_POPUP_SHOWN, {});
        setShowAdvisorPopUp(true);
        hasShownRef.current = true;
      }, 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cardDetails?.content, isLoading]);

  const handleSubmit = async () => {
    if (!selected?.name) return;
    track(EventName.CARD_INFO_SEARCH_SUBMITTED, {
      cardName: selected.name,
      bankName: selected.bankName,
    });

    setCardDetails(null);
    setApplyLink(null);
    setActiveCard(selected);

    // Kick off apply link fetch in parallel — don't await
    if (selected.slug) {
      getRedirectUrl({ cardId: selected.slug })
        .unwrap()
        .then((res) => setApplyLink(res?.data ?? null))
        .catch(() => setApplyLink(null));
    }

    // AI text fetch (awaited so we can render content + track result)
    const token = await createChatSessionToken();
    const data = await communicateToBot({
      message: `tell me everything about ${selected.name}`,
      token,
    });
    const content = joinTextMessagesByMid(data?.data?.messages);
    // @ts-expect-error mixed shape returned by bot
    const selectedMessage = content?.find((msg) => msg?.type === MESSAGE_TYPE.TEXT);
    setCardDetails(selectedMessage as BaseMessage);
    if (selectedMessage?.content) {
      track(EventName.CARD_INFO_RESULT_VIEWED, {
        cardName: selected.name,
        bankName: selected.bankName,
      });
    }
  };

  const showEmpty = !activeCard && !isLoading;

  return (
    <div className="flex h-full bg-brown-background flex-col max-md:px-4 max-md:pt-20 p-20 max-md:pb-0 min-h-screen">
      <HeaderText
        containerClassName="items-start"
        title="Apply for a card"
        content="Search any card to see its rewards, fees & perks — then apply in one click"
        contentVariant="caption"
        titleVariant="h3"
        titleClassName="font-bold max-md:text-left"
        contentClassName="max-md:text-left"
      />

      {showAdvisorPopUp && (
        <div className="shadow-xl flex flex-col gap-4 absolute top-5 max-md:w-[300px] max-md:p-3 max-md:gap-3 right-5 z-100 border-2 bg-brown-sidebar border-secondary-orange p-5 rounded-md w-sm max-w-md">
          <Typography variant="caption" className="text-left text-sm opacity-100 font-semibold">
            Not sure which card to apply for? Get a personalised match from Advisor.
          </Typography>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-lg max-md:text-sm h-10 px-8 max-md:px-4 border-primary-orange"
              onClick={() => {
                track(EventName.CARD_INFO_ADVISOR_DISMISSED, {});
                setShowAdvisorPopUp(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-lg max-md:text-sm h-10 px-8 bg-primary-orange/70 max-md:px-4"
              onClick={() => {
                track(EventName.CARD_INFO_ADVISOR_FIND_OUT_CLICKED, {});
                goToChat();
              }}
            >
              Find out
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4 mb-2">
        <SearchSelect
          searchInputRef={searchInputRef}
          query={query}
          setQuery={setQuery}
          selected={selected}
          setSelected={(card) => {
            if (card) {
              track(EventName.CARD_INFO_CARD_SELECTED, {
                cardName: card.name,
                bankName: card.bankName,
              });
            }
            setSelected(card);
          }}
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

      {activeCard && cardDetails?.content && !isLoading && (
        <div className="max-md:hidden mt-8 mb-2 sticky top-20 max-md:top-18 z-30 bg-brown-background/95 backdrop-blur-sm border border-secondary-orange/40 rounded-xl p-4 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch max-md:gap-3">
          <div className="flex flex-col min-w-0">
            <Typography variant="caption" className="text-left opacity-60 uppercase tracking-[2px]">
              {activeCard.bankName}
            </Typography>
            <Typography
              variant="body"
              className="text-left font-bold opacity-100 truncate max-md:text-base"
            >
              {normalizeString(activeCard.name)}
            </Typography>
          </div>
          {applyLink && cardDetails?.content && !isLoading && (
            <ApplyButton
              applyLink={applyLink}
              cardName={activeCard.name}
              className="max-md:hidden"
            />
          )}
        </div>
      )}

      {isLoading && (
        <div className="w-full grow flex items-center justify-center">
          <MultiStepChatLoader loadingStates={loadingStates} />
        </div>
      )}

      {!isLoading && cardDetails?.content && (
        <ContentRenderer content={cardDetails.content} />
      )}

      {activeCard && applyLink && cardDetails?.content && !isLoading && (
        <>
          <div className="hidden max-md:block h-40" aria-hidden />
          <div className="hidden max-md:flex fixed bottom-22 left-0 right-0 z-40 bg-brown-sidebar/95 backdrop-blur-sm border-t border-secondary-orange/40 p-3 px-4 items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <Typography variant="p" className="text-left opacity-60 text-[10px] uppercase tracking-[1px]">
                {activeCard.bankName}
              </Typography>
              <Typography variant="p" className="text-left font-bold opacity-100 text-[13px] truncate">
                {normalizeString(activeCard.name)}
              </Typography>
            </div>
            <ApplyButton applyLink={applyLink} cardName={activeCard.name} size="sm" />
          </div>
        </>
      )}

      {showEmpty && <NoCardData />}
    </div>
  );
};

export default ApplyCard;
