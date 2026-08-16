import dynamic from 'next/dynamic';

// market
export const Market = dynamic(() => import('@/containers/trade/market'));

// kline area
export const Kline = dynamic(() => import('@/containers/trade/kline'));

// trading area
export const Trading = dynamic(() => import('@/containers/trade/trading'));
export const TradingSm = dynamic(() => import('@/containers/trade/trading/sm'));

// order area
export const Order = dynamic(() => import('@/containers/trade/order'));
