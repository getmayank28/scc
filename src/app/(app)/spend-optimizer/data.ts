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

export interface FormData {
  category: string;
  amount: string;
  merchant: string;
  paymentMethod: string;
  emi: string;
}

export interface FormErrors {
  category: boolean;
  amount: boolean;
  merchant: boolean;
  paymentMethod: boolean;
  emi: boolean;
}

export const categories: Category[] = [
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

export const paymentMethods: PaymentMethod[] = [
  { value: "direct", label: "Directly on the website/app" },
  { value: "in-store", label: "In-store / swipe / tap" },
  {
    value: "rewards-portal",
    label:
      "Through a bank rewards portal (SmartBuy / AmEx Travel / Axis Travel Edge / ICICI iShop etc.)",
  },
];

export const emiOptions: EmiOption[] = [
  { value: "no-emi", label: "No (I'll pay in full)" },
  { value: "no-cost-emi", label: "Yes, No-Cost EMI" },
  { value: "regular-emi", label: "Yes, Regular EMI" },
];
