"use client";
import React, { useEffect, useState } from "react";
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
import {
  ShoppingBag,
  UtensilsCrossed,
  Plane,
  Hotel,
  Car,
  Globe,
  Zap,
  Fuel,
  Store,
  Home,
  GraduationCap,
  Gem,
  Heart,
  Wallet,
  Gift,
  LucideIcon,
} from "lucide-react";
import HeaderText from "@/components/HeaderText/HeaderText";
import useUserData from "@/lib/hooks/useUserData";
import { useGetUserCardsQuery } from "@/store/api";
import Typography from "@/components/Typography/Typography";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface PaymentMethod {
  value: string;
  label: string;
}

interface EmiOption {
  value: string;
  label: string;
}

interface FormData {
  category: string;
  amount: string;
  merchant: string;
  paymentMethod: string;
  emi: string;
}

interface FormErrors {
  category: boolean;
  amount: boolean;
  merchant: boolean;
  paymentMethod: boolean;
  emi: boolean;
}

const categories: Category[] = [
  {
    value: "online-shopping",
    label: "Online shopping (non-travel)",
    icon: ShoppingBag,
  },
  { value: "food-delivery", label: "Food delivery", icon: UtensilsCrossed },
  { value: "dining", label: "Dining", icon: UtensilsCrossed },
  { value: "flights", label: "Flights", icon: Plane },
  { value: "hotels", label: "Hotels", icon: Hotel },
  { value: "travel-ground", label: "Travel (ground transport)", icon: Car },
  {
    value: "international",
    label: "International shopping / subscriptions",
    icon: Globe,
  },
  { value: "utilities", label: "Utilities & bills", icon: Zap },
  { value: "fuel", label: "Fuel & FASTag", icon: Fuel },
  { value: "offline-retail", label: "Offline retail", icon: Store },
  { value: "rent", label: "Rent / insurance / government", icon: Home },
  {
    value: "education-domestic",
    label: "Education (domestic)",
    icon: GraduationCap,
  },
  {
    value: "education-international",
    label: "Education (international)",
    icon: GraduationCap,
  },
  { value: "jewellery", label: "Jewellery", icon: Gem },
  { value: "healthcare", label: "Healthcare", icon: Heart },
  { value: "wallet-load", label: "Wallet Load", icon: Wallet },
  { value: "gift-card", label: "Gift card purchase", icon: Gift },
];

const paymentMethods: PaymentMethod[] = [
  { value: "direct", label: "Directly on the website/app" },
  { value: "in-store", label: "In-store / swipe / tap" },
  {
    value: "rewards-portal",
    label:
      "Through a bank rewards portal (SmartBuy / AmEx Travel / Axis Travel Edge / ICICI iShop etc.)",
  },
];

const emiOptions: EmiOption[] = [
  { value: "no-emi", label: "No (I'll pay in full)" },
  { value: "no-cost-emi", label: "Yes, No-Cost EMI" },
  { value: "regular-emi", label: "Yes, Regular EMI" },
];

export default function SpendOptimizer() {
  const [formData, setFormData] = useState<FormData>({
    category: "online-shopping",
    amount: "5000",
    merchant: "",
    paymentMethod: "direct",
    emi: "no-emi",
  });

  const [errors, setErrors] = useState<FormErrors>({
    category: false,
    amount: false,
    merchant: false,
    paymentMethod: false,
    emi: false,
  });

  const [userCards, setUserCards] = useState<Array<string>>([]);

  const { userId } = useUserData();
  const { data: cards } = useGetUserCardsQuery({ userId });

  useEffect(() => {
    if (cards) {
      const cardIds = cards?.map((card: { _id: string }) => card?._id);
      setUserCards(cardIds);
    }
  }, [cards]);

  const handleSubmit = (): void => {
    // Validate all fields
    const newErrors: FormErrors = {
      category: !formData.category,
      amount: !formData.amount || formData.amount === "0",
      merchant: !formData.merchant.trim(),
      paymentMethod: !formData.paymentMethod,
      emi: !formData.emi,
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error);

    if (hasErrors) {
      console.log("Please fill all required fields");
      return;
    }

    // If no errors, submit the form
    console.log("Form submitted:", formData);
    // Add your submit logic here
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
    // Clear error when user starts typing
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
    <div className="flex flex-col p-20 h-screen">
      <HeaderText
        containerClassName="items-start"
        title="Spend Optimizer"
        titleVariant="h3"
        titleClassName="font-bold"
        contentVariant="caption"
        content="Which of my cards should I use for this purchase?"
      />
      <div className="space-y-6 py-10">
        <div className="grid grid-cols-3 gap-5">
          {/* Category Selection */}
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
                    : "border-secondary-orange"
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

          {/* Amount Input */}
          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-base text-white/80 font-semibold"
            >
              Planned Spend Amount <span className="text-destructive">*</span>
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
                  errors.amount
                    ? "border-destructive"
                    : "border-secondary-orange"
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">Please enter an amount</p>
            )}
          </div>

          {/* Merchant Input */}
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
                errors.merchant
                  ? "border-destructive"
                  : "border-secondary-orange"
              }`}
            />
            {errors.merchant && (
              <p className="text-xs text-destructive">
                Please enter merchant name
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Payment Method */}
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
                    : "border-secondary-orange"
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

          {/* EMI Option */}
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
                  errors.emi ? "border-destructive" : "border-secondary-orange"
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
            className={`w-full h-12 text-base text-white font-semibold ${errors.paymentMethod || errors.emi ? "self-center" : "self-end"}`}
          >
            Find Best Card
          </Button>
        </div>
      </div>
      <div>
        <Typography variant="body" className="font-bold opacity-90 text-left">
          Your cards
        </Typography>
        <div className="flex gap-6 py-2">
          {cards?.map((card: { _id: string; cardId: { name: string } }) => {
            return (
              <div
                key={card?._id}
                className={`flex p-3 px-4 rounded-sm items-center justify-between w-[430px] border ${userCards?.includes(card?._id)?"border-secondary-orange":"border-white/30"}`}
              >
                <div className="flex items-center gap-3">
                  <Image
                    width={25}
                    height={25}
                    src="/logos/hdfc.png"
                    alt="bank-logo"
                  />
                  <Typography
                    variant="caption"
                    className="text-sm font-semibold"
                  >
                    {card?.cardId?.name}
                  </Typography>
                </div>
                <Checkbox
                  checked={userCards?.includes(card?._id)}
                  onClick={() => {
                    const isSelected = userCards?.includes(card?._id);
                    console.log(isSelected);
                    if (isSelected) {
                      const filteredOptions = userCards?.filter(
                        (option) => option !== card?._id
                      );
                      setUserCards(filteredOptions);
                    } else {
                      setUserCards((prev) => [...prev, card?._id]);
                    }
                  }}
                  className="w-6 h-6 data-[state=checked]:border-secondary-orange border-secondary-orange data-[state=checked]:bg-secondary-orange data-[state=checked]:text-white"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
