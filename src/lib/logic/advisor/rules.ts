import { type Category } from "./cards";

export const MERCHANTS = {
  SMARTBUY: "smartbuy",
  AIR_INDIA: "air_india",
  CLEARTRIP: "cleartrip",
  EASEMYTRIP: "easemytrip",
  FAB_HOTELS: "fab_hotels",
  ITC_HOTELS: "itc_hotels",
  IXIGO: "ixigo",
  MAKEMYTRIP: "makemytrip",
  TAJ_EXPERIENCES: "taj_experiences",
  TAJ_WELLNESS: "taj_wellness",
  YATRA: "yatra",
  ADANI_MEET_GREET: "adani_meet_greet",
  FINUSMART: "finusmart",
  IRCTC: "irctc",
  MARRIOTT: "marriott",
  GOIBIBO: "goibibo",
  THE_LEELA: "the_leela",
  THE_POSTCARD: "the_postcard",
  AMAZON_PAY: "amazon_pay",

  // Dining aggregators / sub-MCCs
  SWIGGY: "swiggy",
  ZOMATO: "zomato",
  SWIGGY_DINEOUT: "swiggy_dineout",
  EAZYDINER: "eazydiner",
  ZOMATO_DISTRICT: "zomato_district",

  // Dining merchant chains
  ABSOLUTE_BARBEQUE: "absolute_barbeque",
  ASIA_SEVEN_EXPRESS: "asia_seven_express",
  BAKINGO: "bakingo",
  BARBEQUE_NATION: "barbeque_nation",
  BASKIN_ROBBINS: "baskin_robbins",
  BEER_CAFE: "beer_cafe",
  BEHROUZ_BIRYANI: "behrouz_biryani",
  BIKANERVALA: "bikanervala",
  CAFE_COFFEE_DAY: "cafe_coffee_day",
  CAFE_DELHI_HEIGHTS: "cafe_delhi_heights",
  CHICAGO_PIZZA: "chicago_pizza",
  COSTA_COFFEE: "costa_coffee",
  DOMINOS_PIZZA: "dominos_pizza",
  EATSURE: "eatsure",
  FAASOS: "faasos",
  FRESHMENU: "freshmenu",
  HAUTE_SAUCE: "haute_sauce",
  KFC: "kfc",
  LITE_BITE_FOOD: "lite_bite_food",
  LUNCH_BOX: "lunch_box",
  MACHAAN: "machaan",
  MAINLAND_CHINA: "mainland_china",
  MARRIOTT_DINING: "marriott_dining",
  MCDONALDS: "mcdonalds",
  OH_CALCUTTA: "oh_calcutta",
  OVEN_STORY: "oven_story",
  PIZZA_HUT: "pizza_hut",
  POLAR_BEAR: "polar_bear",
  PRET_A_MANGER: "pret_a_manger",
  PUNJAB_GRILL: "punjab_grill",
  SIGREE: "sigree",
  STARBUCKS: "starbucks",
  STREET_FOODS_PUNJAB_GRILL: "street_foods_punjab_grill",
  SUBWAY: "subway",
  SUN_SCOOP: "sun_scoop",
  SWEET_BENGAL: "sweet_bengal",
  SWEET_TRUTH: "sweet_truth",
  TACO_BELL: "taco_bell",
  TGIF: "tgif",
  THE_GOOD_BOWL: "the_good_bowl",
  TIM_HORTONS: "tim_hortons",
  TOSCANO: "toscano",
  WENDYS: "wendys",
  WOW_CHICKEN: "wow_chicken",
  WOW_CHINA: "wow_china",
  WOW_MOMO: "wow_momo",
  ZAMBAR: "zambar",

  // Online shopping merchants
  AJIO: "ajio",
  AJIO_LUXE: "ajio_luxe",
  AMAZON: "amazon",
  AMAZON_FRESH: "amazon_fresh",
  AMAZON_IN_NON_PRIME: "amazon_in_non_prime",
  AMAZON_IN_PRIME: "amazon_in_prime",
  AMAZON_PAY_PARTNERS: "amazon_pay_partners",
  AMAZON_PRIME: "amazon_prime",
  AMAZON_PRIME_12_MONTHS: "amazon_prime_12_months",
  AMAZON_PRIME_3_MONTHS: "amazon_prime_3_months",
  AMAZON_PRIME_LITE: "amazon_prime_lite",
  AMAZON_SHOPPING: "amazon_shopping",
  BIG_BASKET: "big_basket",
  BLINKIT: "blinkit",
  FLIPKART: "flipkart",
  MARKS_AND_SPENCER: "marks_and_spencer",
  MYNTRA: "myntra",
  NYKAA: "nykaa",
  NYKAA_FASHION: "nykaa_fashion",
  NYKAA_MAN: "nykaa_man",
  OTHER_ONLINE_SPENDS: "other_online_spends",
  RELIANCE_DIGITAL: "reliance_digital",
  RELIANCE_JIO_MART: "reliance_jio_mart",
  RELIANCE_RETAIL: "reliance_retail",
  SNAPDEAL_SCLP_1000: "snapdeal_sclp_1000",
  SNAPDEAL_SCLP_500: "snapdeal_sclp_500",
  TATA_CLIQ: "tata_cliq",
  TATA_NEU: "tata_neu",
  TATA_CLIQ_FASHION: "tata_cliq_fashion",
  TATA_CLIQ_LUXURY: "tata_cliq_luxury",
  ZEPTO: "zepto",

  // Utility merchants
  AIRTEL_XSTREAM: "airtel_xstream",
  GAS: "gas",
  GOOGLE_PAY_BILLS: "google_pay_bills",
  HP_PAY: "hp_pay",
  RELIANCE_MY_JIO_STORE: "reliance_my_jio_store",
  UTILITIES_AMAZON: "utilities_amazon",
  UTILITY_OTHERS: "utility_others",

  // Fuel / rent / insurance / fees & taxes merchants
  BPCL_SMARTDRIVE: "bpcl_smartdrive",
  BPCL: "bpcl",
  CLEARTAX: "cleartax",
  FINUSMART_SURAKSHA: "finusmart_suraksha",
  MYHQ: "myhq",
  RENTOMOJO: "rentomojo",

  // Offline shopping merchants
  CROSSWORD: "crossword",
  PUMA: "puma",
  HARPERS_BAZAAR_INDIA: "harpers_bazaar_india",
  WOGGLES: "woggles",

  // Amex Membership Rewards merchants (Reward Multiplier / RewardXcelerator)
  HPCL: "hpcl",
  APPLE: "apple",
  FOREST_ESSENTIALS: "forest_essentials",
  TANISHQ: "tanishq",
  CARATLANE: "caratlane",
  TITAN: "titan",
  LENOVO: "lenovo",
  SHOPWISE_EVOUCHERS: "shopwise_evouchers",
  BOSS: "boss",
  DARVEYS: "darveys",
  DYSON: "dyson",
  EMPORIO_ARMANI: "emporio_armani",
  GALERIES_LAFAYETTE: "galeries_lafayette",
  GIORGIO_ARMANI: "giorgio_armani",
  KAMA_AYURVEDA: "kama_ayurveda",
  RAS_LUXURY_OILS: "ras_luxury_oils",
  THE_COLLECTIVE: "the_collective",
  TUMI: "tumi",
  BVLGARI: "bvlgari",
  KAMAL_WATCH: "kamal_watch",
  MOI_JEWELS: "moi_jewels",
  ZOYA: "zoya",
  CHAWLA_ART_GALLERY: "chawla_art_gallery",
  THE_FORM_ART: "the_form_art",
  BILI_HU: "bili_hu",
  NEWBY_TEAS: "newby_teas",
  MEATIGO: "meatigo",
  MERCEDES_BENZ: "mercedes_benz",
  DHUN_WELLNESS: "dhun_wellness",
  THE_QUORUM: "the_quorum",
  DREAMSETGO: "dreamsetgo",
  BOOKMYSHOW: "bookmyshow",
  AMAZON_PAY_GYFTR: "amazon_pay_gyftr",
  UBER: "uber",
  PVR: "pvr",
  NETMEDS: "netmeds",
  APOLLO: "apollo",
  TAJ_HOTELS: "taj_hotels",
  SELEQTIONS_HOTELS: "seleqtions_hotels",
  GATEWAY_HOTELS: "gateway_hotels",
  VIVANTA_HOTELS: "vivanta_hotels",
  AMA_STAYS_TRAILS: "ama_stays_trails",
  TAJ_RESTAURANTS_QMIN: "taj_restaurants_qmin",
  PAYTM_TRAVEL: "paytm_travel",
  PAYTM: "paytm",
  HSBC_TRAVEL_WITH_POINTS: "hsbc_travel_with_points",
  ICICI_ISHOP: "icici_ishop",
  ADANI_ONE: "adani_one",
  AXIS_DIRECT_AIRLINES: "axis_direct_airlines",
  AXIS_DIRECT_HOTELS: "axis_direct_hotels",
  AXIS_TRAVEL_EDGE: "axis_travel_edge",
  AXIS_GRAB_DEALS: "axis_grab_deals",
  IOCL: "iocl",
  LIC_PREMIUM: "lic_premium",
  SHOPPERS_STOP: "shoppers_stop",
  SHOPPERS_STOP_BEAUTY: "shoppers_stop_beauty",
  EZEEGO1: "ezeego1",
  FLIPKART_PLUS: "flipkart_plus",
  SPICEJET: "spicejet",
  INDIGO: "indigo",
  SINGAPORE_AIRLINES: "singapore_airlines",
  PHONEPE: "phonepe",
  CULT_FIT: "cult_fit",
  OLA: "ola",
  TIRA: "tira",

  // Fashion & apparel
  HUNKEMOLLER_LUXE: "hunkemoller_luxe",
  INSTAFAB_PLUS: "instafab_plus",
  LIBERTY: "liberty",
  MANGO: "mango",
  MANYAVAR: "manyavar",
  NEXT: "next",
  SANDRO: "sandro",
  TANEIRA: "taneira",
  THE_WHITE_CROW: "the_white_crow",
  VINCI_BOTANICALS: "vinci_botanicals",
  ALDO: "aldo",
  PANTALOONS: "pantaloons",
  SKECHERS: "skechers",
  BATA: "bata",
  HUSH_PUPPIES: "hush_puppies",
  CALL_IT_SPRING: "call_it_spring",
  LIFESTYLE: "lifestyle",
  WESTSIDE: "westside",
  CITIZEN_WATCHES: "citizen_watches",
  TITAN_EYE_PLUS: "titan_eye_plus",
  FABINDIA: "fabindia",
  BEVERLY_HILLS_POLO_CLUB: "beverly_hills_polo_club",
  VICTORIAS_SECRET: "victorias_secret",
  R_AND_B: "r_and_b",
  SOCH: "soch",
  ALLEN_SOLLY: "allen_solly",
  LOUIS_PHILIPPE: "louis_philippe",
  VAN_HEUSEN: "van_heusen",
  THE_RAYMOND_SHOP: "the_raymond_shop",
  JOCKEY: "jockey",
  BLISSCLUB: "blissclub",
  GIVA: "giva",
  FEMMELLA: "femmella",
  FASHION_FACTORY: "fashion_factory",
  WOODLAND: "woodland",
  W_FOR_WOMEN: "w_for_women",
  PETER_ENGLAND: "peter_england",
  HIDESIGN: "hidesign",
  RELIANCE_TRENDS_FOOTWEAR: "reliance_trends_footwear",
  RAYMOND_READY_TO_WEAR: "raymond_ready_to_wear",
  AMERICAN_EAGLE: "american_eagle",
  AURELIA: "aurelia",
  BEYOUNG: "beyoung",
  BIBA: "biba",
  CAMPUS: "campus",
  CAMPUS_SUTRA: "campus_sutra",
  ESTELE: "estele",
  FASTRACK: "fastrack",
  FASTRACK_BAGS: "fastrack_bags",
  FREECULTR: "freecultr",
  RANGRITI: "rangriti",
  PARX: "parx",
  PARK_AVENUE: "park_avenue",
  COLORPLUS: "colorplus",
  LENSKART: "lenskart",
  TITAN_SMARTWATCHES: "titan_smartwatches",
  FASTRACK_SMARTWATCHES: "fastrack_smartwatches",
  EASYBUY: "easybuy",
  LEVIS: "levis",
  RELAXO: "relaxo",
  SIMON_CARTER: "simon_carter",
  TEGO: "tego",
  TITAN_MINIMALS: "titan_minimals",
  V_MART: "v_mart",
  WILDCRAFT: "wildcraft",
  AMERICAN_TOURISTER: "american_tourister",
  SAMSONITE: "samsonite",
  CHARLES_AND_KEITH: "charles_and_keith",
  DUNE_LONDON: "dune_london",
  MAX_FASHION: "max_fashion",
  NEEMANS: "neemans",
  SUPER_BOTTOMS: "super_bottoms",

  // Electronics & appliances
  PHILIPS: "philips",
  CROMA: "croma",
  FUTURE_WORLD_APPLE_RESELLER: "future_world_apple_reseller",
  VIJAY_SALES: "vijay_sales",
  BLAUPUNKT: "blaupunkt",
  CELLO: "cello",
  HAMMER: "hammer",
  SKULLCANDY: "skullcandy",
  PRESTIGE: "prestige",
  WONDERCHEF: "wonderchef",
  DAILY_OBJECTS: "daily_objects",
  DUROFLEX: "duroflex",

  // Beauty & personal care
  CLAYCO: "clayco",
  KIMIRICA: "kimirica",
  LOCCITANE: "loccitane",
  TYPSY_BEAUTY: "typsy_beauty",
  MAMAEARTH: "mamaearth",
  THE_MAN_COMPANY: "the_man_company",
  VICTORIAS_SECRET_BEAUTY: "victorias_secret_beauty",
  INGLOT: "inglot",
  BATH_AND_BODY_WORKS: "bath_and_body_works",
  MAC: "mac",
  BOBBI_BROWN: "bobbi_brown",
  NAT_HABIT: "nat_habit",
  BARE_ANATOMY: "bare_anatomy",
  CHEMIST_AT_PLAY: "chemist_at_play",
  SSUNSU: "ssunsu",
  FOXTALE: "foxtale",
  SKINN: "skinn",
  SAMMY_ICON: "sammy_icon",
  HIMALAYA_WELLNESS: "himalaya_wellness",
  NUA_WOMAN: "nua_woman",
  TATTVA_SPA: "tattva_spa",
  AURIC: "auric",
  TRUEFITT_AND_HILL: "truefitt_and_hill",

  // Home, lifestyle & grocery retail
  FRENCH_ACCENT: "french_accent",
  FRIDO: "frido",
  IKEA: "ikea",
  ME_N_MOMS: "me_n_moms",
  PURE_HOME_LIVING: "pure_home_living",
  URBAN_SPACE: "urban_space",
  SPENCERS_RETAIL: "spencers_retail",
  SHIVA_ORGANIC: "shiva_organic",
  RELIANCE_SMART: "reliance_smart",
  RELIANCE_SMART_POINT: "reliance_smart_point",
  ORGANIC_INDIA: "organic_india",
  RELIANCE_SMART_BAZAAR: "reliance_smart_bazaar",

  // Sports & fitness
  SPEEDO: "speedo",
  DECATHLON: "decathlon",
  FITPASS: "fitpass",

  // Health, wellness & pharmacy
  APOLLO_DIAGNOSTICS: "apollo_diagnostics",
  WELLBEING_NUTRITION: "wellbeing_nutrition",
  HEALTHKART: "healthkart",
  APOLLO_PHARMACY: "apollo_pharmacy",
  PHARMEASY: "pharmeasy",
  MEDIWHEEL: "mediwheel",
  HEALTHIANS: "healthians",

  // OTT / entertainment / gaming
  LIONSGATE_PLAY: "lionsgate_play",
  JIOHOTSTAR: "jiohotstar",
  ZEE5: "zee5",
  SHEMAROOME: "shemaroome",
  ET_PRIME: "et_prime",
  DISCOVERY_PLUS: "discovery_plus",
  HINDUSTAN_TIMES_PREMIUM: "hindustan_times_premium",
  HOICHOI: "hoichoi",
  LIVE_HINDUSTAN: "live_hindustan",
  TIMEZONE: "timezone",
  VROTT: "vrott",
  SONY_LIV: "sony_liv",
  VALORANT: "valorant",
  UNIPIN_BGMI: "unipin_bgmi",
  UNIPIN: "unipin",

  // Travel sub-merchants
  FLIXBUS: "flixbus",
  IXIGO_HOTEL: "ixigo_hotel",
  KLOOK: "klook",
  DPAULS_TRAVEL: "dpauls_travel",
  EASEMYTRIP_HOTELS: "easemytrip_hotels",
  EASEMYTRIP_HOLIDAY: "easemytrip_holiday",
  ASSEMBLY: "assembly",
  CLEARTRIP_HOTELS: "cleartrip_hotels",
  MAKEMYTRIP_HOLIDAY: "makemytrip_holiday",
  MAKEMYTRIP_HOTEL: "makemytrip_hotel",

  // Amex Luxe / RewardXcelerator brand variants
  ABRAHAM_AND_THAKORE_LUXE: "abraham_and_thakore_luxe",
  ADIDAS_KIDS_LUXE: "adidas_kids_luxe",
  ARMANI_EXCHANGE_LUXE: "armani_exchange_luxe",
  BOTTEGA_VENETA_LUXE: "bottega_veneta_luxe",
  BROOKS_BROTHERS_LUXE: "brooks_brothers_luxe",
  CHARLES_TYRWHITT_LUXE: "charles_tyrwhitt_luxe",
  CANALI_LUXE: "canali_luxe",
  DIESEL_LUXE: "diesel_luxe",
  EMPORIO_ARMANI_LUXE: "emporio_armani_luxe",
  FERRAGAMO_LUXE: "ferragamo_luxe",
  GAS_LUXE: "gas_luxe",
  GIORGIO_ARMANI_LUXE: "giorgio_armani_luxe",
  H_BY_HAMLEYS_LUXE: "h_by_hamleys_luxe",
  HAMLEYS_LUXE: "hamleys_luxe",
  HUGO_BOSS_LUXE: "hugo_boss_luxe",
  JIMMY_CHOO_LUXE: "jimmy_choo_luxe",
  KATE_SPADE_LUXE: "kate_spade_luxe",
  LA_MARTINA_LUXE: "la_martina_luxe",
  LUXE: "luxe",
  MAJE_LUXE: "maje_luxe",
  MUJI_LUXE: "muji_luxe",
  MICHAEL_KORS_LUXE: "michael_kors_luxe",
  MOTHER_CARE_LUXE: "mother_care_luxe",
  PAUL_SHARK_LUXE: "paul_shark_luxe",
  PAUL_SMITH_LUXE: "paul_smith_luxe",
  POTTERY_BARN_LUXE: "pottery_barn_luxe",
  PRET_A_MANGER_LUXE: "pret_a_manger_luxe",
  ROWAN_LUXE: "rowan_luxe",
  RITU_KUMAR_LUXE: "ritu_kumar_luxe",
  SATYA_PAUL_LUXE: "satya_paul_luxe",
  SCOTCH_AND_SODA_LUXE: "scotch_and_soda_luxe",
  STEVE_MADDEN_LUXE: "steve_madden_luxe",
  SUNGLASS_HUT_LUXE: "sunglass_hut_luxe",
  SUPERDRY_SPORT_LUXE: "superdry_sport_luxe",
  SUPERDRY_LUXE: "superdry_luxe",
  TODS_LUXE: "tods_luxe",
  TORY_BURCH_LUXE: "tory_burch_luxe",
  TUMI_LUXE: "tumi_luxe",
  VALENTINO_LUXE: "valentino_luxe",
  VERSACE_LUXE: "versace_luxe",
  VILLEROY_AND_BOCH_LUXE: "villeroy_and_boch_luxe",
  WEST_ELM_LUXE: "west_elm_luxe",

  // Bank reward-portal sub-merchants (SmartBuy / IDFC FIRST app)
  SMARTBUY_INSTANT_VOUCHERS_GYFTR: "smartbuy_instant_vouchers_gyftr",
  HDFC_SMARTBUY_FLIGHTS: "hdfc_smartbuy_flights",
  HDFC_SMARTBUY_HOTELS: "hdfc_smartbuy_hotels",
  HDFC_SMARTBUY_RAIL: "hdfc_smartbuy_rail",
  HDFC_SMARTBUY_BUS: "hdfc_smartbuy_bus",
  HDFC_SMARTBUY_MYNTRA: "hdfc_smartbuy_myntra",
  HDFC_SMARTBUY_RELIANCE_DIGITAL: "hdfc_smartbuy_reliance_digital",
  HDFC_SMARTBUY_PHARMEASY: "hdfc_smartbuy_pharmeasy",
  IDFC_FIRST_APP_HOTELS: "idfc_first_app_hotels",
  IDFC_FIRST_APP_FLIGHTS: "idfc_first_app_flights",
} as const;

