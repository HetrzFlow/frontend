import { Address } from "viem";
import type { TokenData } from "./tokens";

export type PnlFactorType = "FOR_DEPOSITS" | "FOR_WITHDRAWALS" | "FOR_TRADERS";

export type MarketSdkConfig = {
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  isListed: boolean;
};

export type Market = {
  marketTokenAddress: string;
  indexTokenAddress: string;
  longTokenAddress: string;
  shortTokenAddress: string;
  isSameCollaterals: boolean;
  isSpotOnly: boolean;
  internalUsdResolutionError?: boolean;
};

export type MarketPoolTokens = {
  longToken: TokenData;
  shortToken: TokenData;
  indexToken: TokenData;
};

export type MarketInfo = Market &
  MarketPoolTokens & {
    isDisabled: boolean;

    longPoolAmount: bigint;
    shortPoolAmount: bigint;
    longPoolAmountRaw: bigint;
    shortPoolAmountRaw: bigint;

    maxLongPoolAmount: bigint;
    maxShortPoolAmount: bigint;
    maxLongPoolUsdForDeposit: bigint;
    maxShortPoolUsdForDeposit: bigint;

    poolValueMax: bigint;
    poolValueMin: bigint;
    withdrawalPoolValueMin: bigint;

    longPnl: bigint;
    shortPnl: bigint;
    netPnl: bigint;

    reserveFactorLong: bigint;
    reserveFactorShort: bigint;

    openInterestReserveFactorLong: bigint;
    openInterestReserveFactorShort: bigint;

    maxOpenInterestLong: bigint;
    maxOpenInterestShort: bigint;

    totalBorrowingFees: bigint;

    positionImpactPoolAmount: bigint;
    lentPositionImpactPoolAmount: bigint;

    minCollateralFactor: bigint;
    minCollateralFactorForLiquidation: bigint;
    minCollateralFactorForOpenInterestLong: bigint;
    minCollateralFactorForOpenInterestShort: bigint;

    swapImpactPoolAmountLong: bigint;
    swapImpactPoolAmountShort: bigint;

    maxPnlFactorForTradersLong: bigint;
    maxPnlFactorForTradersShort: bigint;
    maxPnlFactorForWithdrawalsLong: bigint;
    maxPnlFactorForWithdrawalsShort: bigint;
    maxLendableImpactFactorForWithdrawals: bigint;
    withdrawalFeeFactorForBalanceWasImproved: bigint;
    withdrawalFeeFactorForBalanceWasNotImproved: bigint;
    depositFeeFactorForBalanceWasImproved: bigint;
    depositFeeFactorForBalanceWasNotImproved: bigint;
    swapFeeReceiverFactor: bigint;

    longInterestUsd: bigint;
    shortInterestUsd: bigint;
    longInterestInTokens: bigint;
    shortInterestInTokens: bigint;

    positionFeeFactorForBalanceWasImproved: bigint;
    positionFeeFactorForBalanceWasNotImproved: bigint;
    positionImpactFactorPositive: bigint;
    positionImpactFactorNegative: bigint;
    maxPositionImpactFactorPositive: bigint;
    maxPositionImpactFactorNegative: bigint;
    maxPositionImpactFactorForLiquidations: bigint;
    positionImpactExponentFactor: bigint;

    swapFeeFactorForBalanceWasImproved: bigint;
    swapFeeFactorForBalanceWasNotImproved: bigint;
    atomicSwapFeeFactor: bigint;
    swapImpactFactorPositive: bigint;
    swapImpactFactorNegative: bigint;
    swapImpactExponentFactor: bigint;

    borrowingFactorPerSecondForLongs: bigint;
    borrowingFactorPerSecondForShorts: bigint;

    fundingFactorPerSecond: bigint;
    longsPayShorts: boolean;

    virtualPoolAmountForLongToken: bigint;
    virtualPoolAmountForShortToken: bigint;
    virtualInventoryForPositions: bigint;

    isZFPEnabled: boolean;
    minZFPCollateralFactor: bigint;
    maxZFPCollateralFactor: bigint;
    minZFPCollateralFactorForLiquidation: bigint;
    maxProfitFactor: bigint;

    lossRebateRate: bigint;
  };

