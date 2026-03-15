import {
  card_meta_axis,
  card_milestones_axis,
  card_redemption_axis,
  card_rewards_rules_axis,
} from "./axis-atlas";
import {
  card_meta_infinia,
  card_milestones_infinia,
  card_redemption_infinia,
  card_rewards_rules_infinia,
} from "./hdfc-infinia-metal";
import {
  card_meta_regalia,
  card_milestones_regalia,
  card_redemption_regalia,
  card_rewards_rules_regalia,
} from "./hdfc-regalia-gold";
import {
  card_meta_emeralde,
  card_milestones_emeralde,
  card_redemption_emeralde,
  card_rewards_rules_emeralde,
} from "./icici-emeralde-private-metal";
import {
  card_meta_mayura,
  card_milestones_mayura,
  card_redemption_mayura,
  card_rewards_rules_mayura,
} from "./idfc-mayura";

const card_meta = [
  card_meta_axis,
  card_meta_emeralde,
  card_meta_infinia,
  card_meta_mayura,
  card_meta_regalia,
];

const card_rewards = [
  ...card_rewards_rules_axis,
  ...card_rewards_rules_emeralde,
  ...card_rewards_rules_infinia,
  ...card_rewards_rules_mayura,
  ...card_rewards_rules_regalia,
];

const card_redemption = [
  ...card_redemption_axis,
  ...card_redemption_emeralde,
  ...card_redemption_infinia,
  ...card_redemption_mayura,
  ...card_redemption_regalia,
];

const card_milestone = [
  ...card_milestones_axis,
  ...card_milestones_emeralde,
  ...card_milestones_infinia,
  ...card_milestones_mayura,
  ...card_milestones_regalia,
];

export function loadCardData() {
  const cards = card_meta;
  const rules = card_rewards;
  const redemptions = card_redemption;
  const milestones = card_milestone;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map: any = {};

  cards.forEach((card) => {
    map[card.card_id] = {
      meta: card,
      rules: [],
      redemption: [],
      milestones: [],
    };
  });

  rules.forEach((rule) => {
    map[rule.card_id]?.rules.push(rule);
  });

  redemptions.forEach((r) => {
    map[r.card_id]?.redemption.push(r);
  });

  milestones.forEach((m) => {
    map[m.card_id]?.milestones.push(m);
  });

  return Object.values(map);
}
