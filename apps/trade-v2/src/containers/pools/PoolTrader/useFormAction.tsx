'use client';

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { abis } from '@hertzflow/sdk-v2/abis/index';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useQueryClient } from '@tanstack/react-query';
import {
  parseUnits,
  formatUnits,
  Address,
  getAddress,
  decodeEventLog,
  zeroAddress,
} from 'viem';
import { CoinIcon } from '@repo/common/components';
import { useMutation } from '@repo/lib/queryClient';
import {
  ArrowDownIcon,
  ArrowRightShortIcon,
  cn,
  getMediaSize,
  LinkIcon,
  MEDIA_SIZES,
  tradeToast,
} from '@repo/ui';
import {
  IMAGES_MAP,
  HZLP_TOKEN_DECIMALS,
  useInstStore,
  useHzSdk,
} from '@/common';

import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import { LIQUIDITY_HISTORY_REFRESH_EVENT } from '@/common/constants/events';
import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { usePriceStore } from '@/common/stores/priceStore';
import { useHzlpDepositTransaction } from '@/domain/synthetics/liquidity/hzlp/useHzlpDepositTransaction';
import { useHzlpWithdrawTransaction } from '@/domain/synthetics/liquidity/hzlp/useHzlpWithdrawTransaction';
import { useHzvDepositTransaction } from '@/domain/synthetics/liquidity/hzv/useHzvDepositTransaction';
import { useHzvWithdrawTransaction } from '@/domain/synthetics/liquidity/hzv/useHzvWithdrawTransaction';
import {
  useDepositCancelledEvent,
  useDepositCreatedEvent,
  useDepositExecutedEvent,
  useHlvDepositCancelledEvent,
  useHlvDepositCreatedEvent,
  useHlvDepositExecutedEvent,
  useHlvWithdrawalCancelledEvent,
  useHlvWithdrawalCreatedEvent,
  useHlvWithdrawalExecutedEvent,
  useWithdrawalCancelledEvent,
  useWithdrawalCreatedEvent,
  useWithdrawalExecutedEvent,
} from '@/hooks/useContractEvents';
import { debounce } from '@/lib/runtime/timing';
import { useMarketInfoByAddress } from '@/queries/bsc/pools';
import { useHzvValueByVault, useVaultDetail } from '@/queries/bsc/vaults';
import {
  fetchPoolHistoryData,
  getHistoryNextPageParam,
  HistoryStatus,
  type HistoryItem,
} from '@/services/rest/pools';
import {
  fetchVaultHistoryData,
  type MarketExposureItem,
} from '@/services/rest/vaults';
import type { FormDataType } from '@/stores/pools/trade';
import {
  getTradeKey,
  HZLP_NAME,
  HZV_NAME,
  LiqTradeType,
  usePoolsTradeStore,
} from '@/stores/pools/trade';
import {
  hlvTokensKeys,
  marketTokensKeys,
} from '@/stores/synthetics/marketTokens/constants';
import { useMarketTokenByAddress } from '@/stores/synthetics/marketTokens/hooks';
import {
  usePoolUserPerformance,
  useVaultUserPerformance,
} from '@/stores/synthetics/userPerformance/selectors';
import { POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS } from './constants';
import type { MarketInfo, MarketValues } from '@hertzflow/sdk-v2/types/markets';
import type { InternalUsdParams } from '@hertzflow/sdk-v2/utils/internalUsd';
import type { UseFormReturn } from 'react-hook-form';

const DISPLAY_DECIMALS = 6;
const FEE_FACTOR_PRECISION = 10n ** 30n;

function getQuoteFeeFactor(
  feeUsd: bigint | undefined,
  inputUsd: bigint | undefined,
) {
  if (feeUsd === undefined || inputUsd === undefined || inputUsd <= 0n) {
    return undefined;
  }
  return (feeUsd * FEE_FACTOR_PRECISION) / inputUsd;
}

function formatDisplayAmount(
  value?: string | number,
  maximumFractionDigits: number = 2,
) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '--';

  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}
const TIMEOUT_MS = 30_000;
const PROGRESS_STEP_DELAY_MS = 600;
const POST_TRADE_PERFORMANCE_REFRESH_INTERVAL_MS = 3_000;
const POST_TRADE_PERFORMANCE_REFRESH_REPEAT_COUNT = 10;
const POST_TRADE_HISTORY_STATUS_REFRESH_INTERVAL_MS = 3_000;
const POST_TRADE_HISTORY_STATUS_REFRESH_REPEAT_COUNT = 10;
const POST_TRADE_HISTORY_STATUS_PAGE_SIZE = 8;

type LiquidityTradeKind = 'deposit' | 'withdraw';
type LiquidityTradeVenue = 'pool' | 'vault';

type LiquidityEventLog = {
  transactionHash?: string | null;
  parsedData: {
    args: {
      eventData: {
        addressItems: {
          items: Array<{ key: string; value?: string }>;
        };
        bytes32Items: {
          items: Array<{ key: string; value?: string }>;
        };
      };
    };
  };
};

type LiquidityTrackedKeyResult = {
  status: 'executed' | 'cancelled';
  txHash?: string | null;
};

function normalizeLower(v: string | undefined | null) {
  return v ? v.toLowerCase() : '';
}

function isHistorySuccess(status: string | undefined | null) {
  return normalizeLower(status) === HistoryStatus.Success;
}

function isHistoryCancelled(status: string | undefined | null) {
  return normalizeLower(status) === HistoryStatus.Cancelled;
}

function historyActionMatches(
  action: HistoryItem['action'],
  kind: LiquidityTradeKind,
) {
  return normalizeLower(action) === kind;
}

function findLiquidityHistoryItem({
  items,
  tracking,
  accountAddress,
}: {
  items: HistoryItem[];
  tracking: {
    kind: LiquidityTradeKind;
    createdTxHash: string;
  };
  accountAddress?: string;
}) {
  const expectedTxHash = normalizeLower(tracking.createdTxHash);
  const expectedAccount = normalizeLower(accountAddress);

  return items.find((item) => {
    if (normalizeLower(item.tx_hash) !== expectedTxHash) return false;
    if (!historyActionMatches(item.action, tracking.kind)) return false;
    if (
      expectedAccount &&
      normalizeLower(item.wallet_address) !== expectedAccount
    ) {
      return false;
    }
    return true;
  });
}

