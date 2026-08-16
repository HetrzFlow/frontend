import assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import net from 'node:net';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { HertzFlowSDK } from '@hertzflow/sdk-v2';
import { abis } from '@hertzflow/sdk-v2/abis/index';
import { SOURCE_BSC_TESTNET } from '@hertzflow/sdk-v2/configs/chains';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import {
  MAX_PNL_FACTOR_FOR_DEPOSITS_KEY,
  NONCE_KEY,
} from '@hertzflow/sdk-v2/configs/dataStore';
import { Multicall } from '@hertzflow/sdk-v2/utils/multicall';
import {
  getLiquiditySimulationPrices,
  simulateExecuteLiquidityTxn,
} from '@hertzflow/sdk-v2/utils/simulateExecuteLiquidity';
import { convertToContractTokenPrices } from '@hertzflow/sdk-v2/utils/tokens';
import {
  getDepositAmounts,
  type TokenDataWithPrices,
} from '@hertzflow/sdk-v2/utils/trade/liquidityDeposit';
import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  http,
  keccak256,
  parseEther,
  parseUnits,
  toHex,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import { fetchStatsTokens } from '@/common/services/rest/stats';
import { computeVaultRemainingCaps } from '@/queries/bsc/vaults/caps';
import type { VaultDetailItem } from '@/services/rest/vaults';
import {
  calculateRemainingDepositCap,
  calculateRemainingDepositTokenCap,
  calculateRemainingWithdrawalCap,
} from '@/stores/synthetics/marketsData/caps';
import type {
  HlvMarket,
  MarketTokenData,
  MarketTokensData,
} from '@/stores/synthetics/marketTokens/types';
import { allocateVaultLiquidity } from './allocateVaultLiquidity';

import type { Market, MarketInfo } from '@hertzflow/sdk-v2/types/markets';
import type { HertzFlowSdkConfig } from '@hertzflow/sdk-v2/types/sdk';
import type {
  TokenPricesData,
  TokensData,
} from '@hertzflow/sdk-v2/types/tokens';

const LIVE_TEST_ENABLED = process.env.RUN_LIVE_BSC_FORK_TESTS === '1';
const TARGET_MARKET = '0x3f6D02a30a042b420097e087BEf6a1c2867ef75E' as Address;
const TARGET_VAULT = '0x75C650D46ddb167a54B79B8cF2865700C1b6BaA4' as Address;
const BSC_TESTNET_RPC =
  process.env.BSC_TESTNET_RPC_URL ?? 'https://bsc-testnet-rpc.publicnode.com';
const STATS_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL_BSC ??
  'https://data-statistics-query.beatnet.htzfl.link'
).replace(/\/api\/?$/, '');
const STATS_API_URL = `${STATS_BASE_URL}/api`;
const ORACLE_URL =
  process.env.NEXT_PUBLIC_ORACLE_API_URL_BSC ??
  'https://oracle-aggregator.beatnet.htzfl.link/api';
const ANVIL_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const BALANCES_SLOT = 0n;
const ALLOWANCES_SLOT = 1n;
const HZV_TOKEN_DECIMALS = 18;
const BPS_DIVISOR = 10_000n;
const DEFAULT_SLIPPAGE_BPS = 200n;

function resetSdkMulticall() {
  Multicall.instances = {};
}

function toAddress(value: string): Address {
  return getAddress(value) as Address;
}

function getRequiredToken(
  tokensData: TokensData,
  address: string,
  label: string,
) {
  const checksumAddress = toAddress(address);
  const token =
    tokensData[checksumAddress] ??
    tokensData[checksumAddress.toLowerCase()] ??
    tokensData[address];
  assert.ok(token, `missing ${label} token ${address}`);
  return token;
}

function getRequiredPrices(
  pricesData: TokenPricesData,
  address: string,
  label: string,
) {
  const checksumAddress = toAddress(address);
  const prices =
    pricesData[checksumAddress] ??
    pricesData[checksumAddress.toLowerCase()] ??
    pricesData[address];
  assert.ok(prices, `missing ${label} prices ${address}`);
  return prices;
}

