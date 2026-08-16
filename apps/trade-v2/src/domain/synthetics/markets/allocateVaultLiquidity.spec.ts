import assert from 'node:assert/strict';
import test from 'node:test';

import { computeVaultRemainingCaps } from '@/queries/bsc/vaults/caps';
import {
  calculateMaxAumForDeposit,
  calculateRemainingDepositCap,
  calculateRemainingDepositTokenCap,
  calculateRemainingWithdrawalCap,
} from '@/stores/synthetics/marketsData/caps';
import type {
  HlvMarket,
  MarketTokensData,
} from '@/stores/synthetics/marketTokens/types';

import {
  allocateVaultLiquidity,
  hasCompleteVaultLiquidityData,
} from './allocateVaultLiquidity';
import type { MarketInfo } from '@hertzflow/sdk-v2/types/markets';

const MARKET_A = '0x0000000000000000000000000000000000000001';
const MARKET_B = '0x0000000000000000000000000000000000000002';
const MARKET_C = '0x0000000000000000000000000000000000000003';
const MARKET_D = '0x0000000000000000000000000000000000000004';
const LONG_TOKEN = '0x0000000000000000000000000000000000000011';
const SHORT_TOKEN = '0x0000000000000000000000000000000000000012';
const INDEX_TOKEN = '0x0000000000000000000000000000000000000013';
const TOKEN_SCALE = 10n ** 18n;
const USD_SCALE = 1_000_000n;
const PRECISION = 10n ** 30n;
const TEST_PRICES = {
  [LONG_TOKEN]: { minPrice: 1n, maxPrice: 1n },
  [SHORT_TOKEN]: { minPrice: 1n, maxPrice: 1n },
  [INDEX_TOKEN]: { minPrice: 1n, maxPrice: 1n },
};

const mkExposure = (
  addr: string,
  symbol: string,
  maxCap: string,
  currentVaultUsd: bigint,
) => ({
  market_address: addr,
  symbol,
  long_token: LONG_TOKEN,
  short_token: SHORT_TOKEN,
  max_cap: maxCap,
  distribution_amount: String(currentVaultUsd * TOKEN_SCALE),
});

const mkMarketInfo = (poolCapUsd: bigint, poolValueMin = 0n) =>
  ({
    marketTokenAddress: MARKET_A,
    longTokenAddress: LONG_TOKEN,
    shortTokenAddress: SHORT_TOKEN,
    indexTokenAddress: INDEX_TOKEN,
    isSameCollaterals: false,
    isSpotOnly: false,
    longToken: { address: LONG_TOKEN, decimals: 0 },
    shortToken: { address: SHORT_TOKEN, decimals: 0 },
    indexToken: { address: INDEX_TOKEN, decimals: 0 },
    maxLongPoolUsdForDeposit: 0n,
    maxShortPoolUsdForDeposit: poolCapUsd,
    maxLongPoolAmount: 0n,
    maxShortPoolAmount: poolCapUsd,
    longPoolAmount: poolValueMin / 2n,
    shortPoolAmount: poolValueMin - poolValueMin / 2n,
    poolValueMin,
    poolValueMax: poolValueMin,
    withdrawalPoolValueMin: poolValueMin,
    reserveFactorLong: 0n,
    reserveFactorShort: 0n,
    maxPnlFactorForWithdrawalsLong: 0n,
    maxPnlFactorForWithdrawalsShort: 0n,
    maxLendableImpactFactorForWithdrawals: 0n,
    lentPositionImpactPoolAmount: 0n,
    withdrawalFeeFactorForBalanceWasImproved: 0n,
    withdrawalFeeFactorForBalanceWasNotImproved: 0n,
    depositFeeFactorForBalanceWasImproved: 0n,
    depositFeeFactorForBalanceWasNotImproved: 0n,
    swapFeeReceiverFactor: 0n,
    swapImpactFactorPositive: 0n,
    swapImpactFactorNegative: 0n,
    swapImpactExponentFactor: 0n,
    swapImpactPoolAmountLong: 0n,
    swapImpactPoolAmountShort: 0n,
    virtualPoolAmountForLongToken: 0n,
    virtualPoolAmountForShortToken: 0n,
  }) as MarketInfo;

