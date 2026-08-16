import { getInternalUsdCollateralPriceTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';

export function getCollateralPriceTokenAddress({
  chainId,
  collateralTokenAddress,
  isCreditMarket,
  usdtTokenAddress,
}: {
  chainId?: number;
  collateralTokenAddress?: string;
  isCreditMarket?: boolean;
  usdtTokenAddress?: string;
}) {
  if (isCreditMarket && usdtTokenAddress) return usdtTokenAddress;

  return getInternalUsdCollateralPriceTokenAddress({
    chainId,
    collateralTokenAddress,
  });
}
