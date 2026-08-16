import { USD_DECIMALS } from '@hertzflow/sdk-v2/configs/factors';
import { bigMath } from '@hertzflow/sdk-v2/utils/bigmath';
import { expandDecimals } from '@hertzflow/sdk-v2/utils/numbers';
import {
  convertToTokenAmount,
  convertToUsd,
} from '@hertzflow/sdk-v2/utils/tokens';

import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type { TokenData } from '@hertzflow/sdk-v2/types/tokens';
import type { Address } from 'viem';

export type {
  Market,
  MarketInfo,
  MarketPoolTokens,
  MarketsData,
  MarketsInfoData,
  MarketValues,
  MarketConfig,
  ClaimableFunding,
  ClaimableFundingData,
} from '@hertzflow/sdk-v2/types/markets';

export type { TokenData, TokensData } from '@hertzflow/sdk-v2/types/tokens';

export function usdToMarketTokenAmount(
  marketInfo: MarketInfo,
  marketTokenDecimals: number,
  marketTokenSupply: bigint,
  usdValue: bigint,
): bigint {
  const poolValue = marketInfo.poolValueMax!;

  if (marketTokenSupply == 0n && poolValue == 0n) {
    return convertToTokenAmount(
      usdValue,
      marketTokenDecimals,
      expandDecimals(1, USD_DECIMALS),
    )!;
  }

  if (marketTokenSupply == 0n && poolValue > 0) {
    return convertToTokenAmount(
      usdValue + poolValue,
      marketTokenDecimals,
      expandDecimals(1, USD_DECIMALS),
    )!;
  }

  if (poolValue == 0n) {
    return 0n;
  }

  return bigMath.mulDiv(marketTokenSupply, usdValue, poolValue);
}

export function marketTokenAmountToUsd(
  marketInfo: MarketInfo,
  marketTokenDecimals: number,
  marketTokenSupply: bigint,
  amount: bigint,
): bigint {
  const poolValue = marketInfo.poolValueMax!;

  const price =
    marketTokenSupply == 0n
      ? expandDecimals(1, USD_DECIMALS)
      : bigMath.mulDiv(
        poolValue,
        expandDecimals(1, marketTokenDecimals),
        marketTokenSupply,
      );

  return convertToUsd(amount, marketTokenDecimals, price)!;
}

export interface HlvMarket {
  address: string;
  isDisabled: boolean;
  hlvMaxMarketTokenBalanceAmount: bigint;
  marketTokenBalance: bigint;
}

export type HlvInfo = {
  hlvToken: TokenData & {
    contractSymbol: string;
  };
  hlvTokenAddress: string;
  longTokenAddress: string;
  shortTokenAddress: string;
  isSameCollaterals: boolean;
  isSpotOnly: boolean;
  name: string;
  longToken: TokenData;
  shortToken: TokenData;
  markets: HlvMarket[];
  shiftLastExecutedAt: bigint;
  shiftMinInterval: bigint;
  isDisabled: boolean;
  poolValueMax: bigint;
  poolValueMin: bigint;
  data: string;
  isHlv: true;
};

export type HlvInfoData = {
  [key in string]: HlvInfo;
};

export type HlvOrMarketInfo =
  | import('@hertzflow/sdk-v2/types/markets').MarketInfo
  | HlvInfo;

export type MarketAndHlvInfoData = {
  [marketAddress: string]:
  | import('@hertzflow/sdk-v2/types/markets').MarketInfo
  | HlvInfo;
};

export type CreateDepositParamsAddresses = {
  receiver: Address;
  callbackContract: Address;
  uiFeeReceiver: Address;
  market: Address;
  initialLongToken: Address;
  initialShortToken: Address;
  longTokenSwapPath: Address[];
  shortTokenSwapPath: Address[];
};

export type CreateDepositParams = {
  addresses: CreateDepositParamsAddresses;
  minMarketTokens: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
  dataList: `0x${string}`[];
};

export type RawCreateDepositParams = Omit<CreateDepositParams, 'executionFee'>;

export type CreateHlvDepositAddresses = {
  hlv: Address;
  market: Address;
  receiver: Address;
  callbackContract: Address;
  uiFeeReceiver: Address;
  initialLongToken: Address;
  initialShortToken: Address;
  longTokenSwapPath: Address[];
  shortTokenSwapPath: Address[];
};

export type CreateHlvDepositParams = {
  addresses: CreateHlvDepositAddresses;
  minHlvTokens: bigint;
  executionFee: bigint;
  callbackGasLimit: bigint;
  shouldUnwrapNativeToken: boolean;
  isMarketTokenDeposit: boolean;
  dataList: `0x${string}`[];
};

export type RawCreateHlvDepositParams = Omit<
  CreateHlvDepositParams,
  'executionFee'
>;

export type CreateWithdrawalAddresses = {
  receiver: Address;
  callbackContract: Address;
  uiFeeReceiver: Address;
  market: Address;
  longTokenSwapPath: Address[];
  shortTokenSwapPath: Address[];
};

export type CreateWithdrawalParams = {
  addresses: CreateWithdrawalAddresses;
  minLongTokenAmount: bigint;
  minShortTokenAmount: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
  dataList: `0x${string}`[];
};

export type RawCreateWithdrawalParams = Omit<
  CreateWithdrawalParams,
  'executionFee'
>;

export type CreateHlvWithdrawalAddresses = {
  receiver: Address;
  callbackContract: Address;
  uiFeeReceiver: Address;
  market: Address;
  hlv: Address;
  longTokenSwapPath: Address[];
  shortTokenSwapPath: Address[];
};

export type CreateHlvWithdrawalParams = {
  addresses: CreateHlvWithdrawalAddresses;
  minLongTokenAmount: bigint;
  minShortTokenAmount: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
  dataList: `0x${string}`[];
};

export type RawCreateHlvWithdrawalParams = Omit<
  CreateHlvWithdrawalParams,
  'executionFee'
>;
