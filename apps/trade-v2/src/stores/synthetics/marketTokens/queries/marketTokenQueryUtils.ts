import { getAddress, type Address } from 'viem';
import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';

type MarketDependencyInst = {
  indexTokenAddress: string;
  longTokenAddress: string;
  shortTokenAddress: string;
};

const getAddressValue = <T,>(
  values: Record<string, T>,
  checksumAddress: string,
  rawAddress: string,
) =>
  values[checksumAddress] ??
  values[checksumAddress.toLowerCase()] ??
  values[rawAddress] ??
  values[rawAddress.toLowerCase()];

export function getRequestableMarketAddresses(
  marketAddresses: readonly Address[],
  instsMap: Record<string, MarketDependencyInst>,
  pricesMap: Record<string, TokenPrices>,
  coinsMap: Record<string, { decimals?: number }>,
) {
  return marketAddresses.filter((rawMarketAddress) => {
    try {
      const marketAddress = getAddress(rawMarketAddress) as Address;
      const inst = getAddressValue(instsMap, marketAddress, rawMarketAddress);
      if (!inst) return false;

      const tokenAddresses = [
        inst.indexTokenAddress,
        inst.longTokenAddress,
        inst.shortTokenAddress,
      ];

      return tokenAddresses.every((rawTokenAddress) => {
        const tokenAddress = getAddress(rawTokenAddress);
        const tokenPrices = getAddressValue(
          pricesMap,
          tokenAddress,
          rawTokenAddress,
        );
        const token = getAddressValue(coinsMap, tokenAddress, rawTokenAddress);
        return Boolean(tokenPrices && typeof token?.decimals === 'number');
      });
    } catch {
      return false;
    }
  });
}

export { getAddressValue };