const mkMarketTokensData = (...marketAddresses: string[]) =>
  Object.fromEntries(
    marketAddresses.map((marketAddress) => [
      marketAddress,
      {
        prices: {
          minPrice: 1n,
          maxPrice: 1n,
        },
      },
    ]),
  ) as MarketTokensData;

const mkHlvMarkets = (...entries: Array<[string, bigint, bigint?, bigint?]>) =>
  entries.map(([addr, balance, maxAmount = 0n, maxUsd]) => ({
    address: addr,
    isDisabled: false,
    hlvMaxMarketTokenBalanceUsd: maxUsd,
    hlvMaxMarketTokenBalanceAmount: maxAmount * TOKEN_SCALE,
    hzlpBalance: balance * TOKEN_SCALE,
  })) as HlvMarket[];

test('partial market data is not considered ready for vault capacity', () => {
  const marketExposure = [mkExposure(MARKET_A, 'A', '1000', 0n)];
  const marketsInfoData = { [MARKET_A]: mkMarketInfo(1000n) };
  const hlvMarkets = mkHlvMarkets([MARKET_A, 0n]);

  assert.equal(
    hasCompleteVaultLiquidityData({
      marketExposure,
      marketsInfoData,
      marketTokensData: undefined,
      hlvMarkets,
    }),
    false,
  );
  assert.equal(
    hasCompleteVaultLiquidityData({
      marketExposure,
      marketsInfoData,
      marketTokensData: mkMarketTokensData(MARKET_A),
      hlvMarkets,
    }),
    true,
  );
  assert.equal(
    hasCompleteVaultLiquidityData({
      marketExposure,
      marketsInfoData,
      marketTokensData: {
        [MARKET_A]: {
          ...Object.values(mkMarketTokensData(MARKET_A))[0]!,
          prices: { minPrice: 0n, maxPrice: 0n },
        },
      } as MarketTokensData,
      hlvMarkets,
    }),
    false,
  );
});

test('remaining vault capacity stays undefined until market token data loads', () => {
  const caps = computeVaultRemainingCaps({
    marketExposure: [mkExposure(MARKET_A, 'A', '1000', 0n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(1000n) },
    marketTokensData: undefined,
    pricesData: TEST_PRICES,
    hlvMarkets: mkHlvMarkets([MARKET_A, 0n]),
  });

  assert.equal(caps.remainingDepositCapUsd, undefined);
  assert.equal(caps.remainingWithdrawalCapUsd, undefined);
});

test('totalAvailableCapacity equals sum of min(max_cap, pool_cap) - vault_position', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'XAU/USD', '1000', 100n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(800n, 100n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 100n]),
    depositAmountUsd: 0n,
  });
  assert.equal(result.totalAvailableCapacity, 700n);
  assert.equal(result.exceedsCapacity, false);
});

test('conservative projected cap revalues vault headroom at pool token price', () => {
  const marketTokenData = mkMarketTokensData(MARKET_A)[MARKET_A]!;
  const marketTokensData = {
    [MARKET_A]: {
      ...marketTokenData,
      decimals: 0,
      totalSupply: 100n,
    },
  } as MarketTokensData;
  const regular = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'XAU/USD', '1000', 100n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(2000n, 200n) },
    marketTokensData,
    hlvMarkets: mkHlvMarkets([MARKET_A, 100n]),
    depositAmountUsd: 0n,
  });
  const conservative = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'XAU/USD', '1000', 100n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(2000n, 200n) },
    marketTokensData,
    hlvMarkets: mkHlvMarkets([MARKET_A, 100n]),
    depositAmountUsd: 0n,
    conservativeProjectedCap: true,
  });

  assert.equal(regular.totalAvailableCapacity, 900n);
  assert.equal(conservative.totalAvailableCapacity, 800n);
});

