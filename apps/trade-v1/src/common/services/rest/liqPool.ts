import { useMemo } from 'react';
import {
  addHexPrefix,
  fromDecimalsAmount,
  HERTZFLOW_SUFFIX,
  PerpableTokensResponse,
  ProtocolStoreObjectInfo,
  VaultObjectInfo,
} from '@hertzflow/sdk';

import { normalizeStructTag } from '@mysten/sui/utils';
import { calc, truncate } from '@repo/lib/calc';
import { queryClient, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useHzSdk } from '../../chainClient/hooks';
import { TOTAL_WEIGHT } from '../../constants/common';
import { useGlobalStore } from '../../stores/globalStore';
import { useInstStore } from '../../stores/instStore';
import { getCachedPriceTickerData, usePriceTickerStream } from '../ws/tickers';

export type CoinDetailItem = {
  coin_name: string;
  coin_type: string;
  coin_amount: number;
  current_weight: number;
  target_weight: number;
  utilization: number;
  apr: {
    '1m': string;
    '24h': string;
    '7d': string;
  };
};
export type PoolDetailResData = {
  total_liquidity: string;
  limit: string;
  coin_details: CoinDetailItem[];
};

export interface PositionLiqPoolDataRes {
  error?: string;
  data?: {
    tokens?: {
      availableLongPosition: string;
      availableShortPosition: string;
      coinDecimals: number;
      coinName: string;
      coinType: string;
      longPositionInterest: string;
      shortPositionInterest: string;
    }[];
  };
}

type positionLiqPoolDataType = PerpableTokensResponse['items'][0] & {
  longLiq: string;
  shortLiq: string;
  longOpenInterest: string;
  shortOpenInterest: string;
};

// liq pool data
export const usePositionLiqPoolData = (instId: string = '') => {
  const hzSdk = useHzSdk();
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);
  const coins = useInstStore((state) => state.getCoins());
  const usdcCoin = useInstStore((state) => state.getUsdcCoin(state));
  const inst = useInstStore((state) => state.getInst(state, instId));
  const { data: usdcPrice } = usePriceTickerStream('USDC/USD', {
    throttleWait: 60000,
  });
  const baseCoinPrice = getCachedPriceTickerData(instId || '')?.[0]?.p;

  const result = useQuery({
    queryKey: ['rest', 'positionLiqPoolData', hzSdk.fullClient.network],
    queryFn: async () => {
      try {
        const data = await hzSdk.ApiModule.fetchPerpableTokens();
        return data;
      } catch (error) {
        toast.error((error as Error).message, {
          id: 'rest-positionLiqPoolData',
        });
        throw error;
      }
    },
    refetchInterval: 60000,
  });

  const resultData = useMemo(() => {
    let _resultData = result.data?.items?.find(
      (v) => v.coin_name === instId?.split('/')[0],
    ) as positionLiqPoolDataType | undefined;

    if (_resultData) {
      _resultData = { ..._resultData };
      const baseCoinPower = calc(10).pow(
        coins[inst?.baseCoin || '']?.decimal || '',
      );
      _resultData.pool_amount = truncate(
        calc(_resultData.pool_amount).div(baseCoinPower),
      );
      _resultData.reserved_amount = truncate(
        calc(_resultData.reserved_amount).div(baseCoinPower),
      );

      let longLiq = calc(_resultData.pool_amount)
        .minus(_resultData.reserved_amount)
        .times(baseCoinPrice || '')
        .toFixed();
      const maxLongLiq = +_resultData.max_global_long_size
        ? calc(_resultData.max_global_long_size)
            .minus(calc(_resultData.reserved_amount).times(baseCoinPrice || ''))
            .toFixed()
        : Infinity;
      longLiq = calc.min(maxLongLiq, longLiq).toFixed();

      const usdcPower = calc(10).pow(usdcCoin?.decimal || '');
      _resultData.usdc_pool_amount = truncate(
        calc(_resultData.usdc_pool_amount).div(usdcPower),
      );
      _resultData.usdc_reserved_amount = truncate(
        calc(_resultData.usdc_reserved_amount).div(usdcPower),
      );

      let shortLiq = calc(_resultData.usdc_pool_amount)
        .minus(_resultData.usdc_reserved_amount)
        .times(usdcPrice[0]?.p || '')
        .toFixed();
      const maxShortLiq = +_resultData.max_global_short_size
        ? calc(_resultData.max_global_short_size)
            .minus(
              calc(_resultData.usdc_reserved_amount).times(
                usdcPrice[0]?.p || '',
              ),
            )
            .toFixed()
        : Infinity;
      shortLiq = calc.min(longLiq, shortLiq, maxShortLiq).toFixed();

      _resultData.longLiq = longLiq;
      _resultData.shortLiq = shortLiq;
      _resultData.longOpenInterest = truncate(
        calc(_resultData.long_position_interest).div(
          calc(10).pow(usdAmountDecimal),
        ),
      );
      _resultData.shortOpenInterest = truncate(
        calc(_resultData.short_position_interest).div(
          calc(10).pow(usdAmountDecimal),
        ),
      );
    }

    return _resultData;
  }, [
    baseCoinPrice,
    coins,
    inst,
    instId,
    result.data,
    usdAmountDecimal,
    usdcCoin,
    usdcPrice,
  ]);

  return { ...result, data: resultData };
};

