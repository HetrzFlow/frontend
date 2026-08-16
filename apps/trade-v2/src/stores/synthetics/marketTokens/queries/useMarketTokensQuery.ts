import { useEffect } from 'react';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import {
  MAX_PNL_FACTOR_FOR_DEPOSITS_KEY,
  MAX_PNL_FACTOR_FOR_WITHDRAWALS_KEY,
} from '@hertzflow/sdk-v2/configs/dataStore';
import { convertToContractTokenPrices } from '@hertzflow/sdk-v2/utils/tokens';
import { getAddress, type Address } from 'viem';
import { useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useHzSdk } from '@/common/chainClient/hooks';
import { buildPrioritizedMarketChunks } from '@/common/services/rest/market';
import { useInstStore } from '@/common/stores/instStore';
import { usePriceStore } from '@/common/stores/priceStore';
import {
  marketTokensKeys,
  MARKET_TOKENS_REFRESH_INTERVAL,
  MARKET_TOKENS_STALE_TIME,
  MARKET_TOKENS_GC_TIME,
} from '../constants';
import {
  getAddressValue,
  getRequestableMarketAddresses,
} from './marketTokenQueryUtils';
import type { MarketTokensData } from '../types';
import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';

const ACTIVE_MARKET_TOKEN_CHUNK_SIZE = 1;

interface MarketTokensQueryParams {
  marketAddresses: Address[];
  account?: Address;
  isDeposit: boolean;
  enabled?: boolean;
  refreshInterval?: number;
  priorityMarketAddress?: Address;
}

interface MarketTokensQueryResult {
  marketTokensData: MarketTokensData;
}

