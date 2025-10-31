import {
  User,
  ShoppingCart,
  Plane,
  HandPlatter,
  BadgeDollarSign,
} from "lucide-react";
import { StepConfig } from "./types";

export const STEP_CONFIGS: StepConfig[] = [
  {
    step: 1,
    title: "Basic Info",
    icon: User,
  },
  {
    step: 2,
    title: "Online/Ecommerce spend",
    icon: ShoppingCart,
  },
  {
    step: 3,
    title: "Travel spend",
    icon: Plane,
  },
  {
    step: 4,
    title: "Dining & movie spend",
    icon: HandPlatter,
  },
  {
    step: 5,
    title: "Miscellaneous spend",
    icon: BadgeDollarSign,
  },
];

export const TOTAL_STEPS = 6;

export const INITIAL_FORM_DATA = {
  fullName: "",
  email: "",
  phone: "",
  monthlySpend: "",
  ecommerseSpend: "",
  amazon: "",
  flipkart: "",
  tataNeu: "",
  myntra: "",
  bigBasket: "",
  blinkIt: "",
  ecommerseOthers: "",
  travelSpend: "",
  makeMyTrip: "",
  irctc: "",
  vistara: "",
  airIndia: "",
  indigo: "",
  easeMyTrip: "",
  ola: "",
  uber: "",
  offlineTravelSpend: "",
  diningSpend: "",
  zomato: "",
  swiggy: "",
  eazyDiner: "",
  luxurySpend: "",
  offlineApparelFashion: "",
  departmentalStoresSupermarket: "",
  hotelsAndHolidays: "",
  movieSpend: "",
  pvr: "",
  bookMyShow: "",
  fuel: "",
  utility: "",
  foreignCurrencyTransaction: "",
  otherSpends: "",
};
