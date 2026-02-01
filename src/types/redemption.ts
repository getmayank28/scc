export interface RedemptionOption {
    redemptionOptionTitle: string;
    redemptionOptionDescription: string;
    pointConversionRatioInInr: number;
    note: string;
    category: "Travel" | "Shopping" | string;
    portalLink: string;
  }
  
  export interface RedemptionData {
    startMessage: string;
    redemptionOptions: RedemptionOption[];
    endMessage: string;
    recommendationForMaxBenefits: string;
  }