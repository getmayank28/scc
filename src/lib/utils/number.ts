export function formatNumber(val:number) {
    const value = Number(val)
    if (Number(value) >= 100000) {
      const num = (value / 100000).toFixed(1);
      return `${num.endsWith('.0') ? num.slice(0, -2) : num}L`;
    }
  
    if (value >= 1000) {
      const num = (value / 1000).toFixed(1);
      return `${num.endsWith('.0') ? num.slice(0, -2) : num}K`;
    }
  
    return value?.toString();
  }


  export function calculateRewardsSpendRatio(
    totalRewardsEarned?: number | null,
    totalAmountSpent?: number | null,
    precision: number = 1
  ): number {
    const earned = Number(totalRewardsEarned) || 0;
    const spent = Number(totalAmountSpent) || 0;
    const total = earned + spent;
  
    if (total === 0) return 0;
  
    const factor = Math.pow(10, precision);
    return Math.round((earned / total) * factor) / factor;
  }
  