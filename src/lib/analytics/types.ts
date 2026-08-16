// ─── Event Name Registry ────────────────────────────────────────────
// Organized by feature namespace. Add new features as new enum groups.

export enum EventName {
  // ── Landing Page ──
  LANDING_PAGE = "landing_page.viewed",
  BUTTON_CLICKED = "landing_page.button_clicked",
  WAITLIST_GET_EARLY_ACCESS_BTN = "landing_page.waitlist_get_early_access",
  CLOSE_WAITLIST_MODEL_BTN = "landing_page.waitlist_modal_closed",
  JOIN_WAITLIST_BTN = "landing_page.waitlist_joined",
  STEP_INTO_SMARTER_SPENDING_BTN = "landing_page.step_into_smarter_spending",
  CHECK_MY_CARD_NOW_BTN = "landing_page.check_my_card_now",
  ANALYSE_FOR_BEST_VALUE_BTN = "landing_page.analyse_for_best_value",
  RECOMMEND_MY_BEST_CARD_BTN = "landing_page.recommend_my_best_card",
  SEE_IT_IN_ACTION_BTN = "landing_page.see_it_in_action",
  SEE_IT_IN_ACTION_SECTION_BTN = "landing_page.see_it_in_action_section",

  // ── Spend Optimizer ──
  SPEND_OPTIMIZER_VIEWED = "spend_optimizer.viewed",
  SPEND_OPTIMIZER_CARD_SELECTED = "spend_optimizer.card_selected",
  SPEND_OPTIMIZER_CARD_DESELECTED = "spend_optimizer.card_deselected",
  SPEND_OPTIMIZER_CATEGORY_CHANGED = "spend_optimizer.category_changed",
  SPEND_OPTIMIZER_AMOUNT_ENTERED = "spend_optimizer.amount_entered",
  SPEND_OPTIMIZER_MERCHANT_SELECTED = "spend_optimizer.merchant_selected",
  SPEND_OPTIMIZER_MODE_CHANGED = "spend_optimizer.transaction_mode_changed",
  SPEND_OPTIMIZER_FORM_SUBMITTED = "spend_optimizer.form_submitted",
  SPEND_OPTIMIZER_RESULT_VIEWED = "spend_optimizer.result_viewed",
  SPEND_OPTIMIZER_RESULT_CLOSED = "spend_optimizer.result_closed",
  SPEND_OPTIMIZER_BUY_VOUCHER_CLICKED = "spend_optimizer.buy_voucher_clicked",
  SPEND_OPTIMIZER_DIRECT_SWIPE_CLICKED = "spend_optimizer.direct_swipe_clicked",
  SPEND_OPTIMIZER_PORTAL_MODAL_SHOWN = "spend_optimizer.portal_savings_modal_shown",
  SPEND_OPTIMIZER_PORTAL_CONTINUE_MERCHANT = "spend_optimizer.portal_continue_to_merchant",
  SPEND_OPTIMIZER_PORTAL_OPEN_BANK = "spend_optimizer.portal_open_bank_portal",
  SPEND_OPTIMIZER_VOUCHER_INSTRUCTIONS_VIEWED = "spend_optimizer.voucher_instructions_viewed",
  SPEND_OPTIMIZER_ADD_CARD_CLICKED = "spend_optimizer.add_card_clicked",
  SPEND_OPTIMIZER_EDIT_INPUT_CLICKED = "spend_optimizer.edit_input_clicked",
  SPEND_OPTIMIZER_TAB_CHANGED = "spend_optimizer.tab_changed",

  // ── Home ──
  HOME_VIEWED = "home.viewed",
  HOME_ERROR_RETRY_CLICKED = "home.error_retry_clicked",
  HOME_WELCOME_SMART_SPENDING_CLICKED = "home.welcome_smart_spending_clicked",
  HOME_WELCOME_GET_PERSONALIZED_CARD_CLICKED = "home.welcome_get_personalized_card_clicked",
  HOME_WELCOME_CHECK_BEST_CARD_CLICKED = "home.welcome_check_best_card_clicked",
  HOME_RECOMMENDATION_CARD_APPLY_CLICKED = "home.recommendation_card_apply_clicked",

