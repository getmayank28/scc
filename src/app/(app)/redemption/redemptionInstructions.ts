export interface RedemptionStep {
  title: string;
  description: string;
}

export interface BankRedemptionInstructions {
  bankName: string;
  steps: RedemptionStep[];
  note: string;
}

const COMMON_NOTE =
  "Point value varies by redemption - typically Rs.0.25/point for most vouchers and travel; Rs.0.15/point for Amazon, Flipkart, and statement credit. Air miles transfer: 10 RP = 1 mile. No minimum points required for redemption. Fuel, EMI, cash advances, and wallet loads do not earn reward points. Cancelled/blocked cards cannot redeem points.";

// Keyed by bankId
export const redemptionInstructions: Record<
  string,
  BankRedemptionInstructions
> = {
  // HDFC Bank
  "69c9231d862c4fc3448d05ed": {
    bankName: "HDFC Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to HDFC NetBanking or MyCard App",
        description:
          "Go to Credit Cards → Redeem Reward Points. You will be redirected to the SmartBuy Rewards portal (smartbuy.hdfcbank.com).",
      },
      {
        title: "Redeem for Travel",
        description:
          'Click Travel → search & book → select "Pay with Reward Points" at checkout.',
      },
      {
        title: "Redeem for Vouchers",
        description:
          "Click Instant Vouchers → choose brand → select denomination → pay with points.",
      },
      {
        title: "Redeem for Air Miles",
        description:
          "In NetBanking go to Redeem → AirMiles → select airline frequent flyer programme → enter your FF number.",
      },
      {
        title: "Redeem for Cashback",
        description:
          "NetBanking → Redeem → Statement Credit → select amount → confirm with OTP.",
      },
    ],
  },

  // ICICI Bank
  "69c9231d862c4fc3448d05ee": {
    bankName: "ICICI Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Via Internet Banking",
        description:
          "Log in to ICICI Internet Banking. Go to Cards and Loans or Cards → Credit Cards. Open the Reward Points / ICICI Bank Rewards section.",
      },
      {
        title: "Redeem Online",
        description:
          "Click Redeem Now or Redeem Online. Choose the redemption option available for your card — merchandise, e-vouchers, travel bookings, statement credit, or catalogue items.",
      },
      {
        title: "Confirm Redemption",
        description:
          "Confirm the redemption. Save the order/reference number for tracking.",
      },
      {
        title: "Via iMobile App",
        description:
          "Open the iMobile app → Go to Cards & Forex → Select your credit card → Tap Redeem Now. You will be taken to the rewards section/portal.",
      },
      {
        title: "Select & Confirm",
        description:
          "Select the item or redemption type you want. Confirm the request.",
      },
    ],
  },

  // Axis Bank
  "69c9231d862c4fc3448d05ef": {
    bankName: "Axis Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to Axis Mobile App or NetBanking",
        description:
          "Open the Axis Mobile app or visit axisbank.com. Log in with your Customer ID and password. Rewards Portal: edgerewards.axis.bank.in",
      },
      {
        title: "Navigate to EDGE Rewards",
        description:
          "In the app: tap Menu → Reward Points → Redeem Now. In NetBanking: go to Account → EDGE Rewards → Redeem Now. You will be redirected to the EDGE Rewards portal.",
      },
      {
        title: "Choose Redemption Category",
        description:
          "Select from: Instant e-Vouchers, Rewards Store (merchandise/products), Travel EDGE (flights & hotels), Pay by Rewards (cashback against outstanding), or Air Miles transfer.",
      },
      {
        title: "Select Product or Voucher",
        description:
          "Browse the catalogue, select your item or voucher denomination. You can split payment using Points Plus Pay — pay part via points and the rest via credit card.",
      },
      {
        title: "Confirm and Accept T&C",
        description:
          "Review your cart, set the number of EDGE points to redeem, accept T&C, and click Confirm.",
      },
      {
        title: "Receive Your Reward",
        description:
          "Instant e-vouchers arrive on your registered email and mobile within minutes (max 24 hrs). Physical products delivered in 9 working days (metro) or 9–13 days (non-metro). Cashback reflects in unbilled section within 4 working days.",
      },
      {
        title: "Redemption Fee & Points Validity",
        description:
          "Redemption Fee: Rs.49 + GST (up to 10,000 points) | Rs.99 + GST (above 10,000 points), charged on delivery. Miles transfer — no redemption fee. Points Validity: 3 years from date of earning. Points also expire if no reward-eligible transaction is made for 365 consecutive days.",
      },
    ],
  },

  // SBI
  "69c9231d862c4fc3448d05f0": {
    bankName: "SBI Cards",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to SBI Card App or Website",
        description:
          "Open the SBI Card mobile app or visit sbicard.com. Log in using your Customer ID and password. Customer Care: 39 02 02 02 (prefix city STD code).",
      },
      {
        title: "Navigate to Rewards → Redeem Rewards",
        description:
          "On the app: tap the left-side menu → Rewards → Redeem Rewards. On the website: click Dashboard → Rewards → Redeem Rewards.",
      },
      {
        title: "Browse the Rewards Catalogue",
        description:
          "Use filters for Reward Points range, City, and Category. Browse categories: e-vouchers, merchandise, flights, hotel stays, apparel, electronics, home decor, and more.",
      },
      {
        title: "Select Item and Choose Redemption Method",
        description:
          "Choose your desired product or voucher. Select Redeem Now or use Points + Pay to split between reward points and card payment. For Air Miles (Air India SBI cards only): select Air Miles option → enter Flying Returns number → confirm in multiples of 5,000 RP.",
      },
      {
        title: "Statement Credit (Cashback)",
        description:
          "Contact SBI Card helpline at 39 02 02 02 or write to sbicard.com/email. Capped at 60,000 RP/month in multiples of 4,000 RP.",
      },
      {
        title: "Confirm and Receive Reward",
        description:
          "Confirm the redemption and note your Redemption Order Number. E-vouchers delivered within 5 calendar days. Physical gifts within 15 calendar days. Air miles credited within 7 working days.",
      },
      {
        title: "Redemption Fee & Points Validity",
        description:
          "Redemption Fee: Rs.99 + GST per redemption batch processed in a day (fee waived if card is voluntarily closed on fee posting date). Points Validity: 2 years from date of accrual. Check expiry monthly — SMS REWARD XXXX to 5676791.",
      },
    ],
  },

  // IndusInd Bank
  "69c9231d862c4fc3448d05f1": {
    bankName: "IndusInd Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Method 1: IndusMoments (Main Portal)",
        description:
          "Go to IndusMoments (reward portal). Log in using your credit card / registered credentials. Check your reward points balance.",
      },
      {
        title: "Choose Category & Redeem",
        description:
          "Click on Redeem Points. Choose redemption category: Vouchers/Shopping, Travel/Flights, Merchandise, or Cash credit. Select the product or option and confirm redemption.",
      },
      {
        title: "Method 2: Pay with Rewards (Twid/Checkout)",
        description:
          'Shop online or at supported merchants. At checkout, select "Pay with Rewards". Choose how many points to redeem. Pay remaining amount via card if required. Complete transaction.',
      },
    ],
  },

  // IDFC FIRST Bank
  "69c9231d862c4fc3448d05f2": {
    bankName: "IDFC FIRST Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Via NetBanking / MobileBanking",
        description:
          "Log in to IDFC FIRST NetBanking or MobileBanking. Go to Accounts → Cards → select your Credit Card to view reward points.",
      },
      {
        title: "Choose Redemption Option",
        description:
          "Open the rewards/redemption option linked to the card. Choose what you want to redeem for — gift cards, merchandise, or travel bookings. Confirm the redemption. The bank will charge Rs.99 + GST redemption fee.",
      },
      {
        title: "Via Rewards Portal",
        description:
          "Open the IDFC FIRST Rewards portal. Log in using the required credentials linked to your card/account. Check your reward points balance and INR value.",
      },
      {
        title: "Redeem on Portal",
        description:
          "Click Redeem Points. Select the voucher/product/travel option you want. Confirm the order and note the confirmation/reference details.",
      },
      {
        title: "Pay with Reward Points at Checkout",
        description:
          "While making an eligible online purchase, choose Pay with Reward Points at checkout/OTP stage where supported. For select in-store merchants, choose Pay with Reward Points on supported terminals.",
      },
    ],
  },

  // Kotak Mahindra Bank
  "69c9231d862c4fc3448d05f3": {
    bankName: "Kotak Mahindra Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Method 1: Kotak Rewards Portal (Primary)",
        description:
          "Go to kotakrewards.com. Click Login. Enter your CRN (Customer ID) and verify with OTP. View your reward points balance.",
      },
      {
        title: "Choose Category & Redeem",
        description:
          "Choose redemption category: Travel (flights/hotels), Shopping, Vouchers, Recharge, Movies, or Cashback. Select product/service, click Proceed/Redeem, and confirm order. Cashback gets credited within ~24 hours.",
      },
      {
        title: "Method 2: Net Banking / Mobile App",
        description:
          "Login to Kotak Net Banking / Mobile App. Go to Cards section → select your credit card → Click Rewards / Redeem Points. You will be redirected to the rewards system. Select redemption option and confirm.",
      },
    ],
  },

  // RBL Bank
  "69c9231d862c4fc3448d05f4": {
    bankName: "RBL Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to RBL MyCard App or NetBanking",
        description:
          "Open the RBL MyCard App or visit the RBL Bank NetBanking portal. Log in using your registered mobile number and credentials. Rewards Portal: rblrewards.rbl.bank.in | Customer Care: 022-62327777",
      },
      {
        title: "Go to Offers & Rewards → Redeem",
        description:
          "In the app: tap Offers & Rewards → Rewards → Redeem. First-time users must activate/register on the RBL Rewards portal using credit card number, date of birth, and OTP.",
      },
      {
        title: "Choose Redemption Category",
        description:
          "Select from: Travel (Flights & Hotels), Shopping (merchandise), Gift Vouchers/E-vouchers, Dining, Mobile/DTH Recharge, or Charity Donations.",
      },
      {
        title: "Browse & Select Item",
        description:
          "Browse the rewards catalogue by category or filter by points range. Select the desired product, voucher brand, or flight/hotel. You can pay entirely in reward points or use Points + Pay.",
      },
      {
        title: "Confirm with OTP",
        description:
          "Select the number of reward points to redeem. Accept Terms & Conditions. Enter the OTP sent to your registered mobile number to confirm.",
      },
      {
        title: "Receive Your Reward",
        description:
          "E-vouchers are delivered to registered email and mobile within 20 minutes (missed call to 8510830830 if not received). Physical merchandise delivered to registered address. Travel bookings confirmed on email.",
      },
      {
        title: "Redemption Fee & Points Validity",
        description:
          "Redemption Fee: Rs.99 + GST per day (waived for Edition, Insignia, and Insignia Prime cards). Points Validity: 2 years from date of earning. Points are redeemable only after statement cycle closes.",
      },
    ],
  },

  // American Express
  "69c9231d862c4fc3448d05f5": {
    bankName: "American Express",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to American Express",
        description:
          "Go to americanexpress.com/in → My Account → Rewards & Benefits → Redeem Points.",
      },
      {
        title: "Gold Collection",
        description:
          'Click "Gold Collection" → choose 18K or 24K tier → select your preferred voucher brand → confirm with OTP.',
      },
      {
        title: "Reward Multiplier Vouchers",
        description:
          'Click "Reward Multiplier" → select brand (Amazon, Flipkart, etc.) → choose denomination → redeem.',
      },
      {
        title: "Cashback / Statement Credit",
        description:
          'Select "Statement Credit" → enter point amount → confirm. Value credited to next statement.',
      },
      {
        title: "Marriott Bonvoy Transfer",
        description:
          'Select "Transfer to Marriott Bonvoy" → enter your Bonvoy member ID → confirm transfer (2 MR = 1 Bonvoy point).',
      },
      {
        title: "Receive Your Reward",
        description:
          "Voucher codes are sent by email/SMS within minutes. Statement credits appear in next billing cycle.",
      },
    ],
  },

  // YES Bank
  "69c9231d862c4fc3448d05f6": {
    bankName: "YES Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to YES Bank App or NetBanking",
        description:
          "Open the YES Bank mobile app or visit yesbank.in/netbanking. For the rewards portal, visit creditrewardz.yes.bank.in directly and enter your registered mobile number + OTP + credit card number. Customer Care: 1800-419-0600",
      },
      {
        title: "Select Your Credit Card Variant",
        description:
          "On the YES Rewardz portal, choose the credit card variant you own (e.g., Marquee, Prosperity, First Preferred, First Exclusive, etc.). Your available reward points balance will be displayed.",
      },
      {
        title: "Choose Redemption Category",
        description:
          "Browse categories: E-Gift Vouchers (Swiggy, Zomato, Amazon, Flipkart, brands), Flight & Hotel Bookings, Movie Tickets, Mobile/DTH Recharge, Bus Tickets, Golf Course Bookings, Air Miles (InterMiles / Club Vistara), or Merchandise.",
      },
      {
        title: "Select Item and Add to Cart",
        description:
          "For vouchers/merchandise: select brand and denomination, add to cart. For travel: enter journey details, search, and book. For Air Miles: select InterMiles or Club Vistara, enter membership ID, specify points to transfer (10 RP = 1 Air Mile, min 100 points, max 1,00,000/month).",
      },
      {
        title: "Confirm and Verify with OTP",
        description:
          "Fill in your credit card details on the checkout page. Click Confirm or Redeem Points. Enter OTP to authenticate. Max 10 redemption transactions per day with a cumulative cap of Rs.2 lakh per day.",
      },
      {
        title: "Receive Your Reward",
        description:
          "E-vouchers delivered within 24 hours. Travel bookings confirmed by email. Air miles transferred to your InterMiles/Club Vistara account. Physical merchandise ships in 7-15 working days. Statement credit takes up to 30 days.",
      },
      {
        title: "Redemption Fee & Points Validity",
        description:
          "Redemption Fee: Rs.100 + GST per redemption request. Points Validity: 3 years from date of accrual (FIFO expiry). Select premium cards (Marquee, Prosperity) may have non-expiring points — check your card T&C.",
      },
    ],
  },

  // Bank of Baroda
  "69c9231d862c4fc3448d05f7": {
    bankName: "Bank of Baroda",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to bob World App or BOB NetBanking",
        description:
          "Open the bob World mobile app or visit the Bank of Baroda NetBanking portal. Log in using your credentials. Helpdesk: 1800-419-1101",
      },
      {
        title: "Go to Reward Points / BOBCARD Rewards",
        description:
          "In NetBanking: select Credit Card → Reward Points → Redeem. In the bob World app: tap bob World Benefits under What's Trending → Claim Your Rewardz.",
      },
      {
        title: "Register (First Time Only)",
        description:
          "New users click New User → enter your BOBCARD credit card number or Customer ID → verify with OTP → confirm personal details. Existing users log in directly.",
      },
      {
        title: "Choose Category and Item",
        description:
          "Select from: Flights/Hotels/Bus tickets, Gift Vouchers, Merchandise, Mobile/DTH Recharge, Movie Tickets, or Cashback (statement credit). Browse and add items to cart.",
      },
      {
        title: "Enter Points and Confirm with OTP",
        description:
          "Click Redeem Points, enter the number of points to apply, accept Terms & Conditions, and confirm with OTP. Combine points with cash if needed for higher-value items.",
      },
      {
        title: "Receive Your Reward",
        description:
          "E-vouchers and gift card codes delivered instantly. Physical products delivered within specified timelines. Cashback credited to your credit card statement in the next billing cycle.",
      },
      {
        title: "Redemption Fee & Points Validity",
        description:
          "Redemption Fee: NIL — no redemption fee charged by Bank of Baroda (a key advantage over most other banks). Points Validity: 2 years from date of transaction. Redemption window closes 2 months after financial year end for annual bonus points.",
      },
    ],
  },

  // AU Bank
  "69c9231d862c4fc3448d05f8": {
    bankName: "AU Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to AU 0101 App or NetBanking",
        description:
          "Open the AU 0101 mobile app (iOS & Android) or visit AU Bank NetBanking portal. Log in with your registered mobile number and credentials. Helpdesk: 1800-1200-1500",
      },
      {
        title: "Navigate to Reward Points",
        description:
          "In the app: tap Credit Card → select your card → tap Reward Points → tap Redeem Now. You will be redirected to the AU Rewardz portal (rewardz.au.bank.in).",
      },
      {
        title: "Choose Redemption Category",
        description:
          "On the AU Rewardz portal, select from: Travel (Flights & Hotels), Gift Vouchers, Bills & Payments (Mobile/DTH Recharge), Merchandise, or Air Miles (Air India Maharaja Club).",
      },
      {
        title: "Select Product or Voucher",
        description:
          "For vouchers: choose brand and denomination. For travel: search flights or hotels. For Air India miles: click Air Miles Redemption → enter your Maharaja Club ID → select number of points to transfer.",
      },
      {
        title: "Confirm with OTP",
        description:
          "Review your cart, accept the Terms & Conditions, and click Redeem. Enter the OTP sent to your registered mobile number to confirm the transaction.",
      },
      {
        title: "Receive Your Reward",
        description:
          "E-vouchers and gift card codes are delivered to your registered email and mobile number. Maharaja Miles transfers are credited within 7 working days. Merchandise delivery timelines vary.",
      },
      {
        title: "Redemption Fee & Points Validity",
        description:
          "Redemption Fee: Rs.99 + GST per request. Points Validity: 2 years from date of earning — redeem before expiry. AU Zenith+ cardholders get 1 RP = Rs.1.",
      },
    ],
  },

  // Federal Bank
  "69c9231d862c4fc3448d05fb": {
    bankName: "Federal Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Log in to FedMobile App or FedNet",
        description:
          "Open the FedMobile app or visit federalbank.co.in/netbanking. Log in using your registered mobile number/credentials. Rewards Portal: rewards.federal.bank.in",
      },
      {
        title: "Go to Federal Rewards Section",
        description:
          "In FedMobile: tap on Credit Card → Reward Points → Redeem Points. You will be redirected to the Federal Rewards portal. First-time users register with their credit card number and OTP.",
      },
      {
        title: "Choose Redemption Category",
        description:
          "Browse categories: Travel (Flights, Hotels, Bus), Gift Vouchers, Merchandise, Movie Tickets, Mobile/DTH Recharge, or Credit Card Bill payment. Partner store redemptions are also available.",
      },
      {
        title: "Select Item and Add to Cart",
        description:
          "Choose the brand, denomination, or product. Review the reward points required. You can filter by points range or category.",
      },
      {
        title: "Confirm with OTP",
        description:
          "Accept Terms & Conditions, enter number of points to redeem, and confirm with OTP sent to your registered mobile number.",
      },
      {
        title: "Receive Your Reward",
        description:
          "E-vouchers and codes delivered within minutes. Physical merchandise delivered to registered address. Travel bookings confirmed on email. Bill payment credit reflects in the next statement.",
      },
      {
        title: "Redemption Fee & Points Validity",
        description:
          "Redemption Fee: NIL — no redemption fee charged by Federal Bank. Points Validity: 36 months from date of earning. Partner points may have shorter validity (12 months).",
      },
    ],
  },

  // HSBC Bank
  "69cffa2f862c4fc3448d0720": {
    bankName: "HSBC Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Open the HSBC India Mobile Banking App",
        description:
          "Redemption is exclusively via the HSBC India mobile app — NOT available through NetBanking or web. Download the app and log in with your HSBC credentials. Rewards portal (view only): creditcardrewards.hsbc.co.in",
      },
      {
        title: "Select Your Credit Card",
        description:
          "On the home screen, tap on your credit card to open the card dashboard. Tap View more to access all card options.",
      },
      {
        title: "Tap Redeem Points → Redeem Points Now",
        description:
          "This opens the Rewards Marketplace. Choose your redemption type: Airline Miles, Hotel Points, Travel with Points (flights/hotels/car rentals), or Gift Cards.",
      },
      {
        title: "Select Category and Partner",
        description:
          "For airline miles: select the airline partner (Singapore Airlines, Air India, British Airways, Emirates, etc.) → enter your frequent flyer ID. For hotel points: select Marriott, IHG, Accor, or Wyndham → enter loyalty ID. For travel: search directly in the app. For gift cards: browse and select.",
      },
      {
        title: "Enter Points and Continue",
        description:
          "Enter the number of reward points to convert or apply, review the equivalent value, then tap Continue. Read and accept the Terms & Conditions.",
      },
      {
        title: "Review and Confirm",
        description:
          "Review your redemption summary and place the order. Airline mile transfers: instant to 1 day (JAL: 10 days, Air India: 5 days). Hotel points: instant to 1 day. Gift cards: delivered instantly to email.",
      },
      {
        title: "Redemption Fee & Points Validity",
        description:
          "Redemption Fee: Rs.50 + taxes per redemption (waived on select premium cards). Points Validity: 3 years (rolling expiry from date of earning). Multiple HSBC cards (primary holder) can be combined for redemption.",
      },
    ],
  },

  // Standard Chartered Bank
  "69cffa6b862c4fc3448d0721": {
    bankName: "Standard Chartered Bank",
    note: COMMON_NOTE,
    steps: [
      {
        title: "Method 1: Internet Banking (Primary)",
        description:
          'Log in to Standard Chartered Online Banking. Go to Cards / Rewards section → Click on "Online Rewards". View your reward points balance.',
      },
      {
        title: "Select Category & Redeem",
        description:
          "Select redemption category: Vouchers, Flights/Hotels, Merchandise, or Cashback. Choose item/service and confirm redemption.",
      },
      {
        title: "Method 2: SC Mobile App",
        description:
          "Open SC Mobile App → Go to Credit Card Rewards → View your points → Select redemption option → Complete transaction. Same backend as internet banking.",
      },
      {
        title: "Method 3: 360° Rewards Portal (Direct)",
        description:
          "Open Standard Chartered 360° Rewards portal. Log in, choose category (travel/vouchers/cashback etc.), select option, and confirm redemption. This is where all redemptions actually execute.",
      },
      {
        title: "Method 4: Customer Care (Offline)",
        description:
          "Call customer care, request reward redemption, provide card details, and confirm. Offline option is still supported.",
      },
    ],
  },
};