export type MarketsData = {
  [marketTokenAddress: string]: Market;
};

export type MarketsInfoData = {
  [marketAddress: string]: MarketInfo;
};

export type MarketTokensAPRData = {
  [marketTokenAddress: string]: bigint;
};

export type UserEarningsData = {
  byMarketAddress: {
    [marketTokenAddress: string]: {
      total: bigint;
      recent: bigint;
    };
  };

  allMarkets: {
    total: bigint;
    recent: bigint;
    expected365d: bigint;
  };
};

export type ContractMarketPrices = {
  indexTokenPrice: {
    min: bigint;
    max: bigint;
  };
  longTokenPrice: {
    min: bigint;
    max: bigint;
  };
  shortTokenPrice: {
    min: bigint;
    max: bigint;
  };
};

export type ClaimableFunding = {
  longTokenAddress: Address;
  shortTokenAddress: Address;
  claimableFundingAmountLong: bigint;
  claimableFundingAmountShort: bigint;
};

export type ClaimableFundingData = {
  [marketAddress: string]: ClaimableFunding;
};

/**
 * Updates frequently
 */
export type MarketValues = Pick<
  MarketInfo,
  | "longInterestUsd"
  | "shortInterestUsd"
  | "longInterestInTokens"
  | "shortInterestInTokens"
  | "longPoolAmount"
  | "shortPoolAmount"
  | "longPoolAmountRaw"
  | "shortPoolAmountRaw"
  | "poolValueMin"
  | "poolValueMax"
  | "withdrawalPoolValueMin"
  | "longPnl"
  | "shortPnl"
  | "netPnl"
  | "totalBorrowingFees"
  | "positionImpactPoolAmount"
  | "lentPositionImpactPoolAmount"
  | "swapImpactPoolAmountLong"
  | "swapImpactPoolAmountShort"
  | "borrowingFactorPerSecondForLongs"
  | "borrowingFactorPerSecondForShorts"
  | "fundingFactorPerSecond"
  | "longsPayShorts"
  | "virtualPoolAmountForLongToken"
  | "virtualPoolAmountForShortToken"
  | "virtualInventoryForPositions"
>;

/**
 * Updates seldom
 */
export type MarketConfig = Pick<
  MarketInfo,
  | "isDisabled"
  | "maxLongPoolUsdForDeposit"
  | "maxShortPoolUsdForDeposit"
  | "maxLongPoolAmount"
  | "maxShortPoolAmount"
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
  | "minCollateralFactor"
  | "minCollateralFactorForLiquidation"
  | "minCollateralFactorForOpenInterestLong"
  | "minCollateralFactorForOpenInterestShort"
  | "positionFeeFactorForBalanceWasImproved"
  | "positionFeeFactorForBalanceWasNotImproved"
  | "positionImpactFactorPositive"
  | "positionImpactFactorNegative"
  | "maxPositionImpactFactorPositive"
  | "maxPositionImpactFactorNegative"
  | "maxPositionImpactFactorForLiquidations"
  | "positionImpactExponentFactor"
  | "swapFeeFactorForBalanceWasImproved"
  | "swapFeeFactorForBalanceWasNotImproved"
  | "swapImpactFactorPositive"
  | "swapImpactFactorNegative"
  | "swapImpactExponentFactor"
  | "atomicSwapFeeFactor"
  | "isZFPEnabled"
  | "minZFPCollateralFactor"
  | "maxZFPCollateralFactor"
  | "minZFPCollateralFactorForLiquidation"
  | "maxProfitFactor"
  | "lossRebateRate"
>;