  // ── Chat ──
  CHAT_SESSION_VIEWED = "chat.session_viewed",
  CHAT_MESSAGE_SENT = "chat.message_sent",
  CHAT_JOURNEY_ANSWER_SUBMITTED = "chat.journey_answer_submitted",
  CHAT_CATEGORY_SELECTED = "chat.category_selected",
  CHAT_RECOMMENDATION_REQUESTED = "chat.recommendation_requested",
  CHAT_RECOMMENDATION_RECEIVED = "chat.recommendation_received",
  CHAT_CONTINUE_JOURNEY_CLICKED = "chat.continue_journey_clicked",
  CHAT_SWITCH_CATEGORY_CLICKED = "chat.switch_category_clicked",
  CHAT_END_JOURNEY = "chat.end_journey",
  CHAT_CARD_WHY_THIS_CLICKED = "chat.card_why_this_clicked",
  CHAT_CARD_APPLY_CLICKED = "chat.card_apply_clicked",
  CHAT_CARD_DETAIL_APPLY_CLICKED = "chat.card_detail_apply_clicked",
  CHAT_SIDEBAR_NEW_CHAT_CLICKED = "chat.sidebar_new_chat_clicked",
  CHAT_SIDEBAR_SESSION_CLICKED = "chat.sidebar_session_clicked",
  CHAT_SIDEBAR_HOME_CLICKED = "chat.sidebar_home_clicked",

  // ── Redemption ──
  REDEMPTION_VIEWED = "redemption.viewed",
  REDEMPTION_CARD_SELECTED = "redemption.card_selected",
  REDEMPTION_POINTS_SUBMITTED = "redemption.points_submitted",
  REDEMPTION_RESULT_VIEWED = "redemption.result_viewed",
  REDEMPTION_HOW_TO_REDEEM_CLICKED = "redemption.how_to_redeem_clicked",
  REDEMPTION_REDEEM_NOW_CLICKED = "redemption.redeem_now_clicked",
  REDEMPTION_ADD_CARD_CLICKED = "redemption.add_card_clicked",

  // ── Card Info ──
  CARD_INFO_VIEWED = "card_info.viewed",
  CARD_INFO_CARD_SELECTED = "card_info.card_selected",
  CARD_INFO_SEARCH_SUBMITTED = "card_info.search_submitted",
  CARD_INFO_RESULT_VIEWED = "card_info.result_viewed",
  CARD_INFO_ADVISOR_POPUP_SHOWN = "card_info.advisor_popup_shown",
  CARD_INFO_ADVISOR_FIND_OUT_CLICKED = "card_info.advisor_find_out_clicked",
  CARD_INFO_ADVISOR_DISMISSED = "card_info.advisor_dismissed",

  // ── Sign Up (new customer) ──
  SIGNUP_PAGE_VIEWED = "signup.page_viewed",
  SIGNUP_USERNAME_CHECK_RESULT = "signup.username_check_result",
  SIGNUP_SUBMITTED = "signup.submitted",
  SIGNUP_SUCCEEDED = "signup.succeeded",
  SIGNUP_FAILED = "signup.failed",

  // ── Email Verify (after signup) ──
  EMAIL_VERIFY_PAGE_VIEWED = "email_verify.page_viewed",
  EMAIL_VERIFY_SUBMITTED = "email_verify.submitted",
  EMAIL_VERIFY_SUCCEEDED = "email_verify.succeeded",
  EMAIL_VERIFY_FAILED = "email_verify.failed",
  EMAIL_VERIFY_RESEND_CLICKED = "email_verify.resend_clicked",
  EMAIL_VERIFY_RESEND_SUCCEEDED = "email_verify.resend_succeeded",
  EMAIL_VERIFY_RESEND_FAILED = "email_verify.resend_failed",
  EMAIL_VERIFY_CHANGE_EMAIL_CLICKED = "email_verify.change_email_clicked",

