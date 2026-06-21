// Unit test for spend-tiered direct-swipe rewards (no DB). Exercises the real
// engine path: build rules with a schedule -> computeBestOfForCard ->
// computeCategoryReturn. bookingsPerYear=12 so a ₹20k/mo threshold = ₹240k/yr.
import { CATEGORIES, type MockCard } from "../src/lib/logic/advisor/cards";
import {
  type MockRule,
  type DirectSwipeSchedule,
} from "../src/lib/logic/advisor/rules";
import { computeBestOfForCard } from "../src/lib/logic/advisor/bestOf";
import { computeCategoryReturn } from "../src/lib/logic/advisor/engine";

const card = {
  _id: "card_test",
  name: "Test",
  is_active: true,
  rewards: { base_reward_rate: 1, point_value_inr: 1 },
} as unknown as MockCard;

function makeRule(schedule: DirectSwipeSchedule | null, flatPct = 0): MockRule {
  return {
    _id: "rule_test_edu",
    cardId: "card_test",
    category: CATEGORIES.EDUCATION,
    merchant: null,
    reward: {
      direct_swipe_percentage: flatPct,
      direct_swipe_schedule: schedule,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    fuel_surcharge_applicable: 0,
    max_fuel_transaction_limit: 0,
    redemption_mode: "both",
    voucher_validity_in_months: null,
    gv_coins_percentage: 0,
    valid_from: new Date("2024-01-01"),
    valid_until: null,
    is_active: true,
  };
}

function ret(schedule: DirectSwipeSchedule | null, spend: number, flatPct = 0) {
  const rules = [makeRule(schedule, flatPct)];
  const bestOf = computeBestOfForCard(card, rules).find(
    (b) => b.category === CATEGORIES.EDUCATION,
  );
  const cat = computeCategoryReturn(
    spend,
    CATEGORIES.EDUCATION,
    card,
    bestOf,
    12,
  );
  return Math.round(cat.returnInr);
}

const tiers = [
  { min_spend_per_period_inr: 0, rate: 3 },
  { min_spend_per_period_inr: 20000, rate: 10 },
];
const marginal: DirectSwipeSchedule = { mode: "marginal", period: "monthly", tiers };
const whole: DirectSwipeSchedule = { mode: "whole", period: "monthly", tiers };

let pass = 0,
  fail = 0;
function check(label: string, got: number, want: number) {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: got ${got}, want ${want}`);
  ok ? pass++ : fail++;
}

// annual threshold = 20000 * 12 = 240000
// marginal: first 240k @3%, rest @10%
check("marginal spend<threshold (120k)", ret(marginal, 120000), 3600); // 120k*3%
check("marginal spend>threshold (360k)", ret(marginal, 360000), 7200 + 12000); // 240k*3% + 120k*10%
check("marginal spend=threshold (240k)", ret(marginal, 240000), 7200); // 240k*3%

// whole: cross 240k => all @10%, else all @3%
check("whole spend<threshold (120k)", ret(whole, 120000), 3600); // 120k*3%
check("whole spend>threshold (360k)", ret(whole, 360000), 36000); // 360k*10%
check("whole spend=threshold (240k)", ret(whole, 240000), 24000); // 240k*10%

// flat rule unaffected
check("flat 5% (100k)", ret(null, 100000, 5), 5000);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