export function useMarketTokensQuery({
  marketAddresses,
  account,
  isDeposit,
  enabled = true,
  refreshInterval = MARKET_TOKENS_REFRESH_INTERVAL,
  priorityMarketAddress,
}: MarketTokensQueryParams) {
  const hzSdk = useHzSdk();
  const chainId = hzSdk?.chainId;
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const instsMap = useInstStore((state) => state.insts.map);
  const requestInsts = useInstStore((state) => state.getInsts);
  const coinsMap = useInstStore((state) => state.getCoins());
  const requestCoins = useInstStore((state) => state.getCoins);
  useEffect(() => {
    requestInsts();
  }, [requestInsts]);

  useEffect(() => {
    requestCoins();
  }, [requestCoins]);

  const requestableMarketAddresses = getRequestableMarketAddresses(
    marketAddresses,
    instsMap,
    pricesMap,
    coinsMap,
  );
  const hasMarkets = requestableMarketAddresses.length > 0;
  const hasChainId = !!chainId;
  const queryKey = marketTokensKeys.data(
    hzSdk?.chainId,
    account,
    requestableMarketAddresses,
    isDeposit,
  );
  const queryResult = useQuery<MarketTokensQueryResult | null>({
    queryKey,
    enabled: enabled && hasChainId && hasMarkets,
    retry: false,
    queryFn: async ({ signal, client }) => {
      if (!hasChainId || !hasMarkets) return null;
      const dataStoreAddress = getContract(chainId, 'DataStore');
      const syntheticsReaderAddress = getContract(chainId, 'SyntheticsReader');
      // Select PNL factor based on deposit/withdrawal
      // Decision: Use different PNL factors for accurate price calculation
      const pnlFactorType = isDeposit
        ? MAX_PNL_FACTOR_FOR_DEPOSITS_KEY
        : MAX_PNL_FACTOR_FOR_WITHDRAWALS_KEY;

      const chunks = buildPrioritizedMarketChunks(
        requestableMarketAddresses.map((addr) => ({
          marketTokenAddress: addr,
        })),
        ACTIVE_MARKET_TOKEN_CHUNK_SIZE,
        priorityMarketAddress,
      );

      const merged: MarketTokensData = {};
      let anyChunkSucceeded = false;

      for (let i = 0; i < chunks.length; i++) {
        if (signal?.aborted) break;

        const chunkAddresses = chunks[i]!.map(
          (item) => item.marketTokenAddress as Address,
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const multicallRequest: Record<string, any> = {};
        const chunkMarkets: Address[] = [];

        for (const rawMarketAddress of chunkAddresses) {
          const marketAddress = getAddress(rawMarketAddress) as Address;
          const inst = getAddressValue(
            instsMap,
            marketAddress,
            rawMarketAddress,
          );
          if (!inst) {
            continue;
          }

          multicallRequest[`${marketAddress}-tokenData`] = {
            contractAddress: marketAddress,
            abiId: 'Token',
            calls: {
              totalSupply: {
                methodName: 'totalSupply',
                params: [],
              },
              balance: account
                ? {
                    methodName: 'balanceOf',
                    params: [account],
                  }
                : undefined,
            },
          };

          const indexAddr = getAddress(inst.indexTokenAddress) as Address;
          const longAddr = getAddress(inst.longTokenAddress) as Address;
          const shortAddr = getAddress(inst.shortTokenAddress) as Address;

          const indexTokenPrices = getAddressValue(
            pricesMap,
            indexAddr,
            inst.indexTokenAddress,
          );
          const longTokenPrices = getAddressValue(
            pricesMap,
            longAddr,
            inst.longTokenAddress,
          );
          const shortTokenPrices = getAddressValue(
            pricesMap,
            shortAddr,
            inst.shortTokenAddress,
          );

          const indexCoin = getAddressValue(
            coinsMap,
            indexAddr,
            inst.indexTokenAddress,
          );
          const longCoin = getAddressValue(
            coinsMap,
            longAddr,
            inst.longTokenAddress,
          );
          const shortCoin = getAddressValue(
            coinsMap,
            shortAddr,
            inst.shortTokenAddress,
          );

          const indexDecimals = indexCoin?.decimals;
          const longDecimals = longCoin?.decimals;
          const shortDecimals = shortCoin?.decimals;
          if (
            typeof indexDecimals !== 'number' ||
            typeof longDecimals !== 'number' ||
            typeof shortDecimals !== 'number'
          ) {
            continue;
          }

          if (!indexTokenPrices || !longTokenPrices || !shortTokenPrices) {
            continue;
          }

          const indexTokenPrice = convertToContractTokenPrices(
            indexTokenPrices,
            indexDecimals,
          );
          const longTokenPrice = convertToContractTokenPrices(
            longTokenPrices,
            longDecimals,
          );
          const shortTokenPrice = convertToContractTokenPrices(
            shortTokenPrices,
            shortDecimals,
          );

          const marketProps = {
            marketToken: marketAddress,
            indexToken: indexAddr,
            longToken: longAddr,
            shortToken: shortAddr,
          };

          multicallRequest[`${marketAddress}-prices`] = {
            contractAddress: syntheticsReaderAddress,
            abiId: 'SyntheticsReader',
            calls: {
              minPrice: {
                methodName: 'getMarketTokenPrice',
                params: [
                  dataStoreAddress,
                  marketProps,
                  indexTokenPrice,
                  longTokenPrice,
                  shortTokenPrice,
                  pnlFactorType,
                  false,
                ],
              },
              maxPrice: {
                methodName: 'getMarketTokenPrice',
                params: [
                  dataStoreAddress,
                  marketProps,
                  indexTokenPrice,
                  longTokenPrice,
                  shortTokenPrice,
                  pnlFactorType,
                  true,
                ],
              },
            },
          };

          chunkMarkets.push(marketAddress);
        }

        if (chunkMarkets.length === 0) {
          continue;
        }

        try {
          const result = await hzSdk.executeMulticall(multicallRequest);

          for (const marketAddress of chunkMarkets) {
            const inst =
              instsMap[marketAddress] ?? instsMap[marketAddress.toLowerCase()];
            if (!inst) continue;

            const tokenDataErrors =
              result.errors?.[`${marketAddress}-tokenData`];
            const tokenData = result.data[`${marketAddress}-tokenData`];
            if (tokenDataErrors || !tokenData) {
              continue;
            }

            const pricesErrors = result.errors?.[`${marketAddress}-prices`];
            const pricesData = result.data[`${marketAddress}-prices`];
            const minPriceRaw = pricesErrors
              ? undefined
              : (pricesData?.minPrice?.returnValues?.[0] as bigint | undefined);
            const maxPriceRaw = pricesErrors
              ? undefined
              : (pricesData?.maxPrice?.returnValues?.[0] as bigint | undefined);
            const totalSupplyRaw = tokenData.totalSupply?.returnValues?.[0] as
              | bigint
              | undefined;
            const balanceRaw = tokenData.balance?.returnValues?.[0] as
              | bigint
              | undefined;

            if (totalSupplyRaw === undefined) {
              continue;
            }

            if (
              minPriceRaw === undefined ||
              minPriceRaw <= 0n ||
              maxPriceRaw === undefined ||
              maxPriceRaw <= 0n
            ) {
              continue;
            }

            const prices: TokenPrices = {
              minPrice: minPriceRaw,
              maxPrice: maxPriceRaw,
            };

            merged[marketAddress] = {
              // Token base info
              name: 'HertzFlow Market Tokens',
              symbol: 'HzLP',
              decimals: 18,
              imageUrl: '/coins/hzlp.png',
              isPlatformToken: true,
              address: marketAddress,

              // Dynamic data from chain
              prices,
              totalSupply: totalSupplyRaw,
              walletBalance: balanceRaw,

              // Static config from inst
              id: inst.id || inst.symbol || marketAddress,
              category: inst.category || 'crypto',
              icon: inst.icon,
              longTokenAddress: inst.longTokenAddress as Address,
              shortTokenAddress: inst.shortTokenAddress as Address,
              indexTokenAddress: inst.indexTokenAddress as Address,
              isSameCollaterals: inst.isSameCollaterals ?? true,
              pxDispDecimal: inst.pxDispDecimal ?? 2,
            };
          }

          anyChunkSucceeded = true;

          // write partial result to cache immediately
          client.setQueryData(
            queryKey,
            (prev: MarketTokensQueryResult | null | undefined) => ({
              marketTokensData: {
                ...(prev?.marketTokensData ?? {}),
                ...merged,
              },
            }),
          );
        } catch (err) {
          console.error('[useMarketTokensQuery] batch failed', {
            error: err,
            message: err instanceof Error ? err.message : String(err),
            chainId: hzSdk.chainId,
            chunkIndex: i,
            chunkSize: chunkMarkets.length,
          });
          toast.error((err as Error)?.message ?? 'marketTokens batch failed', {
            id: 'rest-marketTokens',
          });
        }
      }

      if (!anyChunkSucceeded) {
        const cached = client.getQueryData<MarketTokensQueryResult | null>(
          queryKey,
        );
        if (cached?.marketTokensData) {
          return cached;
        }
        return null;
      }

      return { marketTokensData: merged };
    },
    staleTime: MARKET_TOKENS_STALE_TIME,
    gcTime: MARKET_TOKENS_GC_TIME,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
  });
  return queryResult;
}
