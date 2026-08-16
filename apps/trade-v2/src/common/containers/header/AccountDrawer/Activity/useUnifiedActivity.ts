'use client';

import { useCallback, useMemo } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { useLingui } from '@lingui/react/macro';
import {
  useConnectionStatus,
  useCurrentAccountAddress,
  useHzSdk,
  useMarketsConfigs,
  usePrivy,
} from '@/common';
import { USDT_USD_PRICE_SYMBOL } from '@/common/constants';
import { useTradeEventType } from '@/common/hooks/useTradeEventType';
import {
  useActivities,
  type ActivityItem,
} from '@/common/services/rest/activity';
import { usePrices } from '@/common/services/rest/price';
import { usePriceTickerStream } from '@/common/services/ws/tickers';
import { usePriceStore } from '@/common/stores';
import { useGlobalStore } from '@/common/stores/globalStore';
import { useInstStore } from '@/common/stores/instStore';
import { mapActivityItems, type ActivityTextLabels } from './mapActivityItem';

interface UnifiedActivityTimelineOptions {
  vaultAddresses?: readonly string[];
  isPredeposit?: boolean;
}

export function useUnifiedActivityTimeline({
  vaultAddresses,
  isPredeposit = false,
}: UnifiedActivityTimelineOptions = {}) {
  const { t } = useLingui();
  const { getLabel: getTradeEventLabel, getTone: getTradeEventTone } =
    useTradeEventType();
  const { ready } = usePrivy();
  const connectionStatus = useConnectionStatus();
  const hzSdk = useHzSdk();
  const address = useCurrentAccountAddress();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const { data: marketsConfigs } = useMarketsConfigs({
    markets: Object.values(insts),
    refreshPriority: 'background',
  });
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);

  usePrices();
  const usdtPrice = usePriceTickerStream(USDT_USD_PRICE_SYMBOL, {
    throttleWait: 60000,
  }).data[0]?.p;

  const explorerHost = useMemo(() => {
    if (!hzSdk?.config.chainId) return '';
    return getViemChain(hzSdk.config.chainId).blockExplorers?.default.url || '';
  }, [hzSdk?.config.chainId]);
  const enabled = ready && !!address;
  const textLabels = useMemo<ActivityTextLabels>(
    () => ({
      claim: t`Claim`,
      creditClaim: t`Credit Claim`,
      hzflClaim: t`Token Claim`,
      long: t`Long`,
      short: t`Short`,
      size: t`Size`,
      collateral: t`Collateral`,
      price: t`Price`,
      value: t`Value`,
      shares: t`Shares`,
      feeRebate: t`Fee Rebate`,
      referralRebate: t`Referral Rebate`,
      type: t`Type`,
      usedHzCredit: t`Used HzCredit`,
      vault: t`Vault`,
      pool_deposit: t`Pool Deposit`,
      pool_withdraw: t`Pool Withdraw`,
      pool_cancelled_deposit: t`Cancelled Pool Deposit`,
      pool_cancelled_withdraw: t`Cancelled Pool Withdraw`,
      vault_deposit: t`Vault Deposit`,
      vault_withdraw: t`Vault Withdraw`,
      vault_cancelled_deposit: t`Cancelled Vault Deposit`,
      vault_cancelled_withdraw: t`Cancelled Vault Withdraw`,
    }),
    [t],
  );

  const {
    data: activities,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: fetchNextActivitiesPage,
    isFetching,
  } = useActivities({ isPredeposit });
  const vaultAddressSet = useMemo(
    () =>
      vaultAddresses
        ? new Set(vaultAddresses.map((address) => address.toLowerCase()))
        : undefined,
    [vaultAddresses],
  );

  const items = useMemo(() => {
    const rawItems =
      activities?.pages.reduce((acc, page) => {
        if (page.activities?.length) {
          const pageItems = vaultAddressSet
            ? page.activities.filter((item) => {
                const marketAddress = item.market_address?.toLowerCase();
                if (
                  item.action_type === 'vault' &&
                  marketAddress &&
                  vaultAddressSet.has(marketAddress)
                ) {
                  return true;
                }

                return (
                  item.action_type === 'claim' &&
                  item.claim_details?.some(
                    (detail) =>
                      !!detail.market &&
                      vaultAddressSet.has(detail.market.toLowerCase()),
                  )
                );
              })
            : page.activities;
          acc.push(...pageItems);
        }
        return acc;
      }, [] as ActivityItem[]) ?? [];

    return mapActivityItems(rawItems, {
      chainId: hzSdk?.chainId,
      insts,
      coins,
      pricesMap,
      marketsConfigs,
      usdtPrice,
      usdAmountDisplayDecimal,
      leverDecimal,
      explorerHost,
      labels: textLabels,
      getTradeEventLabel,
      getTradeEventTone,
    });
  }, [
    activities?.pages,
    hzSdk?.chainId,
    coins,
    explorerHost,
    getTradeEventLabel,
    getTradeEventTone,
    insts,
    leverDecimal,
    marketsConfigs,
    pricesMap,
    textLabels,
    usdAmountDisplayDecimal,
    usdtPrice,
    vaultAddressSet,
  ]);

  const fetchNextPage = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage) return;
    await fetchNextActivitiesPage();
  }, [fetchNextActivitiesPage, hasNextPage, isFetchingNextPage]);

  const isInitialLoading =
    (!ready && connectionStatus === 'unknown') ||
    (enabled &&
      !items.length &&
      isFetching &&
      !(activities?.pages?.length ?? 0));

  return {
    hasAddress: !!address,
    isWalletPending: !ready && connectionStatus === 'unknown',
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    items,
    fetchNextPage,
  };
}
