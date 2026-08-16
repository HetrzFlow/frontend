import { queryClient } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import type HertzFlowSDK from '@hertzflow/sdk';

// TODO: coin configs
export const COIN_CONFIGS = {
  BTC: {
    pxDispDecimal: 2,
    szDispDecimal: 6,
  },
  ETH: {
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
  },
  HzLP: {
    pxDispDecimal: 4,
    szDispDecimal: 4,
  },
};

interface Symbol {
  coin_type: string;
  coin_name: string;
  coin_decimals: number;
  pool_amount: string;
  reserved_amount: string;
  usdc_decimals: number;
  usdc_pool_amount: string;
  usdc_reserved_amount: string;
  max_global_long_size: string;
  max_global_short_size: string;
  long_position_interest: string;
  short_position_interest: string;
}

export interface PerpSymbolListRes {
  error?: string;
  data?: {
    tokens?: Symbol[];
  };
}

export interface Inst extends Symbol {
  id: string;
  name: string;
  // pxDecimal: number;
  icon: string;
  // pxDispDecimal: number;
  baseCoin: string;
  coinType: string;
  // quoteCoin: string;
  // listTimestamp: number;
}

export const getInsts = (hzSdk: HertzFlowSDK) =>
  queryClient.fetchQuery({
    queryKey: ['rest', 'insts', hzSdk.fullClient.network],
    queryFn: async () => {
      try {
        const data = await hzSdk.ApiModule.fetchPerpableTokens();
        return (data?.items?.map((v) => {
          return {
            id: `${v.coin_name}/USD`,
            name: `${v.coin_name}USD`,
            ...v,
          };
        }) || []) as Inst[];
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-insts' });
        throw error;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

export interface Coin {
  name: string;
  symbol: string;
  icon: string;
  coinType: string;
  // coin decimal
  decimal: number;
  pxDispDecimal: number;
  szDispDecimal: number;
  // second timestamp
  launchTime?: number;
  swapFeeRate: number;
}

export const getCoins = (hzSdk: HertzFlowSDK) =>
  queryClient.fetchQuery({
    queryKey: ['rest', 'coins', hzSdk.fullClient.network],
    queryFn: async () => {
      try {
        const data = await hzSdk.ApiModule.fetchTokenWhitelist();
        const result = (data?.items?.map((v) => {
          return {
            name: v.coin_full_name,
            symbol: v.coin_name,
            icon: '',
            coinType: v.coin_type,
            decimal: v.coin_decimals,
            pxDispDecimal:
              COIN_CONFIGS[v.coin_name as keyof typeof COIN_CONFIGS]
                ?.pxDispDecimal ?? 2,
            //  TODO：hard code 2024-10-17
            launchTime: 1729094400,
            szDispDecimal:
              COIN_CONFIGS[v.coin_name as keyof typeof COIN_CONFIGS]
                .szDispDecimal,
            swapFeeRate: 0,
          };
        }) || []) as Coin[];

        return result;
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-coins' });
        throw error;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