// funding rate
export const useBorrowFee = ({
  collateralCoinType,
  size,
  entryFundingRate,
}: {
  collateralCoinType?: string;
  isLong: boolean;
  size: string;
  entryFundingRate: string;
}) => {
  const hzSdk = useHzSdk();
  const data = useRealtimeConfig({ coinType: collateralCoinType });
  const borrowFee = useMemo(() => {
    return data && size
      ? hzSdk.QueryModule.calculatePositionFundingFee({
          realtimeConfig: data,
          positionSize: size,
          entryFundingFeeRate: entryFundingRate,
        }).positionFundingFeeFormatted
      : '';
  }, [hzSdk, data, size, entryFundingRate]);

  return {
    data: borrowFee,
  };
};

// liq px
export const useLiqPx = (
  {
    collateralCoinType,
    entryPrice,
    collateral,
    size,
    isLong,
    entryFundingRate,
    hasPosition,
  }: {
    collateralCoinType?: string;
    entryPrice: string;
    collateral: string;
    size: string;
    isLong: boolean;
    entryFundingRate?: string;
    hasPosition?: boolean;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refetchInterval?: number,
) => {
  const hzSdk = useHzSdk();
  const data = useRealtimeConfig({ coinType: collateralCoinType });

  const liqPx = useMemo(() => {
    if (data && size && entryPrice) {
      return hzSdk.QueryModule.calculateLiquidationPrice({
        realtimeConfig: data,
        entryPrice: entryPrice,
        collateral: collateral,
        size: size,
        isLong,
        entryFundingRate,
        hasPosition,
      }).liquidationPriceFormatted;
    }

    return '';
  }, [
    data,
    entryPrice,
    collateral,
    size,
    isLong,
    entryFundingRate,
    hasPosition,
    hzSdk,
  ]);

  return {
    data: liqPx,
  };
};

// borrow fee rate
export const useRealtimeConfig = ({ coinType }: { coinType?: string }) => {
  const hzSdk = useHzSdk();
  const { data: protocolStoreData } = useProtocolStoreData();
  const { data: vaultData } = useVaultData();
  return useMemo(() => {
    return coinType && protocolStoreData && vaultData
      ? hzSdk.QueryModule.getRealtimeConfig({
          collateralToken: coinType,
          protocolStore: protocolStoreData,
          vaultObject: vaultData,
        })
      : undefined;
  }, [coinType, protocolStoreData, hzSdk, vaultData]);
};

// query protocolStore
export const useVaultData = (refetchInterval?: number) => {
  const hzSdk = useHzSdk();
  return useQuery({
    queryKey: ['rest', 'vaultData', hzSdk.fullClient.network],
    queryFn: async () => {
      try {
        const data = await hzSdk.QueryModule.parseVaultObject();

        return data;
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-vaultData' });
        throw error;
      }
    },
    refetchInterval,
  });
};

export const getVaultDataFromCache = (network: string) => {
  return queryClient.getQueryData<VaultObjectInfo>([
    'rest',
    'vaultData',
    network,
  ]);
};

// query protocolStore
export const useProtocolStoreData = (refetchInterval?: number) => {
  const hzSdk = useHzSdk();
  return useQuery({
    queryKey: ['rest', 'protocolStoreData', hzSdk.fullClient.network],
    queryFn: async () => {
      try {
        const data = await hzSdk.QueryModule.parseProtocolStoreObject();

        return data;
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-protocolStoreData' });
        throw error;
      }
    },
    refetchInterval,
  });
};

export const getProtocolStoreDataFromCache = (network: string) => {
  return queryClient.getQueryData<ProtocolStoreObjectInfo>([
    'rest',
    'protocolStoreData',
    network,
  ]);
};

export type CustodyItemType = {
  cumulative_funding_rate: string;
  fee_amount: string;
  global_short_average_price: string;
  global_short_size: string;
  guaranteed_usd: string;
  is_shortable: boolean;
  is_stable: boolean;
  last_funding_time: string;
  max_global_long_size: string;
  max_global_short_size: string;
  max_usd_amount: string;
  metadata: {
    fields: {
      name: string;
    };
  };
  pool_amount: string;
  protocol_fee: string;
  reserved_amount: string;
  weight: string;
  // extend pool_amount - reserved_amount
  available_amount: string;
};

// get pool detail from sdk
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useVaultObject = (enabled = true) => {
  const { data: vaultData, refetch } = useVaultData();
  const data = useMemo(() => {
    if (vaultData) {
      const custodyMap: Record<string, CustodyItemType> = {};
      const custodyList =
        vaultData.content.fields.custodies.fields.custodies.fields.contents.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (v: any) => {
            const itemData = { ...v.fields.value.fields };
            const coinType = normalizeStructTag(itemData.metadata.fields.name);
            itemData.available_amount = calc(itemData.pool_amount)
              .minus(itemData.reserved_amount)
              .toFixed();
            custodyMap[coinType] = itemData;
            return itemData as CustodyItemType;
          },
        );
      return {
        hzlpSupply: vaultData.content.fields.hzlp.fields.treasury.fields
          .total_supply.fields.value as string,
        aumUsd: vaultData.content.fields.aum_usd as string,
        custodyList: custodyList,
        custodyMap: custodyMap,
      };
    }
    return undefined;
  }, [vaultData]);
  return {
    data: data,
    refetch,
  };
};

