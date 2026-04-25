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
import { useMemo, useState } from "react";

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
  isGiftorLoading,
}: {
  amount: string;
  directSwipeLink: string | undefined;
  handleGetVoucherLink: (cardSlug: string) => void;
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
    render: (_,record:{cardId:string}) => (
      <div className="flex gap-1">
        <Button disabled={isGiftorLoading} onClick={() => handleGetVoucherLink(record?.cardId)} className="rounded-[4px]">
          <TicketPlus />
        </Button>
        <Button disabled={!directSwipeLink} onClick={() => window.open(directSwipeLink!, "_black")} className="rounded-[4px] bg-secondary-orange border border-primary-orange">
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
      className="m-4 p-0 h-fit max-h-[85vh] max-md:max-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:w-full max-md:min-w-full border-2 border-brown-border bg-brown-background w-[700px] min-w-[700px] max-w-[90vw] max-md:min-w-0"
    >
      <div className="p-5 max-md:p-4 overflow-y-auto max-h-[85vh] max-md:max-h-[100vh]">
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
  const [showInstructions, setShowInstructions] = useState(false);
  const [giftorsById, { isFetching: isGiftorLoading }] =
    useLazyGetGiftorsByCardSlugQuery();

  const handleGetVoucherLink = async (cardSlug: string) => {
    const res = await giftorsById(cardSlug).unwrap();
    window.open(res?.[0]?.url, "_blank");
  };
  const directSwipeLink = useMemo(
    () => selectedPortal?.affiliateLink ?? selectedPortal?.websiteUrl,
    [selectedPortal?.affiliateLink, selectedPortal?.websiteUrl],
  );
  const handleGetDirectLinkClick = () => {
    window.open(directSwipeLink, "_blank");
  };

  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      removeCloseButton
      allowOutsideClickClose={false}
      className="m-10 p-0 h-fit min-h-[70vh] max-md:min-h-[100vh] max-md:!rounded-[0px] max-md:border-3 max-md:p-4 max-md:w-full max-md:min-w-full border-2 border-brown-border  bg-brown-background w-[900px] min-w-[950px] max-w-[80vw]"
    >
      <div className="flex h-[70vh]">
        <div className="bg-brown-sidebar flex-1 h-full p-4">
          <div className="flex  justify-between items-center">
            <Typography variant="caption" className="opacity-100 font-bold">
              Input Summary
            </Typography>
            <Button disabled={isLoading} onClick={onChange}>
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
                      className="text-[16px] opacity-100 font-semibold text-white"
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
                  <Button onClick={() => setShowInstructions(true)} className="rounded-[4px] p-1">
                    <CircleQuestionMark size={16}/>
                    </Button>
                    <Button onClick={onChange} className="rounded-[4px] p-1">
                      <X />
                    </Button>
                  </div>
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
                        onClick={handleGetDirectLinkClick}
                        className="border border-primary-orange bg-secondary-orange rounded-md mt-2 text-sm"
                      >
                        Direct swipe
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DataTable
                data={data?.cards}
                // @ts-expect-error ignore this
                columns={spendOptimizerColumns({
                  amount: formData?.amount,
                  directSwipeLink,
                  handleGetVoucherLink,
                  isGiftorLoading,
                })}
                loading={false}
                emptyText="No alerts found"
              />
            </>
          )}
        </div>
      </div>
      <VoucherInstructionModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </Modal>
  );
};

export default SpendOptimizerResult;
