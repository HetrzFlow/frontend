import { Address } from 'viem';
import { queryClient } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import {
  CREDIT_TOKEN_SYMBOL,
  CREDIT_TOKEN_UI_CONFIG,
} from '@/lib/credit/creditTrade';
import { CATEGORY } from '@/services/rest/pools';
import { fetchStatsMarkets, type StatsMarket } from './stats';
import type { HertzFlowSDK } from '@hertzflow/sdk-v2';
import type { Market } from '@hertzflow/sdk-v2/types/markets';

// TODO: coin configs
export const COIN_CONFIGS: Record<
  string,
  {
    pxDispDecimal: number;
    szDispDecimal: number;
    szInputDecimal?: number;
  }
> = {
  BTC: {
    pxDispDecimal: 2,
    szDispDecimal: 6,
  },
  ETH: {
    pxDispDecimal: 2,
    szDispDecimal: 4,
  },
  BNB: {
    pxDispDecimal: 2,
    szDispDecimal: 4,
  },
  SUI: {
    pxDispDecimal: 4,
    szDispDecimal: 4,
  },
  USDC: {
    pxDispDecimal: 4,
    szDispDecimal: 2,
    szInputDecimal: 6,
  },
  USDT: {
    pxDispDecimal: 4,
    szDispDecimal: 2,
    szInputDecimal: 6,
  },
  [CREDIT_TOKEN_SYMBOL]: CREDIT_TOKEN_UI_CONFIG,
  HzLP: {
    pxDispDecimal: 4,
    szDispDecimal: 4,
  },
};

export interface Inst extends Market {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  category: CATEGORY;
  is_closed: boolean;
  is_market_pausing?: boolean;
  internalUsdResolutionError?: boolean;
  is_default?: boolean;
  max_leverage_normal?: number;
  min_leverage_hyper?: number;
  max_leverage_hyper?: number;
  marketTokenAddress: Address;
  indexTokenAddress: Address;
  longTokenAddress: Address;
  shortTokenAddress: Address;
  isSameCollaterals: boolean;
  isSpotOnly: boolean;
  isView: boolean;
  data: string;
  schedule: string;
  is_view?: boolean;
  // second timestamp
  launchTime?: number;
  pxDispDecimal?: number;
}

export function buildTradingInstruments(
  contractMarkets: Market[],
  marketMetadata: StatsMarket[],
): Inst[] {
  const contractMarketsByAddress = new Map(
    contractMarkets.map((market) => [
      market.marketTokenAddress.toLowerCase(),
      market,
    ]),
  );

  return marketMetadata.flatMap((metadata) => {
    const contractMarket = contractMarketsByAddress.get(
      metadata.market_address.toLowerCase(),
    );
    if (!contractMarket) return [];

    const internalUsdResolutionError =
      contractMarket.internalUsdResolutionError === true;

    return [
      {
        ...contractMarket,
        marketTokenAddress: contractMarket.marketTokenAddress as Address,
        indexTokenAddress: contractMarket.indexTokenAddress as Address,
        longTokenAddress: contractMarket.longTokenAddress as Address,
        shortTokenAddress: contractMarket.shortTokenAddress as Address,
        id: contractMarket.marketTokenAddress,
        icon: '',
        data: '',
        name: metadata.display_name,
        symbol: metadata.symbol,
        pxDispDecimal: metadata.px_disp_decimal,
        max_leverage_normal: metadata.max_leverage_normal,
        min_leverage_hyper: metadata.min_leverage_hyper,
        max_leverage_hyper: metadata.max_leverage_hyper,
        category: metadata.category,
        is_closed: metadata.is_closed,
        is_market_pausing:
          metadata.is_market_pausing || internalUsdResolutionError,
        is_default: metadata.is_default,
        isView: metadata.is_view ?? true,
        schedule: metadata.schedule,
        launchTime: 1729094400,
      },
    ];
  });
}

export const instDataStaleTime = 6 * 60 * 60 * 1000;

export const getInsts = (hzSdk: HertzFlowSDK | null) =>
  queryClient.fetchQuery({
    queryKey: ['rest', 'insts', hzSdk?.chainId],
    queryFn: async () => {
      try {
        if (!hzSdk) {
          return [];
        }
        const [contractMarkets, marketMetadata] = await Promise.all([
          hzSdk.markets.getMarkets(),
          fetchStatsMarkets(),
        ]);
        const data = {
          items: buildTradingInstruments(contractMarkets, marketMetadata),
        };

        return data.items.map((v) => {
          return {
            ...v,
            pxDispDecimal: v.pxDispDecimal ?? 2,
          };
        });
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-insts' });
        throw error;
      }
    },
    staleTime: instDataStaleTime,
    gcTime: instDataStaleTime * 2,
  });

export const getInstDataState = (hzSdk: HertzFlowSDK | null) => {
  return queryClient.getQueryState(['rest', 'insts', hzSdk?.chainId]);
};

export interface Coin {
  name: string;
  symbol: string;
  icon: string;
  address: string;
  decimals: number;

  decimal: number;
  isNative: boolean;
  isWrapped: boolean;
  isSynthetic?: boolean;

  pxDispDecimal: number;
  szDispDecimal: number;
  szInputDecimal: number;
}

export const coinDataStaleTime = 6 * 60 * 60 * 1000;

export const getCoins = (hzSdk: HertzFlowSDK | null) =>
  queryClient.fetchQuery({
    queryKey: ['rest', 'coins', hzSdk?.chainId],
    queryFn: async () => {
      try {
        if (!hzSdk) {
          return [];
        }
        const { tokensData = {} } = await hzSdk.tokens.getTokensData();
        const configuredAndApiTokens = {
          ...hzSdk.tokens.tokensConfig,
          ...tokensData,
        };
        const result = (Object.values(configuredAndApiTokens)?.map((v) => {
          const symbol =
            v.symbol === 'hfCREDIT' ? CREDIT_TOKEN_SYMBOL : v.symbol;

          const {
            pxDispDecimal = 2,
            szDispDecimal = 6,
            szInputDecimal = v.decimals,
          } = COIN_CONFIGS[symbol] || {};

          return {
            ...v,
            name: v.name,
            symbol: symbol,
            icon: '',
            coinType: v.address,
            decimal: v.decimals,
            pxDispDecimal: pxDispDecimal,
            szDispDecimal: szDispDecimal,
            szInputDecimal: szInputDecimal,
          };
        }) || []) as Coin[];

        return result;
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-coins' });
        throw error;
      }
    },
    staleTime: coinDataStaleTime,
    gcTime: Infinity,
  });

export const getCoinDataState = (hzSdk: HertzFlowSDK | null) => {
  return queryClient.getQueryState(['rest', 'coins', hzSdk?.chainId]);
};