test('vault chain USD cap overrides rest max_cap fallback', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'XAU/USD', '1000', 100n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(800n, 100n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 100n, 0n, 300n]),
    depositAmountUsd: 0n,
  });

  assert.equal(result.totalAvailableCapacity, 200n);
});

test('vault market token amount cap limits deposit capacity', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'XAU/USD', '1000', 100n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(800n, 100n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 100n, 150n]),
    depositAmountUsd: 0n,
  });

  assert.equal(result.totalAvailableCapacity, 50n);
});

test('exceedsCapacity checks against 100% of total available capacity', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'XAU/USD', '1000', 100n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(800n, 100n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 100n]),
    depositAmountUsd: 701n,
  });
  assert.equal(result.totalAvailableCapacity, 700n);
  assert.equal(result.exceedsCapacity, true);
});

test('capacity is limited by pool remaining cap when pool has less room than vault', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'A', '1000', 100n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(800n, 750n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 100n]),
    depositAmountUsd: 50n,
  });

  assert.equal(result.totalAvailableCapacity, 50n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 50n },
  ]);
});

test('capacity is limited by vault market remaining cap when vault has less room than pool', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'A', '1000', 950n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(2000n, 100n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 950n]),
    depositAmountUsd: 50n,
  });

  assert.equal(result.totalAvailableCapacity, 50n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 50n },
  ]);
});

test('tracks deposit input token amount cap separately from usd cap', () => {
  const marketInfo = {
    ...mkMarketInfo(1000n, 90n),
    maxShortPoolAmount: 100n,
    shortPoolAmount: 90n,
    poolValueMin: 90n,
    poolValueMax: 90n,
  };
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'A', '1000', 0n)],
    marketsInfoData: { [MARKET_A]: marketInfo },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 0n]),
    depositAmountUsd: 0n,
    pricesData: {
      ...TEST_PRICES,
      [SHORT_TOKEN]: { minPrice: 2n, maxPrice: 2n },
    },
  });

  assert.equal(result.totalAvailableCapacity, 20n);
  assert.equal(result.totalAvailableCapacityAmount, 10n);
});

test('splits large vault deposits by per-market input token amount cap', () => {
  const firstMarket = {
    ...mkMarketInfo(1_000n, 90n),
    maxShortPoolAmount: 100n,
    shortPoolAmount: 90n,
    poolValueMin: 90n,
    poolValueMax: 90n,
  };
  const secondMarket = {
    ...mkMarketInfo(1_000n, 0n),
    maxShortPoolAmount: 1_000n,
    shortPoolAmount: 0n,
  };
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(MARKET_A, 'A', '1000', 0n),
      mkExposure(MARKET_B, 'B', '1000', 0n),
    ],
    marketsInfoData: {
      [MARKET_A]: firstMarket,
      [MARKET_B]: secondMarket,
    },
    marketTokensData: mkMarketTokensData(MARKET_A, MARKET_B),
    hlvMarkets: mkHlvMarkets([MARKET_A, 0n], [MARKET_B, 0n]),
    depositAmountUsd: 100n,
    depositAmount: 50n,
    pricesData: {
      ...TEST_PRICES,
      [SHORT_TOKEN]: { minPrice: 2n, maxPrice: 2n },
    },
  });

  assert.equal(result.totalAvailableCapacity, 1_020n);
  assert.equal(result.totalAvailableCapacityAmount, 510n);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 20n, amount: 10n },
    { marketAddress: MARKET_B, amountUsd: 80n, amount: 40n },
  ]);
});

