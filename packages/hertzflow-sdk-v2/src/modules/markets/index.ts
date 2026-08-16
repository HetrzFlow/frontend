import { Address, getAddress, zeroAddress } from "viem";

import { getContract } from "configs/contracts";
import { SOURCE_BSC_TESTNET } from "configs/chainIds";
import { getInternalUsdConfig, hydrateInternalUsdConfigs } from "configs/internalUsd";
import { convertTokenAddress } from "configs/tokens";
import { Market, MarketInfo, MarketsInfoData, MarketConfig, MarketValues } from "types/markets";
import { TokenPrices, TokensData } from "types/tokens";
import { getByKey } from "utils/objects";
import { sleep } from "utils/common";

import { Module } from "../base";
import { buildMarketsConfigsRequest, buildMarketsValuesRequest } from "./query-builders";
import { MarketsResult } from "./types";

const BSC_TESTNET_MARKET_BATCH_SIZE = 15;
const BSC_TESTNET_MARKET_BATCH_WAIT_MS = 200;
const MARKETS_CACHE_TIME_MS = 6 * 60 * 60 * 1000;

const chunkBySize = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) {
    return [items];
  }

  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

export class Markets extends Module {
  async getMarketsValues({
    markets,
    prices,
    tokensData,
  }: {
    markets: Market[];
    prices: Record<Address, TokenPrices>;
    tokensData: TokensData | undefined;
  }): Promise<{
    [marketAddress: string]: MarketValues;
  }> {
    const dataStoreAddress = getContract(this.chainId, "DataStore");
    const syntheticsReaderAddress = getContract(this.chainId, "SyntheticsReader");

    const buildResult = (res: any, marketsChunk: Market[]) => {
      const result = marketsChunk.reduce(
        (acc, market) => {
          const marketAddress = market.marketTokenAddress;
          const readerErrors = res.errors[`${marketAddress}-reader`];
          const dataStoreErrors = res.errors[`${marketAddress}-dataStore`];

          const readerValues = res.data[`${marketAddress}-reader`];
          const dataStoreValues = res.data[`${marketAddress}-dataStore`];

          // Skip invalid market
          if (!readerValues || !dataStoreValues || readerErrors || dataStoreErrors) {
            this.logger.warn(`No market found ${marketAddress} in getMarketsValues`);
            return acc;
          }

          const marketDivisor = market.isSameCollaterals ? 2n : 1n;
          const longInterestUsingLongToken =
            BigInt(dataStoreValues.longInterestUsingLongToken.returnValues[0]) / marketDivisor;
          const longInterestUsingShortToken =
            BigInt(dataStoreValues.longInterestUsingShortToken.returnValues[0]) / marketDivisor;
          const shortInterestUsingLongToken =
            BigInt(dataStoreValues.shortInterestUsingLongToken.returnValues[0]) / marketDivisor;
          const shortInterestUsingShortToken =
            BigInt(dataStoreValues.shortInterestUsingShortToken.returnValues[0]) / marketDivisor;

          const longInterestUsd = longInterestUsingLongToken + longInterestUsingShortToken;
          const shortInterestUsd = shortInterestUsingLongToken + shortInterestUsingShortToken;

          const longInterestInTokensUsingLongToken =
            BigInt(dataStoreValues.longInterestInTokensUsingLongToken.returnValues[0]) / marketDivisor;
          const longInterestInTokensUsingShortToken =
            BigInt(dataStoreValues.longInterestInTokensUsingShortToken.returnValues[0]) / marketDivisor;
          const shortInterestInTokensUsingLongToken =
            BigInt(dataStoreValues.shortInterestInTokensUsingLongToken.returnValues[0]) / marketDivisor;
          const shortInterestInTokensUsingShortToken =
            BigInt(dataStoreValues.shortInterestInTokensUsingShortToken.returnValues[0]) / marketDivisor;

          const longInterestInTokens = longInterestInTokensUsingLongToken + longInterestInTokensUsingShortToken;
          const shortInterestInTokens = shortInterestInTokensUsingLongToken + shortInterestInTokensUsingShortToken;

          const { nextFunding, virtualInventory } = readerValues.marketInfo.returnValues;

          const [, poolValueInfoMin] = readerValues.marketTokenPriceMin.returnValues as [
            bigint,
            {
              poolValue: bigint;
              longPnl: bigint;
              shortPnl: bigint;
              netPnl: bigint;
            },
          ];

          const [, poolValueInfoMax] = readerValues.marketTokenPriceMax.returnValues as [
            bigint,
            { poolValue: bigint; totalBorrowingFees: bigint; longPnl: bigint; shortPnl: bigint; netPnl: bigint },
          ];

          const [, withdrawalPoolValueInfoMin] = readerValues.marketTokenPriceMinForWithdrawals.returnValues as [
            bigint,
            {
              poolValue: bigint;
            },
          ];

          const longPoolAmountRaw = dataStoreValues.longPoolAmount.returnValues[0];
          const shortPoolAmountRaw = dataStoreValues.shortPoolAmount.returnValues[0];
          const longPoolAmount = longPoolAmountRaw / marketDivisor;
          const shortPoolAmount = shortPoolAmountRaw / marketDivisor;

          acc[marketAddress] = {
            longInterestUsd,
            shortInterestUsd,
            longInterestInTokens,
            shortInterestInTokens,
            longPoolAmount: longPoolAmount,
            shortPoolAmount: shortPoolAmount,
            longPoolAmountRaw,
            shortPoolAmountRaw,
            poolValueMin: poolValueInfoMin.poolValue,
            poolValueMax: poolValueInfoMax.poolValue,
            withdrawalPoolValueMin: withdrawalPoolValueInfoMin.poolValue,
            longPnl: poolValueInfoMax.longPnl,
            shortPnl: poolValueInfoMax.shortPnl,
            netPnl: poolValueInfoMax.netPnl,
            totalBorrowingFees: poolValueInfoMax.totalBorrowingFees,
            positionImpactPoolAmount: dataStoreValues.positionImpactPoolAmount.returnValues[0],
            lentPositionImpactPoolAmount: dataStoreValues.lentPositionImpactPoolAmount.returnValues[0],
            swapImpactPoolAmountLong: dataStoreValues.swapImpactPoolAmountLong.returnValues[0],
            swapImpactPoolAmountShort: dataStoreValues.swapImpactPoolAmountShort.returnValues[0],
            borrowingFactorPerSecondForLongs: readerValues.marketInfo.returnValues.borrowingFactorPerSecondForLongs,
            borrowingFactorPerSecondForShorts: readerValues.marketInfo.returnValues.borrowingFactorPerSecondForShorts,
            fundingFactorPerSecond: nextFunding.fundingFactorPerSecond,
            longsPayShorts: nextFunding.longsPayShorts,
            virtualPoolAmountForLongToken: virtualInventory.virtualPoolAmountForLongToken,
            virtualPoolAmountForShortToken: virtualInventory.virtualPoolAmountForShortToken,
            virtualInventoryForPositions: virtualInventory.virtualInventoryForPositions,
          };

          return acc;
        },
        {} as {
          [marketAddress: string]: MarketValues;
        }
      );

      return result;
    };

    const shouldChunk = this.chainId === SOURCE_BSC_TESTNET && markets.length > BSC_TESTNET_MARKET_BATCH_SIZE;

    if (!shouldChunk) {
      const request = await buildMarketsValuesRequest(this.chainId, {
        prices,
        markets,
        tokensData,
        dataStoreAddress,
        syntheticsReaderAddress,
        warn: this.logger.warn,
      });
      const res = await this.sdk.executeMulticall(request);
      return buildResult(res, markets);
    }

    const chunks = chunkBySize(markets, BSC_TESTNET_MARKET_BATCH_SIZE);
    const result: {
      [marketAddress: string]: MarketValues;
    } = {};

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const request = await buildMarketsValuesRequest(this.chainId, {
        prices,
        markets: chunk,
        tokensData,
        dataStoreAddress,
        syntheticsReaderAddress,
        warn: this.logger.warn,
      });
      const res = await this.sdk.executeMulticall(request);
      Object.assign(result, buildResult(res, chunk));

      if (i < chunks.length - 1) {
        await sleep(BSC_TESTNET_MARKET_BATCH_WAIT_MS);
      }
    }

