import { MAX_PNL_FACTOR_FOR_TRADERS_KEY, MAX_PNL_FACTOR_FOR_WITHDRAWALS_KEY } from "configs/dataStore";
import { Market } from "types/markets";
import { TokenPrices, TokensData } from "types/tokens";
import { hashMarketConfigKeys, hashMarketValuesKeys } from "utils/marketKeysAndConfigs";
import { getContractMarketPrices } from "utils/markets";
import type { ContractCallsConfig } from "utils/multicall";

import { MarketConfigMulticallRequestConfig, MarketValuesMulticallRequestConfig } from "./types";
import { getHashedMarketConfigKeys, getHashedMarketValuesKeys } from "../../prebuilt";
import { Address } from "viem";

export async function buildMarketsValuesRequest(
  chainId: number,
  {
    markets,
    prices,
    tokensData,
    dataStoreAddress,
    syntheticsReaderAddress,
    warn,
  }: {
    markets: Market[];
    prices: Record<Address, TokenPrices>;
    tokensData: TokensData | undefined;
    dataStoreAddress: string;
    syntheticsReaderAddress: string;
    warn?: (...args: unknown[]) => void;
  }
) {
  const request: MarketValuesMulticallRequestConfig = {};
  if (!markets?.length) {
    return request;
  }

  const hashedMarketValuesKeys = await getHashedMarketValuesKeys();

  for (const market of markets) {
    const marketAddress = market.marketTokenAddress;

    const marketPrices = getContractMarketPrices(tokensData!, market, prices, chainId)!;

    if (!marketPrices) {
      warn?.(`No market prices for ${marketAddress}, skipping market values request`);
      continue;
    }

    const marketProps = {
      marketToken: market.marketTokenAddress,
      indexToken: market.indexTokenAddress,
      longToken: market.longTokenAddress,
      shortToken: market.shortTokenAddress,
    };

    request[`${marketAddress}-reader`] = {
      contractAddress: syntheticsReaderAddress,
      abiId: "SyntheticsReader",
      calls: {
        marketInfo: {
          methodName: "getMarketInfo",
          params: [dataStoreAddress, marketPrices, marketAddress],
        },
        marketTokenPriceMax: {
          methodName: "getMarketTokenPrice",
          params: [
            dataStoreAddress,
            marketProps,
            marketPrices.indexTokenPrice,
            marketPrices.longTokenPrice,
            marketPrices.shortTokenPrice,
            MAX_PNL_FACTOR_FOR_TRADERS_KEY,
            true,
          ],
        },
        marketTokenPriceMin: {
          methodName: "getMarketTokenPrice",
          params: [
            dataStoreAddress,
            marketProps,
            marketPrices.indexTokenPrice,
            marketPrices.longTokenPrice,
            marketPrices.shortTokenPrice,
            MAX_PNL_FACTOR_FOR_TRADERS_KEY,
            false,
          ],
        },
        marketTokenPriceMinForWithdrawals: {
          methodName: "getMarketTokenPrice",
          params: [
            dataStoreAddress,
            marketProps,
            marketPrices.indexTokenPrice,
            marketPrices.longTokenPrice,
            marketPrices.shortTokenPrice,
            MAX_PNL_FACTOR_FOR_WITHDRAWALS_KEY,
            false,
          ],
        },
      },
    } satisfies ContractCallsConfig<any>;

    let prebuiltHashedKeys = hashedMarketValuesKeys[chainId]?.[marketAddress];

    if (!prebuiltHashedKeys) {
      warn?.(
        `No pre-built hashed market keys found for the market ${marketAddress}. Run \`yarn prebuild\` to generate them.`
      );

      prebuiltHashedKeys = hashMarketValuesKeys(market);
    }

    const keys = {
      ...hashMarketValuesKeys(market),
      ...prebuiltHashedKeys,
    };

    request[`${marketAddress}-dataStore`] = {
      contractAddress: dataStoreAddress,
      abiId: "DataStore",
      calls: {
        longPoolAmount: {
          methodName: "getUint",
          params: [keys.longPoolAmount],
        },
        shortPoolAmount: {
          methodName: "getUint",
          params: [keys.shortPoolAmount],
        },
        positionImpactPoolAmount: {
          methodName: "getUint",
          params: [keys.positionImpactPoolAmount],
        },
        lentPositionImpactPoolAmount: {
          methodName: "getUint",
          params: [keys.lentPositionImpactPoolAmount],
        },
        swapImpactPoolAmountLong: {
          methodName: "getUint",
          params: [keys.swapImpactPoolAmountLong],
        },
        swapImpactPoolAmountShort: {
          methodName: "getUint",
          params: [keys.swapImpactPoolAmountShort],
        },
        longInterestUsingLongToken: {
          methodName: "getUint",
          params: [keys.longInterestUsingLongToken],
        },
        longInterestUsingShortToken: {
          methodName: "getUint",
          params: [keys.longInterestUsingShortToken],
        },
        shortInterestUsingLongToken: {
          methodName: "getUint",
          params: [keys.shortInterestUsingLongToken],
        },
        shortInterestUsingShortToken: {
          methodName: "getUint",
          params: [keys.shortInterestUsingShortToken],
        },
        longInterestInTokensUsingLongToken: {
          methodName: "getUint",
          params: [keys.longInterestInTokensUsingLongToken],
        },
        longInterestInTokensUsingShortToken: {
          methodName: "getUint",
          params: [keys.longInterestInTokensUsingShortToken],
        },
        shortInterestInTokensUsingLongToken: {
          methodName: "getUint",
          params: [keys.shortInterestInTokensUsingLongToken],
        },
        shortInterestInTokensUsingShortToken: {
          methodName: "getUint",
          params: [keys.shortInterestInTokensUsingShortToken],
        },
      },
    } satisfies ContractCallsConfig<any>;
  }

  return request;
}

