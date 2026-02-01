import { BadgeCheck, BaggageClaim, BedDouble, Coins, FileBox, Gift, HandPlatter, LucideProps, PlaneTakeoff, Receipt, ReceiptIndianRupee, ShoppingBag, Store, Wallet } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export const redemptionsCategoryMap:Record<string,ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>> = {
    travel: PlaneTakeoff,
    hotel: BedDouble,
    "cashback/vouchers": Gift,
    cashback: ReceiptIndianRupee,
    shopping: ShoppingBag,
    "bill payment": Receipt,
    "travel & shopping": BaggageClaim,
    merchandise: Store,
    financial: Wallet,
    general: BadgeCheck,
    "merchandise/experiences": FileBox,
    "shopping / cash": Coins,
    "default":BadgeCheck,
    "dining":HandPlatter,
    "Shopping/Vouchers":Gift
  };