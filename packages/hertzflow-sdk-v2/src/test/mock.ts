import { Address, zeroAddress } from "viem";

import { USD_DECIMALS } from "configs/factors";
import { MarketInfo, MarketsData, MarketsInfoData } from "types/markets";
import { Token, TokenData, TokenPrices, TokensData } from "types/tokens";
import { ExternalSwapAggregator, ExternalSwapQuote } from "types/trade";
import { expandDecimals } from "utils/numbers";
import { convertToTokenAmount, getTokenData } from "utils/tokens";

export function usdToToken(usd: number, token: TokenData, price: bigint) {
  return convertToTokenAmount(expandDecimals(usd, USD_DECIMALS), token.decimals, price)!;
}

export const MOCK_GAS_PRICE = 100000000n; // (0.1 gwei)

export function mockMarketKeys() {
  return [
    "AVAX-AVAX-USDC",
    "ETH-ETH-USDC",
    "ETH-ETH-DAI",
    "SOL-ETH-USDC",
    "BTC-BTC-DAI",
    "SPOT-USDC-DAI",
    "SPOT-DAI-USDC",
    // same collaterals, should be disabled for swaps
    "ETH-USDC-USDC",
    // Unreachable markets
    "TBTC-TBTC-TBTC",
    "TETH_A-TETH_A-TETH_B",
    // Partially unreachable markets
    "TEST_B-TEST_B-TEST_A",
    "TEST_C-TEST_C-TEST_A",
  ];
}

export function mockTokenPrices(): Record<string, TokenPrices> {
  return {
    AVAX: {
      minPrice: expandDecimals(12, 30),
      maxPrice: expandDecimals(12, 30),
    },
    WAVAX: {
      minPrice: expandDecimals(12, 30),
      maxPrice: expandDecimals(12, 30),
    },
    USDC: {
      minPrice: expandDecimals(1, 30),
      maxPrice: expandDecimals(1, 30),
    },
    ETH: {
      minPrice: expandDecimals(1200, 30),
      maxPrice: expandDecimals(1200, 30),
    },
    BTC: {
      minPrice: expandDecimals(20000, 30),
      maxPrice: expandDecimals(20000, 30),
    },
    DAI: {
      minPrice: expandDecimals(1, 30),
      maxPrice: expandDecimals(1, 30),
    },
    SOL: {
      minPrice: expandDecimals(16, 30),
      maxPrice: expandDecimals(16, 30),
    },
    SPOT: {
      minPrice: BigInt(1),
      maxPrice: BigInt(1),
    },
  };
}

export function mockTokensData(overrides: { [symbol: string]: Partial<TokenData> } = {}): TokensData {
  const tokens: TokensData = {
    ...overrides,
    USDC: {
      address: "USDC",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      isStable: true,
      prices: {
        minPrice: expandDecimals(1, 30),
        maxPrice: expandDecimals(1, 30),
      },
      ...((overrides.USDC || {}) as any),
    },
    ETH: {
      address: "ETH",
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      prices: {
        minPrice: expandDecimals(1200, 30),
        maxPrice: expandDecimals(1200, 30),
      },
      ...((overrides.ETH || {}) as any),
    },
    BTC: {
      address: "BTC",
      name: "Bitcoin",
      symbol: "BTC",
      decimals: 8,
      prices: {
        minPrice: expandDecimals(20000, 30),
        maxPrice: expandDecimals(20000, 30),
      },
      ...((overrides.BTC || {}) as any),
    },
    DAI: {
      address: "DAI",
      name: "Dai",
      symbol: "DAI",
      decimals: 30,
      isStable: true,
      prices: {
        minPrice: expandDecimals(1, 30),
        maxPrice: expandDecimals(1, 30),
      },
      ...((overrides.DAI || {}) as any),
    },
    SOL: {
      address: "SOL",
      name: "Solana",
      symbol: "SOL",
      decimals: 18,
      isSynthetic: true,
      prices: {
        minPrice: expandDecimals(16, 30),
        maxPrice: expandDecimals(16, 30),
      },
      ...((overrides.SOL || {}) as any),
    },
    SPOT: {
      address: "SPOT",
      name: "SPOT",
      decimals: 30,
      symbol: "SPOT",
      prices: {
        minPrice: BigInt(1),
        maxPrice: BigInt(1),
      },
      ...((overrides.SPOT || {}) as any),
    },
  };

  return tokens;
}
/**
 * @param marketKeys - array of market keys in the following format: indexToken-longToken-shortToken
 */

export function mockMarketsData(marketKeys: string[]): MarketsData {
  return marketKeys.reduce((acc, key) => {
    const [indexTokenAddress, longTokenAddress, shortTokenAddress] = key.split("-");

    acc[key] = {
      marketTokenAddress: key,
      indexTokenAddress,
      longTokenAddress,
      shortTokenAddress,
      isSameCollaterals: longTokenAddress === shortTokenAddress,
      isSpotOnly: indexTokenAddress === "SPOT",
    };

    return acc;
  }, {} as MarketsData);
}