  // ── Sign In (existing customer) ──
  SIGNIN_PAGE_VIEWED = "signin.page_viewed",
  SIGNIN_SUBMITTED = "signin.submitted",
  SIGNIN_SUCCEEDED = "signin.succeeded",
  SIGNIN_FAILED = "signin.failed",
  SIGNIN_GOOGLE_CLICKED = "signin.google_clicked",
  SIGNIN_MODAL_CLOSED = "signin.modal_closed",
  SIGNIN_SKIP_CLICKED = "signin.skip_clicked",

  // ── Forget / Change Password ──
  FORGET_PASSWORD_CLICKED = "forget_password.clicked",
  FORGET_PASSWORD_EMAIL_SENT = "forget_password.email_sent",
  FORGET_PASSWORD_EMAIL_FAILED = "forget_password.email_failed",
  CHANGE_PASSWORD_PAGE_VIEWED = "change_password.page_viewed",
  CHANGE_PASSWORD_SUBMITTED = "change_password.submitted",
  CHANGE_PASSWORD_SUCCEEDED = "change_password.succeeded",
  CHANGE_PASSWORD_FAILED = "change_password.failed",

  // ── WhatsApp Mobile OTP (user info) ──
  WHATSAPP_OTP_USER_INFO_VIEWED = "whatsapp_otp.user_info_viewed",
  WHATSAPP_OTP_SEND_CLICKED = "whatsapp_otp.send_clicked",
  WHATSAPP_OTP_SEND_SUCCEEDED = "whatsapp_otp.send_succeeded",
  WHATSAPP_OTP_SEND_FAILED = "whatsapp_otp.send_failed",
  WHATSAPP_OTP_VERIFY_CLICKED = "whatsapp_otp.verify_clicked",
  WHATSAPP_OTP_VERIFY_SUCCEEDED = "whatsapp_otp.verify_succeeded",
  WHATSAPP_OTP_VERIFY_FAILED = "whatsapp_otp.verify_failed",
  WHATSAPP_OTP_RESEND_CLICKED = "whatsapp_otp.resend_clicked",
  WHATSAPP_OTP_EDIT_PHONE_CLICKED = "whatsapp_otp.edit_phone_clicked",
  WHATSAPP_OTP_USER_INFO_SUBMITTED = "whatsapp_otp.user_info_submitted",
  WHATSAPP_OTP_USER_INFO_SUCCEEDED = "whatsapp_otp.user_info_succeeded",
  WHATSAPP_OTP_USER_INFO_FAILED = "whatsapp_otp.user_info_failed",
  WHATSAPP_OTP_SIGN_OUT_CLICKED = "whatsapp_otp.sign_out_clicked",
}

// ─── Event Property Maps ────────────────────────────────────────────
// Each event gets its own property type. This enforces correct usage
// at the call site and makes Amplitude dashboards predictable.

interface BaseProperties {
  platform?: "desktop" | "mobile";
}

interface LandingPageProperties extends BaseProperties {
  name?: string;
  buttonName?: string;
  location?: string;
  path?: string;
  referrer?: string;
}

interface SpendOptimizerCardProperties extends BaseProperties {
  cardId: string;
  cardName: string;
  bankName: string;
  selectedCardCount: number;
}

interface SpendOptimizerCategoryProperties extends BaseProperties {
  category: string;
  previousCategory?: string;
}

interface SpendOptimizerAmountProperties extends BaseProperties {
  amount: number;
}

interface SpendOptimizerMerchantProperties extends BaseProperties {
  merchant: string;
}

interface SpendOptimizerModeProperties extends BaseProperties {
  transactionMode: "online" | "offline";
}