export type Merchant = (typeof MERCHANTS)[keyof typeof MERCHANTS];

export type CapPeriod = "monthly" | "quarterly" | "annually";
export type CapMetric = "points" | "inr" | "cashback";
export type CapScope = "merchant" | "category" | "card";

export type SharedCapType = "combined" | "standalone";

// Sentinel `merchant` value meaning the shared cap is scoped to the whole card
// (pools across merchants) rather than a specific merchant. Lets a group like
// "10:card:combined" key a card-level pool while keeping the multiplier in play.
export const CARD_LEVEL_CAP = "card" as const;
export type SharedCapMerchant = Merchant | typeof CARD_LEVEL_CAP;

// A rule's shared cap group. `multiplier`/`merchant` identify the accelerated
// tier (and, for `combined`, derive the pool key shared across rules on a card).
// `merchant` may be a real merchant, the `CARD_LEVEL_CAP` sentinel ("card"), or
// null (any merchant). `capType`:
//   - "combined"   — this rule's reward_cap pools with other `combined` rules
//                    sharing the same multiplier/merchant key on the same card.
//   - "standalone" — the cap applies to this rule alone (same as having no
//                    group); multiplier/merchant are display-only.
export interface SharedCapGroup {
  multiplier?: number | null;
  merchant?: SharedCapMerchant | null;
  capType: SharedCapType;
}

