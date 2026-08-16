import type { HlvListItem } from '../types';

export function selectScopedHlvs(
  hlvList: HlvListItem[],
  marketsInfoData: Record<string, unknown>,
  vaultAddresses?: readonly string[],
) {
  const allowedVaults = vaultAddresses
    ? new Set(vaultAddresses.map((address) => address.toLowerCase()))
    : undefined;
  const availableMarkets = new Set(
    Object.keys(marketsInfoData).map((address) => address.toLowerCase()),
  );

  return hlvList.filter(({ hlv, markets }) => {
    if (markets.length === 0) return false;
    if (
      allowedVaults &&
      !allowedVaults.has(hlv.hlvToken.toLowerCase())
    ) {
      return false;
    }
    return markets.every((market) =>
      availableMarkets.has(market.toLowerCase()),
    );
  });
}
