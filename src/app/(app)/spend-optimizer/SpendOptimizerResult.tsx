"use client";
import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import {
  CircleQuestionMark,
  CreditCard,
  Pencil,
  Star,
  TicketPlus,
  TrendingUp,
  X,
} from "lucide-react";
import { FormData } from "./data";
import { MultiStepChatLoader } from "@/components/MultiStepChatLoader/MultiStepChatLoader";
import { SpendOptimizerResponseCard } from "@/types/optimizer";
import { CreditCard as CreditCardProps } from "@/types/card";
import Image from "next/image";
import { bankIcon } from "@/lib/data/banks";
import { DataTable } from "@/components/ui/table/data-table";
import { formatCurrency } from "@/lib/utils/number";
import {
  useLazyGetGiftorsByCardSlugQuery,
} from "@/store/admin";
import { PortalProps } from "@/models/Portal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";

// Bank travel portal URLs keyed by bankName
const bankTravelPortals: Record<string, { url: string; name: string }> = {
  "HDFC Bank": { url: "https://offers.reward360.in/v2/compare-fly", name: "SmartBuy" },
  "Axis Bank": { url: "https://traveledge.axis.bank.in/", name: "Travel Edge" },
  "ICICI Bank": { url: "https://www.ishoprewards.com/compare-fly", name: "iShop" },
  "American Express": { url: "https://www.americanexpress.com/en-us/travel/flights", name: "Amex Travel" },
  "HSBC Bank": { url: "https://www.hsbc.co.in/security/", name: "HSBC Travel Offers" },
};

const loadingStates = [
  {
    text: "Learning your spending",
  },
  {
    text: "Categorizing your expenses",
  },
  {
    text: "Scanning your cards",
  },
  {
    text: "Analyzing rewards, and benefits",
  },
  {
    text: "Calculating cards rewards",
  },
  {
    text: "Optimizing for maximum benefits",
  },
  {
    text: "Running cards comparisons",
  },
  {
    text: "Finding the best match",
  },
];

