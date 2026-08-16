import { Market } from "types/markets";
import { MulticallRequestConfig } from "utils/multicall";

export type MarketsResult = Market[];

export type MarketValuesMulticallRequestConfig = MulticallRequestConfig<{
  [key: `${string}-reader`]: {
    calls: Record<
      "marketInfo" | "marketTokenPriceMax" | "marketTokenPriceMin" | "marketTokenPriceMinForWithdrawals",
      {
        methodName: string;
        params: any[];
      }
    >;
  };
  [key: `${string}-dataStore`]: {
    calls: Record<
      | "longPoolAmount"
      | "shortPoolAmount"
      | "positionImpactPoolAmount"
      | "lentPositionImpactPoolAmount"
      | "swapImpactPoolAmountLong"
      | "swapImpactPoolAmountShort"
      | "longInterestUsingLongToken"
      | "longInterestUsingShortToken"
      | "shortInterestUsingLongToken"
      | "shortInterestUsingShortToken"
      | "longInterestInTokensUsingLongToken"
      | "longInterestInTokensUsingShortToken"
      | "shortInterestInTokensUsingLongToken"
      | "shortInterestInTokensUsingShortToken",
      {
        methodName: string;
        params: any[];
      }
    >;
  };
}>;

export type MarketConfigMulticallRequestConfig = MulticallRequestConfig<{
  [key: `${string}-dataStore`]: {
    calls: Record<
      | "isDisabled"
      | "maxLongPoolAmount"
      | "maxShortPoolAmount"
      | "maxLongPoolUsdForDeposit"
      | "maxShortPoolUsdForDeposit"
      | "reserveFactorLong"
      | "reserveFactorShort"
      | "openInterestReserveFactorLong"
      | "openInterestReserveFactorShort"
      | "maxOpenInterestLong"
      | "maxOpenInterestShort"
      | "maxPnlFactorForTradersLong"
      | "maxPnlFactorForTradersShort"
      | "maxPnlFactorForWithdrawalsLong"
      | "maxPnlFactorForWithdrawalsShort"
      | "maxLendableImpactFactorForWithdrawals"
      | "withdrawalFeeFactorForBalanceWasImproved"
      | "withdrawalFeeFactorForBalanceWasNotImproved"
      | "depositFeeFactorForBalanceWasImproved"
      | "depositFeeFactorForBalanceWasNotImproved"
      | "swapFeeReceiverFactor"
      | "positionFeeFactorForBalanceWasImproved"
      | "positionFeeFactorForBalanceWasNotImproved"
      | "positionImpactFactorPositive"
      | "positionImpactFactorNegative"
      | "maxPositionImpactFactorPositive"
      | "maxPositionImpactFactorNegative"
      | "maxPositionImpactFactorForLiquidations"
      | "minCollateralFactor"
      | "minCollateralFactorForLiquidation"
      | "minCollateralFactorForOpenInterestLong"
      | "minCollateralFactorForOpenInterestShort"
      | "positionImpactExponentFactor"
      | "swapFeeFactorForBalanceWasImproved"
      | "swapFeeFactorForBalanceWasNotImproved"
      | "atomicSwapFeeFactor"
      | "swapImpactFactorPositive"
      | "swapImpactFactorNegative"
      | "swapImpactExponentFactor"
      | "isZFPEnabled"
      | "minZFPCollateralFactor"
      | "maxZFPCollateralFactor"
      | "minZFPCollateralFactorForLiquidation"
      | "maxProfitFactor"
      | "lossRebateRate",
      {
        methodName: string;
        params: any[];
      }
    >;
  };
}>;

export type KinkModelMarketRateMulticallRequestConfig = MulticallRequestConfig<{
  [key: `${string}-dataStore`]: {
    calls: Record<
      | "optimalUsageFactorLong"
      | "optimalUsageFactorShort"
      | "baseBorrowingFactorLong"
      | "baseBorrowingFactorShort"
      | "aboveOptimalUsageBorrowingFactorLong"
      | "aboveOptimalUsageBorrowingFactorShort",
      {
        methodName: string;
        params: any[];
      }
    >;
  };
}>;
