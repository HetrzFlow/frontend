'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENT_NAMES, generateSub, type PushData } from '@repo/lib/ws';
import { useHzSdk } from '@/common';
import { ws } from '@/common/services/ws/instance';
import { useInstStore, usePriceStore } from '@/common/stores';
import {
  mapPlatformHistoryOrder,
  type PlatformHistoryOrder,
  type PlatformHistoryTrade,
} from '@/services/rest/order';

const RECENT_TRADES_CHANNEL = 'recentTrades';
const MAX_RECENT_TRADES = 100;

type RecentTradesMode = 'waiting' | 'ws';

type RecentTradesParamType = {
  marketAddress: string;
};

const [subRecentTrades] = generateSub<
  RecentTradesParamType,
  PlatformHistoryTrade[] | null
>(ws, RECENT_TRADES_CHANNEL, ['marketAddress']);

type RecentTradesMessage = PushData<PlatformHistoryTrade[] | null> & {
  type?: 'snapshot' | 'update';
};

type RecentTradeKeyCarrier = Pick<
  PlatformHistoryTrade | PlatformHistoryOrder,
  'tx_hash' | 'log_index' | 'order_key'
>;

function getTradeKey(item: RecentTradeKeyCarrier) {
  if (item.tx_hash && item.log_index !== undefined) {
    return `${item.tx_hash}-${item.log_index}`;
  }

  return item.order_key;
}

function mergeRecentTrades<T extends RecentTradeKeyCarrier>(
  incoming: T[],
  prev: T[] = [],
) {
  if (!incoming.length) return prev;

  const seen = new Set<string>();
  const next: T[] = [];

  for (const item of incoming) {
    const key = getTradeKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(item);
    if (next.length >= MAX_RECENT_TRADES) {
      return next;
    }
  }

  for (const item of prev) {
    const key = getTradeKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(item);
    if (next.length >= MAX_RECENT_TRADES) {
      break;
    }
  }

  return next;
}

export function useRecentTradesStream(
  instId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const hzSdk = useHzSdk();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const inst = insts[instId || ''];
  const marketAddress = inst?.marketTokenAddress?.toLowerCase();
  const indexTokenDecimals = inst?.indexTokenAddress
    ? coins[inst.indexTokenAddress]?.decimals
    : undefined;

  const [wsData, setWsData] = useState<PlatformHistoryOrder[]>([]);
  const [mode, setMode] = useState<RecentTradesMode>('waiting');
  const mapContextRef = useRef({
    coins,
    pricesMap,
    chainId: hzSdk?.chainId,
    indexTokenDecimals,
    usdtTokenAddress: coins.USDT?.address,
  });
  mapContextRef.current = {
    coins,
    pricesMap,
    chainId: hzSdk?.chainId,
    indexTokenDecimals,
    usdtTokenAddress: coins.USDT?.address,
  };

  useEffect(() => {
    setWsData([]);
    setMode(enabled && marketAddress ? 'waiting' : 'ws');
  }, [enabled, marketAddress]);

  useEffect(() => {
    if (!enabled || !marketAddress) return;

    const handleMessage = (res: PushData<PlatformHistoryTrade[] | null>) => {
      const message = res as RecentTradesMessage;
      const incoming = message.data || [];
      const { coins, pricesMap, chainId, indexTokenDecimals, usdtTokenAddress } =
        mapContextRef.current;
      const mappedIncoming = mergeRecentTrades(
        incoming.map((trade) =>
          mapPlatformHistoryOrder(trade, {
            coins,
            pricesMap,
            chainId,
            indexTokenDecimals,
            usdtTokenAddress,
          }),
        ),
      );

      if (!mappedIncoming.length) {
        setMode('ws');
        return;
      }

      if (message.type === 'snapshot') {
        setMode('ws');
        setWsData(mappedIncoming);
        return;
      }

      setMode('ws');
      setWsData((prev) => mergeRecentTrades(mappedIncoming, prev));
    };

    const handleWsUnavailable = () => {
      setMode('ws');
    };

    ws.addEventListener(EVENT_NAMES.CLOSE, handleWsUnavailable);
    ws.addEventListener(EVENT_NAMES.ERROR, handleWsUnavailable);
    const unsubscribe = subRecentTrades({
      marketAddress,
      callback: handleMessage,
    });

    return () => {
      ws.removeEventListener(EVENT_NAMES.CLOSE, handleWsUnavailable);
      ws.removeEventListener(EVENT_NAMES.ERROR, handleWsUnavailable);
      unsubscribe();
    };
  }, [enabled, marketAddress]);

  const data = mode === 'ws' ? wsData : [];
  const isLoading = enabled && mode === 'waiting';

  return {
    data,
    isLoading,
  };
}