interface SpendOptimizerFormSubmittedProperties extends BaseProperties {
  category: string;
  amount: number;
  merchant: string;
  transactionMode: "online" | "offline";
  selectedCardCount: number;
}

interface SpendOptimizerResultViewedProperties extends BaseProperties {
  category: string;
  amount: number;
  merchant: string;
  transactionMode: "online" | "offline";
  bestCardName: string | null;
  bestCardSavings: number | null;
  totalCardsCompared: number;
}

interface SpendOptimizerActionProperties extends BaseProperties {
  cardId: string;
  cardName: string;
  isBestCard: boolean;
  category: string;
  amount: number;
  merchant: string;
  savingsAmount: number;
}

interface SpendOptimizerPortalProperties extends BaseProperties {
  merchant: string;
  action: "continue_merchant" | "open_bank_portal";
}

interface SpendOptimizerTabProperties extends BaseProperties {
  tab: string;
}

interface HomeViewedProperties extends BaseProperties {
  hasSpendData: boolean;
  hasRecommendations: boolean;
}

interface HomeRecommendationCardProperties extends BaseProperties {
  cardName: string;
  bankName: string;
}

interface ChatSessionViewedProperties extends BaseProperties {
  sessionId: string;
  isNewSession: boolean;
}

interface ChatMessageSentProperties extends BaseProperties {
  /** "retry" is a re-send of a turn the partner never answered in time. */
  messageSource: "direct" | "journey" | "retry";
  messageLength: number;
}

interface ChatJourneyAnswerProperties extends BaseProperties {
  questionId: string;
  questionType: string;
  category: string;
}

interface ChatCategorySelectedProperties extends BaseProperties {
  category: string;
}

interface ChatRecommendationProperties extends BaseProperties {
  category: string;
  action: string;
}

interface ChatCardActionProperties extends BaseProperties {
  cardName: string;
}

interface ChatSidebarSessionProperties extends BaseProperties {
  sessionId: string;
}

interface RedemptionCardSelectedProperties extends BaseProperties {
  cardName: string;
}

interface RedemptionPointsSubmittedProperties extends BaseProperties {
  cardName: string;
  points: number;
}

interface RedemptionResultViewedProperties extends BaseProperties {
  cardName: string;
  points: number;
  bestOption: string | null;
  bestValue: number | null;
  totalOptions: number;
}

interface RedemptionRedeemClickedProperties extends BaseProperties {
  cardName: string;
  optionTitle: string;
  category: string;
  totalValue: number;
  isBestOption: boolean;
}

interface CardInfoCardSelectedProperties extends BaseProperties {
  cardName: string;
  bankName: string;
}

interface CardInfoSearchProperties extends BaseProperties {
  cardName: string;
  bankName: string;
}

// ── Auth ─────────────────────────────────────────────────────────────
// Auth-funnel events. `method` distinguishes credentials/google/etc.,
// `reason` carries a normalized error code for failure events so the
// dashboard can break down drop-offs by cause.

type SignInMethod = "credentials" | "google";

interface AuthBaseProperties extends BaseProperties {
  method?: SignInMethod;
}

interface SignupUsernameCheckProperties extends BaseProperties {
  available: boolean;
  reason?: string;
}

interface SignupSubmittedProperties extends BaseProperties {
  hasUsername: boolean;
  hasEmail: boolean;
}

interface AuthFailureProperties extends AuthBaseProperties {
  reason?: string;
}

interface EmailVerifyProperties extends BaseProperties {
  hasEmail: boolean;
}

interface ResendProperties extends BaseProperties {
  reason?: string;
}

interface ForgetPasswordProperties extends BaseProperties {
  reason?: string;
}

// ── WhatsApp Mobile OTP ──────────────────────────────────────────────

interface WhatsappOtpBaseProperties extends BaseProperties {
  phoneProvided?: boolean;
}

interface WhatsappOtpFailureProperties extends WhatsappOtpBaseProperties {
  reason?: string;
}