export function sharedCapGroupKey(group: SharedCapGroup): string {
  return `${group.multiplier ?? "*"}::${group.merchant ?? "*"}`;
}

// Coerce a stored value (legacy array / single object, or null) into the
// canonical single-object form. Used at DB read sites so existing rows keep
// working: legacy pooled rules had no `capType` and were always shared, so they
// map to "combined"; any legacy `id`/`cap` fields are dropped.
export function toSharedCapGroup(raw: unknown): SharedCapGroup | null {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first || typeof first !== "object") return null;
  const g = first as Partial<SharedCapGroup>;
  return {
    multiplier: g.multiplier ?? null,
    merchant: g.merchant ?? null,
    capType: g.capType === "standalone" ? "standalone" : "combined",
  };
}

function sameCap(
  a: NonNullable<MockRule["caps"]["reward_cap"]> | null | undefined,
  b: NonNullable<MockRule["caps"]["reward_cap"]> | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.value === b.value && a.period === b.period && a.metric === b.metric;
}

export function validateSharedCapGroups(rules: MockRule[]): void {
  // Only `combined` rules form a shared pool; the pool budget derives from the
  // members' own reward_cap, so members sharing a pool key must agree on it.
  // `standalone` (and groupless) rules keep a private cap and are skipped.
  const byKey = new Map<string, MockRule[]>();
  for (const r of rules) {
    if (!r.is_active) continue;
    const group = r.shared_cap_group;
    if (!group || group.capType !== "combined") continue;
    const key = `${r.cardId}::${sharedCapGroupKey(group)}`;
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }
  for (const [key, members] of byKey) {
    if (members.length <= 1) continue;
    const first = members[0].caps.reward_cap;
    for (const m of members.slice(1)) {
      if (!sameCap(first, m.caps.reward_cap)) {
        throw new Error(
          `Shared cap group "${key}" has inconsistent reward_cap across rules: ${members
            .map((x) => x._id)
            .join(", ")}`,
        );
      }
    }
  }
}