// get pool
export const usePoolDetail = () => {
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const { data, ...res } = useQuery({
    queryKey: ['rest', 'poolDetail', hzSdk.fullClient.network],
    queryFn: async () => {
      return await hzSdk.ApiModule.fetchPoolDetail();
    },
    refetchInterval: 60000,
  });
  const { data: prices } = usePriceTickerStream(
    data?.coin_details?.map((v) => `${v.coin_name}${HERTZFLOW_SUFFIX.USD}`) ||
      [],
    { throttleWait: 5000 },
  );
  if (!data) return { data: undefined, ...res };

  const realTimeTvl =
    data?.coin_details?.reduce((total, coin, i) => {
      const coinObjFromInstStore = coins[addHexPrefix(coin.coin_type)];
      const coinPrice = prices[i]?.[0]?.p;
      const coinAmount = fromDecimalsAmount(
        coin.coin_amount.toString(10),
        coinObjFromInstStore?.decimal ?? 8,
      );
      const coinValue = calc(coinAmount).times(coinPrice || 0);
      return total.plus(coinValue);
    }, calc(0)) || calc(0);

  const adjustedData: PoolDetailResData = {
    ...data,
    coin_details: data?.coin_details?.map((v, i) => {
      const coinObjFromInstStore = coins[addHexPrefix(v.coin_type)];
      const price = prices[i]?.[0]?.p;

      const coinAmount = fromDecimalsAmount(
        v.coin_amount.toString(10),
        coinObjFromInstStore?.decimal ?? 8,
      );
      const coinValue = calc(coinAmount).times(price || 0);

      const current_weight = realTimeTvl.gt(0)
        ? coinValue.div(realTimeTvl).toNumber()
        : 0;
      return {
        ...v,
        current_weight,
        target_weight: v.target_weight / TOTAL_WEIGHT,
      };
    }),
  };
  return {
    data: adjustedData,
    ...res,
  };
};