interface WhatsappOtpSendSuccessProperties extends WhatsappOtpBaseProperties {
  retryAfter?: number;
}

interface WhatsappOtpUserInfoSubmittedProperties extends BaseProperties {
  employmentType: string;
  hasSalaryRange: boolean;
  informationConsent: boolean;
  promotionalConsent: boolean;
}

interface WhatsappOtpUserInfoFailedProperties extends BaseProperties {
  reason?: string;
}

// ─── Event → Properties Type Map ────────────────────────────────────
// This is the single source of truth. When you add a new event,
// add its property type here. The trackEvent function uses this
// to enforce correct properties per event at compile time.

export interface EventPropertiesMap {
  // Landing page
  [EventName.LANDING_PAGE]: LandingPageProperties;
  [EventName.BUTTON_CLICKED]: LandingPageProperties;
  [EventName.WAITLIST_GET_EARLY_ACCESS_BTN]: LandingPageProperties;
  [EventName.CLOSE_WAITLIST_MODEL_BTN]: LandingPageProperties;
  [EventName.JOIN_WAITLIST_BTN]: LandingPageProperties;
  [EventName.STEP_INTO_SMARTER_SPENDING_BTN]: LandingPageProperties;
  [EventName.CHECK_MY_CARD_NOW_BTN]: LandingPageProperties;
  [EventName.ANALYSE_FOR_BEST_VALUE_BTN]: LandingPageProperties;
  [EventName.RECOMMEND_MY_BEST_CARD_BTN]: LandingPageProperties;
  [EventName.SEE_IT_IN_ACTION_BTN]: LandingPageProperties;
  [EventName.SEE_IT_IN_ACTION_SECTION_BTN]: LandingPageProperties;

  // Spend Optimizer
  [EventName.SPEND_OPTIMIZER_VIEWED]: BaseProperties;
  [EventName.SPEND_OPTIMIZER_CARD_SELECTED]: SpendOptimizerCardProperties;
  [EventName.SPEND_OPTIMIZER_CARD_DESELECTED]: SpendOptimizerCardProperties;
  [EventName.SPEND_OPTIMIZER_CATEGORY_CHANGED]: SpendOptimizerCategoryProperties;
  [EventName.SPEND_OPTIMIZER_AMOUNT_ENTERED]: SpendOptimizerAmountProperties;
  [EventName.SPEND_OPTIMIZER_MERCHANT_SELECTED]: SpendOptimizerMerchantProperties;
  [EventName.SPEND_OPTIMIZER_MODE_CHANGED]: SpendOptimizerModeProperties;
  [EventName.SPEND_OPTIMIZER_FORM_SUBMITTED]: SpendOptimizerFormSubmittedProperties;
  [EventName.SPEND_OPTIMIZER_RESULT_VIEWED]: SpendOptimizerResultViewedProperties;
  [EventName.SPEND_OPTIMIZER_RESULT_CLOSED]: BaseProperties;
  [EventName.SPEND_OPTIMIZER_BUY_VOUCHER_CLICKED]: SpendOptimizerActionProperties;
  [EventName.SPEND_OPTIMIZER_DIRECT_SWIPE_CLICKED]: SpendOptimizerActionProperties;
  [EventName.SPEND_OPTIMIZER_PORTAL_MODAL_SHOWN]: SpendOptimizerPortalProperties;
  [EventName.SPEND_OPTIMIZER_PORTAL_CONTINUE_MERCHANT]: SpendOptimizerPortalProperties;
  [EventName.SPEND_OPTIMIZER_PORTAL_OPEN_BANK]: SpendOptimizerPortalProperties;
  [EventName.SPEND_OPTIMIZER_VOUCHER_INSTRUCTIONS_VIEWED]: BaseProperties;
  [EventName.SPEND_OPTIMIZER_ADD_CARD_CLICKED]: BaseProperties;
  [EventName.SPEND_OPTIMIZER_EDIT_INPUT_CLICKED]: BaseProperties;
  [EventName.SPEND_OPTIMIZER_TAB_CHANGED]: SpendOptimizerTabProperties;

