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
  emiOptions,
  FormData,
  FormErrors,
  paymentMethods,
  SpendTransaction,
} from "./data";
import { CreditCard } from "@/types/card";
import useSocket from "@/lib/hooks/useSocket";
import SpendOptimizerResult from "./SpendOptimizerResult";
import toast from "react-hot-toast";
import Typography from "@/components/Typography/Typography";
import { SpendOptimizerResponseCard } from "@/types/optimizer";

export default function SpendOptimizerDesktop({
  selectedCards,
  isCardsLoading,
  onAddSpendTransaction,
}: {
  selectedCards: CreditCard[];
  isCardsLoading: boolean;
  onAddSpendTransaction: (payload: SpendTransaction) => void;
}) {
  const [formData, setFormData] = useState<FormData>({
    category: "online-shopping",
    amount: "5000",
    merchant: "",
    paymentMethod: "direct-payment",
    emi: "no-emi",
  });

  const [errors, setErrors] = useState<FormErrors>({
    category: false,
    amount: false,
    merchant: false,
    paymentMethod: false,
    emi: false,
  });

  const [data, setData] = useState<ParsedMessage | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [communicateToBot, { isLoading }] = useChatCommunicationMutation();
  const { createChatSessionToken } = useSocket();

  const winnerCard = useMemo(() => {
    return data?.cards?.find((card) => card?.isBestOption)
  }, [data?.cards]);

  const handleSubmit = async () => {
    // Validate all fields
    const newErrors: FormErrors = {
      category: !formData.category,
      amount: !formData.amount || formData.amount === "0",
      merchant: !formData.merchant.trim(),
      paymentMethod: !formData.paymentMethod,
      emi: !formData.emi,
    };

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

    let cardNames = "";
    selectedCards?.forEach((card) => {
      cardNames = cardNames + card?.cardId?.name + " ,";
    });
    const emiOption =
      formData?.emi === "no-emi" ? "" : `my emi method is ${formData?.emi}`;

    const message = `<I have ${selectedCards?.length} ${cardNames},  my spend category is ${formData?.category}, my spend amount is ${formData?.amount}, platform/app I am going to use ${formData?.merchant} , I a paying by ${formData?.paymentMethod}, ${emiOption}, which credit card I should use for maximum benefits only for this transaction>`;
    setOpenModal(true);
    const data = await communicateToBot({ message, token });

    const content = joinTextMessagesByMid(data?.data?.messages);

  

    const msg = content?.find(msg => msg?.m_id && msg?.content)?.content ||''
    const finalData = JSON.parse(convertBoldMarkdownToHtml(msg))

    const winnerCard = finalData?.cards?.find((card:SpendOptimizerResponseCard) => card?.isBestOption)
    const payload = {
      ...formData,
      cardIds: selectedCards?.map((card) => card?.cardId?._id),
      cardName: winnerCard?.cardName,
      expectedBenefit: winnerCard?.benefitValue,
    };

    setData(finalData);
    onAddSpendTransaction?.(payload);
  };

  const formatCurrency = (value: string): string => {
    if (!value) return "";
    const number = value.replace(/[^\d]/g, "");
    return new Intl.NumberFormat("en-IN").format(Number(number));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setFormData({ ...formData, amount: value });
    // Clear error when user starts typing
    if (value) {
      setErrors({ ...errors, amount: false });
    }
  };

  const handleMerchantChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setFormData({ ...formData, merchant: e.target.value });
    if (e.target.value.trim()) {
      setErrors({ ...errors, merchant: false });
    }
  };

  const handleCategoryChange = (value: string): void => {
    setFormData({ ...formData, category: value });
    setErrors({ ...errors, category: false });
  };

  const handlePaymentMethodChange = (value: string): void => {
    setFormData({ ...formData, paymentMethod: value });
    setErrors({ ...errors, paymentMethod: false });
  };

  const handleEmiChange = (value: string): void => {
    setFormData({ ...formData, emi: value });
    setErrors({ ...errors, emi: false });
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
                className={`!h-12 w-full text-white ${
                  errors.category
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
                className={`h-12 pl-8 text-lg text-white ${
                  errors.amount ? "border-destructive" : "border-primary-orange"
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">Please enter an amount</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="merchant"
              className="text-base text-white/80 font-semibold"
            >
              Platform / Merchant / App{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="merchant"
              type="text"
              placeholder="e.g., Amazon, Swiggy, MakeMyTrip"
              value={formData.merchant}
              onChange={handleMerchantChange}
              className={`h-12 text-white ${
                errors.merchant ? "border-destructive" : "border-primary-orange"
              }`}
            />
            {errors.merchant && (
              <p className="text-xs text-destructive">
                Please enter merchant name
              </p>
            )}
          </div>
        </div>
      </div>
     <div>
     <div className="flex gap-2 items-center">
          <div
            className={`rounded-lg flex justify-center items-center text-xl h-9 w-9 border-2 bg-[#D0DFE0] text-[#165F61] border-[#165F61] font-bold uppercas`}
          >
            03
          </div>
          <Typography
            variant="body"
            className="font-bold opacity-100 text-left"
          >
            Transaction Details
          </Typography>
        </div>
      <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1 mt-2">
        <div className="space-y-2">
          <Label
            htmlFor="paymentMethod"
            className="text-base text-white/80 font-semibold"
          >
            How will you pay? <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={handlePaymentMethodChange}
          >
            <SelectTrigger
              id="paymentMethod"
              className={`!h-12 w-full text-white ${
                errors.paymentMethod
                  ? "border-destructive"
                  : "border-primary-orange"
              }`}
            >
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent
              className="!max-h-[300px] !max-w-[430px]"
              position="popper"
              sideOffset={4}
            >
              {paymentMethods.map((cat) => {
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errors.paymentMethod && (
            <p className="text-xs text-destructive">
              Please select a payment method
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="emi"
            className="text-base text-white/80 font-semibold"
          >
            Will this purchase be converted to EMI?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.emi} onValueChange={handleEmiChange}>
            <SelectTrigger
              id="emi"
              className={`!h-12 w-full text-white ${
                errors.emi ? "border-destructive" : "border-primary-orange"
              }`}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent
              className="!max-h-[300px]"
              position="popper"
              sideOffset={4}
            >
              {emiOptions.map((cat) => {
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errors.emi && (
            <p className="text-xs text-destructive">
              Please select an EMI option
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isCardsLoading || isLoading}
          className={`w-full h-12 text-base text-white font-semibold ${errors.paymentMethod || errors.emi ? "self-center" : "self-end"}`}
        >
         Optimize Spend
        </Button>
      </div>
     </div>
      <SpendOptimizerResult
        isLoading={isLoading}
        formData={formData}
        open={openModal}
       // @ts-expect-error this is expected
        winnerCard={winnerCard}
       // @ts-expect-error this is expected
        data={data}
        onChange={() => setOpenModal(false)}
      />
    </div>
  );
}