export const spendOptimizerColumns = ({
  amount,
  directSwipeLink,
  handleGetVoucherLink,
  handleDirectSwipeClick,
  isGiftorLoading,
}: {
  amount: string;
  directSwipeLink: string | undefined;
  handleGetVoucherLink: (cardSlug: string) => void;
  handleDirectSwipeClick: (card: SpendOptimizerResponseCard) => void;
  isGiftorLoading: boolean;
}) => [
  {
    key: "cardName",
    title: "Card",
    width: "35%",
    render: (cardName: string, record: { isBestCard: boolean }) => {
      return (
        <div className="flex items-center gap-3">
          <span className={`text-sm text-white font-semibold capitalize`}>
            {cardName}
          </span>
          {record?.isBestCard && (
            <div className="border border-primary-orange p-1 bg-primary-orange rounded-full flex justify-center items-center">
              <Star className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: "directSwipeSavingsInInr",
    title: "Direct Swipe",
    width: "25%",
    render: (value: number) => {
      return (
        <div className="flex flex-col justify-center items-center">
          <span className="text-sm text-white max-md:text-[10px] font-semibold">
            {formatCurrency(String(value))}
          </span>
          <span className="text-[10px] text-white/80 max-md:text-[10px] font-semibold">
            {((value / +amount) * 100)?.toFixed(2)}%
          </span>
        </div>
      );
    },
  },
  {
    key: "voucherSavingsInInr",
    title: "Voucher Route",
    width: "25%",
    render: (value: number) => {
      return (
        <div className="flex flex-col justify-center items-center">
          <span className="text-sm text-white max-md:text-[10px] font-semibold">
            {formatCurrency(String(value))}
          </span>
          <span className="text-[10px] text-white/80 max-md:text-[10px] font-semibold">
            {((value / +amount) * 100)?.toFixed(2)}%
          </span>
        </div>
      );
    },
  },
  {
    key: "action",
    title: "Action",
    width: "15%",
    // @ts-expect-error ignore this
    render: (_,record: SpendOptimizerResponseCard) => (
      <div className="flex gap-1">
        <Button disabled={isGiftorLoading} onClick={() => handleGetVoucherLink(record?.cardId)} className="rounded-[4px]">
          <TicketPlus />
        </Button>
        <Button disabled={!directSwipeLink} onClick={() => handleDirectSwipeClick(record)} className="rounded-[4px] bg-secondary-orange border border-primary-orange">
          <CreditCard />
        </Button>
      </div>
    ),
  },
];

const voucherPhases = [
  {
    title: "PHASE 1 · Purchasing Your Voucher",
    steps: [
      { title: "Visit your bank's reward portal", desc: "Click the link provided or log in directly at your bank's rewards / SmartBuy / Gyftr portal." },
      { title: "Log in", desc: "Sign in using your credit card number, registered mobile, or net banking credentials." },
      { title: "Search for the voucher", desc: "Browse by category (Fashion, Travel, Food, etc.) or search the brand name directly." },
      { title: "Check redemption mode & validity", desc: "Confirm whether the voucher is Online, Offline (store), or Both — and note the expiry period." },
      { title: "Read terms & conditions", desc: "Review the brand's T&C — minimum purchase value, excluded categories, or store restrictions." },
      { title: "Place the order", desc: "Select denomination, confirm with OTP, and pay via card or reward points. You will receive a voucher code by SMS & email within minutes." },
    ],
  },
  {
    title: "PHASE 2A · Online Redemption",
    steps: [
      { title: "Visit the brand's website or app", desc: "Log in or register on the brand's official website or mobile app." },
      { title: "Add items to cart", desc: "Select your desired products and proceed to checkout." },
      { title: "Apply voucher code", desc: "On the payment page, enter the voucher code (and PIN, if applicable) in the Gift Card / Promo Code field." },
      { title: "Pay balance & confirm", desc: "Voucher value is deducted instantly. Pay any remaining amount by card, UPI, or wallet." },
    ],
  },
  {
    title: "PHASE 2B · Offline (Store) Redemption",
    steps: [
      { title: "Locate a participating outlet", desc: "Use the Store / Outlet Locator on the brand's website to find the nearest store that accepts this voucher." },
      { title: "Shop & select products", desc: "Pick your desired products at the store." },
      { title: "Present voucher at billing", desc: "Show the voucher code (SMS or email) to the cashier at the time of billing." },
      { title: "Pay balance amount", desc: "Voucher value is applied. Pay any remaining balance by cash, card, or UPI." },
    ],
  },
];

const disclaimerPoints = [
  "This document is prepared for informational and research purposes only. The data presented is sourced from publicly available bank portals and brand websites and is subject to change without notice.",
  "Discounts, reward rates, redemption modes, denominations, and validity periods are indicative and may vary based on the bank, card variant, and the brand's current terms. Always verify the latest details on your bank's official reward portal before purchase.",
  "Reward points or cashback earned on gift voucher purchases are subject to the respective bank's credit card terms and conditions. No accelerated or bonus reward rates apply on voucher purchases unless explicitly stated by the issuing bank.",
  "Gift vouchers once purchased are non-refundable, non-transferable (unless otherwise stated by the brand), and cannot be exchanged for cash. Expired vouchers will not be revalidated.",
  "The issuing bank and the research team are not responsible for any loss arising from the use, misuse, or expiry of gift vouchers. In case of any dispute regarding a voucher, the brand's terms & conditions shall prevail.",
  "Savings calculations (savings per ₹1,000) are indicative estimates only and do not account for individual spend patterns, applicable taxes, or convenience fees charged by specific brands.",
  "This document does not constitute financial advice. Please consult your bank or a qualified financial advisor before making significant financial decisions.",
];

const VoucherInstructionModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      allowOutsideClickClose
      className="m-4 p-0 h-fit max-h-[85vh] max-md:max-h-[90vh] max-md:overflow-y-hidden max-md:!rounded-[0px] max-md:border-3 max-md:w-full max-md:min-w-full border-2 border-brown-border bg-brown-background w-[700px] min-w-[700px] max-w-[90vw] max-md:min-w-0"
    >
      <div className="p-5 max-md:p-4 overflow-y-auto max-h-[85vh]  max-md:max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <Typography
            variant="h4"
            className="text-left opacity-100 font-bold max-md:text-[16px]"
          >
            How to Purchase & Redeem Gift Vouchers
          </Typography>
          
        </div>

        {voucherPhases.map((phase, phaseIdx) => (
          <div key={phaseIdx} className="mb-6">
            <Typography
              variant="caption"
              className="text-xs font-bold tracking-wider mb-3 text-primary-orange uppercase text-left opacity-100"
            >
              {phase.title}
            </Typography>
            <div className="flex flex-col gap-3">
              {phase.steps.map((step, stepIdx) => (
                <div key={stepIdx} className="flex gap-3 items-start">
                  <div
                    className="rounded-sm py-2 w-8 h-8 min-w-8 px-2 flex justify-center items-center border border-[#6F4D34]"
                    style={{
                      background:
                        "linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      className="text-[12px] font-black text-left opacity-100"
                    >
                      {stepIdx + 1}
                    </Typography>
                  </div>
                  <div className="flex flex-col">
                    <Typography
                      variant="caption"
                      className="text-sm font-semibold text-left opacity-100"
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      className="text-xs text-left opacity-70"
                    >
                      {step.desc}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mb-4 mt-6">
          <Typography
            variant="caption"
            className="text-xs font-bold tracking-wider mb-3 text-primary-orange uppercase text-left opacity-100"
          >
            Disclaimer
          </Typography>
          <div className="flex flex-col gap-2">
            {disclaimerPoints.map((point, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-primary-orange mt-1 text-xs">•</span>
                <Typography
                  variant="caption"
                  className="text-xs text-left opacity-70"
                >
                  {point}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const PortalSavingsModal = ({
  isOpen,
  onClose,
  merchantName,
  merchantLink,
  portalLink,
  onContinueMerchant,
  onOpenBankPortal,
}: {
  isOpen: boolean;
  onClose: () => void;
  merchantName: string;
  merchantLink: string;
  portalLink: string;
  onContinueMerchant?: () => void;
  onOpenBankPortal?: () => void;
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      allowOutsideClickClose
      className="m-4 p-0 h-fit max-md:!rounded-[0px] max-md:border-3 max-md:w-full max-md:min-w-full border-2 border-brown-border bg-brown-background w-[500px] min-w-[500px] max-w-[90vw] max-md:min-w-0"
    >
      <div className="p-6 max-md:p-4">
        <div className="flex justify-between items-center mb-4">
          <Typography
            variant="h4"
            className="text-left opacity-100 font-bold max-md:text-[16px]"
          >
            Better Savings Available
          </Typography>
          {/* <Button onClick={onClose} className="rounded-[4px] p-1">
            <X size={16} />
          </Button> */}
        </div>
        <Typography
          variant="body"
          className="text-left opacity-80 mb-6 max-md:text-sm"
        >
          You can get more benefits through your bank portal than on{" "}
          <span className="font-semibold opacity-100 text-primary-orange capitalize">
            {merchantName}
          </span>
          . Consider using the portal link for better savings.
        </Typography>
        <div className="flex gap-3 max-md:flex-col">
          <Button
            onClick={() => {
              onContinueMerchant?.();
              window.open(merchantLink, "_blank");
              onClose();
            }}
            className="flex-1 h-11 rounded-md text-sm border border-primary-orange bg-secondary-orange"
          >
            Continue to Merchant
          </Button>
          <Button
            onClick={() => {
              onOpenBankPortal?.();
              window.open(
                portalLink.startsWith("http") ? portalLink : `https://${portalLink}`,
                "_blank"
              );
              onClose();
            }}
            className="flex-1 h-11 rounded-md text-sm"
          >
            Open Bank Portal
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const SpendOptimizerResult = ({
  data,
  open,
  onChange,
  formData,
  isLoading,
  winnerCard,
  selectedCards,
  selectedPortal,
}: {
  data: {
    startMessage: string;
    cards: SpendOptimizerResponseCard[];
    endMessage: string;
  } | null;
  open: boolean;
  onChange: () => void;
  formData: FormData;
  isLoading?: boolean;
  winnerCard?: SpendOptimizerResponseCard | null;
  selectedCards: CreditCardProps[];
  selectedPortal: PortalProps | null;
}) => {
  const { track } = useAnalytics();
  const [showInstructions, setShowInstructions] = useState(false);
  const [portalModalData, setPortalModalData] = useState<{
    merchantLink: string;
    portalLink: string;
  } | null>(null);
  const [giftorsById, { isFetching: isGiftorLoading }] =
    useLazyGetGiftorsByCardSlugQuery();

  // Track result viewed when data loads
  useEffect(() => {
    if (data?.cards?.length && !isLoading) {
      const best = data.cards.find((c) => c.isBestCard);
      track(EventName.SPEND_OPTIMIZER_RESULT_VIEWED, {
        category: formData.category,
        amount: Number(formData.amount),
        merchant: formData.merchant,
        transactionMode: formData.transactionMode,
        bestCardName: best?.cardName ?? null,
        bestCardSavings: best
          ? Math.max(best.voucherSavingsInInr ?? 0, best.directSwipeSavingsInInr ?? 0)
          : null,
        totalCardsCompared: data.cards.length,
      });
    }
  }, [data?.cards, isLoading]);

  const handleGetVoucherLink = async (cardSlug: string) => {
    const card = data?.cards?.find((c) => c.cardId === cardSlug);
    if (card) {
      track(EventName.SPEND_OPTIMIZER_BUY_VOUCHER_CLICKED, {
        cardId: card.cardId,
        cardName: card.cardName,
        isBestCard: card.isBestCard,
        savingsAmount: card.voucherSavingsInInr,
        category: formData.category,
        amount: Number(formData.amount),
        merchant: formData.merchant,
      });
    }
    const res = await giftorsById(cardSlug).unwrap();
    window.open(res?.[0]?.url, "_blank");
  };
  const directSwipeLink = useMemo(
    () => selectedPortal?.affiliateLink ?? selectedPortal?.websiteUrl,
    [selectedPortal?.affiliateLink, selectedPortal?.websiteUrl],
  );

  const sortedCards = useMemo(() => {
    if (!data?.cards) return [];
    return [...data.cards].sort((a, b) => {
      const maxA = Math.max(a.voucherSavingsInInr ?? 0, a.directSwipeSavingsInInr ?? 0);
      const maxB = Math.max(b.voucherSavingsInInr ?? 0, b.directSwipeSavingsInInr ?? 0);
      return maxB - maxA;
    });
  }, [data?.cards]);

  const getBankTravelPortal = useCallback(
    (cardSlug: string) => {
      const matched = selectedCards?.find((c) => c.cardId?.slug === cardSlug);
      const bankName = matched?.cardId?.bankName;
      return bankName ? bankTravelPortals[bankName] : undefined;
    },
    [selectedCards]
  );

  const handleDirectSwipeClick = useCallback(
    (card?: SpendOptimizerResponseCard) => {
      const targetCard = card || winnerCard;
      if (targetCard) {
        track(EventName.SPEND_OPTIMIZER_DIRECT_SWIPE_CLICKED, {
          cardId: targetCard.cardId,
          cardName: targetCard.cardName,
          isBestCard: targetCard.isBestCard,
          savingsAmount: targetCard.directSwipeSavingsInInr,
          category: formData.category,
          amount: Number(formData.amount),
          merchant: formData.merchant,
        });
      }
      const travelPortal = targetCard ? getBankTravelPortal(targetCard.cardId) : undefined;
      if (
        targetCard?.isDirectSwipePortalSavings &&
        travelPortal &&
        directSwipeLink
      ) {
        track(EventName.SPEND_OPTIMIZER_PORTAL_MODAL_SHOWN, {
          merchant: formData.merchant,
          action: "continue_merchant",
        });
        setPortalModalData({
          merchantLink: directSwipeLink,
          portalLink: travelPortal.url,
        });
      } else if (directSwipeLink) {
        window.open(directSwipeLink, "_blank");
      }
    },
    [winnerCard, directSwipeLink, track, formData, getBankTravelPortal]
  );

  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      removeCloseButton
      allowOutsideClickClose={false}
      className="m-10 p-0 h-fit min-h-[70vh] max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:py-4 max-md:w-full max-md:min-w-full border-2 border-brown-border  bg-brown-background w-[900px] min-w-[950px] max-w-[80vw]"
    >
      <div className="flex h-[70vh]  max-md:h-[98vh]">
        <div className="bg-brown-sidebar flex-1 h-full p-4 max-md:hidden">
          <div className="flex  justify-between items-center">
            <Typography variant="caption" className="opacity-100 font-bold">
              Input Summary
            </Typography>
            <Button disabled={isLoading} onClick={() => {
              track(EventName.SPEND_OPTIMIZER_EDIT_INPUT_CLICKED, {});
              onChange();
            }}>
              <Pencil />
            </Button>
          </div>
          <div className="mt-4">
            <Typography
              variant="caption"
              className="text-xs font-bold tracking-wider mb-2 text-primary-orange uppercase text-left opacity-100"
            >
              transaction details
            </Typography>
            <div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <div
                    className="rounded-sm py-2 w-8 h-8 px-2 flex justify-center items-center border border-[#6F4D34]"
                    style={{
                      background:
                        "linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      className="text-[12px] font-black text-left opacity-100"
                    >
                      1
                    </Typography>
                  </div>
                  <Typography
                    variant="caption"
                    className="text-sm capitalize font-medium text-left opacity-100"
                  >
                    {formData?.category}
                  </Typography>
                </div>
                <div className="flex gap-2 items-center">
                  <div
                    className="rounded-sm py-2 w-8 h-8 px-2 flex justify-center items-center border border-[#6F4D34]"
                    style={{
                      background:
                        "linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      className="text-[12px] font-black text-left opacity-100"
                    >
                      2
                    </Typography>
                  </div>
                  <Typography
                    variant="caption"
                    className="text-sm capitalize font-medium text-left opacity-100"
                  >
                    {formatCurrency(formData?.amount)}
                  </Typography>
                </div>
                <div className="flex gap-2 items-center">
                  <div
                    className="rounded-sm py-2 w-8 h-8 px-2 flex justify-center items-center border border-[#6F4D34]"
                    style={{
                      background:
                        "linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      className="text-[12px] font-black text-left opacity-100"
                    >
                      3
                    </Typography>
                  </div>
                  <Typography
                    variant="caption"
                    className="text-sm capitalize font-medium text-left opacity-100"
                  >
                    {formData?.merchant}
                  </Typography>
                </div>
                <div className="flex gap-2 items-center">
                  <div
                    className="rounded-sm py-2 w-8 h-8 px-2 flex justify-center items-center border border-[#6F4D34]"
                    style={{
                      background:
                        "linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      className="text-[12px] font-black text-left opacity-100"
                    >
                      4
                    </Typography>
                  </div>
                  <Typography
                    variant="caption"
                    className="text-sm capitalize font-medium text-left opacity-100"
                  >
                    {formData?.transactionMode} transaction
                  </Typography>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Typography
              variant="caption"
              className="text-primary-orange text-xs tracking-wider mb-2 font-bold uppercase text-left opacity-100"
            >
              selected Cards
            </Typography>
            <div className="flex flex-col gap-2 max-h-[280px] overflow-y-scroll">
              {selectedCards?.map((card) => (
                <div
                  key={card?.cardId?._id}
                  className="flex gap-2 items-center"
                >
                  <div
                    className="rounded-sm py-2 px-2 border border-[#AD744A]"
                    style={{
                      background:
                        "linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)",
                    }}
                  >
                    <Image
                      width={12}
                      height={12}
                      src={`/icons/banks/${bankIcon?.[card?.cardId?.bankName] ?? bankIcon?.default}`}
                      alt="bank-logo"
                    />
                  </div>
                  <Typography
                    variant="caption"
                    className="text-sm text-left opacity-100 capitalize"
                  >
                    {card?.cardId?.name?.slice(0, 20)}
                    {card?.cardId?.name?.length > 20 ? "..." : ""}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
          
        </div>
        <div className="flex-1/2 p-4 overflow-y-scroll">
          {isLoading ? (
            <div className="h-full flex justify-center items-center">
              <MultiStepChatLoader loadingStates={loadingStates} />
            </div>
          ) : (
            <>
              <div
                className=" border-[#AD744A] p-4 rounded-md"
                style={{
                  background:
                    "linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)",
                }}
              >
                <div className="flex justify-between">
                  <div className="flex gap-2 items-center">
                    <Typography
                      variant="body"
                      className="max-md:hidden text-[16px] opacity-100 font-semibold text-white"
                    >
                      {winnerCard?.cardName}
                    </Typography>
                    <div className="border border-primary-orange bg-secondary-orange rounded-full w-[90px] py-1 px-2 flex justify-center items-center">
                      <Typography
                        variant="caption"
                        className="text-[10px] max-md:text-[9px] text-left opacity-100 uppercase font-black"
                      >
                        best choice
                      </Typography>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                  <Button onClick={() => {
                    track(EventName.SPEND_OPTIMIZER_VOUCHER_INSTRUCTIONS_VIEWED, {});
                    setShowInstructions(true);
                  }} className="rounded-[4px] p-1">
                    <CircleQuestionMark size={16}/>
                    </Button>
                    <Button onClick={() => {
                      track(EventName.SPEND_OPTIMIZER_RESULT_CLOSED, {});
                      onChange();
                    }} className="rounded-[4px] p-1">
                      <X />
                    </Button>
                  </div>
                </div>
                <div>
                  <Typography
                      variant="body"
                      className="hidden max-md:flex max-md:text-[14px] max-md:text-left my-2 opacity-100 font-semibold text-white"
                    >
                      {winnerCard?.cardName}
                    </Typography>
                  </div>
                <div className="flex gap-4">
                  <div className="flex-1 rounded-md pt-2">
                    <Typography
                      variant="caption"
                      className="text-[12px] text-left  opacity-70 uppercase font-bold tracking-[1px]"
                    >
                      Voucher Path
                    </Typography>
                    <div className="mt-4">
                      <Typography
                        variant="h4"
                        className="text-left  opacity-80 uppercase font-bold tracking-[1px]"
                      >
                        {formatCurrency(String(winnerCard?.voucherSavingsInInr))}
                      </Typography>
                      <div className="flex gap-2 items-center">
                        <TrendingUp className="w-4 text-secondary-success" />
                        <Typography
                          variant="caption"
                          className="text-[12px] text-left  opacity-100 text-secondary-success  font-bold tracking-[1px]"
                        >
                          {(
                            ((winnerCard?.voucherSavingsInInr ?? 0) /
                              Number(formData?.amount ?? 0)) *
                            100
                          )?.toFixed(2)}
                          % return
                        </Typography>
                      </div>
                      <Button
                        disabled={isGiftorLoading}
                        className="rounded-md mt-2 text-sm"
                        onClick={() => handleGetVoucherLink(winnerCard?.cardId??'')}
                      >
                        Buy Voucher
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 rounded-md pt-2">
                    <Typography
                      variant="caption"
                      className="text-[12px] text-left  opacity-70 uppercase font-bold tracking-[1px]"
                    >
                      direct swipe
                    </Typography>
                    <div className="mt-4">
                      <Typography
                        variant="h4"
                        className="text-left  opacity-80 uppercase font-bold tracking-[1px]"
                      >
                        {formatCurrency(
                          String(winnerCard?.directSwipeSavingsInInr),
                        )}
                      </Typography>
                      <div className="flex gap-2 items-center">
                        <TrendingUp className="w-4 text-secondary-success" />
                        <Typography
                          variant="caption"
                          className="text-[12px] text-left  opacity-100 text-secondary-success  font-bold tracking-[1px]"
                        >
                          {(
                            ((winnerCard?.directSwipeSavingsInInr ?? 0) /
                              Number(formData?.amount ?? 0)) *
                            100
                          )?.toFixed(2)}
                          % return
                        </Typography>
                      </div>
                      <Button
                        disabled={!directSwipeLink}
                        onClick={() => handleDirectSwipeClick()}
                        className="border border-primary-orange bg-secondary-orange rounded-md mt-2 text-sm"
                      >
                        Direct swipe
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Desktop Table */}
              <div className="max-md:hidden">
                <DataTable
                  data={sortedCards}
                  // @ts-expect-error ignore this
                  columns={spendOptimizerColumns({
                    amount: formData?.amount,
                    directSwipeLink,
                    handleGetVoucherLink,
                    handleDirectSwipeClick,
                    isGiftorLoading,
                  })}
                  loading={false}
                  emptyText="No alerts found"
                />
              </div>

              {/* Mobile Cards */}
              <div className="hidden max-md:flex flex-col gap-3 mt-4">
                {sortedCards?.length ? (
                  sortedCards.map((card) => (
                    <div
                      key={card.cardId}
                      className="rounded-lg border border-[#6F4D34] p-4"
                      style={{
                        background:"#30251E"
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Typography
                            variant="caption"
                            className="text-sm font-semibold text-white opacity-100 capitalize text-left"
                          >
                            {card.cardName}
                          </Typography>
                          {card.isBestCard && (
                            <div className="border border-primary-orange p-1 bg-primary-orange rounded-full flex justify-center items-center">
                              <Star className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 mb-3">
                       
                        <div className="flex-1">
                          <Typography
                            variant="caption"
                            className="text-[10px] text-left opacity-60 uppercase font-bold tracking-wider"
                          >
                            Voucher Route
                          </Typography>
                          <Typography
                            variant="caption"
                            className="text-sm font-semibold text-white text-left opacity-100"
                          >
                            {formatCurrency(String(card.voucherSavingsInInr))}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="text-[10px] text-left opacity-70"
                          >
                            {((card.voucherSavingsInInr / +formData?.amount) * 100)?.toFixed(2)}%
                          </Typography>
                        </div>
                        <div className="flex-1">
                          <Typography
                            variant="caption"
                            className="text-[10px] text-left opacity-60 uppercase font-bold tracking-wider"
                          >
                            Direct Swipe
                          </Typography>
                          <Typography
                            variant="caption"
                            className="text-sm font-semibold text-white text-left opacity-100"
                          >
                            {formatCurrency(String(card.directSwipeSavingsInInr))}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="text-[10px] text-left opacity-70"
                          >
                            {((card.directSwipeSavingsInInr / +formData?.amount) * 100)?.toFixed(2)}%
                          </Typography>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          disabled={isGiftorLoading}
                          onClick={() => handleGetVoucherLink(card.cardId)}
                          className="flex-1 h-9 rounded-md text-xs"
                        >
                          {/* <TicketPlus className="w-4 h-4 mr-1" /> */}
                          Buy Voucher
                        </Button>
                        <Button
                          disabled={!directSwipeLink}
                          onClick={() => handleDirectSwipeClick(card)}
                          className="flex-1 h-9 rounded-md text-xs bg-secondary-orange border border-primary-orange"
                        >
                          {/* <CreditCard className="w-4 h-4 mr-1" /> */}
                          Direct Swipe
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Typography
                    variant="caption"
                    className="text-center opacity-60 py-4"
                  >
                    No cards found
                  </Typography>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <VoucherInstructionModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      {portalModalData && (
        <PortalSavingsModal
          isOpen={!!portalModalData}
          onClose={() => setPortalModalData(null)}
          merchantName={formData?.merchant}
          merchantLink={portalModalData.merchantLink}
          portalLink={portalModalData.portalLink}
          onContinueMerchant={() =>
            track(EventName.SPEND_OPTIMIZER_PORTAL_CONTINUE_MERCHANT, {
              merchant: formData.merchant,
              action: "continue_merchant",
            })
          }
          onOpenBankPortal={() =>
            track(EventName.SPEND_OPTIMIZER_PORTAL_OPEN_BANK, {
              merchant: formData.merchant,
              action: "open_bank_portal",
            })
          }
        />
      )}
    </Modal>
  );
};

export default SpendOptimizerResult;