  // Home
  [EventName.HOME_VIEWED]: HomeViewedProperties;
  [EventName.HOME_ERROR_RETRY_CLICKED]: BaseProperties;
  [EventName.HOME_WELCOME_SMART_SPENDING_CLICKED]: BaseProperties;
  [EventName.HOME_WELCOME_GET_PERSONALIZED_CARD_CLICKED]: BaseProperties;
  [EventName.HOME_WELCOME_CHECK_BEST_CARD_CLICKED]: BaseProperties;
  [EventName.HOME_RECOMMENDATION_CARD_APPLY_CLICKED]: HomeRecommendationCardProperties;

  // Chat
  [EventName.CHAT_SESSION_VIEWED]: ChatSessionViewedProperties;
  [EventName.CHAT_MESSAGE_SENT]: ChatMessageSentProperties;
  [EventName.CHAT_JOURNEY_ANSWER_SUBMITTED]: ChatJourneyAnswerProperties;
  [EventName.CHAT_CATEGORY_SELECTED]: ChatCategorySelectedProperties;
  [EventName.CHAT_RECOMMENDATION_REQUESTED]: ChatRecommendationProperties;
  [EventName.CHAT_RECOMMENDATION_RECEIVED]: ChatRecommendationProperties;
  [EventName.CHAT_CONTINUE_JOURNEY_CLICKED]: BaseProperties;
  [EventName.CHAT_SWITCH_CATEGORY_CLICKED]: ChatCategorySelectedProperties;
  [EventName.CHAT_END_JOURNEY]: BaseProperties;
  [EventName.CHAT_CARD_WHY_THIS_CLICKED]: ChatCardActionProperties;
  [EventName.CHAT_CARD_APPLY_CLICKED]: ChatCardActionProperties;
  [EventName.CHAT_CARD_DETAIL_APPLY_CLICKED]: ChatCardActionProperties;
  [EventName.CHAT_SIDEBAR_NEW_CHAT_CLICKED]: BaseProperties;
  [EventName.CHAT_SIDEBAR_SESSION_CLICKED]: ChatSidebarSessionProperties;
  [EventName.CHAT_SIDEBAR_HOME_CLICKED]: BaseProperties;

  // Redemption
  [EventName.REDEMPTION_VIEWED]: BaseProperties;
  [EventName.REDEMPTION_CARD_SELECTED]: RedemptionCardSelectedProperties;
  [EventName.REDEMPTION_POINTS_SUBMITTED]: RedemptionPointsSubmittedProperties;
  [EventName.REDEMPTION_RESULT_VIEWED]: RedemptionResultViewedProperties;
  [EventName.REDEMPTION_HOW_TO_REDEEM_CLICKED]: BaseProperties;
  [EventName.REDEMPTION_REDEEM_NOW_CLICKED]: RedemptionRedeemClickedProperties;
  [EventName.REDEMPTION_ADD_CARD_CLICKED]: BaseProperties;

  // Card Info
  [EventName.CARD_INFO_VIEWED]: BaseProperties;
  [EventName.CARD_INFO_CARD_SELECTED]: CardInfoCardSelectedProperties;
  [EventName.CARD_INFO_SEARCH_SUBMITTED]: CardInfoSearchProperties;
  [EventName.CARD_INFO_RESULT_VIEWED]: CardInfoSearchProperties;
  [EventName.CARD_INFO_ADVISOR_POPUP_SHOWN]: BaseProperties;
  [EventName.CARD_INFO_ADVISOR_FIND_OUT_CLICKED]: BaseProperties;
  [EventName.CARD_INFO_ADVISOR_DISMISSED]: BaseProperties;

