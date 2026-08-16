import { MarketInfo } from "types/markets";
import { TokenData, TokenPrices } from "types/tokens";
import { FindSwapPath, WithdrawalAmounts } from "types/trade";
import { bigMath } from "utils/bigmath";
import { marketTokenAmountToUsd } from "utils/markets";
import { applyFactor } from "utils/numbers";
import { convertToTokenAmount, convertToUsd } from "utils/tokens";

export type GetWithdrawalAmountsParams = {
  marketInfo: MarketInfo;
  marketTokenDecimals: number;
  marketTokenTotalSupply: bigint;
  longToken: TokenData;
  shortToken: TokenData;
  longTokenPrices: TokenPrices;
  shortTokenPrices: TokenPrices;
  marketTokenAmount: bigint;
  uiFeeFactor: bigint;
  /** If provided, will swap all output to this token address */
  wrappedReceiveTokenAddress?: string;
  /** Function to find swap path, required when wrappedReceiveTokenAddress is set */
  findSwapPath?: FindSwapPath;
};

export function getWithdrawalAmounts(p: GetWithdrawalAmountsParams): WithdrawalAmounts {
  const {
    marketInfo,
    marketTokenDecimals,
    marketTokenTotalSupply,
    longToken,
    shortToken,
    longTokenPrices,
    shortTokenPrices,
    marketTokenAmount,
    uiFeeFactor,
    wrappedReceiveTokenAddress,
    findSwapPath,
  } = p;

  const longPoolAmount = marketInfo.longPoolAmount;
  const shortPoolAmount = marketInfo.shortPoolAmount;

  const longPoolUsd = convertToUsd(longPoolAmount, longToken.decimals, longTokenPrices.maxPrice) ?? 0n;
  const shortPoolUsd = convertToUsd(shortPoolAmount, shortToken.decimals, shortTokenPrices.maxPrice) ?? 0n;

  const totalPoolUsd = longPoolUsd + shortPoolUsd;

  const values: WithdrawalAmounts = {
    marketTokenAmount: 0n,
    marketTokenUsd: 0n,
    longTokenAmount: 0n,
    longTokenBeforeSwapAmount: 0n,
    longTokenUsd: 0n,
    shortTokenAmount: 0n,
    shortTokenBeforeSwapAmount: 0n,
    shortTokenUsd: 0n,
    hlvTokenAmount: 0n,
    hlvTokenUsd: 0n,
    swapFeeUsd: 0n,
    uiFeeUsd: 0n,
    swapPriceImpactDeltaUsd: 0n,
    longTokenSwapPathStats: undefined,
    shortTokenSwapPathStats: undefined,
  };

  if (totalPoolUsd === 0n) {
    return values;
  }

  values.marketTokenAmount = marketTokenAmount;
  values.marketTokenUsd = marketTokenAmountToUsd(
    marketInfo,
    marketTokenDecimals,
    marketTokenTotalSupply,
    marketTokenAmount
  );

  // Distribute withdrawal proportionally to pool composition
  values.longTokenUsd = totalPoolUsd > 0n ? bigMath.mulDiv(values.marketTokenUsd, longPoolUsd, totalPoolUsd) : 0n;
  values.shortTokenUsd = totalPoolUsd > 0n ? bigMath.mulDiv(values.marketTokenUsd, shortPoolUsd, totalPoolUsd) : 0n;

  // Withdrawal execution uses the withdrawal fee with balanceWasImproved=false.
  const longWithdrawalFeeUsd = applyFactor(values.longTokenUsd, marketInfo.withdrawalFeeFactorForBalanceWasNotImproved);
  const shortWithdrawalFeeUsd = applyFactor(
    values.shortTokenUsd,
    marketInfo.withdrawalFeeFactorForBalanceWasNotImproved
  );

  // Apply UI fees
  const longUiFeeUsd = applyFactor(values.marketTokenUsd, uiFeeFactor);
  const shortUiFeeUsd = applyFactor(values.shortTokenUsd, uiFeeFactor);

  values.uiFeeUsd = applyFactor(values.marketTokenUsd, uiFeeFactor);
  values.swapFeeUsd = longWithdrawalFeeUsd + shortWithdrawalFeeUsd;

  // Deduct fees from output
  values.longTokenUsd = values.longTokenUsd - longWithdrawalFeeUsd - longUiFeeUsd;
  values.shortTokenUsd = values.shortTokenUsd - shortWithdrawalFeeUsd - shortUiFeeUsd;

  // Convert to token amounts (before any swap)
  values.longTokenAmount =
    convertToTokenAmount(values.longTokenUsd, longToken.decimals, longTokenPrices.maxPrice) ?? 0n;
  values.longTokenBeforeSwapAmount = values.longTokenAmount;
  values.shortTokenAmount =
    convertToTokenAmount(values.shortTokenUsd, shortToken.decimals, shortTokenPrices.maxPrice) ?? 0n;
  values.shortTokenBeforeSwapAmount = values.shortTokenAmount;

  // Handle swap to single receive token if specified
  if (wrappedReceiveTokenAddress) {
    // Special case: longToken and shortToken are the same token
    // No swap needed, just combine the amounts
    if (longToken.address === shortToken.address) {
      // Both tokens are the same, combine them into the receive token
      const totalUsd = values.longTokenUsd + values.shortTokenUsd;
      const totalAmount = values.longTokenAmount + values.shortTokenAmount;

      if (wrappedReceiveTokenAddress === shortToken.address) {
        values.shortTokenUsd = totalUsd;
        values.shortTokenAmount = totalAmount;
        values.longTokenUsd = 0n;
        values.longTokenAmount = 0n;
      } else if (wrappedReceiveTokenAddress === longToken.address) {
        values.longTokenUsd = totalUsd;
        values.longTokenAmount = totalAmount;
        values.shortTokenUsd = 0n;
        values.shortTokenAmount = 0n;
      }
    } else if (findSwapPath) {
      // Normal case: different tokens, need to swap
      if (wrappedReceiveTokenAddress === longToken.address) {
        // User wants to receive only longToken, swap shortToken to longToken
        const shortToLongSwapPathStats = findSwapPath(values.shortTokenUsd);
        if (shortToLongSwapPathStats) {
          values.shortTokenSwapPathStats = shortToLongSwapPathStats;
          values.longTokenUsd += shortToLongSwapPathStats.usdOut;
          values.longTokenAmount =
            convertToTokenAmount(values.longTokenUsd, longToken.decimals, longTokenPrices.maxPrice) ?? 0n;
          values.shortTokenUsd = 0n;
          values.shortTokenAmount = 0n;
        }
      } else if (wrappedReceiveTokenAddress === shortToken.address) {
        // User wants to receive only shortToken, swap longToken to shortToken
        const longToShortSwapPathStats = findSwapPath(values.longTokenUsd);
        if (longToShortSwapPathStats) {
          values.longTokenSwapPathStats = longToShortSwapPathStats;
          values.shortTokenUsd += longToShortSwapPathStats.usdOut;
          values.shortTokenAmount =
            convertToTokenAmount(values.shortTokenUsd, shortToken.decimals, shortTokenPrices.maxPrice) ?? 0n;
          values.longTokenUsd = 0n;
          values.longTokenAmount = 0n;
        }
      }
    }
  }

  return values;
}