test('sorts by max_cap before remaining capacity', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(MARKET_A, 'A', '1000', 300n),
      mkExposure(MARKET_B, 'B', '500', 50n),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(700n, 300n),
      [MARKET_B]: mkMarketInfo(500n, 50n),
    },
    marketTokensData: mkMarketTokensData(MARKET_A, MARKET_B),
    hlvMarkets: mkHlvMarkets([MARKET_A, 300n], [MARKET_B, 50n]),
    depositAmountUsd: 300n,
  });
  assert.equal(result.totalAvailableCapacity, 850n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 300n },
  ]);
  assert.equal(result.primaryMarket, MARKET_A);
});

test('skips higher-priority markets whose pool deposit cap is already full', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(MARKET_A, 'A', '1000', 300n),
      mkExposure(MARKET_B, 'B', '500', 50n),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(700n, 700n),
      [MARKET_B]: mkMarketInfo(500n, 100n),
    },
    marketTokensData: mkMarketTokensData(MARKET_A, MARKET_B),
    hlvMarkets: mkHlvMarkets([MARKET_A, 300n], [MARKET_B, 50n]),
    depositAmountUsd: 1n,
  });

  assert.equal(result.totalAvailableCapacity, 400n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_B, amountUsd: 1n },
  ]);
  assert.equal(result.primaryMarket, MARKET_B);
});

test('continues large deposits across later markets after skipping a full pool', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(MARKET_A, 'A', '1000', 300n),
      mkExposure(MARKET_B, 'B', '800', 100n),
      mkExposure(MARKET_C, 'C', '500', 0n),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(700n, 700n),
      [MARKET_B]: mkMarketInfo(800n, 200n),
      [MARKET_C]: mkMarketInfo(500n, 100n),
    },
    marketTokensData: mkMarketTokensData(MARKET_A, MARKET_B, MARKET_C),
    hlvMarkets: mkHlvMarkets(
      [MARKET_A, 300n],
      [MARKET_B, 100n],
      [MARKET_C, 0n],
    ),
    depositAmountUsd: 700n,
  });

  assert.equal(result.totalAvailableCapacity, 1000n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_B, amountUsd: 600n },
    { marketAddress: MARKET_C, amountUsd: 100n },
  ]);
  assert.equal(result.primaryMarket, MARKET_B);
});

test('continues large deposits after skipping multiple full priority pools', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(MARKET_A, 'A', '1200', 500n),
      mkExposure(MARKET_B, 'B', '1000', 400n),
      mkExposure(MARKET_C, 'C', '800', 100n),
      mkExposure(MARKET_D, 'D', '600', 0n),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(900n, 900n),
      [MARKET_B]: mkMarketInfo(700n, 700n),
      [MARKET_C]: mkMarketInfo(800n, 200n),
      [MARKET_D]: mkMarketInfo(600n, 100n),
    },
    marketTokensData: mkMarketTokensData(
      MARKET_A,
      MARKET_B,
      MARKET_C,
      MARKET_D,
    ),
    hlvMarkets: mkHlvMarkets(
      [MARKET_A, 500n],
      [MARKET_B, 400n],
      [MARKET_C, 100n],
      [MARKET_D, 0n],
    ),
    depositAmountUsd: 900n,
  });

  assert.equal(result.totalAvailableCapacity, 1100n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_C, amountUsd: 600n },
    { marketAddress: MARKET_D, amountUsd: 300n },
  ]);
  assert.equal(result.primaryMarket, MARKET_C);
});

test('does not subtract fixed headroom from markets close to vault deposit cap', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'A', '300000', 291619n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(300000n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 291619n]),
    depositAmountUsd: 8381n,
  });

  assert.equal(result.totalAvailableCapacity, 8381n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 8381n },
  ]);
});

test('allows the real remaining capacity when the last usable market has about $100 left', () => {
  const dogeVaultRemaining = 100_846263n;
  const depositAmountUsd = 1n * USD_SCALE;
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(
        MARKET_A,
        'DOGE/USD',
        String(100_000n * USD_SCALE),
        99_899_153737n,
      ),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(1_997_551_360000n, 1_962_341_419122n),
    },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 99_899_153737n]),
    depositAmountUsd,
  });

  assert.equal(result.totalAvailableCapacity, dogeVaultRemaining);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: depositAmountUsd },
  ]);
});

