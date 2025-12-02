interface SlabProps {
  limit: number;
  bill: number;
  online: number;
  offline: number;
}

interface SpendsProps {
  onlineBillPayment: number;
  onlineShopping: number;
  offlineSpend: number;
}

const rewardSlabs = [
  { limit: 15000, bill: 0.01, online: 0.015, offline: 0.01 },
  { limit: 40000, bill: 0.02, online: 0.03, offline: 0.0125 },
  { limit: 75000, bill: 0.02, online: 0.035, offline: 0.015 },
  { limit: 125000, bill: 0.02, online: 0.0375, offline: 0.015 },
  { limit: Infinity, bill: 0.02, online: 0.04, offline: 0.02 },
];

function getCategoryRate(
  amount: number,
  category: "bill" | "online" | "offline"
): number {
  const slab = rewardSlabs.find((s: SlabProps) => amount <= s.limit);
  return slab?.[category] || 0; // "bill", "online", or "offline"
}

export function calculateRewards(spends: SpendsProps) {
  const billRate = getCategoryRate(spends.onlineBillPayment, "bill");
  const onlineRate = getCategoryRate(spends.onlineShopping, "online");
  const offlineRate = getCategoryRate(spends.offlineSpend, "offline");

  const billReward = spends.onlineBillPayment * billRate;
  const onlineShoppingReward = spends.onlineShopping * onlineRate;
  const offlineSpendReward = spends.offlineSpend * offlineRate;

  return {
    billReward,
    onlineShoppingReward,
    offlineSpendReward,
    totalReward: billReward + onlineShoppingReward + offlineSpendReward,
  };
}
