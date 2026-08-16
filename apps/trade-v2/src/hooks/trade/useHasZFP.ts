import { CREDIT_MARKET_CATEGORY } from '@/common/constants';
import type { Inst } from '@/common/services';
import { useMarketConfigs } from '@/common/services/rest/market';
export const checkMarketHasZFP = (
  inst: Inst | undefined,
  marketConfig: { isZFPEnabled?: boolean } | undefined,
): boolean => {
  if (!inst?.marketTokenAddress) return false;
  if (inst.category === CREDIT_MARKET_CATEGORY) return false;
  return marketConfig?.isZFPEnabled ?? false;
};

export const checkHasZFP = (
  inst: Inst | undefined,
  marketsConfigs: Record<string, { isZFPEnabled?: boolean }> | undefined,
): boolean => {
  return checkMarketHasZFP(
    inst,
    inst?.marketTokenAddress
      ? marketsConfigs?.[inst.marketTokenAddress]
      : undefined,
  );
};

export const useHasZFP = (inst?: Inst): boolean => {
  const { data: marketConfig } = useMarketConfigs(inst);
  return checkMarketHasZFP(inst, marketConfig);
};