test('rejects only amounts above the real remaining capacity for the last usable market', () => {
  const dogeVaultRemaining = 100_846263n;
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(
        MARKET_A,
        'DOGE/USD',
        String(100_000n * USD_SCALE),
        99_899_153737n,
      ),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(1_997_551_360000n, 1_962_341_419122n),
    },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 99_899_153737n]),
    depositAmountUsd: 101n * USD_SCALE,
  });

  assert.equal(result.totalAvailableCapacity, dogeVaultRemaining);
  assert.equal(result.exceedsCapacity, true);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: dogeVaultRemaining },
  ]);
});

test('vault remaining deposit cap uses the same capacity as vault deposit validation', () => {
  const marketExposure = [
    mkExposure(MARKET_A, 'A', '1000', 100n),
    mkExposure(MARKET_B, 'B', '500', 100n),
  ];
  const marketsInfoData = {
    [MARKET_A]: mkMarketInfo(800n, 750n),
    [MARKET_B]: mkMarketInfo(1000n, 100n),
  };
  const marketTokensData = mkMarketTokensData(MARKET_A, MARKET_B);
  const hlvMarkets = mkHlvMarkets([MARKET_A, 100n], [MARKET_B, 100n]);

  const allocation = allocateVaultLiquidity({
    marketExposure,
    marketsInfoData,
    marketTokensData,
    hlvMarkets,
    depositAmountUsd: 0n,
    pricesData: TEST_PRICES,
  });
  const caps = computeVaultRemainingCaps({
    marketExposure,
    marketsInfoData,
    marketTokensData,
    pricesData: TEST_PRICES,
    hlvMarkets,
  });

  assert.equal(allocation.totalAvailableCapacity, 825n);
  assert.equal(caps.remainingDepositCapUsd, allocation.totalAvailableCapacity);
});

test('pool remaining deposit cap uses token amount headroom when it is smaller', () => {
  const marketInfo = {
    longTokenAddress: '0xtoken',
    shortTokenAddress: '0xtoken',
    maxLongPoolUsdForDeposit: 1000n,
    maxShortPoolUsdForDeposit: 1000n,
    maxLongPoolAmount: 1000n,
    maxShortPoolAmount: 1000n,
    longPoolAmount: 963n,
    shortPoolAmount: 963n,
    poolValueMax: 1900n,
    poolValueMin: 1900n,
  } as MarketInfo;

  assert.equal(calculateRemainingDepositCap(marketInfo, 1n, 0), 75n);
});

test('pool max aum for same collateral deposit uses raw pool capacity', () => {
  const marketInfo = {
    longTokenAddress: '0xtoken',
    shortTokenAddress: '0xtoken',
    maxLongPoolUsdForDeposit: 1000n,
    maxShortPoolUsdForDeposit: 1000n,
    maxLongPoolAmount: 1000n,
    maxShortPoolAmount: 1000n,
    longToken: { address: '0xtoken', decimals: 0 },
    shortToken: { address: '0xtoken', decimals: 0 },
  } as MarketInfo;

  assert.equal(calculateMaxAumForDeposit(marketInfo, 1n, 0), 2000n);
});

test('pool remaining deposit cap returns gross input after deposit fee amount', () => {
  const marketInfo = {
    ...mkMarketInfo(1000n, 100n),
    depositFeeFactorForBalanceWasImproved: PRECISION / 10n,
    depositFeeFactorForBalanceWasNotImproved: PRECISION / 10n,
    swapFeeReceiverFactor: PRECISION / 2n,
  } as MarketInfo;

  assert.equal(
    calculateRemainingDepositTokenCap(marketInfo, TEST_PRICES),
    1000n,
  );
  assert.equal(
    calculateRemainingDepositCap(marketInfo, 1n, 0, TEST_PRICES),
    1000n,
  );
});