// Bank redemption portal URLs keyed by bankId
export const bankRedemptionPortals: Record<string, string> = {
  "69c9231d862c4fc3448d05ed": "https://offers.smartbuy.hdfc.bank.in", // HDFC Bank
  "69c9231d862c4fc3448d05ee": "https://icicibank.com/ishoplogin", // ICICI Bank
  "69c9231d862c4fc3448d05ef": "https://edgerewards.axis.bank.in", // Axis Bank
  "69c9231d862c4fc3448d05f0": "https://sbicard.com/en/personal/rewards.page", // SBI Card
  "69c9231d862c4fc3448d05f1": "https://indusmoments.com", // IndusInd Bank
  "69c9231d862c4fc3448d05f2": "https://idfcfirst.bank.in/rewards", // IDFC FIRST Bank
  "69c9231d862c4fc3448d05f3": "https://rewards.kotak.bank.in/", // Kotak Mahindra Bank
  "69c9231d862c4fc3448d05f4": "https://rblrewards.rbl.bank.in", // RBL Bank
  "69c9231d862c4fc3448d05f5": "https://www.americanexpress.com/en-in/account/login/", // American Express
  "69c9231d862c4fc3448d05f6": "https://creditrewardz.yes.bank.in", // YES Bank
  "69c9231d862c4fc3448d05f7": "https://myservices.bobcard.co.in/microsite/rewards", // Bank of Baroda
  "69c9231d862c4fc3448d05f8": "https://rewardz.au.bank.in", // AU Bank
  "69cffa6b862c4fc3448d0721": "https://sc.com/360rewards", // Standard Chartered Bank
};

// Set of bankIds that have redemption instructions available
export const supportedBankIds = new Set(Object.keys(redemptionInstructions));
