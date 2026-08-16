import { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import { getAvailableUsdLiquidityForPosition } from '@hertzflow/sdk-v2/utils/markets';
import { Address } from 'viem';
import { calc } from '@repo/lib/calc';
import {
  usePriceStore,
  useInstStore,
  useMarketConfigs,
  useMarketValues,
  CONTRACT_USD_MULTIPLIER,
} from '@/common';

export const useAvailableLiquidity = (marketAddress?: Address) => {
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const inst = marketAddress ? insts[marketAddress] : undefined;
  const { data: marketConfig } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const pricesMap = usePriceStore((state) => state.pricesMap);

  return marketAddress && insts[marketAddress] && marketConfig && marketValues
    ? {
        longAvailableLiquidity: calc(
          getAvailableUsdLiquidityForPosition(
            {
              ...insts[marketAddress],
              ...marketConfig,
              ...marketValues,
            } as unknown as MarketInfo,
            true,
            pricesMap,
            coins,
          ).toString(),
        ).div(CONTRACT_USD_MULTIPLIER),
        shortAvailableLiquidity: calc(
          getAvailableUsdLiquidityForPosition(
            {
              ...insts[marketAddress],
              ...marketConfig,
              ...marketValues,
            } as unknown as MarketInfo,
            false,
            pricesMap,
            coins,
          ).toString(),
        ).div(CONTRACT_USD_MULTIPLIER),
      }
    : {
        longAvailableLiquidity: '',
        shortAvailableLiquidity: '',
      };
};