// Spend-tiered direct-swipe rate. Some cards change the accelerated rate at a
// per-period spend threshold (e.g. Education: 3X up to ₹20k/month, 10X beyond).
//   - "marginal": each slice of spend earns its own tier's rate (first ₹20k @
//     3X, the rest @ 10X).
//   - "whole": the highest tier whose threshold the per-period spend reaches
//     applies to ALL the spend (cross ₹20k ⇒ everything earns 10X).
// `tiers` are ascending by `min_spend_per_period_inr`; the first should be 0.
// Thresholds are per-period and annualized exactly like reward caps. A rule with
// no schedule (null) is a plain flat `direct_swipe_percentage` rule.
export type DirectSwipeTierMode = "marginal" | "whole";

export interface DirectSwipeTier {
  min_spend_per_period_inr: number;
  rate: number;
}

export interface DirectSwipeSchedule {
  mode: DirectSwipeTierMode;
  period: CapPeriod;
  tiers: DirectSwipeTier[];
}

export interface MockRule {
  _id: string;
  cardId: string;
  category: Category;
  merchant: Merchant | null;

  reward: {
    direct_swipe_percentage: number;
    // Optional spend-tiered schedule for direct swipe. When set, it overrides
    // `direct_swipe_percentage` (which stays as a single-tier fallback rate).
    direct_swipe_schedule?: DirectSwipeSchedule | null;
    voucher_discount_percentage: number;
    voucher_reward_percentage: number;
    convenience_fee_percentage: number;
  };

  caps: {
    reward_cap: {
      period: CapPeriod;
      metric: CapMetric;
      value: number;
      scope: CapScope;
    } | null;
    voucher_monthly_purchase_limit_inr: number | null;
    max_voucher_size_inr: number | null;
    vouchers_per_booking: number | null;
  };

  shared_cap_group: SharedCapGroup | null;

  fuel_surcharge_applicable: number;
  max_fuel_transaction_limit: number;
  redemption_mode: "online" | "offline" | "both";
  voucher_validity_in_months: number | null;
  gv_coins_percentage: number;

  valid_from: Date;
  valid_until: Date | null;

  is_active: boolean;
}

export const MOCK_RULES: MockRule[] = [];