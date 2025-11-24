export const BENEFIT_TYPES = {
  PERCENTAGE_OF_SPEND: "percentOfSpend", // e.g., 1.5% of spend
  PER_SPEND_BLOCK: "perSpendBlock", // e.g., ₹0.8 on every ₹200 spent
  FIXED_DISCOUNT: "fixedDiscount", // e.g., ₹120 off on ₹500 spend
  PERCENTAGE_WITH_CAP: "percentWithCap", // e.g., 16.5% cashback, max ₹500
  NO_BENEFIT: "noBenefit", // e.g., 0 benefit
};

export const cards: Array<keyof typeof cardRules> = [
  "aceCreditCard",
  "myZoneCreditCard",
  "neoCreditCard",
];
// Rules for each credit card
export const cardRules = {
  aceCreditCard: {
    // accuracy off
    ecommerseSpend: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    travelSpend: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    diningSpend: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 2.75 },
    movieSpend: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },

    // Online spend- ecommerce spends
    amazon: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    flipkart: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    tataNeu: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    myntra: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    bigBasket: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    blinkIt: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    ecommerseOthers: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },

    // Travel
    makeMyTrip: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    irctc: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    vistara: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    airIndia: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    indigo: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    easeMyTrip: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    ola: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 4 },
    uber: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },

    // Dining & movie
    zomato: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 4 },
    swiggy: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 4 },
    eazyDiner: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    luxurySpend: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    pvr: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    bookMyShow: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },

    //miscellaneous
    offlineApparelFashion: {
      type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND,
      value: 1.5,
    },
    departmentalStoresSupermarket: {
      type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND,
      value: 1.5,
    },
    hotelsAndHolidays: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
    fuel: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 0 },
    utility: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 5 },
    foreignCurrencyTransaction: {
      type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND,
      value: 0,
    },
    otherSpends: { type: BENEFIT_TYPES.PERCENTAGE_OF_SPEND, value: 1.5 },
  },
  myZoneCreditCard: {
    // accuracy off
    ecommerseSpend: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.8,
      per: 200,
    },
    travelSpend: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    diningSpend: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    movieSpend: {
      type: BENEFIT_TYPES.FIXED_DISCOUNT,
      thresholds: [{ min: 500, value: 200 }],
    },

    // Online spend - ecommerce spends
    amazon: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    flipkart: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    tataNeu: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    myntra: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    bigBasket: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    blinkIt: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    ecommerseOthers: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.8,
      per: 200,
    },

    // Travel
    makeMyTrip: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    irctc: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    vistara: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    airIndia: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    indigo: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    easeMyTrip: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    ola: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    uber: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },

    // Dining
    zomato: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    swiggy: {
      type: BENEFIT_TYPES.FIXED_DISCOUNT,
      thresholds: [
        { min: 500, value: 120 },
        { min: 1000, value: 240 },
      ],
    },
    eazyDiner: {
      type: BENEFIT_TYPES.PERCENTAGE_WITH_CAP,
      percent: 16.5,
      minSpend: 2500,
      maxBenefit: 500,
    },
    luxurySpend: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },

    // Miscellaneous
    offlineApparelFashion: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.8,
      per: 200,
    },
    departmentalStoresSupermarket: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.8,
      per: 200,
    },
    hotelsAndHolidays: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.8,
      per: 200,
    },
    pvr: {
      type: BENEFIT_TYPES.FIXED_DISCOUNT,
      thresholds: [{ min: 500, value: 200 }],
    },
    bookMyShow: {
      type: BENEFIT_TYPES.FIXED_DISCOUNT,
      thresholds: [{ min: 500, value: 200 }],
    },
    fuel: { type: BENEFIT_TYPES.NO_BENEFIT, value: 0 },
    utility: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
    foreignCurrencyTransaction: { type: BENEFIT_TYPES.NO_BENEFIT, value: 0 },
    otherSpends: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.8, per: 200 },
  },
  neoCreditCard: {
    // accuracy off
    ecommerseSpend: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.2,
      per: 200,
    },
    travelSpend: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    diningSpend: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    movieSpend: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },

    // Online spend - ecommerce spends
    amazon: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    flipkart: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    tataNeu: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    myntra: {
      type: BENEFIT_TYPES.FIXED_DISCOUNT,
      thresholds: [{ min: 999, value: 150 }],
    },
    bigBasket: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    blinkIt: {
      type: BENEFIT_TYPES.PERCENTAGE_WITH_CAP,
      percent: 10,
      minSpend: 750,
      maxBenefit: 250,
    },
    ecommerseOthers: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.2,
      per: 200,
    },

    // Travel
    makeMyTrip: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    irctc: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    vistara: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    airIndia: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    indigo: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    easeMyTrip: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    ola: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    uber: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },

    // Dining
    zomato: {
      type: BENEFIT_TYPES.FIXED_DISCOUNT,
      thresholds: [
        { min: 500, value: 120 },
        { min: 1000, value: 240 },
      ],
    },
    swiggy: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    eazyDiner: {
      type: BENEFIT_TYPES.PERCENTAGE_WITH_CAP,
      percent: 15,
      minSpend: 2500,
      maxBenefit: 501,
    },
    luxurySpend: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },

    // Miscellaneous
    offlineApparelFashion: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.2,
      per: 201,
    },
    departmentalStoresSupermarket: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.2,
      per: 200,
    },
    hotelsAndHolidays: {
      type: BENEFIT_TYPES.PER_SPEND_BLOCK,
      value: 0.2,
      per: 200,
    },
    pvr: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    bookMyShow: {
      type: BENEFIT_TYPES.PERCENTAGE_WITH_CAP,
      percent: 10,
      maxBenefit: 100,
    },
    fuel: { type: BENEFIT_TYPES.NO_BENEFIT, value: 0 },
    utility: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
    foreignCurrencyTransaction: { type: BENEFIT_TYPES.NO_BENEFIT, value: 0 },
    otherSpends: { type: BENEFIT_TYPES.PER_SPEND_BLOCK, value: 0.2, per: 200 },
  },
};
