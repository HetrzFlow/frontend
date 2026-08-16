'use client';

import dynamic from 'next/dynamic';
import MarketSkeleton from '@/containers/trade/market/Skeleton';
import MarketTickerBarSkeleton from '@/containers/trade/marketTickerBar/Skeleton';
import RecentTradesSkeleton from '@/containers/trade/trades/recentTrades/Skeleton';

export const MarketTickerBar = dynamic(
  () => import('@/containers/trade/marketTickerBar'),
  {
    ssr: false,
    loading: () => <MarketTickerBarSkeleton />,
  },
);

// market
export const Market = dynamic(() => import('@/containers/trade/market'), {
  loading: () => <MarketSkeleton />,
});
export const MarketSm = dynamic(() => import('@/containers/trade/market/sm'), {
  loading: () => <MarketSkeleton />,
});

// trades
export const Trades = dynamic(() => import('@/containers/trade/trades'), {
  loading: () => <RecentTradesSkeleton />,
});
export const TradesSm = dynamic(() => import('@/containers/trade/trades/sm'));

// kline area
export const Kline = dynamic(() => import('@/containers/trade/kline'));

// trading area
export const Trading = dynamic(() => import('@/containers/trade/trading'));
export const TradingSm = dynamic(() => import('@/containers/trade/trading/sm'));

// order area
export const Order = dynamic(() => import('@/containers/trade/order'));

// widgets
export const Widgets = dynamic(() => import('@/containers/trade/widgets'), {
  ssr: false,
});