test('pool remaining deposit cap returns gross input after ui fee amount', () => {
  const marketInfo = mkMarketInfo(1000n, 200n);
  const uiFeeFactor = PRECISION / 10n;

  assert.equal(
    calculateRemainingDepositTokenCap(marketInfo, TEST_PRICES, uiFeeFactor),
    1000n,
  );
  assert.equal(
    calculateRemainingDepositCap(marketInfo, 1n, 0, TEST_PRICES, uiFeeFactor),
    1000n,
  );
});

test('same-collateral pool deposit raw cap uses contract token headroom', () => {
  const marketInfo = {
    longTokenAddress: '0xtoken',
    shortTokenAddress: '0xtoken',
    maxLongPoolAmount: 1000n,
    maxShortPoolAmount: 1000n,
    longPoolAmount: 963n,
    shortPoolAmount: 963n,
  } as MarketInfo;

  assert.equal(calculateRemainingDepositTokenCap(marketInfo), 75n);
});

test('same-collateral pool deposit raw cap uses exact raw pool amount when available', () => {
  const marketInfo = {
    longTokenAddress: '0xtoken',
    shortTokenAddress: '0xtoken',
    maxLongPoolAmount: 1000n,
    maxShortPoolAmount: 1000n,
    longPoolAmount: 963n,
    shortPoolAmount: 963n,
    longPoolAmountRaw: 1927n,
    shortPoolAmountRaw: 1927n,
  } as MarketInfo;

  assert.equal(calculateRemainingDepositTokenCap(marketInfo), 74n);
});

test('non same-collateral pool deposit raw cap uses short token headroom', () => {
  const marketInfo = {
    longTokenAddress: '0xlong',
    shortTokenAddress: '0xshort',
    maxLongPoolAmount: 1000n,
    maxShortPoolAmount: 500n,
    longPoolAmount: 100n,
    shortPoolAmount: 490n,
  } as MarketInfo;

  assert.equal(calculateRemainingDepositTokenCap(marketInfo), 10n);
});

test('pool remaining withdrawal cap is limited by side reserve after withdrawal', () => {
  const marketInfo = {
    ...mkMarketInfo(1000n, 1000n),
    longPoolAmount: 500n,
    shortPoolAmount: 500n,
    longInterestInTokens: 200n,
    reserveFactorLong: PRECISION / 2n,
  } as MarketInfo;

  assert.equal(calculateRemainingWithdrawalCap(marketInfo, TEST_PRICES), 201n);
});

test('pool remaining withdrawal cap accounts for withdrawal fee kept by pool', () => {
  const marketInfo = {
    ...mkMarketInfo(1000n, 1000n),
    longPoolAmount: 500n,
    shortPoolAmount: 500n,
    longInterestInTokens: 200n,
    reserveFactorLong: PRECISION / 2n,
    withdrawalFeeFactorForBalanceWasNotImproved: PRECISION / 10n,
  } as MarketInfo;

  assert.equal(calculateRemainingWithdrawalCap(marketInfo, TEST_PRICES), 223n);
});

test('pool remaining withdrawal cap is limited by side max pnl after withdrawal', () => {
  const marketInfo = {
    ...mkMarketInfo(1000n, 1000n),
    longPoolAmount: 500n,
    shortPoolAmount: 500n,
    longInterestUsd: 100n,
    longInterestInTokens: 300n,
    reserveFactorLong: PRECISION,
    maxPnlFactorForWithdrawalsLong: PRECISION / 2n,
  } as MarketInfo;

  assert.equal(calculateRemainingWithdrawalCap(marketInfo, TEST_PRICES), 201n);
});