  // Sign Up
  [EventName.SIGNUP_PAGE_VIEWED]: BaseProperties;
  [EventName.SIGNUP_USERNAME_CHECK_RESULT]: SignupUsernameCheckProperties;
  [EventName.SIGNUP_SUBMITTED]: SignupSubmittedProperties;
  [EventName.SIGNUP_SUCCEEDED]: BaseProperties;
  [EventName.SIGNUP_FAILED]: AuthFailureProperties;

  // Email Verify
  [EventName.EMAIL_VERIFY_PAGE_VIEWED]: EmailVerifyProperties;
  [EventName.EMAIL_VERIFY_SUBMITTED]: BaseProperties;
  [EventName.EMAIL_VERIFY_SUCCEEDED]: BaseProperties;
  [EventName.EMAIL_VERIFY_FAILED]: AuthFailureProperties;
  [EventName.EMAIL_VERIFY_RESEND_CLICKED]: BaseProperties;
  [EventName.EMAIL_VERIFY_RESEND_SUCCEEDED]: BaseProperties;
  [EventName.EMAIL_VERIFY_RESEND_FAILED]: ResendProperties;
  [EventName.EMAIL_VERIFY_CHANGE_EMAIL_CLICKED]: BaseProperties;

  // Sign In
  [EventName.SIGNIN_PAGE_VIEWED]: BaseProperties;
  [EventName.SIGNIN_SUBMITTED]: AuthBaseProperties;
  [EventName.SIGNIN_SUCCEEDED]: AuthBaseProperties;
  [EventName.SIGNIN_FAILED]: AuthFailureProperties;
  [EventName.SIGNIN_GOOGLE_CLICKED]: BaseProperties;
  [EventName.SIGNIN_MODAL_CLOSED]: BaseProperties;
  [EventName.SIGNIN_SKIP_CLICKED]: BaseProperties;

  // Forget / Change Password
  [EventName.FORGET_PASSWORD_CLICKED]: BaseProperties;
  [EventName.FORGET_PASSWORD_EMAIL_SENT]: BaseProperties;
  [EventName.FORGET_PASSWORD_EMAIL_FAILED]: ForgetPasswordProperties;
  [EventName.CHANGE_PASSWORD_PAGE_VIEWED]: BaseProperties;
  [EventName.CHANGE_PASSWORD_SUBMITTED]: BaseProperties;
  [EventName.CHANGE_PASSWORD_SUCCEEDED]: BaseProperties;
  [EventName.CHANGE_PASSWORD_FAILED]: AuthFailureProperties;

  // WhatsApp Mobile OTP
  [EventName.WHATSAPP_OTP_USER_INFO_VIEWED]: BaseProperties;
  [EventName.WHATSAPP_OTP_SEND_CLICKED]: WhatsappOtpBaseProperties;
  [EventName.WHATSAPP_OTP_SEND_SUCCEEDED]: WhatsappOtpSendSuccessProperties;
  [EventName.WHATSAPP_OTP_SEND_FAILED]: WhatsappOtpFailureProperties;
  [EventName.WHATSAPP_OTP_VERIFY_CLICKED]: WhatsappOtpBaseProperties;
  [EventName.WHATSAPP_OTP_VERIFY_SUCCEEDED]: WhatsappOtpBaseProperties;
  [EventName.WHATSAPP_OTP_VERIFY_FAILED]: WhatsappOtpFailureProperties;
  [EventName.WHATSAPP_OTP_RESEND_CLICKED]: WhatsappOtpBaseProperties;
  [EventName.WHATSAPP_OTP_EDIT_PHONE_CLICKED]: BaseProperties;
  [EventName.WHATSAPP_OTP_USER_INFO_SUBMITTED]: WhatsappOtpUserInfoSubmittedProperties;
  [EventName.WHATSAPP_OTP_USER_INFO_SUCCEEDED]: BaseProperties;
  [EventName.WHATSAPP_OTP_USER_INFO_FAILED]: WhatsappOtpUserInfoFailedProperties;
  [EventName.WHATSAPP_OTP_SIGN_OUT_CLICKED]: BaseProperties;
}
