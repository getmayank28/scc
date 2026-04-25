"use client";
import React, { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useChatCommunicationMutation } from "@/store/api";
import { joinTextMessagesByMid } from "@/lib/utils/content";
import { convertBoldMarkdownToHtml, ParsedMessage } from "@/lib/utils/markdown";
import {
  categories,
  FormData,
  FormErrors,
  SpendTransaction,
} from "./data";
import { CreditCard } from "@/types/card";
import useSocket from "@/lib/hooks/useSocket";
import SpendOptimizerResult from "./SpendOptimizerResult";
import toast from "react-hot-toast";
import Typography from "@/components/Typography/Typography";
import { formatCurrency } from "@/lib/utils/number";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { useGetPortalsQuery } from "@/store/admin";
import { SearchboxInput } from "@/components/SearchBoxInput";
import { PortalProps } from "@/models/Portal";

export default function SpendOptimizerDesktop({
  selectedCards,
  isCardsLoading,
  onAddSpendTransaction,
}: {
  selectedCards: CreditCard[];
  isCardsLoading: boolean;
  onAddSpendTransaction: (payload: SpendTransaction) => void;
}) {
  const [selectedMerchant, setSelectedMerchant] = useState<PortalProps|null>(null)
  const [formData, setFormData] = useState<FormData>({
    category: "online-shopping",
    amount: "5000",
    merchant: "",
    transactionMode: 'online'
  });

  const [errors, setErrors] = useState<FormErrors>({
    category: false,
    amount: false,
    merchant: false,
    transactionMode: false
  });

  const [data, setData] = useState<ParsedMessage | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const { data: portals, isFetching:isPortalFetching } = useGetPortalsQuery({})

  const [communicateToBot, { isLoading }] = useChatCommunicationMutation();
  const { createChatSessionToken } = useSocket();



  const winnerCard = useMemo(() => {
    return data?.cards?.find((card) => card?.isBestCard)
  }, [data?.cards]);

  const handleSubmit = async () => {
    const newErrors: FormErrors = {
      category: !formData.category,
      amount: !formData.amount || formData.amount === "0",
      merchant: !formData.merchant.trim(),
      transactionMode: !formData.transactionMode,
    };

    const selectedPortal = portals?.find((portal:PortalProps) => portal?.name?.toLowerCase()=== formData?.merchant?.toLowerCase())
    setSelectedMerchant(selectedPortal)
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error);

    if (hasErrors) {
      console.log("Please fill all required fields");
      return;
    }

    if (!selectedCards?.length) {
      toast.error("Please add your cards to start optimizing your spend");
      return;
    }

    const token = await createChatSessionToken();
    let cardSlugs = "";
    selectedCards?.forEach((card) => {
      cardSlugs = cardSlugs + card?.cardId?.slug + " ,";
    });

    const message = `<I have ${selectedCards?.length} cards, use these card slug_id for identity ${cardSlugs}  my category is ${formData?.category}, my transaction_amount is ${formData?.amount}, this is my merchant_name ${formData?.merchant}, this transaction spend_mode is ${formData?.transactionMode}, which credit card I should use for maximum benefits only for this transaction`;
    setOpenModal(true);
    const data = await communicateToBot({ message, token });

    const content = joinTextMessagesByMid(data?.data?.messages);



    const msg = content?.find(msg => msg?.m_id && msg?.content)?.content || ''
    const finalData = JSON.parse(convertBoldMarkdownToHtml(msg))


    // const winnerCard = finalData?.cards?.find((card:SpendOptimizerResponseCard) => card?.isBestCard)
    // const payload = {
    //   ...formData,
    //   cardIds: selectedCards?.map((card) => card?.cardId?._id),
    //   cardName: winnerCard?.cardName,
    //   expectedBenefit: winnerCard?.benefitValue,
    // };

    setData(finalData);
  };



  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setFormData({ ...formData, amount: value });
    // Clear error when user starts typing
    if (value) {
      setErrors({ ...errors, amount: false });
    }
  };

  const handleCategoryChange = (value: string): void => {
    setFormData({ ...formData, category: value });
    setErrors({ ...errors, category: false });
  };


  return (
    <div className="space-y-6 py-6 max-md:hidden">
      <div>
        <div className="flex gap-2 items-center">
          <div
            className={`rounded-lg flex justify-center items-center text-xl h-9 w-9 border-2 bg-[#E0EAFF] text-[#6496FF] border-[#6496FF] font-bold uppercas`}
          >
            02
          </div>
          <Typography
            variant="body"
            className="font-bold opacity-100 text-left"
          >
            Transaction Details
          </Typography>
        </div>
        <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-base text-white/80 font-semibold"
            >
              Spend category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger
                id="category"
                className={`!h-12 w-full text-white ${errors.category
                    ? "border-destructive"
                    : "border-primary-orange"
                  }`}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent
                className="!max-h-[300px]"
                position="popper"
                sideOffset={4}
              >
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary-orange" />
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">
                Please select a category
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-base text-white/80 font-semibold"
            >
              Spend Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-orange font-medium">
                ₹
              </span>
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={formatCurrency(formData.amount)}
                onChange={handleAmountChange}
                className={`h-12 pl-8 text-lg text-white ${errors.amount ? "border-destructive" : "border-primary-orange"
                  }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">Please enter an amount</p>
            )}
          </div>
          <SearchboxInput
              disabled={isPortalFetching}
              options={portals}
              value={formData.merchant}
              onChange={(val) => setFormData((prev) => ({ ...prev, merchant: val }))}
              error={errors.merchant?'Please enter a valid input':''}
              label="Portal/Merchant/App/Website"
              placeholder="Search portals..."
              required
            />
        </div>
      </div>
      <div className="flex gap-6">
        <div className="space-y-2">
          <Label className="text-base text-white/80 font-semibold">Transaction Mode</Label>
          <RadioGroup
            value={formData.transactionMode}
            onValueChange={(value: "online" | "offline") =>
              setFormData({ ...formData, transactionMode: value })
            }
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="online" id="online" />
              <Label htmlFor="online" className="text-white">Online</Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="offline" id="offline" />
              <Label htmlFor="offline" className="text-white">Offline</Label>
            </div>
          </RadioGroup>
        </div>
        <Button
            onClick={handleSubmit}
            disabled={isCardsLoading || isLoading}
            className={`w-full max-w-xs h-12 text-base text-white font-semibold`}
          >
            Optimize Spend
          </Button>
      </div>
      <SpendOptimizerResult
        selectedCards={selectedCards}
        isLoading={isLoading}
        formData={formData}
        open={openModal}
        selectedPortal={selectedMerchant}
        // @ts-expect-error this is expected
        winnerCard={winnerCard}
        // @ts-expect-error this is expected
        data={data}
        onChange={() => setOpenModal(false)}
      />
    </div>
  );
}