export const useFormAction = (
  form: UseFormReturn<FormDataType>,
  opts: {
    direction: LiqTradeType;
    type: 'pool' | 'vault';
    vaultMarketExposure?: MarketExposureItem[];
    vaultMarketsInfoData?: Record<Address, MarketInfo>;
    marketAddress?: string;
    fallbackDirectRate?: number | null;
    fallbackReverseRate?: number | null;
    underlyingTokenAddress?: string;
    underlyingTokenDecimals?: number;
    underlyingTokenSymbol?: string;
    internalUsd?: InternalUsdParams;
    internalUsdResolutionReady?: boolean;
    onExecutionResolved?: () => void;
  },
) => {
  const hzSdk = useHzSdk();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const coins = useInstStore((state) => state.getCoins());
  const instsArr = useInstStore((state) => state.getInstsArr());
  const instsMap = useInstStore((state) => state.getInsts());
  const params = useParams();
  const routeMarketAddress = params?.market_address as string | undefined;
  const marketAddress = opts.marketAddress ?? routeMarketAddress ?? '';
  const normalizedMarketAddress = useMemo(() => {
    if (!marketAddress) return undefined;
    try {
      return getAddress(marketAddress);
    } catch {
      return marketAddress;
    }
  }, [marketAddress]);
  const isVault = opts.type === 'vault';
  const vaultAddress = isVault ? marketAddress : zeroAddress;
  const accountAddress = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const setIsTransacting = usePoolsTradeStore((s) => s.setIsTransacting);
  const tradeKey = getTradeKey(marketAddress ?? zeroAddress, opts.type);
  const submitPending = usePoolsTradeStore(
    (s) => s.submitPendingByKey[tradeKey] ?? false,
  );
  const setSubmitPending = usePoolsTradeStore((s) => s.setSubmitPending);
  const vaultPerformance = useVaultUserPerformance(
    isVault ? vaultAddress : undefined,
  );
  const poolPerformance = usePoolUserPerformance(
    isVault ? undefined : normalizedMarketAddress,
  );
  const performance = isVault ? vaultPerformance : poolPerformance;
  const performanceReady =
    !!performance &&
    !performance.isLoading &&
    (opts.direction === LiqTradeType.Withdraw || performance.hasDeposit);

  const liquidityTrackingRef = useRef<{
    venue: LiquidityTradeVenue;
    kind: LiquidityTradeKind;
    marketAddress?: string;
    vaultAddress?: string;
    createdTxHash: string;
    contractKeys: string[];
    keyResults: Record<string, LiquidityTrackedKeyResult>;
    hasResolvedCreatedLogs: boolean;
    expectedTotalCount: number;
    timeoutId: ReturnType<typeof setTimeout> | null;
    onProgress: (
      executedCount: number,
      cancelledCount: number,
      totalCount: number,
    ) => void;
    onFilled: (executedTxHashes: string[]) => void;
    onPartiallyFilled: (
      executedTxHashes: string[],
      cancelledTxHashes: string[],
      executedCount: number,
    ) => void;
    onFailed: (cancelledTxHashes: string[]) => void;
    onTimeout: () => void;
  } | null>(null);
  const isMobile = getMediaSize() === MEDIA_SIZES.SM;
  const manualUnsubsRef = useRef<{
    created?: () => void;
    executed?: () => void;
    cancelled?: () => void;
  } | null>(null);
  const displayedProgressRef = useRef(0);
  const progressAnimationTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const performanceRefreshTimerRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);
  const historyStatusRefreshTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const performanceRefreshCountRef = useRef(0);
  const performanceReadyRef = useRef(false);

  const clearManualUnsubs = useCallback(() => {
    const current = manualUnsubsRef.current;
    if (!current) return;
    current.created?.();
    current.executed?.();
    current.cancelled?.();
    manualUnsubsRef.current = null;
  }, []);

  const clearProgressAnimation = useCallback(() => {
    if (progressAnimationTimerRef.current) {
      clearTimeout(progressAnimationTimerRef.current);
      progressAnimationTimerRef.current = null;
    }
  }, []);

  const clearPerformanceRefresh = useCallback(() => {
    if (performanceRefreshTimerRef.current) {
      clearInterval(performanceRefreshTimerRef.current);
      performanceRefreshTimerRef.current = null;
    }
    performanceRefreshCountRef.current = 0;
  }, []);

  const clearHistoryStatusRefresh = useCallback(() => {
    if (historyStatusRefreshTimerRef.current) {
      clearTimeout(historyStatusRefreshTimerRef.current);
      historyStatusRefreshTimerRef.current = null;
    }
  }, []);

  const clearLiquidityTracking = useCallback(() => {
    const current = liquidityTrackingRef.current;
    if (current?.timeoutId) {
      clearTimeout(current.timeoutId);
    }
    clearProgressAnimation();
    clearHistoryStatusRefresh();
    liquidityTrackingRef.current = null;
    clearManualUnsubs();
  }, [clearHistoryStatusRefresh, clearManualUnsubs, clearProgressAnimation]);

  const normalize = useCallback((v: string | undefined | null) => {
    return v ? v.toLowerCase() : '';
  }, []);

  const mergeTrackingKeys = useCallback((keys: Array<string | undefined>) => {
    const current = liquidityTrackingRef.current;
    if (!current) return;
    const nextKeys = keys.filter((key): key is string => !!key);
    if (!nextKeys.length) return;
    current.contractKeys = Array.from(
      new Set([...current.contractKeys, ...nextKeys]),
    );
  }, []);

  const getLiquidityTrackingProgress = useCallback(() => {
    const current = liquidityTrackingRef.current;
    if (!current) return null;

    const totalCount = Math.max(
      current.contractKeys.length,
      current.expectedTotalCount,
    );
    if (!totalCount) return null;

    const resolvedEntries: LiquidityTrackedKeyResult[] = [];
    let executedCount = 0;
    let cancelledCount = 0;

    for (const key of current.contractKeys) {
      const entry = current.keyResults[key];
      if (!entry) continue;

      resolvedEntries.push(entry);
      if (entry.status === 'executed') {
        executedCount += 1;
      } else if (entry.status === 'cancelled') {
        cancelledCount += 1;
      }
    }

    return {
      totalCount,
      resolvedEntries,
      executedCount,
      cancelledCount,
    };
  }, []);

  const finalizeLiquidityTrackingIfReady = useCallback(() => {
    const current = liquidityTrackingRef.current;
    if (!current) return false;
    if (!current.hasResolvedCreatedLogs) return false;
    const progress = getLiquidityTrackingProgress();
    if (!progress) return false;
    const { resolvedEntries, executedCount, cancelledCount, totalCount } =
      progress;

    if (resolvedEntries.length !== totalCount) return false;

    const executedTxHashSet = new Set<string>();
    const cancelledTxHashSet = new Set<string>();
    for (const entry of resolvedEntries) {
      if (!entry.txHash) continue;

      if (entry.status === 'executed') {
        executedTxHashSet.add(entry.txHash);
      } else if (entry.status === 'cancelled') {
        cancelledTxHashSet.add(entry.txHash);
      }
    }
    const executedTxHashes = Array.from(executedTxHashSet);
    const cancelledTxHashes = Array.from(cancelledTxHashSet);

    const { onFilled, onPartiallyFilled, onFailed } = current;
    clearLiquidityTracking();

    if (executedCount === totalCount) {
      onFilled(executedTxHashes);
      return true;
    }

    if (cancelledCount === totalCount) {
      onFailed(cancelledTxHashes);
      return true;
    }

    onPartiallyFilled(executedTxHashes, cancelledTxHashes, executedCount);
    return true;
  }, [clearLiquidityTracking, getLiquidityTrackingProgress]);

  const handleLiquidityCreated = useCallback(
    (
      venue: LiquidityTradeVenue,
      kind: LiquidityTradeKind,
      logs: LiquidityEventLog[],
    ) => {
      const tracking = liquidityTrackingRef.current;
      if (!tracking) return;
      if (tracking.venue !== venue) return;
      if (tracking.kind !== kind) return;

      const expectedTx = normalize(tracking.createdTxHash);
      const expectedMarket = normalize(tracking.marketAddress);
      const expectedVault = normalize(tracking.vaultAddress);
      const createdKeys: string[] = [];

      for (const log of logs) {
        if (
          expectedTx &&
          normalize(log.transactionHash ?? undefined) !== expectedTx
        ) {
          continue;
        }

        const eventData = log.parsedData.args.eventData;
        const addressItems = Object.fromEntries(
          eventData.addressItems.items.map((v) => [v.key, v.value]),
        ) as Record<string, string | undefined>;
        const bytes32Items = Object.fromEntries(
          eventData.bytes32Items.items.map((v) => [v.key, v.value]),
        ) as Record<string, string | undefined>;

        if (expectedMarket) {
          const maybeMarket = normalize(addressItems.market);
          if (maybeMarket && maybeMarket !== expectedMarket) continue;
        }

        if (expectedVault) {
          const maybeHlv = normalize(addressItems.hlv);
          if (maybeHlv && maybeHlv !== expectedVault) continue;
        }

        const key = bytes32Items.key;
        if (!key) continue;
        createdKeys.push(key);
      }

      if (createdKeys.length) {
        mergeTrackingKeys(createdKeys);
        tracking.hasResolvedCreatedLogs = true;
        finalizeLiquidityTrackingIfReady();
      }
    },
    [finalizeLiquidityTrackingIfReady, mergeTrackingKeys, normalize],
  );

  const handleLiquidityExecuted = useCallback(
    (
      venue: LiquidityTradeVenue,
      kind: LiquidityTradeKind,
      logs: LiquidityEventLog[],
    ) => {
      const tracking = liquidityTrackingRef.current;
      if (!tracking) return;
      if (tracking.venue !== venue) return;
      if (tracking.kind !== kind) return;
      let didUpdate = false;
      const contractKeySet = new Set(tracking.contractKeys);

      for (const log of logs) {
        const eventData = log.parsedData.args.eventData;
        const bytes32Items = Object.fromEntries(
          eventData.bytes32Items.items.map((v) => [v.key, v.value]),
        ) as Record<string, string | undefined>;

        if (
          bytes32Items.key &&
          (!contractKeySet.size || contractKeySet.has(bytes32Items.key)) &&
          !tracking.keyResults[bytes32Items.key]
        ) {
          tracking.keyResults[bytes32Items.key] = {
            status: 'executed',
            txHash: log.transactionHash,
          };
          didUpdate = true;
        }
      }

      if (didUpdate) {
        const progress = getLiquidityTrackingProgress();
        if (progress) {
          tracking.onProgress(
            progress.executedCount,
            progress.cancelledCount,
            progress.totalCount,
          );
        }
        finalizeLiquidityTrackingIfReady();
      }
    },
    [finalizeLiquidityTrackingIfReady, getLiquidityTrackingProgress],
  );

  const handleLiquidityCancelled = useCallback(
    (
      venue: LiquidityTradeVenue,
      kind: LiquidityTradeKind,
      logs: LiquidityEventLog[],
    ) => {
      const tracking = liquidityTrackingRef.current;
      if (!tracking) return;
      if (tracking.venue !== venue) return;
      if (tracking.kind !== kind) return;
      let didUpdate = false;
      const contractKeySet = new Set(tracking.contractKeys);

      for (const log of logs) {
        const eventData = log.parsedData.args.eventData;
        const bytes32Items = Object.fromEntries(
          eventData.bytes32Items.items.map((v) => [v.key, v.value]),
        ) as Record<string, string | undefined>;

        if (
          bytes32Items.key &&
          (!contractKeySet.size || contractKeySet.has(bytes32Items.key)) &&
          !tracking.keyResults[bytes32Items.key]
        ) {
          tracking.keyResults[bytes32Items.key] = {
            status: 'cancelled',
            txHash: log.transactionHash,
          };
          didUpdate = true;
        }
      }

      if (didUpdate) {
        finalizeLiquidityTrackingIfReady();
      }
    },
    [finalizeLiquidityTrackingIfReady],
  );

  const applyLiquidityHistoryStatus = useCallback(
    (item: HistoryItem) => {
      const tracking = liquidityTrackingRef.current;
      if (!tracking) return false;
      if (
        normalizeLower(item.tx_hash) !== normalizeLower(tracking.createdTxHash)
      ) {
        return false;
      }

      const detailItems = item.details?.filter((detail) => detail.key) ?? [];
      if (detailItems.length) {
        const detailKeys = detailItems.map((detail) => detail.key);
        mergeTrackingKeys(detailKeys);
        tracking.hasResolvedCreatedLogs = true;

        let didUpdate = false;
        for (const detail of detailItems) {
          const status = detail.status;
          if (!isHistorySuccess(status) && !isHistoryCancelled(status)) {
            continue;
          }

          const nextStatus = isHistorySuccess(status)
            ? 'executed'
            : 'cancelled';
          if (tracking.keyResults[detail.key]?.status === nextStatus) {
            continue;
          }

          tracking.keyResults[detail.key] = {
            status: nextStatus,
            txHash:
              detail.executed_tx_hash || item.executed_tx_hash || item.tx_hash,
          };
          didUpdate = true;
        }

        if (didUpdate) {
          const progress = getLiquidityTrackingProgress();
          if (progress) {
            tracking.onProgress(
              progress.executedCount,
              progress.cancelledCount,
              progress.totalCount,
            );
          }
        }

        return finalizeLiquidityTrackingIfReady();
      }

      const status = item.status;
      const txHash = item.executed_tx_hash || item.tx_hash;
      if (isHistorySuccess(status)) {
        const onFilled = tracking.onFilled;
        clearLiquidityTracking();
        onFilled(txHash ? [txHash] : []);
        return true;
      }
      if (isHistoryCancelled(status)) {
        const onFailed = tracking.onFailed;
        clearLiquidityTracking();
        onFailed(txHash ? [txHash] : []);
        return true;
      }

      return false;
    },
    [
      clearLiquidityTracking,
      finalizeLiquidityTrackingIfReady,
      getLiquidityTrackingProgress,
      mergeTrackingKeys,
    ],
  );

  const refreshLiquidityHistoryStatus = useCallback(async () => {
    const tracking = liquidityTrackingRef.current;
    if (!tracking || !marketAddress) return false;
    const trackingTxHash = tracking.createdTxHash;
    const historyVenue = tracking.venue;
    const historyType =
      historyVenue === 'vault' ? 'vault-history' : 'pool-history';

    const walletAddress = accountAddress ?? hzSdk?.account;
    const historyData = await queryClient.fetchInfiniteQuery({
      queryKey: [
        'bsc-data-query',
        historyType,
        marketAddress,
        POST_TRADE_HISTORY_STATUS_PAGE_SIZE,
        walletAddress,
      ],
      queryFn: async ({ pageParam }) => {
        const req = {
          market_address: marketAddress,
          cursor: pageParam,
          limit: POST_TRADE_HISTORY_STATUS_PAGE_SIZE,
          wallet_address: walletAddress,
        };
        return historyVenue === 'vault'
          ? fetchVaultHistoryData(req)
          : fetchPoolHistoryData(req);
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: getHistoryNextPageParam,
      staleTime: 0,
    });
    const latest = liquidityTrackingRef.current;
    if (!latest || latest.createdTxHash !== trackingTxHash) return false;
    const item = findLiquidityHistoryItem({
      items: historyData.pages.flatMap((page) => page.actions ?? []),
      tracking,
      accountAddress: walletAddress,
    });
    if (!item) return false;

    return applyLiquidityHistoryStatus(item);
  }, [
    accountAddress,
    applyLiquidityHistoryStatus,
    hzSdk?.account,
    marketAddress,
    queryClient,
  ]);

  const triggerLiquidityHistoryStatusRefresh = useCallback(() => {
    clearHistoryStatusRefresh();

    const refresh = async (count: number) => {
      const resolved = await refreshLiquidityHistoryStatus().catch(() => false);
      if (resolved || count >= POST_TRADE_HISTORY_STATUS_REFRESH_REPEAT_COUNT) {
        clearHistoryStatusRefresh();
        return;
      }

      historyStatusRefreshTimerRef.current = setTimeout(() => {
        void refresh(count + 1);
      }, POST_TRADE_HISTORY_STATUS_REFRESH_INTERVAL_MS);
    };

    void refresh(0);
  }, [clearHistoryStatusRefresh, refreshLiquidityHistoryStatus]);

  const subscribeLiquidityEvents = useCallback(
    (venue: LiquidityTradeVenue, kind: LiquidityTradeKind) => {
      clearManualUnsubs();
      const options = {
        usePolling: true,
        accountAddress: accountAddress ?? hzSdk?.account,
      };
      if (venue === 'vault') {
        if (kind === 'deposit') {
          const created = hzSdk?.events.subscribeHlvDepositCreated(
            (logs) =>
              handleLiquidityCreated(
                'vault',
                'deposit',
                logs as unknown as LiquidityEventLog[],
              ),
            options,
          );
          const executed = hzSdk?.events.subscribeHlvDepositExecuted(
            (logs) =>
              handleLiquidityExecuted(
                'vault',
                'deposit',
                logs as unknown as LiquidityEventLog[],
              ),
            options,
          );
          const cancelled = hzSdk?.events.subscribeHlvDepositCancelled(
            (logs) =>
              handleLiquidityCancelled(
                'vault',
                'deposit',
                logs as unknown as LiquidityEventLog[],
              ),
            options,
          );
          manualUnsubsRef.current = { created, executed, cancelled };
          return;
        }
        const created = hzSdk?.events.subscribeHlvWithdrawalCreated(
          (logs) =>
            handleLiquidityCreated(
              'vault',
              'withdraw',
              logs as unknown as LiquidityEventLog[],
            ),
          options,
        );
        const executed = hzSdk?.events.subscribeHlvWithdrawalExecuted(
          (logs) =>
            handleLiquidityExecuted(
              'vault',
              'withdraw',
              logs as unknown as LiquidityEventLog[],
            ),
          options,
        );
        const cancelled = hzSdk?.events.subscribeHlvWithdrawalCancelled(
          (logs) =>
            handleLiquidityCancelled(
              'vault',
              'withdraw',
              logs as unknown as LiquidityEventLog[],
            ),
          options,
        );
        manualUnsubsRef.current = { created, executed, cancelled };
        return;
      }
      if (kind === 'deposit') {
        const created = hzSdk?.events.subscribeDepositCreated(
          (logs) =>
            handleLiquidityCreated(
              'pool',
              'deposit',
              logs as unknown as LiquidityEventLog[],
            ),
          options,
        );
        const executed = hzSdk?.events.subscribeDepositExecuted(
          (logs) =>
            handleLiquidityExecuted(
              'pool',
              'deposit',
              logs as unknown as LiquidityEventLog[],
            ),
          options,
        );
        const cancelled = hzSdk?.events.subscribeDepositCancelled(
          (logs) =>
            handleLiquidityCancelled(
              'pool',
              'deposit',
              logs as unknown as LiquidityEventLog[],
            ),
          options,
        );
        manualUnsubsRef.current = { created, executed, cancelled };
        return;
      }
      const created = hzSdk?.events.subscribeWithdrawalCreated(
        (logs) =>
          handleLiquidityCreated(
            'pool',
            'withdraw',
            logs as unknown as LiquidityEventLog[],
          ),
        options,
      );
      const executed = hzSdk?.events.subscribeWithdrawalExecuted(
        (logs) =>
          handleLiquidityExecuted(
            'pool',
            'withdraw',
            logs as unknown as LiquidityEventLog[],
          ),
        options,
      );
      const cancelled = hzSdk?.events.subscribeWithdrawalCancelled(
        (logs) =>
          handleLiquidityCancelled(
            'pool',
            'withdraw',
            logs as unknown as LiquidityEventLog[],
          ),
        options,
      );
      manualUnsubsRef.current = { created, executed, cancelled };
    },
    [
      clearManualUnsubs,
      handleLiquidityCancelled,
      handleLiquidityCreated,
      handleLiquidityExecuted,
      accountAddress,
      hzSdk?.account,
      hzSdk?.events,
    ],
  );

  const eventOptions = useMemo(() => ({ enabled: !isMobile }), [isMobile]);

  useHlvDepositCreatedEvent((logs) => {
    handleLiquidityCreated(
      'vault',
      'deposit',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useDepositCreatedEvent((logs) => {
    handleLiquidityCreated(
      'pool',
      'deposit',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useHlvWithdrawalCreatedEvent((logs) => {
    handleLiquidityCreated(
      'vault',
      'withdraw',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useWithdrawalCreatedEvent((logs) => {
    handleLiquidityCreated(
      'pool',
      'withdraw',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);

  useHlvDepositExecutedEvent((logs) => {
    handleLiquidityExecuted(
      'vault',
      'deposit',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useDepositExecutedEvent((logs) => {
    handleLiquidityExecuted(
      'pool',
      'deposit',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useHlvWithdrawalExecutedEvent((logs) => {
    handleLiquidityExecuted(
      'vault',
      'withdraw',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useWithdrawalExecutedEvent((logs) => {
    handleLiquidityExecuted(
      'pool',
      'withdraw',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);

  useHlvDepositCancelledEvent((logs) => {
    handleLiquidityCancelled(
      'vault',
      'deposit',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useDepositCancelledEvent((logs) => {
    handleLiquidityCancelled(
      'pool',
      'deposit',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useHlvWithdrawalCancelledEvent((logs) => {
    handleLiquidityCancelled(
      'vault',
      'withdraw',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);
  useWithdrawalCancelledEvent((logs) => {
    handleLiquidityCancelled(
      'pool',
      'withdraw',
      logs as unknown as LiquidityEventLog[],
    );
  }, eventOptions);

  const [depositShortTokenAmount, setDepositShortTokenAmount] = useState(0n);

  const [withdrawMarketTokenAmount, setWithdrawMarketTokenAmount] =
    useState(0n);

  const [withdrawHlvTokenAmount, setWithdrawHlvTokenAmount] = useState(0n);

  const { data: marketInfo } = useMarketInfoByAddress(marketAddress ?? '', {
    enabled: !isVault && !!marketAddress,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });

  const shortTokenDecimals = isVault
    ? (opts.underlyingTokenDecimals ?? HZLP_TOKEN_DECIMALS)
    : (coins?.[marketInfo?.shortTokenAddress ?? zeroAddress]?.decimals ??
      HZLP_TOKEN_DECIMALS);

  const { marketTokenData } = useMarketTokenByAddress({
    marketAddress: isVault ? undefined : (marketAddress as Address | undefined),
    isDeposit: opts.direction === LiqTradeType.Deposit,
    refreshInterval: POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS,
  });

  // Get market token decimals for receiveSz formatting
  const marketTokenDecimals = marketTokenData?.decimals ?? HZLP_TOKEN_DECIMALS;

  // TODO: now longToken is equal to shortToken, so we don't need to swap,maybe will change on next version
  const poolDepositLongTokenSwapPath = useMemo<Address[]>(() => [], []);
  const poolDepositShortTokenSwapPath = useMemo<Address[]>(() => [], []);
  const vaultDepositLongTokenSwapPath = useMemo<Address[]>(() => [], []);
  const vaultDepositShortTokenSwapPath = useMemo<Address[]>(() => [], []);

  const hzlpDepositTx = useHzlpDepositTransaction({
    marketAddress: (marketAddress as Address) ?? ('0x0' as Address),
    enabled: !isVault && opts.direction === LiqTradeType.Deposit,
    shortTokenAmount: depositShortTokenAmount,
    longTokenSwapPath: poolDepositLongTokenSwapPath,
    shortTokenSwapPath: poolDepositShortTokenSwapPath,
  });

  const hzlpWithdrawTx = useHzlpWithdrawTransaction({
    marketAddress: (marketAddress as Address) ?? ('0x0' as Address),
    enabled: !isVault && opts.direction === LiqTradeType.Withdraw,
    marketTokenAmount: withdrawMarketTokenAmount,
  });

  const { data: vaultDetailRes } = useVaultDetail(isVault ? vaultAddress : '', {
    staleTime: STATIC_CONFIG_CACHE_TIME,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
  });
  const vaultDetail = useMemo(() => {
    const detail = vaultDetailRes?.data ?? null;
    if (
      !detail ||
      (detail.market_exposure?.length ?? 0) > 0 ||
      !opts.vaultMarketExposure?.length
    ) {
      return detail;
    }

    return {
      ...detail,
      market_exposure: opts.vaultMarketExposure,
    };
  }, [opts.vaultMarketExposure, vaultDetailRes?.data]);

  const { data: hzvValues } = useHzvValueByVault(
    isVault ? (vaultDetail?.vault_address ?? marketAddress) : undefined,
    { refetchInterval: POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS },
  );
  const hzvDepositTx = useHzvDepositTransaction({
    vaultDetail:
      isVault && opts.direction === LiqTradeType.Deposit ? vaultDetail : null,
    marketsInfoData: opts.vaultMarketsInfoData,
    inputTokenDecimals: shortTokenDecimals,
    inputTokenAddress: opts.underlyingTokenAddress as Address | undefined,
    internalUsd: opts.internalUsd,
    internalUsdResolutionReady: opts.internalUsdResolutionReady,
    shortTokenAmount: depositShortTokenAmount,
    longTokenSwapPath: vaultDepositLongTokenSwapPath,
    shortTokenSwapPath: vaultDepositShortTokenSwapPath,
  });

  const hzvWithdrawTx = useHzvWithdrawTransaction({
    vaultDetail:
      isVault && opts.direction === LiqTradeType.Withdraw ? vaultDetail : null,
    marketsInfoData: opts.vaultMarketsInfoData,
    hlvTokenAmount: withdrawHlvTokenAmount,
    receiveTokenAddress:
      opts.direction === LiqTradeType.Withdraw
        ? (vaultDetail?.short_token_address as Address | undefined)
        : undefined,
  });

  const quoteFeeFactor = useMemo(() => {
    if (isVault) {
      return opts.direction === LiqTradeType.Deposit
        ? getQuoteFeeFactor(
            hzvDepositTx.quoteFeeUsd,
            hzvDepositTx.quoteInputUsd,
          )
        : getQuoteFeeFactor(
            hzvWithdrawTx.quoteFeeUsd,
            hzvWithdrawTx.quoteInputUsd,
          );
    }

    if (opts.direction === LiqTradeType.Deposit) {
      const amounts = hzlpDepositTx.depositAmounts;
      return getQuoteFeeFactor(
        amounts?.swapFeeUsd,
        amounts ? amounts.longTokenUsd + amounts.shortTokenUsd : undefined,
      );
    }

    const amounts = hzlpWithdrawTx.withdrawalAmounts;
    return getQuoteFeeFactor(amounts?.swapFeeUsd, amounts?.marketTokenUsd);
  }, [
    hzlpDepositTx.depositAmounts,
    hzlpWithdrawTx.withdrawalAmounts,
    hzvDepositTx.quoteFeeUsd,
    hzvDepositTx.quoteInputUsd,
    hzvWithdrawTx.quoteFeeUsd,
    hzvWithdrawTx.quoteInputUsd,
    isVault,
    opts.direction,
  ]);

  const marketsValuesQueryKey = useMemo(() => {
    const marketAddressesKey = instsArr
      .map((v) => v.marketTokenAddress)
      .sort()
      .join(',');
    return ['rest', 'marketsValues', hzSdk?.chainId, marketAddressesKey];
  }, [hzSdk?.chainId, instsArr]);

  const refreshTradeMarketsValues = useCallback(async () => {
    if (!hzSdk) return;
    if (!instsArr.length) return;
    if (!Object.keys(pricesMap).length) return;
    if (!Object.keys(coins).length) return;
    const targetAddresses = isVault
      ? (vaultDetail?.market_exposure ?? []).map((item) => item.market_address)
      : marketAddress
        ? [marketAddress]
        : [];
    if (!targetAddresses.length) return;
    const targetSet = new Set(
      targetAddresses.map((addr) => addr.toLowerCase()),
    );
    const markets = instsArr.filter((inst) =>
      targetSet.has(inst.marketTokenAddress.toLowerCase()),
    );
    if (!markets.length) return;
    try {
      const res = await hzSdk?.markets.getMarketsValues({
        markets,
        prices: pricesMap,
        tokensData: coins,
      });
      queryClient.setQueryData(
        marketsValuesQueryKey,
        (prev: Record<string, MarketValues> | undefined) => ({
          ...(prev ?? {}),
          ...res,
        }),
      );
    } catch {
      return;
    }
  }, [
    coins,
    hzSdk,
    instsArr,
    isVault,
    marketAddress,
    marketsValuesQueryKey,
    pricesMap,
    queryClient,
    vaultDetail?.market_exposure,
  ]);

  const refreshPerformanceDependencies = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [
        'bsc-data-query',
        isVault ? 'vault-history' : 'pool-history',
        marketAddress,
      ],
    });

    if (isVault && vaultAddress) {
      const checksumVault = getAddress(vaultAddress);
      queryClient.invalidateQueries({
        queryKey: ['bsc-data-query', 'vaults'],
      });
      queryClient.invalidateQueries({
        queryKey: ['bsc-data-query', 'vault-detail', checksumVault],
      });
      queryClient.invalidateQueries({
        queryKey: ['hz-sdk', 'hzv-value', hzSdk?.chainId, checksumVault],
      });
      queryClient.invalidateQueries({
        queryKey: ['hz-sdk', 'hzv-values', hzSdk?.chainId],
      });
      queryClient.invalidateQueries({
        queryKey: ['hz-sdk', 'hlv-token-balance', hzSdk?.chainId],
      });
      queryClient.invalidateQueries({
        queryKey: ['bsc-data-query', 'vault-tvl-chart', checksumVault],
      });
      queryClient.invalidateQueries({
        queryKey: ['bsc-data-query', 'vault-net-apr-chart', checksumVault],
      });
      queryClient.invalidateQueries({
        queryKey: ['bsc-data-query', 'vault-exposure-chart', checksumVault],
      });
      queryClient.invalidateQueries({
        queryKey: marketTokensKeys.chain(hzSdk?.chainId),
      });
    } else if (marketAddress) {
      const poolAddressesToInvalidate = Array.from(
        new Set([marketAddress, normalizedMarketAddress].filter(Boolean)),
      );
      poolAddressesToInvalidate.forEach((address) => {
        queryClient.invalidateQueries({
          queryKey: ['usePoolDetail', address],
        });
        queryClient.invalidateQueries({
          queryKey: ['bsc-data-query', 'pool-chart', address],
        });
        queryClient.invalidateQueries({
          queryKey: ['bsc-data-query', 'pool-apy', address],
        });
      });
    }

    if (hzSdk?.chainId) {
      queryClient.invalidateQueries({
        queryKey: ['usePoolsList'],
      });
      if (accountAddress) {
        queryClient.invalidateQueries({
          queryKey: ['rest', 'activities', accountAddress],
        });
        queryClient.invalidateQueries({
          queryKey: ['balances', hzSdk?.chainId, accountAddress],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['tokenBalance', hzSdk?.chainId],
      });
      queryClient.invalidateQueries({
        queryKey: marketsValuesQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: marketTokensKeys.chain(hzSdk?.chainId),
      });
      queryClient.invalidateQueries({
        queryKey: hlvTokensKeys.chain(hzSdk?.chainId),
      });
    }
  }, [
    accountAddress,
    hzSdk?.chainId,
    isVault,
    marketAddress,
    normalizedMarketAddress,
    marketsValuesQueryKey,
    queryClient,
    vaultAddress,
  ]);

  const triggerPerformanceBurstRefresh = useCallback(() => {
    refreshPerformanceDependencies();
    clearPerformanceRefresh();

    performanceRefreshTimerRef.current = setInterval(() => {
      if (
        performanceRefreshCountRef.current > 0 &&
        performanceReadyRef.current
      ) {
        clearPerformanceRefresh();
        return;
      }

      performanceRefreshCountRef.current += 1;
      refreshPerformanceDependencies();
      if (
        performanceRefreshCountRef.current >=
        POST_TRADE_PERFORMANCE_REFRESH_REPEAT_COUNT
      ) {
        clearPerformanceRefresh();
      }
    }, POST_TRADE_PERFORMANCE_REFRESH_INTERVAL_MS);
  }, [clearPerformanceRefresh, refreshPerformanceDependencies]);

  useEffect(() => {
    performanceReadyRef.current = performanceReady;
    if (
      performanceReady &&
      performanceRefreshTimerRef.current &&
      performanceRefreshCountRef.current > 0
    ) {
      clearPerformanceRefresh();
    }
  }, [clearPerformanceRefresh, performanceReady]);

  useEffect(() => {
    return () => {
      clearPerformanceRefresh();
    };
  }, [clearPerformanceRefresh]);

  const triggerHistoryBurstRefresh = useCallback(() => {
    if (!marketAddress) return;
    window.dispatchEvent(
      new CustomEvent(LIQUIDITY_HISTORY_REFRESH_EVENT, {
        detail: {
          activityType: isVault ? 'vault' : 'pool',
          marketAddress,
        },
      }),
    );
  }, [isVault, marketAddress]);

  // Token price for display purposes
  // - Deposit: use maxPrice for receive token (HzLP/HZV) display
  // - Withdraw: use minPrice for pay token (HzLP/HZV) display
  const tokenPriceUsdForDeposit = useMemo(() => {
    if (isVault) {
      const price = hzvValues?.hlvTokenPriceMax ?? hzvValues?.hlvTokenPrice;
      if (!price) {
        return null;
      }
      return price;
    } else {
      if (!marketTokenData?.prices?.maxPrice) {
        return null;
      }
      return marketTokenData.prices.maxPrice;
    }
  }, [
    isVault,
    hzvValues?.hlvTokenPrice,
    hzvValues?.hlvTokenPriceMax,
    marketTokenData?.prices?.maxPrice,
  ]);

  const tokenPriceUsdForWithdraw = useMemo(() => {
    if (isVault) {
      const price = hzvValues?.hlvTokenPriceMin ?? hzvValues?.hlvTokenPrice;
      if (!price) {
        return null;
      }
      return price;
    } else {
      if (!marketTokenData?.prices?.minPrice) {
        return null;
      }
      return marketTokenData.prices.minPrice;
    }
  }, [
    isVault,
    hzvValues?.hlvTokenPrice,
    hzvValues?.hlvTokenPriceMin,
    marketTokenData?.prices?.minPrice,
  ]);

  const shortTokenAddress = useMemo(() => {
    if (isVault) {
      return opts.underlyingTokenAddress ?? null;
    }
    return marketInfo?.shortTokenAddress ?? null;
  }, [isVault, marketInfo?.shortTokenAddress, opts.underlyingTokenAddress]);

  const shortTokenPrices = shortTokenAddress
    ? (pricesMap[shortTokenAddress] ?? null)
    : null;
  const shortTokenPriceUsdForDeposit =
    shortTokenPrices?.maxPrice ?? shortTokenPrices?.minPrice ?? null;
  const shortTokenPriceUsdForWithdraw =
    shortTokenPrices?.maxPrice ?? shortTokenPrices?.minPrice ?? null;

  const shortTokenSymbol =
    opts.underlyingTokenSymbol ??
    coins?.[shortTokenAddress ?? zeroAddress]?.symbol;

  // directRate: used for Deposit (underlying token -> HzLP/HZV)
  // Uses maxPrice for HzLP/HZV to show fair value to user
  const directRate = useMemo(() => {
    if (!tokenPriceUsdForDeposit || !shortTokenPriceUsdForDeposit) {
      return null;
    }

    const rateNum = Number(
      formatUnits(shortTokenPriceUsdForDeposit, USD_DECIMALS),
    );
    const tokenPriceNum = Number(
      formatUnits(tokenPriceUsdForDeposit, USD_DECIMALS),
    );
    if (tokenPriceNum <= 0) return null;
    return rateNum / tokenPriceNum;
  }, [tokenPriceUsdForDeposit, shortTokenPriceUsdForDeposit]);

  // reverseRate: used for Withdraw (HzLP/HZV -> underlying token)
  // Uses minPrice for HzLP/HZV to show conservative value to user
  const reverseRate = useMemo(() => {
    if (!tokenPriceUsdForWithdraw || !shortTokenPriceUsdForWithdraw) {
      return null;
    }
    const rateNum = Number(formatUnits(tokenPriceUsdForWithdraw, USD_DECIMALS));
    const shortPriceNum = Number(
      formatUnits(shortTokenPriceUsdForWithdraw, USD_DECIMALS),
    );
    if (shortPriceNum <= 0) return null;
    return rateNum / shortPriceNum;
  }, [tokenPriceUsdForWithdraw, shortTokenPriceUsdForWithdraw]);

  const poolSymbol = useMemo(() => {
    if (!marketAddress) return '';
    const direct =
      instsMap[marketAddress] ?? instsMap[marketAddress.toLowerCase()];
    if (direct?.symbol) return direct.symbol;
    try {
      const checksum = getAddress(marketAddress);
      return (
        instsMap[checksum]?.symbol ??
        instsMap[checksum.toLowerCase()]?.symbol ??
        ''
      );
    } catch {
      return '';
    }
  }, [instsMap, marketAddress]);

  const liquidityMutation = useMutation({
    mutationKey: [
      'liquidity-trade',
      isVault ? 'vault' : 'pool',
      opts.direction,
      marketAddress,
    ],
    onMutate: () => {
      setSubmitPending(tradeKey, true);
      subscribeLiquidityEvents(
        isVault ? 'vault' : 'pool',
        opts.direction === LiqTradeType.Deposit ? 'deposit' : 'withdraw',
      );
    },
    onError: () => {
      setSubmitPending(tradeKey, false);
      clearLiquidityTracking();
    },
    mutationFn: async (data: FormDataType) => {
      const { paySz, receiveSz } = data;
      const payIconSrc =
        IMAGES_MAP.coinIcons[paySz.coin as keyof typeof IMAGES_MAP.coinIcons];
      const receiveIconSrc =
        IMAGES_MAP.coinIcons[
          receiveSz.coin as keyof typeof IMAGES_MAP.coinIcons
        ];
      const isDeposit = opts.direction === LiqTradeType.Deposit;
      const toastId = `toast-${isVault ? 'vault' : 'pool'}-${isDeposit ? 'deposit' : 'withdraw'}`;
      const toastTitleText = i18n._(isDeposit ? msg`Deposit` : msg`Withdraw`);
      const toastIcon = isDeposit ? (
        <ArrowDownIcon size={24} />
      ) : (
        <ArrowDownIcon size={24} className="rotate-180" />
      );
      const totalAllocations = isVault
        ? isDeposit
          ? hzvDepositTx.allocationCount
          : hzvWithdrawTx.allocationCount
        : 1;
      const isMultiMarketVaultTrade = isVault && totalAllocations > 1;
      const splitHintText = i18n._(
        msg`To optimize capital efficiency, large deposits may be routed via several underlying pools with no extra fees incurred.`,
      );
      const poolLabel = poolSymbol || marketAddress || '';
      const vaultLabel = vaultDetail?.vault_name || marketAddress || '';
      const contextLabel = isVault
        ? `${HZV_NAME}: ${vaultLabel}`
        : `${HZLP_NAME}: ${poolLabel}`;

      const renderToastContent = (params?: {
        linkHref?: string;
        showHint?: boolean;
        hintText?: string;
        hintClassName?: string;
      }) => {
        const {
          linkHref,
          showHint = false,
          hintText,
          hintClassName,
        } = params ?? {};
        return (
          <div>
            <div className="bg-t-1100/10 my-2 h-px" />
            <div className="space-y-2">
              <div className="text-t-270 text-[13px]">{contextLabel}</div>
              <div className="flex items-center gap-2">
                <div className="text-t-1100 flex flex-1 items-center justify-between gap-2 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    {payIconSrc && (
                      <CoinIcon size={20} src={payIconSrc} alt={paySz.coin} />
                    )}
                    <div>
                      <span className="font-plex">
                        {formatDisplayAmount(paySz.value)}
                      </span>{' '}
                      {paySz.coin}
                    </div>
                  </div>
                  <ArrowRightShortIcon size={10} className="" />
                  <div className="flex items-center gap-2">
                    {receiveIconSrc && (
                      <CoinIcon
                        size={20}
                        src={receiveIconSrc}
                        alt={receiveSz.coin}
                      />
                    )}
                    <div>
                      <span className="font-plex">
                        {formatDisplayAmount(receiveSz.value)}
                      </span>{' '}
                      {receiveSz.coin}
                    </div>
                  </div>
                </div>
                {linkHref ? (
                  <a
                    href={linkHref}
                    target="_blank"
                    className="text-accent cursor-pointer"
                    rel="noreferrer noopener"
                  >
                    <LinkIcon size={16} />
                  </a>
                ) : !showHint ? (
                  <span className="invisible" aria-hidden="true">
                    <LinkIcon size={16} />
                  </span>
                ) : null}
              </div>
              {showHint ? (
                <div
                  className={cn(
                    'text-t-270 bg-warning/12 w-full min-w-0 rounded-lg px-3 py-2 text-xs break-words',
                    hintClassName,
                  )}
                >
                  {hintText || splitHintText}
                </div>
              ) : null}
            </div>
          </div>
        );
      };

      const onTxSent = () => {
        const nextValues = form.getValues();
        form.setValue('paySz', { ...nextValues.paySz, value: '' });
        form.setValue('receiveSz', { ...nextValues.receiveSz, value: '' });
      };
      const failedDescription = i18n._(
        isDeposit ? msg`Deposit Failed` : msg`Withdraw Failed`,
      );

      return executeTransaction({
        toast: {
          title: i18n._(isDeposit ? msg`Deposit` : msg`Withdraw`),
          description: i18n._(msg`Submitting`),
          icon: toastIcon,
          loadingContent: renderToastContent({
            showHint: isMultiMarketVaultTrade,
          }),
          errorDescription: failedDescription,
          showDefaultSuccess: false,
          showClose: true,
          id: toastId,
        },
        refetchBalancesAfterSuccess: false,
        executeTransaction: async () => {
          const txHash = isVault
            ? isDeposit
              ? await hzvDepositTx.onDeposit()
              : await hzvWithdrawTx.onWithdraw()
            : isDeposit
              ? await hzlpDepositTx.onDeposit()
              : await hzlpWithdrawTx.onWithdraw();
          if (!txHash) {
            throw new Error(
              i18n._(msg`Transaction failed. Please try again later.`),
            );
          }
          return txHash;
        },
        onError: () => {
          setIsTransacting(tradeKey, false);
          setSubmitPending(tradeKey, false);
        },
        onSuccess: (txHash) => {
          displayedProgressRef.current = 0;
          clearProgressAnimation();
          if (hzSdk?.chainId && accountAddress) {
            queryClient.invalidateQueries({
              queryKey: ['liquidity-orders', hzSdk.chainId, accountAddress],
            });
          }
          const explorerHost = hzSdk
            ? getViemChain(hzSdk?.config.chainId).blockExplorers?.default.url
            : '';
          const createHref =
            explorerHost && txHash ? `${explorerHost}/tx/${txHash}` : undefined;

          const venue: LiquidityTradeVenue = isVault ? 'vault' : 'pool';
          const kind: LiquidityTradeKind = isDeposit ? 'deposit' : 'withdraw';
          const filledLabel = i18n._(msg`Filled`);
          const partiallyFilledLabel = i18n._(msg`Partially Filled`);
          const failedLabel = i18n._(msg`Failed`);
          const renderProgressDescription = (
            executedCount: number,
            totalCount: number,
          ) => `${filledLabel} ${executedCount}/${totalCount}`;
          const animateProgressTo = (
            target: number,
            total: number,
            onDone?: () => void,
          ) => {
            clearProgressAnimation();
            const step = () => {
              if (displayedProgressRef.current >= target) {
                onDone?.();
                return;
              }
              displayedProgressRef.current += 1;
              tradeToast(
                {
                  type: 'loading',
                  title: toastTitleText,
                  description: renderProgressDescription(
                    displayedProgressRef.current,
                    total,
                  ),
                  icon: toastIcon,
                  content: renderToastContent({ showHint: true }),
                  showClose: true,
                },
                { id: toastId, duration: Infinity },
              );
              if (displayedProgressRef.current < target) {
                progressAnimationTimerRef.current = setTimeout(
                  step,
                  PROGRESS_STEP_DELAY_MS,
                );
              } else {
                progressAnimationTimerRef.current = null;
                onDone?.();
              }
            };
            if (displayedProgressRef.current < target) {
              progressAnimationTimerRef.current = setTimeout(
                step,
                PROGRESS_STEP_DELAY_MS,
              );
            } else {
              onDone?.();
            }
          };
          const showFilledToasts = (executedTxHashes: string[]) => {
            executedTxHashes.forEach((executedTxHash, index) => {
              const filledHref =
                explorerHost && executedTxHash
                  ? `${explorerHost}/tx/${executedTxHash}`
                  : createHref;
              tradeToast(
                {
                  type: 'success',
                  title: toastTitleText,
                  description: filledLabel,
                  icon: toastIcon,
                  content: renderToastContent({ linkHref: filledHref }),
                  showClose: true,
                },
                {
                  id:
                    index === 0
                      ? toastId
                      : `${toastId}-filled-${executedTxHash}`,
                },
              );
            });
          };
          const showFailedToasts = (
            cancelledTxHashes: string[],
            idPrefix: string,
          ) => {
            cancelledTxHashes.forEach((cancelledTxHash, index) => {
              const failedHref =
                explorerHost && cancelledTxHash
                  ? `${explorerHost}/tx/${cancelledTxHash}`
                  : createHref;
              tradeToast(
                {
                  type: 'error',
                  title: toastTitleText,
                  description: failedDescription,
                  icon: toastIcon,
                  content: renderToastContent({ linkHref: failedHref }),
                  showClose: true,
                },
                {
                  id:
                    index === 0 && idPrefix === toastId
                      ? toastId
                      : `${idPrefix}-${cancelledTxHash}`,
                },
              );
            });
          };

          tradeToast(
            {
              type: 'loading',
              title: toastTitleText,
              description: i18n._(msg`Submitted`),
              icon: toastIcon,
              content: renderToastContent({
                linkHref: createHref,
                showHint: isMultiMarketVaultTrade,
              }),
              showClose: true,
            },
            { id: toastId, duration: Infinity },
          );

          const timeoutId = setTimeout(() => {
            const current = liquidityTrackingRef.current;
            if (!current) return;
            if (current.createdTxHash !== txHash) return;
            void refreshLiquidityHistoryStatus()
              .then((resolved) => {
                if (resolved) return;
                const latest = liquidityTrackingRef.current;
                if (!latest) return;
                if (latest.createdTxHash !== txHash) return;
                const onTimeout = latest.onTimeout;
                clearLiquidityTracking();
                onTimeout();
              })
              .catch(() => {
                const latest = liquidityTrackingRef.current;
                if (!latest) return;
                if (latest.createdTxHash !== txHash) return;
                const onTimeout = latest.onTimeout;
                clearLiquidityTracking();
                onTimeout();
              });
          }, TIMEOUT_MS);

          liquidityTrackingRef.current = {
            venue,
            kind,
            marketAddress: isVault ? undefined : marketAddress,
            vaultAddress: isVault ? vaultDetail?.vault_address : undefined,
            createdTxHash: txHash,
            contractKeys: [],
            keyResults: {},
            hasResolvedCreatedLogs: false,
            expectedTotalCount: totalAllocations,
            timeoutId,
            onProgress: (executedCount, _cancelledCount, totalCount) => {
              if (!isMultiMarketVaultTrade) return;
              animateProgressTo(executedCount, totalCount);
            },
            onFilled: (executedTxHashes) => {
              refreshTradeMarketsValues();
              triggerPerformanceBurstRefresh();
              triggerHistoryBurstRefresh();
              opts.onExecutionResolved?.();
              onTxSent();
              setIsTransacting(tradeKey, false);
              setSubmitPending(tradeKey, false);
              if (isMultiMarketVaultTrade) {
                animateProgressTo(totalAllocations, totalAllocations, () => {
                  tradeToast(
                    {
                      type: 'success',
                      title: toastTitleText,
                      description: filledLabel,
                      icon: toastIcon,
                      content: renderToastContent({ showHint: true }),
                      showClose: true,
                    },
                    { id: toastId },
                  );
                });
                return;
              }
              showFilledToasts(executedTxHashes);
            },
            onPartiallyFilled: (
              executedTxHashes,
              cancelledTxHashes,
              executedCount,
            ) => {
              refreshTradeMarketsValues();
              triggerPerformanceBurstRefresh();
              triggerHistoryBurstRefresh();
              opts.onExecutionResolved?.();
              onTxSent();
              setIsTransacting(tradeKey, false);
              setSubmitPending(tradeKey, false);
              if (isMultiMarketVaultTrade) {
                animateProgressTo(executedCount, totalAllocations, () => {
                  tradeToast(
                    {
                      type: 'warning',
                      title: toastTitleText,
                      description: partiallyFilledLabel,
                      icon: toastIcon,
                      content: renderToastContent({ showHint: true }),
                      showClose: true,
                    },
                    { id: toastId },
                  );
                });
                return;
              }
              showFilledToasts(executedTxHashes);
              showFailedToasts(cancelledTxHashes, `${toastId}-cancelled`);
            },
            onFailed: (cancelledTxHashes) => {
              setIsTransacting(tradeKey, false);
              setSubmitPending(tradeKey, false);
              if (hzSdk?.chainId) {
                queryClient.invalidateQueries({
                  queryKey: ['tokenBalance', hzSdk.chainId],
                });
              }
              if (isMultiMarketVaultTrade) {
                clearProgressAnimation();
                tradeToast(
                  {
                    type: 'error',
                    title: toastTitleText,
                    description: failedLabel,
                    icon: toastIcon,
                    content: renderToastContent({ showHint: true }),
                    showClose: true,
                  },
                  { id: toastId },
                );
                return;
              }
              showFailedToasts(cancelledTxHashes, toastId);
            },
            onTimeout: () => {
              setIsTransacting(tradeKey, false);
              setSubmitPending(tradeKey, false);
              if (hzSdk?.chainId) {
                queryClient.invalidateQueries({
                  queryKey: ['tokenBalance', hzSdk.chainId],
                });
              }
              clearProgressAnimation();
              tradeToast(
                {
                  type: 'error',
                  title: toastTitleText,
                  description: i18n._(msg`Pending`),
                  icon: toastIcon,
                  content: renderToastContent({
                    showHint: true,
                    hintText: i18n._(
                      msg`Transaction pending. Please refresh the page to check the latest status in history.`,
                    ),
                    hintClassName: 'p-0 bg-transparent',
                  }),
                  showClose: true,
                },
                { id: toastId },
              );
            },
          };

          if (isMultiMarketVaultTrade) {
            tradeToast(
              {
                type: 'loading',
                title: toastTitleText,
                description: renderProgressDescription(0, totalAllocations),
                icon: toastIcon,
                content: renderToastContent({ showHint: true }),
                showClose: true,
              },
              { id: toastId, duration: Infinity },
            );
          }

          queryClient.invalidateQueries({
            queryKey: [
              'bsc-data-query',
              isVault ? 'vault-history' : 'pool-history',
              marketAddress,
            ],
          });
          triggerLiquidityHistoryStatusRefresh();
          triggerPerformanceBurstRefresh();

          if (txHash && hzSdk?.publicClient) {
            const expectedEventName =
              venue === 'vault'
                ? kind === 'deposit'
                  ? 'HlvDepositCreated'
                  : 'HlvWithdrawalCreated'
                : kind === 'deposit'
                  ? 'DepositCreated'
                  : 'WithdrawalCreated';
            const eventEmitterAddress = getContract(
              hzSdk?.chainId,
              'EventEmitter',
            );
            hzSdk?.publicClient
              .getTransactionReceipt({ hash: txHash as `0x${string}` })
              .then((receipt) => {
                const foundKeys: string[] = [];
                for (const log of receipt.logs) {
                  if (
                    log.address?.toLowerCase() !==
                    eventEmitterAddress.toLowerCase()
                  ) {
                    continue;
                  }

                  try {
                    const decoded = decodeEventLog({
                      abi: abis.EventEmitter,
                      eventName: 'EventLog2',
                      data: log.data,
                      topics: log.topics,
                    });
                    if (decoded.args?.eventName === expectedEventName) {
                      let key: string | undefined;
                      for (const item of decoded.args.eventData.bytes32Items
                        .items) {
                        if (item.key === 'key') {
                          key = item.value;
                          break;
                        }
                      }
                      if (key) {
                        foundKeys.push(key);
                      }
                    }
                  } catch {
                    // Ignore non-EventLog2 logs from the same transaction.
                  }
                }

                const current = liquidityTrackingRef.current;
                if (!current) return;
                if (current.createdTxHash !== txHash) return;
                mergeTrackingKeys(foundKeys);
                current.hasResolvedCreatedLogs = true;
                finalizeLiquidityTrackingIfReady();
              })
              .catch(() => {});
          }
        },
      });
    },
  });

  const onSubmit = useCallback(
    async (data: FormDataType) => {
      await liquidityMutation.mutateAsync(data);
    },
    [liquidityMutation],
  );
  const calculateExpectedOutput = useCallback(
    (inputAmount: number, isDeposit: boolean): string | null => {
      if (isVault) {
        if (isDeposit) {
          if (
            hzvDepositTx.depositAmounts?.hlvTokenAmount !== undefined &&
            hzvDepositTx.depositAmounts.hlvTokenAmount > 0n
          ) {
            return formatUnits(
              hzvDepositTx.depositAmounts.hlvTokenAmount,
              HZLP_TOKEN_DECIMALS,
            );
          }
          const rate = directRate ?? opts.fallbackDirectRate;
          return rate == null ? null : String(inputAmount * rate);
        } else {
          if (
            hzvWithdrawTx.withdrawalAmounts?.shortTokenAmount !== undefined &&
            hzvWithdrawTx.withdrawalAmounts.shortTokenAmount > 0n
          ) {
            return formatUnits(
              hzvWithdrawTx.withdrawalAmounts.shortTokenAmount,
              shortTokenDecimals,
            );
          }
          const rate = reverseRate ?? opts.fallbackReverseRate;
          return rate == null ? null : String(inputAmount * rate);
        }
      }

      if (!marketInfo) return null;

      if (isDeposit) {
        if (hzlpDepositTx.depositAmounts?.marketTokenAmount !== undefined) {
          return formatUnits(
            hzlpDepositTx.depositAmounts.marketTokenAmount,
            HZLP_TOKEN_DECIMALS,
          );
        }
        return null;
      } else {
        if (hzlpWithdrawTx.withdrawalAmounts?.shortTokenAmount !== undefined) {
          if (hzlpWithdrawTx.withdrawalAmounts.shortTokenAmount <= 0n) {
            return null;
          }
          return formatUnits(
            hzlpWithdrawTx.withdrawalAmounts.shortTokenAmount,
            shortTokenDecimals,
          );
        }
        return null;
      }
    },
    [
      isVault,
      marketInfo,
      hzvDepositTx?.depositAmounts?.hlvTokenAmount,
      hzvWithdrawTx?.withdrawalAmounts?.shortTokenAmount,
      directRate,
      reverseRate,
      opts.fallbackDirectRate,
      opts.fallbackReverseRate,
      shortTokenDecimals,
      hzlpDepositTx?.depositAmounts?.marketTokenAmount,
      hzlpWithdrawTx?.withdrawalAmounts?.shortTokenAmount,
    ],
  );

  const resetPayQuote = useCallback(
    (clearReceive = true) => {
      if (clearReceive) {
        const { receiveSz } = form.getValues();
        form.setValue('receiveSz', { ...receiveSz, value: '' });
      }
      if (opts.direction === LiqTradeType.Deposit) {
        setDepositShortTokenAmount(0n);
      } else if (isVault) {
        setWithdrawHlvTokenAmount(0n);
      } else {
        setWithdrawMarketTokenAmount(0n);
      }
    },
    [form, isVault, opts.direction],
  );

  const recalculatePaySz = useMemo(() => {
    const debounceUpdate = debounce(
      (value: { value?: string; coin?: string }, rawAmount?: bigint) => {
        const isDepositOp = opts.direction === LiqTradeType.Deposit;
        const payTokenDecimals = isDepositOp
          ? shortTokenDecimals
          : HZLP_TOKEN_DECIMALS;
        const amount = rawAmount
          ? Number(formatUnits(rawAmount, payTokenDecimals))
          : Number(value.value || '');

        if (!amount || !Number.isFinite(amount) || amount <= 0) {
          resetPayQuote();
          return;
        }

        if (isDepositOp) {
          const shortTokenAmount =
            rawAmount ?? parseUnits(value.value || '0', shortTokenDecimals);
          setDepositShortTokenAmount(shortTokenAmount);
        } else if (isVault) {
          const hlvTokenAmount =
            rawAmount ?? parseUnits(value.value || '0', HZLP_TOKEN_DECIMALS);
          setWithdrawHlvTokenAmount(hlvTokenAmount);
        } else {
          const marketTokenAmount =
            rawAmount ?? parseUnits(value.value || '0', HZLP_TOKEN_DECIMALS);
          setWithdrawMarketTokenAmount(marketTokenAmount);
        }
      },
      200,
    );

    return debounceUpdate;
  }, [opts.direction, isVault, shortTokenDecimals, resetPayQuote]);

  useEffect(() => {
    return () => recalculatePaySz.cancel();
  }, [recalculatePaySz]);

  const handlePaySzChange = useCallback(
    (value: { value?: string; coin?: string }, rawAmount?: bigint) => {
      form.setValue('paySz', value);

      const isDepositOp = opts.direction === LiqTradeType.Deposit;
      const payTokenDecimals = isDepositOp
        ? shortTokenDecimals
        : HZLP_TOKEN_DECIMALS;
      const amount = rawAmount
        ? Number(formatUnits(rawAmount, payTokenDecimals))
        : Number(value.value || '');

      if (!amount || !Number.isFinite(amount) || amount <= 0) {
        recalculatePaySz.cancel();
        resetPayQuote(false);
        return;
      }

      recalculatePaySz(value, rawAmount);
    },
    [form, opts.direction, shortTokenDecimals, recalculatePaySz, resetPayQuote],
  );

  const paySzValue = form.watch('paySz.value');

  useEffect(() => {
    const { receiveSz } = form.getValues();
    const amount = Number(paySzValue || '');
    if (!amount || !Number.isFinite(amount) || amount <= 0) return;

    const isDeposit = opts.direction === LiqTradeType.Deposit;
    // Determine output decimals based on direction
    const outputDecimals = DISPLAY_DECIMALS;
    const expectedOutput = calculateExpectedOutput(amount, isDeposit);

    if (expectedOutput === null) {
      if (!receiveSz.value) {
        form.setValue('receiveSz', { ...receiveSz, value: '' });
      }
      return;
    }

    const outputNum = Number(expectedOutput);
    form.setValue('receiveSz', {
      ...receiveSz,
      value: Number.isFinite(outputNum)
        ? outputNum.toFixed(outputDecimals)
        : '',
    });
  }, [
    marketInfo,
    marketTokenData?.totalSupply,
    hzvValues,
    directRate,
    reverseRate,
    form,
    opts.direction,
    calculateExpectedOutput,
    marketTokenDecimals,
    shortTokenDecimals,
    paySzValue,
  ]);

  const underlyingTokenPriceNum = useMemo(() => {
    const price =
      opts.direction === LiqTradeType.Deposit
        ? shortTokenPriceUsdForDeposit
        : shortTokenPriceUsdForWithdraw;
    if (!price) return undefined;
    return Number(formatUnits(price, USD_DECIMALS));
  }, [
    opts.direction,
    shortTokenPriceUsdForDeposit,
    shortTokenPriceUsdForWithdraw,
  ]);

  // getUsdPxFor: returns USD price for a given coin. The underlying token
  // uses the collateral price; the vault/pool token uses the trade rate.
  const getUsdPxFor = useCallback(
    (coin: string | undefined) => {
      if (!coin) return undefined;
      if (coin === shortTokenSymbol) {
        return underlyingTokenPriceNum !== undefined
          ? String(underlyingTokenPriceNum)
          : undefined;
      }

      const isDeposit = opts.direction === LiqTradeType.Deposit;
      // For HzLP/HZV token:
      // - Deposit: use directRate (based on maxPrice) for receive token display
      // - Withdraw: use reverseRate (based on minPrice) for pay token display
      const effectiveDirectRate = directRate ?? opts.fallbackDirectRate;
      const effectiveReverseRate = reverseRate ?? opts.fallbackReverseRate;
      const rate =
        isDeposit && effectiveDirectRate != null
          ? 1 / effectiveDirectRate
          : !isDeposit
            ? effectiveReverseRate
            : undefined;
      if (!rate) return undefined;
      if (underlyingTokenPriceNum === undefined) return undefined;
      const px = rate * underlyingTokenPriceNum;
      return Number.isFinite(px) ? String(px) : undefined;
    },
    [
      directRate,
      opts.direction,
      opts.fallbackDirectRate,
      opts.fallbackReverseRate,
      reverseRate,
      shortTokenSymbol,
      underlyingTokenPriceNum,
    ],
  );

  const isPending = submitPending;

  const isTradeReady = isVault
    ? opts.direction === LiqTradeType.Deposit
      ? hzvDepositTx.isReady
      : hzvWithdrawTx.isReady
    : opts.direction === LiqTradeType.Deposit
      ? hzlpDepositTx.isReady
      : hzlpWithdrawTx.isReady;

  const vaultDepositCapacityUsd = useMemo(() => {
    if (!isVault || opts.direction !== LiqTradeType.Deposit) {
      return undefined;
    }
    if (hzvDepositTx.isLoading) {
      return undefined;
    }
    return hzvDepositTx.totalAvailableCapacity;
  }, [
    hzvDepositTx.isLoading,
    hzvDepositTx.totalAvailableCapacity,
    isVault,
    opts.direction,
  ]);
  const vaultDepositCapacityAmount = useMemo(() => {
    if (!isVault || opts.direction !== LiqTradeType.Deposit) {
      return undefined;
    }
    if (hzvDepositTx.isLoading) {
      return undefined;
    }
    return hzvDepositTx.totalAvailableCapacityAmount;
  }, [
    hzvDepositTx.isLoading,
    hzvDepositTx.totalAvailableCapacityAmount,
    isVault,
    opts.direction,
  ]);
  const vaultDepositProjectedCapExceeded =
    isVault && opts.direction === LiqTradeType.Deposit
      ? hzvDepositTx.projectedCapExceeded
      : false;
  const vaultDepositFirstDepositSplitUnsupported =
    isVault && opts.direction === LiqTradeType.Deposit
      ? hzvDepositTx.isFirstDepositSplitUnsupported
      : false;

  return {
    onSubmit,
    handlePaySzChange,
    getUsdPxFor,
    isPending,
    isTradeReady,
    vaultDepositCapacityUsd,
    vaultDepositCapacityAmount,
    vaultDepositProjectedCapExceeded,
    vaultDepositFirstDepositSplitUnsupported,
    quoteFeeFactor,
  };
};
