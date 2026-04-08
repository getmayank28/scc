"use client";
import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import {
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
import { useMemo } from "react";

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
    key: "directionSwipeValueInInr",
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
    key: "voucherValueInInr",
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
              className="text-primary-orange text-xs tracking-wider mb-2 font-bold uppercase text-left opacity-100"
            >
              selected Cards
            </Typography>
            <div className="flex flex-col gap-2">
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
                    className="text-sm text-left opacity-100"
                  >
                    {card?.cardId?.name?.slice(0, 28)}
                    {card?.cardId?.name?.length > 28 ? "..." : ""}
                  </Typography>
                </div>
              ))}
            </div>
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
                        {formatCurrency(String(winnerCard?.voucherValueInInr))}
                      </Typography>
                      <div className="flex gap-2 items-center">
                        <TrendingUp className="w-4 text-secondary-success" />
                        <Typography
                          variant="caption"
                          className="text-[12px] text-left  opacity-100 text-secondary-success  font-bold tracking-[1px]"
                        >
                          {(
                            ((winnerCard?.voucherValueInInr ?? 0) /
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
                          String(winnerCard?.directionSwipeValueInInr),
                        )}
                      </Typography>
                      <div className="flex gap-2 items-center">
                        <TrendingUp className="w-4 text-secondary-success" />
                        <Typography
                          variant="caption"
                          className="text-[12px] text-left  opacity-100 text-secondary-success  font-bold tracking-[1px]"
                        >
                          {(
                            ((winnerCard?.directionSwipeValueInInr ?? 0) /
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
    </Modal>
  );
};

export default SpendOptimizerResult;