export function mockMarketsInfoData(
  tokensData: TokensData,
  prices: Record<Address, TokenPrices>,
  marketKeys: string[],
  overrides: { [marketKey: string]: Partial<MarketInfo> } = {}
): MarketsInfoData {
  return marketKeys.reduce((acc, key) => {
    const [indexTokenAddress, longTokenAddress, shortTokenAddress] = key.split("-");

    const indexToken = getTokenData(tokensData, indexTokenAddress)!;
    const longToken = getTokenData(tokensData, longTokenAddress)!;
    const shortToken = getTokenData(tokensData, shortTokenAddress)!;

    const isSpotOnly = indexTokenAddress === "SPOT";
    const indexTokenPrice = prices[indexTokenAddress].minPrice;
    const longTokenPrice = prices[longTokenAddress].minPrice;
    const shortTokenPrice = prices[shortTokenAddress].minPrice;

    acc[key] = {
      isDisabled: false,

      marketTokenAddress: key,
      indexTokenAddress,
      longTokenAddress,
      shortTokenAddress,

      isSameCollaterals: longTokenAddress === shortTokenAddress,
      isSpotOnly,

      longToken,
      shortToken,
      indexToken,

      longPoolAmount: usdToToken(1000, longToken, longTokenPrice),
      shortPoolAmount: usdToToken(1000, shortToken, shortTokenPrice),

      maxLongPoolAmount: usdToToken(10000, longToken, longTokenPrice),
      maxShortPoolAmount: usdToToken(10000, shortToken, shortTokenPrice),
      maxLongPoolUsdForDeposit: usdToToken(10000, longToken, longTokenPrice),
      maxShortPoolUsdForDeposit: usdToToken(10000, shortToken, shortTokenPrice),

      poolValueMax: expandDecimals(2000, USD_DECIMALS),
      poolValueMin: expandDecimals(2000, USD_DECIMALS),

      reserveFactorLong: expandDecimals(5, 29),
      reserveFactorShort: expandDecimals(5, 29),

      openInterestReserveFactorLong: expandDecimals(5, 29),
      openInterestReserveFactorShort: expandDecimals(5, 29),

      maxOpenInterestLong: expandDecimals(5, 29),
      maxOpenInterestShort: expandDecimals(5, 29),

      positionImpactPoolAmount: usdToToken(1000, indexToken, indexTokenPrice),

      swapImpactPoolAmountLong: usdToToken(1000, longToken, longTokenPrice),
      swapImpactPoolAmountShort: usdToToken(1000, shortToken, shortTokenPrice),

      positionFeeFactorForBalanceWasImproved: expandDecimals(5, 26),
      positionFeeFactorForBalanceWasNotImproved: expandDecimals(5, 26),
      positionImpactFactorPositive: expandDecimals(2, 23),
      positionImpactFactorNegative: expandDecimals(1, 23),
      maxPositionImpactFactorPositive: expandDecimals(2, 23),
      maxPositionImpactFactorNegative: expandDecimals(1, 23),
      maxPositionImpactFactorForLiquidations: expandDecimals(1, 23),
      positionImpactExponentFactor: expandDecimals(2, 30),

      swapFeeFactorForBalanceWasImproved: expandDecimals(2, 27),
      swapFeeFactorForBalanceWasNotImproved: expandDecimals(2, 27),

      atomicSwapFeeFactor: expandDecimals(2, 27),

      swapImpactFactorPositive: expandDecimals(2, 23),
      swapImpactFactorNegative: expandDecimals(1, 23),
      swapImpactExponentFactor: expandDecimals(2, 30),

      // MarketInfo
      borrowingFactorPerSecondForLongs: 0n,
      borrowingFactorPerSecondForShorts: 0n,

      totalBorrowingFees: 0n,
      minCollateralFactor: 0n,
      minCollateralFactorForLiquidation: 0n,

      minCollateralFactorForOpenInterestLong: 0n,
      minCollateralFactorForOpenInterestShort: 0n,

      fundingFactorPerSecond: 0n,
      longsPayShorts: false,

      longInterestUsd: expandDecimals(500, USD_DECIMALS),
      shortInterestUsd: expandDecimals(500, USD_DECIMALS),
      longInterestInTokens: usdToToken(500, indexToken, indexTokenPrice),
      shortInterestInTokens: usdToToken(500, indexToken, indexTokenPrice),

      maxPnlFactorForTradersLong: expandDecimals(1, 30),
      maxPnlFactorForTradersShort: expandDecimals(1, 30),
      maxPnlFactorForWithdrawalsLong: expandDecimals(5, 29), // 50%
      maxPnlFactorForWithdrawalsShort: expandDecimals(5, 29), // 50%

      virtualPoolAmountForLongToken: 0n,
      virtualPoolAmountForShortToken: 0n,
      virtualInventoryForPositions: 0n,

      isZFPEnabled: false,
      minZFPCollateralFactor: 0n,
      maxZFPCollateralFactor: 0n,
      minZFPCollateralFactorForLiquidation: 0n,
      maxProfitFactor: 0n,

      lossRebateRate: 0n,

      ...(overrides[key] || {}),
    };

    return acc;
  }, {} as MarketsInfoData);
}

export function mockExternalSwap({
  inToken,
  outToken,
  amountIn,
  amountOut,
  priceIn,
  priceOut,
  feesUsd = expandDecimals(5, USD_DECIMALS), // $5 default fee
  data = "0x1",
  to = "0x6352a56caadC4F1E25CD6c75970Fa768A3304e64",
  receiver = "0x1234567890123456789012345678901234567890",
}: {
  inToken: Token;
  outToken: Token;
  amountIn: bigint;
  amountOut: bigint;
  priceIn: bigint;
  priceOut: bigint;
  feesUsd?: bigint;
  data?: string;
  to?: string;
  receiver?: string;
}): ExternalSwapQuote {
  const usdIn = (amountIn * priceIn) / expandDecimals(1, inToken.decimals);
  const usdOut = (amountOut * priceOut) / expandDecimals(1, outToken.decimals);

  return {
    aggregator: ExternalSwapAggregator.OpenOcean,
    inTokenAddress: inToken.address,
    outTokenAddress: outToken.address,
    receiver,
    usdIn,
    usdOut,
    amountIn,
    amountOut,
    priceIn,
    priceOut,
    feesUsd,
    txnData: {
      to,
      data,
      value: 0n,
      estimatedGas: 100000n,
      estimatedExecutionFee: 100000n,
    },
  };
}