export async function buildMarketsConfigsRequest(
  chainId: number,
  {
    markets,
    dataStoreAddress,
    warn,
  }: {
    markets: Market[];
    dataStoreAddress: string;
    warn?: (...args: unknown[]) => void;
  }
) {
  const request: MarketConfigMulticallRequestConfig = {};
  if (!markets?.length) {
    return request;
  }

  const hashedMarketConfigKeys = await getHashedMarketConfigKeys();

  for (const market of markets) {
    const marketAddress = market.marketTokenAddress;

    let prebuiltHashedKeys = hashedMarketConfigKeys[chainId]?.[marketAddress];

    if (!prebuiltHashedKeys) {
      warn?.(
        `No pre-built hashed config keys found for the market ${marketAddress}. Run \`yarn prebuild\` to generate them.`
      );
      prebuiltHashedKeys = hashMarketConfigKeys(market);
    }

    const keys = {
      ...hashMarketConfigKeys(market),
      ...prebuiltHashedKeys,
    };

    request[`${marketAddress}-dataStore`] = {
      contractAddress: dataStoreAddress,
      abiId: "DataStore",
      calls: {
        isDisabled: {
          methodName: "getBool",
          params: [keys.isDisabled],
        },
        maxLongPoolAmount: {
          methodName: "getUint",
          params: [keys.maxLongPoolAmount],
        },
        maxShortPoolAmount: {
          methodName: "getUint",
          params: [keys.maxShortPoolAmount],
        },
        maxLongPoolUsdForDeposit: {
          methodName: "getUint",
          params: [keys.maxLongPoolUsdForDeposit],
        },
        maxShortPoolUsdForDeposit: {
          methodName: "getUint",
          params: [keys.maxShortPoolUsdForDeposit],
        },
        reserveFactorLong: {
          methodName: "getUint",
          params: [keys.reserveFactorLong],
        },
        reserveFactorShort: {
          methodName: "getUint",
          params: [keys.reserveFactorShort],
        },
        openInterestReserveFactorLong: {
          methodName: "getUint",
          params: [keys.openInterestReserveFactorLong],
        },
        openInterestReserveFactorShort: {
          methodName: "getUint",
          params: [keys.openInterestReserveFactorShort],
        },
        maxOpenInterestLong: {
          methodName: "getUint",
          params: [keys.maxOpenInterestLong],
        },
        maxOpenInterestShort: {
          methodName: "getUint",
          params: [keys.maxOpenInterestShort],
        },
        maxPnlFactorForTradersLong: {
          methodName: "getUint",
          params: [keys.maxPnlFactorForTradersLong],
        },
        maxPnlFactorForTradersShort: {
          methodName: "getUint",
          params: [keys.maxPnlFactorForTradersShort],
        },
        maxPnlFactorForWithdrawalsLong: {
          methodName: "getUint",
          params: [keys.maxPnlFactorForWithdrawalsLong],
        },
        maxPnlFactorForWithdrawalsShort: {
          methodName: "getUint",
          params: [keys.maxPnlFactorForWithdrawalsShort],
        },
        withdrawalFeeFactorForBalanceWasImproved: {
          methodName: "getUint",
          params: [keys.withdrawalFeeFactorForBalanceWasImproved],
        },
        withdrawalFeeFactorForBalanceWasNotImproved: {
          methodName: "getUint",
          params: [keys.withdrawalFeeFactorForBalanceWasNotImproved],
        },
        depositFeeFactorForBalanceWasImproved: {
          methodName: "getUint",
          params: [keys.depositFeeFactorForBalanceWasImproved],
        },
        depositFeeFactorForBalanceWasNotImproved: {
          methodName: "getUint",
          params: [keys.depositFeeFactorForBalanceWasNotImproved],
        },
        swapFeeReceiverFactor: {
          methodName: "getUint",
          params: [keys.swapFeeReceiverFactor],
        },
        maxLendableImpactFactorForWithdrawals: {
          methodName: "getUint",
          params: [keys.maxLendableImpactFactorForWithdrawals],
        },
        positionFeeFactorForBalanceWasImproved: {
          methodName: "getUint",
          params: [keys.positionFeeFactorForBalanceWasImproved],
        },
        positionFeeFactorForBalanceWasNotImproved: {
          methodName: "getUint",
          params: [keys.positionFeeFactorForBalanceWasNotImproved],
        },
        positionImpactFactorPositive: {
          methodName: "getUint",
          params: [keys.positionImpactFactorPositive],
        },
        positionImpactFactorNegative: {
          methodName: "getUint",
          params: [keys.positionImpactFactorNegative],
        },
        maxPositionImpactFactorPositive: {
          methodName: "getUint",
          params: [keys.maxPositionImpactFactorPositive],
        },
        maxPositionImpactFactorNegative: {
          methodName: "getUint",
          params: [keys.maxPositionImpactFactorNegative],
        },
        maxPositionImpactFactorForLiquidations: {
          methodName: "getUint",
          params: [keys.maxPositionImpactFactorForLiquidations],
        },
        minCollateralFactor: {
          methodName: "getUint",
          params: [keys.minCollateralFactor],
        },
        minCollateralFactorForLiquidation: {
          methodName: "getUint",
          params: [keys.minCollateralFactorForLiquidation],
        },
        minCollateralFactorForOpenInterestLong: {
          methodName: "getUint",
          params: [keys.minCollateralFactorForOpenInterestLong],
        },
        minCollateralFactorForOpenInterestShort: {
          methodName: "getUint",
          params: [keys.minCollateralFactorForOpenInterestShort],
        },
        positionImpactExponentFactor: {
          methodName: "getUint",
          params: [keys.positionImpactExponentFactor],
        },
        swapFeeFactorForBalanceWasImproved: {
          methodName: "getUint",
          params: [keys.swapFeeFactorForBalanceWasImproved],
        },
        swapFeeFactorForBalanceWasNotImproved: {
          methodName: "getUint",
          params: [keys.swapFeeFactorForBalanceWasNotImproved],
        },
        atomicSwapFeeFactor: {
          methodName: "getUint",
          params: [keys.atomicSwapFeeFactor],
        },
        swapImpactFactorPositive: {
          methodName: "getUint",
          params: [keys.swapImpactFactorPositive],
        },
        swapImpactFactorNegative: {
          methodName: "getUint",
          params: [keys.swapImpactFactorNegative],
        },
        swapImpactExponentFactor: {
          methodName: "getUint",
          params: [keys.swapImpactExponentFactor],
        },
        isZFPEnabled: {
          methodName: "getBool",
          params: [keys.isZFPEnabled],
        },
        minZFPCollateralFactor: {
          methodName: "getUint",
          params: [keys.minZFPCollateralFactor],
        },
        maxZFPCollateralFactor: {
          methodName: "getUint",
          params: [keys.maxZFPCollateralFactor],
        },
        minZFPCollateralFactorForLiquidation: {
          methodName: "getUint",
          params: [keys.minZFPCollateralFactorForLiquidation],
        },
        maxProfitFactor: {
          methodName: "getUint",
          params: [keys.maxProfitFactor],
        },
        lossRebateRate: {
          methodName: "getUint",
          params: [keys.lossRebateRate],
        },
      },
    } satisfies ContractCallsConfig<any>;
  }

  return request;
}