    return result;
  }

  async getMarketsConfigs(markets: Market[]) {
    const dataStoreAddress = getContract(this.chainId, "DataStore");

    const buildResult = (res: any, marketsChunk: Market[]) => {
      const result = marketsChunk.reduce(
        (acc, market) => {
          const marketAddress = market.marketTokenAddress;
          const dataStoreErrors = res.errors[`${marketAddress}-dataStore`];

          const dataStoreValues = res.data[`${marketAddress}-dataStore`];

          // Skip invalid market
          if (!dataStoreValues || dataStoreErrors) {
            this.logger.info("Market info error", marketAddress, dataStoreErrors, dataStoreValues);
            return acc;
          }

          acc[marketAddress] = {
            isDisabled: dataStoreValues.isDisabled.returnValues[0],
            maxLongPoolUsdForDeposit: dataStoreValues.maxLongPoolUsdForDeposit.returnValues[0],
            maxShortPoolUsdForDeposit: dataStoreValues.maxShortPoolUsdForDeposit.returnValues[0],
            maxLongPoolAmount: dataStoreValues.maxLongPoolAmount.returnValues[0],
            maxShortPoolAmount: dataStoreValues.maxShortPoolAmount.returnValues[0],
            reserveFactorLong: dataStoreValues.reserveFactorLong.returnValues[0],
            reserveFactorShort: dataStoreValues.reserveFactorShort.returnValues[0],
            openInterestReserveFactorLong: dataStoreValues.openInterestReserveFactorLong.returnValues[0],
            openInterestReserveFactorShort: dataStoreValues.openInterestReserveFactorShort.returnValues[0],
            maxOpenInterestLong: dataStoreValues.maxOpenInterestLong.returnValues[0],
            maxOpenInterestShort: dataStoreValues.maxOpenInterestShort.returnValues[0],

            maxPnlFactorForTradersLong: dataStoreValues.maxPnlFactorForTradersLong.returnValues[0],
            maxPnlFactorForTradersShort: dataStoreValues.maxPnlFactorForTradersShort.returnValues[0],
            maxPnlFactorForWithdrawalsLong: dataStoreValues.maxPnlFactorForWithdrawalsLong.returnValues[0],
            maxPnlFactorForWithdrawalsShort: dataStoreValues.maxPnlFactorForWithdrawalsShort.returnValues[0],
            withdrawalFeeFactorForBalanceWasImproved:
              dataStoreValues.withdrawalFeeFactorForBalanceWasImproved.returnValues[0],
            withdrawalFeeFactorForBalanceWasNotImproved:
              dataStoreValues.withdrawalFeeFactorForBalanceWasNotImproved.returnValues[0],
            depositFeeFactorForBalanceWasImproved:
              dataStoreValues.depositFeeFactorForBalanceWasImproved.returnValues[0],
            depositFeeFactorForBalanceWasNotImproved:
              dataStoreValues.depositFeeFactorForBalanceWasNotImproved.returnValues[0],
            swapFeeReceiverFactor: dataStoreValues.swapFeeReceiverFactor.returnValues[0],
            maxLendableImpactFactorForWithdrawals:
              dataStoreValues.maxLendableImpactFactorForWithdrawals.returnValues[0],

            minCollateralFactor: dataStoreValues.minCollateralFactor.returnValues[0],
            minCollateralFactorForOpenInterestLong:
              dataStoreValues.minCollateralFactorForOpenInterestLong.returnValues[0],

            minCollateralFactorForOpenInterestShort:
              dataStoreValues.minCollateralFactorForOpenInterestShort.returnValues[0],

            minCollateralFactorForLiquidation: dataStoreValues.minCollateralFactorForLiquidation.returnValues[0],

            positionFeeFactorForBalanceWasImproved:
              dataStoreValues.positionFeeFactorForBalanceWasImproved.returnValues[0],
            positionFeeFactorForBalanceWasNotImproved:
              dataStoreValues.positionFeeFactorForBalanceWasNotImproved.returnValues[0],
            positionImpactFactorPositive: dataStoreValues.positionImpactFactorPositive.returnValues[0],
            positionImpactFactorNegative: dataStoreValues.positionImpactFactorNegative.returnValues[0],
            maxPositionImpactFactorPositive: dataStoreValues.maxPositionImpactFactorPositive.returnValues[0],
            maxPositionImpactFactorNegative: dataStoreValues.maxPositionImpactFactorNegative.returnValues[0],
            maxPositionImpactFactorForLiquidations:
              dataStoreValues.maxPositionImpactFactorForLiquidations.returnValues[0],
            positionImpactExponentFactor: dataStoreValues.positionImpactExponentFactor.returnValues[0],
            swapFeeFactorForBalanceWasImproved: dataStoreValues.swapFeeFactorForBalanceWasImproved.returnValues[0],
            swapFeeFactorForBalanceWasNotImproved:
              dataStoreValues.swapFeeFactorForBalanceWasNotImproved.returnValues[0],
            swapImpactFactorPositive: dataStoreValues.swapImpactFactorPositive.returnValues[0],
            atomicSwapFeeFactor: dataStoreValues.atomicSwapFeeFactor.returnValues[0],
            swapImpactFactorNegative: dataStoreValues.swapImpactFactorNegative.returnValues[0],
            swapImpactExponentFactor: dataStoreValues.swapImpactExponentFactor.returnValues[0],

            isZFPEnabled: dataStoreValues.isZFPEnabled.returnValues[0] ?? false,
            minZFPCollateralFactor: dataStoreValues.minZFPCollateralFactor.returnValues[0] ?? 0n,
            maxZFPCollateralFactor: dataStoreValues.maxZFPCollateralFactor.returnValues[0] ?? 0n,
            minZFPCollateralFactorForLiquidation:
              dataStoreValues.minZFPCollateralFactorForLiquidation.returnValues[0] ?? 0n,
            maxProfitFactor: dataStoreValues.maxProfitFactor.returnValues[0] ?? 0n,

            lossRebateRate: dataStoreValues.lossRebateRate.returnValues[0] ?? 0n,
          };

          return acc;
        },
        {} as {
          [marketAddress: string]: MarketConfig;
        }
      );

      return result;
    };

    const shouldChunk = this.chainId === SOURCE_BSC_TESTNET && markets.length > BSC_TESTNET_MARKET_BATCH_SIZE;

    if (!shouldChunk) {
      const request = await buildMarketsConfigsRequest(this.chainId, {
        markets,
        dataStoreAddress,
        warn: this.logger.warn,
      });
      const res = await this.sdk.executeMulticall(request);
      return buildResult(res, markets);
    }

    const chunks = chunkBySize(markets, BSC_TESTNET_MARKET_BATCH_SIZE);
    const result: {
      [marketAddress: string]: MarketConfig;
    } = {};

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const request = await buildMarketsConfigsRequest(this.chainId, {
        markets: chunk,
        dataStoreAddress,
        warn: this.logger.warn,
      });
      const res = await this.sdk.executeMulticall(request);
      Object.assign(result, buildResult(res, chunk));

      if (i < chunks.length - 1) {
        await sleep(BSC_TESTNET_MARKET_BATCH_WAIT_MS);
      }
    }

    return result;
  }

  private _marketsData = new Map<string, { data: MarketsResult; updatedAt: number }>();
  private _marketsDataPromises = new Map<string, Promise<MarketsResult>>();
  async getMarkets(offset = 0n, limit = 1000n): Promise<MarketsResult> {
    const cacheKey = `${offset}:${limit}`;
    const cached = this._marketsData.get(cacheKey);
    if (cached && Date.now() - cached.updatedAt < MARKETS_CACHE_TIME_MS) {
      return cached.data;
    }
    const pending = this._marketsDataPromises.get(cacheKey);
    if (pending) {
      return pending;
    }

    const request = this.fetchMarkets(offset, limit);
    this._marketsDataPromises.set(cacheKey, request);
    try {
      const data = await request;
      this._marketsData.set(cacheKey, { data, updatedAt: Date.now() });
      return data;
    } finally {
      this._marketsDataPromises.delete(cacheKey);
    }
  }

  private async fetchMarkets(offset: bigint, limit: bigint): Promise<MarketsResult> {
    const readerAddress = getContract(this.chainId, "SyntheticsReader");
    const dataStoreAddress = getContract(this.chainId, "DataStore");

    const markets = await this.sdk
      .executeMulticall({
        markets: {
          contractAddress: readerAddress,
          abiId: "SyntheticsReader",
          calls: {
            markets: {
              methodName: "getMarkets",
              params: [dataStoreAddress, offset, offset + limit],
            },
          },
        },
      })
      .then((res) => {
        return res.data.markets.markets.returnValues.map(
          (market: { marketToken: string; indexToken: string; longToken: string; shortToken: string }) => {
            return {
              marketTokenAddress: market.marketToken,
              indexTokenAddress: market.indexToken,
              longTokenAddress: market.longToken,
              shortTokenAddress: market.shortToken,
            };
          }
        );
      });

    const unresolvedInternalUsdCandidates = markets
      .filter((market) => market.longTokenAddress.toLowerCase() === market.shortTokenAddress.toLowerCase())
      .map((market) => getAddress(market.longTokenAddress))
      .filter((tokenAddress) => !getInternalUsdConfig(this.chainId, tokenAddress));
    const failedInternalUsdTokens = new Set<string>();

    try {
      await hydrateInternalUsdConfigs({
        chainId: this.chainId,
        wrappedTokenAddresses: unresolvedInternalUsdCandidates,
        publicClient: this.publicClient,
      });
    } catch (error) {
      unresolvedInternalUsdCandidates.forEach((tokenAddress) =>
        failedInternalUsdTokens.add(tokenAddress.toLowerCase())
      );
      this.logger.warn("Failed to resolve internal USD wrapper candidates", error);
    }

    const marketsResult = markets.reduce(
      (
        acc: Market[],
        market: {
          marketTokenAddress: string;
          indexTokenAddress: string;
          longTokenAddress: string;
          shortTokenAddress: string;
        }
      ) => {
        try {
          const isSameCollaterals = market.longTokenAddress === market.shortTokenAddress;
          const isSpotOnly = market.indexTokenAddress === zeroAddress;

          acc.push({
            ...market,
            isSameCollaterals,
            isSpotOnly,
            internalUsdResolutionError: failedInternalUsdTokens.has(market.longTokenAddress.toLowerCase()),
          });
        } catch (e) {
          this.logger.warn(`Unsupported market ${market.marketTokenAddress}`, e);
        }

        return acc;
      },
      []
    );

    return marketsResult;
  }

  mergeMarketsInfo({
    markets: markets,
    tokensData: tokensData,
    marketsConfigs: marketsConfigs,
    marketsValues: marketsValues,
  }: {
    markets?: MarketsResult;
    tokensData?: TokensData;
    marketsConfigs?: Record<string, MarketConfig>;
    marketsValues?: Record<string, MarketValues>;
  }) {
    if (!marketsValues || !marketsConfigs || !markets) {
      return {
        marketsInfoData: {},
        tokensData,
      };
    }

    // Manual merging to avoid cloning tokens as they are sometimes compared by reference
    const marketsInfoData: MarketsInfoData = {};
    for (const market of markets) {
      const marketAddress = market.marketTokenAddress;
      const marketValues = marketsValues[marketAddress];
      const marketConfig = marketsConfigs[marketAddress];

      const longToken = getByKey(tokensData!, market?.longTokenAddress);
      const shortToken = getByKey(tokensData!, market?.shortTokenAddress);
      const indexToken = market
        ? getByKey(tokensData!, convertTokenAddress(this.chainId, market.indexTokenAddress, "native"))
        : undefined;

      if (!market || !marketValues || !marketConfig || !longToken || !shortToken || !indexToken) {
        continue;
      }

      const fullMarketInfo: MarketInfo = {
        ...marketValues,
        ...marketConfig,
        ...market,
        longToken,
        shortToken,
        indexToken,
      };

      marketsInfoData[marketAddress] = fullMarketInfo;
    }

    return {
      marketsInfoData,
      tokensData,
    };
  }
}