test('vault remaining withdrawal cap equals the sum of per-market withdrawable liquidity', () => {
  const marketExposure = [
    mkExposure(MARKET_A, 'A', '1000', 100n),
    mkExposure(MARKET_B, 'B', '1000', 150n),
  ];
  const marketsInfoData = {
    [MARKET_A]: mkMarketInfo(1000n, 80n),
    [MARKET_B]: mkMarketInfo(1000n, 200n),
  };
  const marketTokensData = mkMarketTokensData(MARKET_A, MARKET_B);
  const hlvMarkets = mkHlvMarkets([MARKET_A, 100n], [MARKET_B, 150n]);
  const caps = computeVaultRemainingCaps({
    marketExposure,
    marketsInfoData,
    marketTokensData,
    pricesData: TEST_PRICES,
    hlvMarkets,
  });

  assert.equal(caps.remainingWithdrawalCapByMarket[MARKET_A], 80n);
  assert.equal(caps.remainingWithdrawalCapByMarket[MARKET_B], 150n);
  assert.equal(caps.remainingWithdrawalCapUsd, 230n);
});

test('ties max_cap by current vault usd desc', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(MARKET_A, 'A', '100', 60n),
      mkExposure(MARKET_B, 'B', '100', 20n),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(200n),
      [MARKET_B]: mkMarketInfo(200n),
    },
    marketTokensData: mkMarketTokensData(MARKET_A, MARKET_B),
    hlvMarkets: mkHlvMarkets([MARKET_A, 60n], [MARKET_B, 20n]),
    depositAmountUsd: 90n,
  });
  assert.equal(result.totalAvailableCapacity, 120n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 30n },
    { marketAddress: MARKET_B, amountUsd: 60n },
  ]);
});

test('round 1 uses buffered cap instead of buffered remaining gap', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(MARKET_A, 'A', '100', 95n),
      mkExposure(MARKET_B, 'B', '100', 0n),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(200n),
      [MARKET_B]: mkMarketInfo(200n),
    },
    marketTokensData: mkMarketTokensData(MARKET_A, MARKET_B),
    hlvMarkets: mkHlvMarkets([MARKET_A, 95n], [MARKET_B, 0n]),
    depositAmountUsd: 4n,
  });
  assert.equal(result.totalAvailableCapacity, 105n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_B, amountUsd: 4n },
  ]);
});

test('two rounds: round 1 takes 90%, round 2 fills 100% remainder', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'A', '100', 0n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(100n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 0n]),
    depositAmountUsd: 95n,
  });
  assert.equal(result.totalAvailableCapacity, 100n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 95n },
  ]);
});

test('two rounds: round 2 fills remaining by priority order', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [
      mkExposure(MARKET_A, 'A', '100', 0n),
      mkExposure(MARKET_B, 'B', '100', 0n),
    ],
    marketsInfoData: {
      [MARKET_A]: mkMarketInfo(100n),
      [MARKET_B]: mkMarketInfo(100n),
    },
    marketTokensData: mkMarketTokensData(MARKET_A, MARKET_B),
    hlvMarkets: mkHlvMarkets([MARKET_A, 0n], [MARKET_B, 0n]),
    depositAmountUsd: 190n,
  });
  assert.equal(result.totalAvailableCapacity, 200n);
  assert.equal(result.exceedsCapacity, false);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 100n },
    { marketAddress: MARKET_B, amountUsd: 90n },
  ]);
});

test('exceedsCapacity when deposit > totalAvailableCapacity', () => {
  const result = allocateVaultLiquidity({
    marketExposure: [mkExposure(MARKET_A, 'A', '1000', 100n)],
    marketsInfoData: { [MARKET_A]: mkMarketInfo(150n, 100n) },
    marketTokensData: mkMarketTokensData(MARKET_A),
    hlvMarkets: mkHlvMarkets([MARKET_A, 100n]),
    depositAmountUsd: 60n,
  });
  assert.equal(result.totalAvailableCapacity, 50n);
  assert.equal(result.exceedsCapacity, true);
  assert.deepEqual(result.allocations, [
    { marketAddress: MARKET_A, amountUsd: 50n },
  ]);
});