async function getFreePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === 'string') {
          reject(new Error('Failed to allocate anvil port'));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

async function startAnvilFork() {
  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}`;
  const anvil = spawn('anvil', [
    '--fork-url',
    BSC_TESTNET_RPC,
    '--chain-id',
    String(SOURCE_BSC_TESTNET),
    '--port',
    String(port),
    '--silent',
  ]);

  anvil.unref();
  const client = createPublicClient({
    chain: bscTestnet,
    transport: http(url, { timeout: 20_000, retryCount: 0 }),
  });

  for (let i = 0; i < 80; i += 1) {
    if (anvil.exitCode !== null) {
      throw new Error(`anvil exited early with code ${anvil.exitCode}`);
    }
    try {
      await client.getBlockNumber();
      return { anvil, url };
    } catch {
      await delay(250);
    }
  }

  anvil.kill();
  throw new Error('Timed out waiting for anvil fork');
}

function stopAnvil(anvil: ChildProcessWithoutNullStreams) {
  anvil.kill();
}

function mappingSlot(address: Address, slot: bigint) {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [address, slot],
    ),
  );
}

function nestedAllowanceSlot(owner: Address, spender: Address) {
  const ownerSlot = mappingSlot(owner, ALLOWANCES_SLOT);
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [spender, ownerSlot],
    ),
  );
}

async function setForkAccountFunds({
  client,
  token,
  account,
  spender,
  amount,
}: {
  client: ReturnType<typeof createPublicClient>;
  token: Address;
  account: Address;
  spender: Address;
  amount: bigint;
}) {
  const storageValue = toHex(amount, { size: 32 });
  await client.request({
    method: 'anvil_setBalance',
    params: [account, toHex(parseEther('10'))],
  });
  await client.request({
    method: 'anvil_setStorageAt',
    params: [token, mappingSlot(account, BALANCES_SLOT), storageValue],
  });
  await client.request({
    method: 'anvil_setStorageAt',
    params: [token, nestedAllowanceSlot(account, spender), storageValue],
  });
  await client.request({ method: 'evm_mine', params: [] });
}

async function readMarketFromReader(
  client: ReturnType<typeof createPublicClient>,
  marketAddress: Address,
) {
  const readerAddress = getContract(SOURCE_BSC_TESTNET, 'SyntheticsReader');
  const dataStoreAddress = getContract(SOURCE_BSC_TESTNET, 'DataStore');
  const market = (await client.readContract({
    address: readerAddress,
    abi: abis.SyntheticsReader,
    functionName: 'getMarket',
    args: [dataStoreAddress, marketAddress],
  })) as {
    marketToken: Address;
    indexToken: Address;
    longToken: Address;
    shortToken: Address;
  };
  assert.ok(
    market.marketToken.toLowerCase() === marketAddress.toLowerCase(),
    `missing target market ${marketAddress}; reader returned ${market.marketToken}`,
  );

  return {
    marketTokenAddress: market.marketToken,
    indexTokenAddress: market.indexToken,
    longTokenAddress: market.longToken,
    shortTokenAddress: market.shortToken,
    isSameCollaterals:
      market.longToken.toLowerCase() === market.shortToken.toLowerCase(),
    isSpotOnly: market.indexToken === zeroAddress,
  } satisfies Market;
}

function readTargetMarketFromReader(
  client: ReturnType<typeof createPublicClient>,
) {
  return readMarketFromReader(client, TARGET_MARKET);
}

async function loadLiveMarketContext(
  sdk: HertzFlowSDK,
  client: ReturnType<typeof createPublicClient>,
) {
  const targetMarket = await readTargetMarketFromReader(client);

  const { tokensData } = await sdk.tokens.getTokensData();
  assert.ok(tokensData, 'missing live tokens data');

  const pricesResult = await sdk.tokens.getTokenRecentPrices();
  const pricesData = pricesResult.pricesData ?? {};
  assert.ok(Object.keys(pricesData).length > 0, 'missing live prices data');

  const [marketsValues, marketsConfigs] = await Promise.all([
    sdk.markets.getMarketsValues({
      prices: pricesData,
      markets: [targetMarket],
      tokensData,
    }),
    sdk.markets.getMarketsConfigs([targetMarket]),
  ]);
  const { marketsInfoData } = sdk.markets.mergeMarketsInfo({
    markets: [targetMarket],
    tokensData,
    marketsConfigs,
    marketsValues,
  });
  const marketKey = Object.keys(marketsInfoData).find(
    (address) => address.toLowerCase() === TARGET_MARKET.toLowerCase(),
  );
  assert.ok(marketKey, `missing merged market info ${TARGET_MARKET}`);
  const marketInfo = marketsInfoData[marketKey];
  assert.ok(marketInfo, `missing merged market info ${TARGET_MARKET}`);

  return {
    marketInfo,
    pricesData,
    tokensData,
  };
}

async function fetchLiveVaultDetail(): Promise<VaultDetailItem> {
  const url = `${STATS_BASE_URL}/api/v1/bsc/vault/${TARGET_VAULT}`;
  const response = await fetch(url);
  assert.ok(
    response.ok,
    `failed to fetch live vault detail: ${response.status}`,
  );
  const json = (await response.json()) as { data?: VaultDetailItem };
  assert.ok(json.data, 'missing live vault detail data');
  return json.data;
}

async function loadMarketTokenData({
  client,
  markets,
  marketInfoData,
  pricesData,
}: {
  client: ReturnType<typeof createPublicClient>;
  markets: Market[];
  marketInfoData: Record<string, MarketInfo>;
  pricesData: TokenPricesData;
}): Promise<MarketTokensData> {
  const dataStoreAddress = getContract(SOURCE_BSC_TESTNET, 'DataStore');
  const readerAddress = getContract(SOURCE_BSC_TESTNET, 'SyntheticsReader');
  const marketTokensData: MarketTokensData = {};

  for (const market of markets) {
    const marketAddress = toAddress(market.marketTokenAddress);
    const marketInfo = marketInfoData[marketAddress];
    assert.ok(marketInfo, `missing market info for ${marketAddress}`);
    const indexTokenAddress = toAddress(marketInfo.indexTokenAddress);
    const longTokenAddress = toAddress(marketInfo.longTokenAddress);
    const shortTokenAddress = toAddress(marketInfo.shortTokenAddress);

    const indexTokenPrice = convertToContractTokenPrices(
      getRequiredPrices(pricesData, indexTokenAddress, 'index token'),
      marketInfo.indexToken.decimals,
    );
    const longTokenPrice = convertToContractTokenPrices(
      getRequiredPrices(pricesData, longTokenAddress, 'long token'),
      marketInfo.longToken.decimals,
    );
    const shortTokenPrice = convertToContractTokenPrices(
      getRequiredPrices(pricesData, shortTokenAddress, 'short token'),
      marketInfo.shortToken.decimals,
    );
    const marketProps = {
      marketToken: marketAddress,
      indexToken: indexTokenAddress,
      longToken: longTokenAddress,
      shortToken: shortTokenAddress,
    };
    const [minPriceResult, maxPriceResult, totalSupply] = await Promise.all([
      client.readContract({
        address: readerAddress,
        abi: abis.SyntheticsReader,
        functionName: 'getMarketTokenPrice',
        args: [
          dataStoreAddress,
          marketProps,
          indexTokenPrice,
          longTokenPrice,
          shortTokenPrice,
          MAX_PNL_FACTOR_FOR_DEPOSITS_KEY as Hex,
          false,
        ],
      }) as Promise<[bigint, unknown]>,
      client.readContract({
        address: readerAddress,
        abi: abis.SyntheticsReader,
        functionName: 'getMarketTokenPrice',
        args: [
          dataStoreAddress,
          marketProps,
          indexTokenPrice,
          longTokenPrice,
          shortTokenPrice,
          MAX_PNL_FACTOR_FOR_DEPOSITS_KEY as Hex,
          true,
        ],
      }) as Promise<[bigint, unknown]>,
      client.readContract({
        address: marketAddress,
        abi: abis.Token,
        functionName: 'totalSupply',
        args: [],
      }) as Promise<bigint>,
    ]);

    marketTokensData[marketAddress] = {
      name: 'HertzFlow Market Tokens',
      symbol: 'HzLP',
      decimals: 18,
      imageUrl: '/coins/hzlp.png',
      isPlatformToken: true,
      address: marketAddress,
      prices: {
        minPrice: minPriceResult[0],
        maxPrice: maxPriceResult[0],
      },
      totalSupply,
      id: marketAddress,
      category: 'crypto',
      longTokenAddress: marketInfo.longTokenAddress as Address,
      shortTokenAddress: marketInfo.shortTokenAddress as Address,
      indexTokenAddress: marketInfo.indexTokenAddress as Address,
      isSameCollaterals: marketInfo.isSameCollaterals,
      pxDispDecimal: 2,
    } satisfies MarketTokenData;
  }

  return marketTokensData;
}

async function loadHlvMarkets({
  client,
  vault,
  markets,
}: {
  client: ReturnType<typeof createPublicClient>;
  vault: Address;
  markets: Address[];
}): Promise<HlvMarket[]> {
  const dataStoreAddress = getContract(SOURCE_BSC_TESTNET, 'DataStore');
  const {
    hlvMaxMarketTokenBalanceAmountKey,
    hlvMaxMarketTokenBalanceUsdKey,
    isHlvDisabledKey,
  } = await import('@hertzflow/sdk-v2/configs/dataStore');

  const result: HlvMarket[] = [];
  for (const market of markets) {
    const [amountCap, usdCap, isDisabled, balance] = await Promise.all([
      client.readContract({
        address: dataStoreAddress,
        abi: abis.DataStore,
        functionName: 'getUint',
        args: [hlvMaxMarketTokenBalanceAmountKey(vault, market) as Hex],
      }) as Promise<bigint>,
      client.readContract({
        address: dataStoreAddress,
        abi: abis.DataStore,
        functionName: 'getUint',
        args: [hlvMaxMarketTokenBalanceUsdKey(vault, market) as Hex],
      }) as Promise<bigint>,
      client.readContract({
        address: dataStoreAddress,
        abi: abis.DataStore,
        functionName: 'getBool',
        args: [isHlvDisabledKey(vault, market) as Hex],
      }) as Promise<boolean>,
      client.readContract({
        address: vault,
        abi: abis.HlvToken,
        functionName: 'tokenBalances',
        args: [market],
      }) as Promise<bigint>,
    ]);
    result.push({
      address: market,
      isDisabled,
      hlvMaxMarketTokenBalanceAmount: amountCap,
      hlvMaxMarketTokenBalanceUsd: usdCap,
      hzlpBalance: balance,
    });
  }
  return result.sort((a, b) => (a.hzlpBalance > b.hzlpBalance ? -1 : 1));
}

async function readHlvTokenPriceMax({
  client,
  markets,
  marketInfoData,
  pricesData,
  tokensData,
}: {
  client: ReturnType<typeof createPublicClient>;
  markets: Address[];
  marketInfoData: Record<string, MarketInfo>;
  pricesData: TokenPricesData;
  tokensData: TokensData;
}) {
  const dataStoreAddress = getContract(SOURCE_BSC_TESTNET, 'DataStore');
  const readerAddress = getContract(SOURCE_BSC_TESTNET, 'HlvReader');
  const indexTokenPrices = markets.map((market) => {
    const marketInfo = marketInfoData[market];
    assert.ok(marketInfo, `missing market info for ${market}`);
    return convertToContractTokenPrices(
      getRequiredPrices(
        pricesData,
        marketInfo.indexTokenAddress,
        'index token',
      ),
      marketInfo.indexToken.decimals,
    );
  });
  const firstMarketAddress = markets[0];
  assert.ok(firstMarketAddress, 'missing vault market addresses');
  const firstMarketInfo = marketInfoData[firstMarketAddress];
  assert.ok(
    firstMarketInfo,
    `missing first vault market ${firstMarketAddress}`,
  );
  const longToken = getRequiredToken(
    tokensData,
    firstMarketInfo.longTokenAddress,
    'vault long',
  );
  const shortToken = getRequiredToken(
    tokensData,
    firstMarketInfo.shortTokenAddress,
    'vault short',
  );
  const longTokenPrice = convertToContractTokenPrices(
    getRequiredPrices(pricesData, longToken.address, 'vault long token'),
    longToken.decimals,
  );
  const shortTokenPrice = convertToContractTokenPrices(
    getRequiredPrices(pricesData, shortToken.address, 'vault short token'),
    shortToken.decimals,
  );
  const result = (await client.readContract({
    address: readerAddress,
    abi: abis.HlvReader,
    functionName: 'getHlvTokenPrice',
    args: [
      dataStoreAddress,
      markets,
      indexTokenPrices,
      longTokenPrice,
      shortTokenPrice,
      TARGET_VAULT,
      true,
    ],
  })) as [bigint, bigint, bigint];
  return result[0];
}

function buildDepositPayload({
  amount,
  account,
  market,
  token,
  executionFee,
}: {
  amount: bigint;
  account: Address;
  market: Address;
  token: Address;
  executionFee: bigint;
}): Hex[] {
  const depositVault = getContract(SOURCE_BSC_TESTNET, 'DepositVault');
  return [
    encodeFunctionData({
      abi: abis.ExchangeRouter,
      functionName: 'sendWnt',
      args: [depositVault, executionFee],
    }),
    encodeFunctionData({
      abi: abis.ExchangeRouter,
      functionName: 'sendTokens',
      args: [token, depositVault, amount],
    }),
    encodeFunctionData({
      abi: abis.ExchangeRouter,
      functionName: 'createDeposit',
      args: [
        {
          addresses: {
            receiver: account,
            callbackContract: zeroAddress,
            uiFeeReceiver: zeroAddress,
            market,
            initialLongToken: token,
            initialShortToken: token,
            longTokenSwapPath: [],
            shortTokenSwapPath: [],
          },
          minMarketTokens: 0n,
          shouldUnwrapNativeToken: false,
          executionFee,
          callbackGasLimit: 0n,
          dataList: [],
        },
      ],
    }),
  ];
}

function applySlippage(value: bigint) {
  return (value * (BPS_DIVISOR - DEFAULT_SLIPPAGE_BPS)) / BPS_DIVISOR;
}

function getMarketInfoByAddress(
  data: Record<string, MarketInfo>,
  market: Address,
) {
  const checksum = toAddress(market);
  return (
    data[checksum] ?? data[checksum.toLowerCase() as Address] ?? data[market]
  );
}

function getMarketTokenDataByAddress(data: MarketTokensData, market: Address) {
  const checksum = toAddress(market);
  return (
    data[checksum] ?? data[checksum.toLowerCase() as Address] ?? data[market]
  );
}

function getDepositAmountsForMarket({
  marketInfo,
  marketTokenData,
  tokensData,
  pricesData,
  shortTokenAmount,
  depositUiFeeFactor,
  hlvTokenPrice,
}: {
  marketInfo: MarketInfo;
  marketTokenData: MarketTokenData;
  tokensData: TokensData;
  pricesData: TokenPricesData;
  shortTokenAmount: bigint;
  depositUiFeeFactor: bigint;
  hlvTokenPrice: bigint;
}) {
  const longToken = getRequiredToken(
    tokensData,
    marketInfo.longTokenAddress,
    'long',
  );
  const shortToken = getRequiredToken(
    tokensData,
    marketInfo.shortTokenAddress,
    'short',
  );
  const longPrices = getRequiredPrices(
    pricesData,
    marketInfo.longTokenAddress,
    'long token',
  );
  const shortPrices = getRequiredPrices(
    pricesData,
    marketInfo.shortTokenAddress,
    'short token',
  );

  const longTokenAmount = marketInfo.isSameCollaterals
    ? shortTokenAmount / 2n
    : 0n;
  const adjustedShortTokenAmount = marketInfo.isSameCollaterals
    ? shortTokenAmount - longTokenAmount
    : shortTokenAmount;

  return getDepositAmounts({
    marketInfo,
    marketToken: marketTokenData,
    longToken: {
      ...longToken,
      prices: longPrices,
    } satisfies TokenDataWithPrices,
    shortToken: {
      ...shortToken,
      prices: shortPrices,
    } satisfies TokenDataWithPrices,
    longTokenAmount,
    shortTokenAmount: adjustedShortTokenAmount,
    uiFeeFactor: depositUiFeeFactor,
    hlvToken: {
      decimals: HZV_TOKEN_DECIMALS,
      prices: {
        minPrice: hlvTokenPrice,
        maxPrice: hlvTokenPrice,
      },
    },
    isMarketTokenDeposit: false,
  });
}

function buildHlvDepositPayload({
  account,
  vault,
  shortToken,
  parts,
  executionFee,
}: {
  account: Address;
  vault: Address;
  shortToken: Address;
  parts: Array<{
    marketAddress: Address;
    shortTokenAmount: bigint;
    minHlvTokens: bigint;
    marketTokenAmount?: bigint;
  }>;
  executionFee: bigint;
}): Hex[] {
  const hlvVault = getContract(SOURCE_BSC_TESTNET, 'HlvVault');
  const payload: Hex[] = [];

  for (const part of parts) {
    payload.push(
      encodeFunctionData({
        abi: abis.HlvRouter,
        functionName: 'sendWnt',
        args: [hlvVault, executionFee],
      }),
    );
    payload.push(
      encodeFunctionData({
        abi: abis.HlvRouter,
        functionName: 'sendTokens',
        args: [shortToken, hlvVault, part.shortTokenAmount],
      }),
    );
    payload.push(
      encodeFunctionData({
        abi: abis.HlvRouter,
        functionName: 'createHlvDeposit',
        args: [
          {
            addresses: {
              hlv: vault,
              market: part.marketAddress,
              receiver: account,
              callbackContract: zeroAddress,
              uiFeeReceiver: zeroAddress,
              initialLongToken: shortToken,
              initialShortToken: shortToken,
              longTokenSwapPath: [],
              shortTokenSwapPath: [],
            },
            minHlvTokens: part.minHlvTokens,
            executionFee,
            callbackGasLimit: 0n,
            shouldUnwrapNativeToken: false,
            isMarketTokenDeposit: false,
            dataList: [],
          },
        ],
      }),
    );
  }

  return payload;
}

function buildVaultDepositParts({
  allocation,
  amount,
  marketInfoData,
  marketTokensData,
  tokensData,
  pricesData,
  depositUiFeeFactor,
  hlvTokenPrice,
}: {
  allocation: ReturnType<typeof allocateVaultLiquidity>;
  amount: bigint;
  marketInfoData: Record<string, MarketInfo>;
  marketTokensData: MarketTokensData;
  tokensData: TokensData;
  pricesData: TokenPricesData;
  depositUiFeeFactor: bigint;
  hlvTokenPrice: bigint;
}) {
  assert.ok(allocation.allocations.length > 0, 'missing live vault allocation');

  const lastPartIndex = allocation.allocations.length - 1;
  const totalUsd = allocation.allocations.reduce(
    (sum, item) => sum + item.amountUsd,
    0n,
  );
  let remainingAmount = amount;

  return allocation.allocations.map((item, index) => {
    const partAmount =
      index === lastPartIndex
        ? remainingAmount
        : (amount * item.amountUsd) / totalUsd;
    remainingAmount =
      remainingAmount > partAmount ? remainingAmount - partAmount : 0n;
    const marketInfo = getMarketInfoByAddress(
      marketInfoData,
      item.marketAddress,
    );
    const marketTokenData = getMarketTokenDataByAddress(
      marketTokensData,
      item.marketAddress,
    );
    assert.ok(marketInfo, `missing allocation market ${item.marketAddress}`);
    assert.ok(
      marketTokenData,
      `missing allocation market token ${item.marketAddress}`,
    );
    const depositAmounts = getDepositAmountsForMarket({
      marketInfo,
      marketTokenData,
      tokensData,
      pricesData,
      shortTokenAmount: partAmount,
      depositUiFeeFactor,
      hlvTokenPrice,
    });
    assert.ok(
      depositAmounts.hlvTokenAmount > 0n,
      `missing min HzV for ${item.marketAddress}`,
    );

    return {
      marketAddress: item.marketAddress,
      shortTokenAmount: partAmount,
      minHlvTokens: applySlippage(depositAmounts.hlvTokenAmount),
      marketTokenAmount: depositAmounts.marketTokenAmount,
      projectedPoolValue:
        marketInfo.poolValueMax +
        depositAmounts.longTokenUsd +
        depositAmounts.shortTokenUsd,
      projectedMarketTokenSupply:
        marketTokenData.totalSupply + depositAmounts.marketTokenAmount,
    };
  });
}

function hasProjectedVaultMarketCapExceeded({
  parts,
  hlvMarkets,
  marketTokensData,
}: {
  parts: Array<{
    marketAddress: Address;
    marketTokenAmount: bigint;
    projectedPoolValue: bigint;
    projectedMarketTokenSupply: bigint;
  }>;
  hlvMarkets: HlvMarket[];
  marketTokensData: MarketTokensData;
}) {
  for (const part of parts) {
    const hlvMarket = hlvMarkets.find(
      (market) =>
        market.address.toLowerCase() === part.marketAddress.toLowerCase(),
    );
    const marketTokenData = getMarketTokenDataByAddress(
      marketTokensData,
      part.marketAddress,
    );
    assert.ok(hlvMarket, `missing HLV market ${part.marketAddress}`);
    assert.ok(marketTokenData, `missing market token ${part.marketAddress}`);

    const projectedMarketTokenAmount =
      hlvMarket.hzlpBalance + part.marketTokenAmount;
    if (
      hlvMarket.hlvMaxMarketTokenBalanceAmount > 0n &&
      projectedMarketTokenAmount > hlvMarket.hlvMaxMarketTokenBalanceAmount
    ) {
      return true;
    }

    const maxUsd = hlvMarket.hlvMaxMarketTokenBalanceUsd;
    if (!maxUsd || maxUsd <= 0n) continue;
    const projectedMarketTokenUsd =
      part.projectedPoolValue > 0n && part.projectedMarketTokenSupply > 0n
        ? (projectedMarketTokenAmount * part.projectedPoolValue) /
          part.projectedMarketTokenSupply
        : (projectedMarketTokenAmount * marketTokenData.prices.maxPrice) /
          10n ** BigInt(marketTokenData.decimals);
    if (projectedMarketTokenUsd > maxUsd) {
      return true;
    }
  }

  return false;
}

function pickSimulationTokens(
  tokensData: TokensData,
  tokenAddresses: string[],
): TokensData {
  const result: TokensData = {};
  const entries = Object.entries(tokensData);

  for (const tokenAddress of new Set(tokenAddresses)) {
    const entry = entries.find(
      ([address]) => address.toLowerCase() === tokenAddress.toLowerCase(),
    );
    assert.ok(entry, `missing token data for ${tokenAddress}`);
    result[entry[0]] = entry[1];
  }

  return result;
}

function getNonceKey(dataStore: Address, nonce: bigint): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [dataStore, nonce],
    ),
  );
}

async function createDepositRequest({
  client,
  walletClient,
  payload,
  value,
}: {
  client: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
  payload: Hex[];
  value: bigint;
}) {
  const dataStore = getContract(SOURCE_BSC_TESTNET, 'DataStore');
  const exchangeRouter = getContract(SOURCE_BSC_TESTNET, 'ExchangeRouter');
  const nonce = (await client.readContract({
    address: dataStore,
    abi: abis.DataStore,
    functionName: 'getUint',
    args: [NONCE_KEY as Hex],
  })) as bigint;

  const forkWalletClient = walletClient as unknown as {
    writeContract: (args: {
      address: Address;
      abi: typeof abis.ExchangeRouter;
      functionName: 'multicall';
      args: [Hex[]];
      value: bigint;
    }) => Promise<Hex>;
  };
  const hash = await forkWalletClient.writeContract({
    address: exchangeRouter,
    abi: abis.ExchangeRouter,
    functionName: 'multicall',
    args: [payload],
    value,
  });
  const receipt = await client.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success', 'create deposit request failed');

  return getNonceKey(dataStore, nonce + 1n);
}

function isEndOfOracleSimulation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('EndOfOracleSimulation') || message.includes('0x4e48dcda')
  );
}

async function simulateDepositByKey({
  sdk,
  key,
  prices,
}: {
  sdk: HertzFlowSDK;
  key: Hex;
  prices: ReturnType<typeof getLiquiditySimulationPrices>;
}) {
  const exchangeRouterAddress = getContract(
    SOURCE_BSC_TESTNET,
    'ExchangeRouter',
  );
  const block = await sdk.publicClient.getBlock();
  const blockTimestamp = block.timestamp;
  const priceTimestamp = blockTimestamp + 120n;

  try {
    await sdk.publicClient.simulateContract({
      address: exchangeRouterAddress,
      abi: abis.ExchangeRouter,
      functionName: 'simulateExecuteDeposit',
      args: [
        key,
        {
          primaryTokens: prices.primaryTokens,
          primaryPrices: prices.primaryPrices,
          minTimestamp: priceTimestamp,
          maxTimestamp: priceTimestamp,
        },
      ],
      account: sdk.account,
    });
  } catch (error) {
    if (isEndOfOracleSimulation(error)) return;
    throw error;
  }

  throw new Error('simulateExecuteDeposit did not end oracle simulation');
}

const liveTest = LIVE_TEST_ENABLED ? test : test.skip;

liveTest(
  'live fork: target pool deposit cap matches contract simulation boundary',
  { timeout: 120_000 },
  async (t) => {
    resetSdkMulticall();
    const { anvil, url } = await startAnvilFork();
    t.after(() => {
      stopAnvil(anvil);
      resetSdkMulticall();
    });

    const account = privateKeyToAccount(ANVIL_PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http(url, { timeout: 90_000, retryCount: 0 }),
    });
    const walletClient = createWalletClient({
      account,
      chain: bscTestnet,
      transport: http(url, { timeout: 90_000, retryCount: 0 }),
    });
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      account: account.address,
      rpcUrl: url,
      oracleUrl: ORACLE_URL,
      tokens: () =>
        fetchStatsTokens(SOURCE_BSC_TESTNET, `${STATS_API_URL}/v1/bsc`),
      publicClient: publicClient as HertzFlowSdkConfig['publicClient'],
      settings: { debugMode: false, ignoreTimeoutError: true },
    });
    t.after(() => sdk.destroy());

    const { marketInfo, pricesData, tokensData } = await loadLiveMarketContext(
      sdk,
      publicClient,
    );
    assert.equal(marketInfo.marketTokenAddress, TARGET_MARKET);
    assert.equal(marketInfo.longTokenAddress, marketInfo.shortTokenAddress);

    const depositAmountCap = calculateRemainingDepositTokenCap(
      marketInfo,
      pricesData,
      0n,
    );
    const depositUsdCap = calculateRemainingDepositCap(
      marketInfo,
      pricesData[marketInfo.shortTokenAddress]?.maxPrice,
      marketInfo.shortToken.decimals,
      pricesData,
      0n,
    );
    const withdrawalUsdCap = calculateRemainingWithdrawalCap(
      marketInfo,
      pricesData,
    );

    assert.ok(depositAmountCap > 0n, 'live deposit token cap should be > 0');
    assert.ok(depositUsdCap > 0n, 'live deposit USD cap should be > 0');
    assert.ok(
      withdrawalUsdCap !== undefined && withdrawalUsdCap > 0n,
      'live withdrawal USD cap should be > 0',
    );

    const router = getContract(SOURCE_BSC_TESTNET, 'SyntheticsRouter');
    await setForkAccountFunds({
      client: publicClient,
      token: marketInfo.shortTokenAddress as Address,
      account: account.address,
      spender: router,
      amount:
        depositAmountCap + 25n * 10n ** BigInt(marketInfo.shortToken.decimals),
    });

    const balance = (await publicClient.readContract({
      address: marketInfo.shortTokenAddress as Address,
      abi: abis.Token,
      functionName: 'balanceOf',
      args: [account.address],
    })) as bigint;
    const allowance = (await publicClient.readContract({
      address: marketInfo.shortTokenAddress as Address,
      abi: abis.Token,
      functionName: 'allowance',
      args: [account.address, router],
    })) as bigint;
    assert.ok(balance >= depositAmountCap + 1n, 'fork balance not set');
    assert.ok(allowance >= depositAmountCap + 1n, 'fork allowance not set');

    const executionFee = parseEther('0.02');
    const simulationTokensData = pickSimulationTokens(tokensData, [
      marketInfo.indexTokenAddress,
      marketInfo.longTokenAddress,
      marketInfo.shortTokenAddress,
    ]);
    const simulationPrices = getLiquiditySimulationPrices(
      pricesData as Record<Address, TokenPricesData[string]>,
      simulationTokensData,
      [],
    );
    const createAndSimulateDeposit = async (amount: bigint) => {
      const payload = buildDepositPayload({
        amount,
        account: account.address,
        market: TARGET_MARKET,
        token: marketInfo.shortTokenAddress as Address,
        executionFee,
      });
      const key = await createDepositRequest({
        client: publicClient,
        walletClient,
        payload,
        value: executionFee,
      });
      const deposit = (await publicClient.readContract({
        address: getContract(SOURCE_BSC_TESTNET, 'SyntheticsReader'),
        abi: abis.SyntheticsReader,
        functionName: 'getDeposit',
        args: [getContract(SOURCE_BSC_TESTNET, 'DataStore'), key],
      })) as {
        numbers: {
          initialLongTokenAmount: bigint;
          initialShortTokenAmount: bigint;
        };
      };
      assert.equal(deposit.numbers.initialLongTokenAmount, amount);
      assert.equal(deposit.numbers.initialShortTokenAmount, 0n);

      await simulateDepositByKey({
        sdk,
        key,
        prices: simulationPrices,
      });
    };
    const rpcClient = publicClient as unknown as {
      request: (args: { method: string; params: unknown[] }) => Promise<Hex>;
    };
    const runWithSnapshot = async (fn: () => Promise<void>) => {
      const snapshotId = await rpcClient.request({
        method: 'evm_snapshot',
        params: [],
      });
      try {
        await fn();
      } finally {
        await rpcClient.request({
          method: 'evm_revert',
          params: [snapshotId],
        });
      }
    };

    await runWithSnapshot(() => createAndSimulateDeposit(depositAmountCap));
    await runWithSnapshot(() =>
      assert.rejects(
        () => createAndSimulateDeposit(depositAmountCap + 1n),
        /MaxPoolAmountExceeded|MaxPoolUsdForDepositExceeded|0x6429ff3f|0x46169f04/,
      ),
    );
  },
);

liveTest(
  'live fork: target vault deposit validation matches HlvRouter simulation',
  { timeout: 180_000 },
  async (t) => {
    resetSdkMulticall();
    const { anvil, url } = await startAnvilFork();
    t.after(() => {
      stopAnvil(anvil);
      resetSdkMulticall();
    });

    const account = privateKeyToAccount(ANVIL_PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http(url, { timeout: 90_000, retryCount: 0 }),
    });
    const sdk = new HertzFlowSDK({
      chainId: SOURCE_BSC_TESTNET,
      account: account.address,
      rpcUrl: url,
      oracleUrl: ORACLE_URL,
      tokens: () =>
        fetchStatsTokens(SOURCE_BSC_TESTNET, `${STATS_API_URL}/v1/bsc`),
      publicClient: publicClient as HertzFlowSdkConfig['publicClient'],
      settings: { debugMode: false, ignoreTimeoutError: true },
    });
    t.after(() => sdk.destroy());

    const vaultDetail = await fetchLiveVaultDetail();
    assert.equal(toAddress(vaultDetail.vault_address), TARGET_VAULT);

    const exposureAddresses = vaultDetail.market_exposure.map((item) =>
      toAddress(item.market_address),
    );
    const vaultMarkets = await Promise.all(
      exposureAddresses.map((marketAddress) =>
        readMarketFromReader(publicClient, marketAddress),
      ),
    );
    assert.equal(
      vaultMarkets.length,
      exposureAddresses.length,
      'failed to load every vault market from reader',
    );

    const { tokensData } = await sdk.tokens.getTokensData();
    assert.ok(tokensData, 'missing live tokens data');
    const pricesResult = await sdk.tokens.getTokenRecentPrices();
    const pricesData = pricesResult.pricesData ?? {};
    assert.ok(Object.keys(pricesData).length > 0, 'missing live prices data');

    const [marketsValues, marketsConfigs] = await Promise.all([
      sdk.markets.getMarketsValues({
        prices: pricesData,
        markets: vaultMarkets,
        tokensData,
      }),
      sdk.markets.getMarketsConfigs(vaultMarkets),
    ]);
    const { marketsInfoData } = sdk.markets.mergeMarketsInfo({
      markets: vaultMarkets,
      tokensData,
      marketsConfigs,
      marketsValues,
    });
    assert.equal(
      Object.keys(marketsInfoData).length,
      vaultMarkets.length,
      'failed to merge every vault market info',
    );

    const [marketTokensData, hlvMarkets, depositUiFeeFactor, hlvTokenPrice] =
      await Promise.all([
        loadMarketTokenData({
          client: publicClient,
          markets: vaultMarkets,
          marketInfoData: marketsInfoData as Record<string, MarketInfo>,
          pricesData,
        }),
        loadHlvMarkets({
          client: publicClient,
          vault: TARGET_VAULT,
          markets: exposureAddresses,
        }),
        sdk.utils.getUiFeeFactor(),
        readHlvTokenPriceMax({
          client: publicClient,
          markets: exposureAddresses,
          marketInfoData: marketsInfoData as Record<string, MarketInfo>,
          pricesData,
          tokensData,
        }),
      ]);
    assert.equal(
      Object.keys(marketTokensData).length,
      vaultMarkets.length,
      'failed to load every vault market token price',
    );
    assert.equal(hlvMarkets.length, vaultMarkets.length);
    assert.ok(hlvTokenPrice > 0n, 'missing live HLV token price');

    const usdtAddress = toAddress(vaultDetail.short_token_address);
    const usdtToken = getRequiredToken(tokensData, usdtAddress, 'vault short');
    const usdtPrice = pricesData[usdtAddress]?.maxPrice;
    assert.ok(usdtPrice && usdtPrice > 0n, 'missing USDT max price');

    const caps = computeVaultRemainingCaps({
      marketExposure: vaultDetail.market_exposure,
      marketsInfoData: marketsInfoData as Record<Address, MarketInfo>,
      marketTokensData,
      pricesData,
      depositTokenPrice: usdtPrice,
      depositTokenDecimals: usdtToken.decimals,
      depositUiFeeFactor,
      hlvMarkets,
    });
    assert.ok(
      caps.remainingDepositCapUsd !== undefined,
      'live vault remaining deposit cap should be defined',
    );

    const simulateVaultDeposit = async (
      amount: bigint,
      parts: ReturnType<typeof buildVaultDepositParts>,
    ) => {
      const router = getContract(SOURCE_BSC_TESTNET, 'SyntheticsRouter');
      await setForkAccountFunds({
        client: publicClient,
        token: usdtAddress,
        account: account.address,
        spender: router,
        amount: amount + 1n,
      });

      const executionFee = parseEther('0.02');
      const payload = buildHlvDepositPayload({
        account: account.address,
        vault: TARGET_VAULT,
        shortToken: usdtAddress,
        parts,
        executionFee,
      });
      const simulationTokensData = pickSimulationTokens(tokensData, [
        ...vaultMarkets.flatMap((market) => [
          market.indexTokenAddress,
          market.longTokenAddress,
          market.shortTokenAddress,
        ]),
        usdtAddress,
      ]);
      const simulationPrices = getLiquiditySimulationPrices(
        pricesData as Record<Address, TokenPricesData[string]>,
        simulationTokensData,
        [],
      );

      await simulateExecuteLiquidityTxn(sdk, {
        createMulticallPayload: payload,
        prices: simulationPrices,
        value: executionFee * BigInt(parts.length),
        method: 'simulateExecuteLatestHlvDeposit',
      });
    };

    const buildCandidate = (amount: bigint) => {
      const amountUsd =
        (amount * usdtPrice) / 10n ** BigInt(usdtToken.decimals);
      const allocation = allocateVaultLiquidity({
        marketExposure: vaultDetail.market_exposure,
        marketsInfoData: marketsInfoData as Record<Address, MarketInfo>,
        marketTokensData,
        hlvMarkets,
        depositAmountUsd: amountUsd,
        depositTokenPrice: usdtPrice,
        depositTokenDecimals: usdtToken.decimals,
        pricesData,
        depositUiFeeFactor,
        conservativeProjectedCap: true,
      });
      if (allocation.exceedsCapacity || amount <= 0n) {
        return {
          amount,
          allocation,
          parts: [] as ReturnType<typeof buildVaultDepositParts>,
          projectedCapExceeded: false,
        };
      }

      const parts = buildVaultDepositParts({
        allocation,
        amount,
        marketInfoData: marketsInfoData as Record<string, MarketInfo>,
        marketTokensData,
        tokensData,
        pricesData,
        depositUiFeeFactor,
        hlvTokenPrice,
      });
      return {
        amount,
        allocation,
        parts,
        projectedCapExceeded: hasProjectedVaultMarketCapExceeded({
          parts,
          hlvMarkets,
          marketTokensData,
        }),
      };
    };

    const requestedAmount = parseUnits('20668', usdtToken.decimals);
    const requestedCandidate = buildCandidate(requestedAmount);
    const requestedBlocked =
      requestedCandidate.allocation.exceedsCapacity ||
      requestedCandidate.projectedCapExceeded;

    let candidate = requestedCandidate;
    if (requestedBlocked) {
      const forcedMarketAddress =
        exposureAddresses.find(
          (address) => address.toLowerCase() === TARGET_MARKET.toLowerCase(),
        ) ?? exposureAddresses[0];
      assert.ok(forcedMarketAddress, 'missing forced vault simulation market');
      const forcedAmountUsd =
        (requestedAmount * usdtPrice) / 10n ** BigInt(usdtToken.decimals);
      const forcedParts = buildVaultDepositParts({
        allocation: {
          allocations: [
            { marketAddress: forcedMarketAddress, amountUsd: forcedAmountUsd },
          ],
          exceedsCapacity: false,
          totalAvailableCapacity: forcedAmountUsd,
          totalAvailableCapacityAmount: requestedAmount,
          primaryMarket: forcedMarketAddress,
        },
        amount: requestedAmount,
        marketInfoData: marketsInfoData as Record<string, MarketInfo>,
        marketTokensData,
        tokensData,
        pricesData,
        depositUiFeeFactor,
        hlvTokenPrice,
      });

      await assert.rejects(
        () => simulateVaultDeposit(requestedAmount, forcedParts),
        /HlvMaxMarketTokenBalance(?:Usd|Amount)Exceeded|0xdb8376c7|0x1bd7f4fa/,
      );

      if (requestedCandidate.allocation.totalAvailableCapacity <= 0n) {
        return;
      }

      let low = 1n;
      let high = requestedAmount - 1n;
      let bestCandidate: typeof requestedCandidate | undefined;

      while (low <= high) {
        const mid = (low + high) / 2n;
        const midCandidate = buildCandidate(mid);
        const midBlocked =
          midCandidate.allocation.exceedsCapacity ||
          midCandidate.projectedCapExceeded ||
          midCandidate.parts.length === 0;
        if (midBlocked) {
          high = mid - 1n;
        } else {
          bestCandidate = midCandidate;
          low = mid + 1n;
        }
      }

      assert.ok(
        bestCandidate,
        'live vault projected cap cannot fit a safe test deposit',
      );
      candidate = bestCandidate;
    }

    assert.equal(candidate.allocation.exceedsCapacity, false);
    assert.equal(candidate.projectedCapExceeded, false);
    const parts = candidate.parts;
    const depositAmount = candidate.amount;
    assert.ok(parts.length > 0, 'missing generated vault deposit parts');
    assert.equal(
      parts.reduce((sum, part) => sum + part.shortTokenAmount, 0n),
      depositAmount,
      'vault deposit split does not conserve input amount',
    );

    await simulateVaultDeposit(depositAmount, parts);
  },
);
