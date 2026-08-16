import { Skeleton } from '@repo/ui';
import MarketSkeleton from '@/containers/trade/market/Skeleton';
import MarketTickerBarSkeleton from '@/containers/trade/marketTickerBar/Skeleton';
import RecentTradesSkeleton from '@/containers/trade/trades/recentTrades/Skeleton';

export const KlineLoading = () => {
  return (
    <div className="relative h-full w-full max-md:h-[330px]">
      <Skeleton className="bg-card h-full w-full rounded-2xl" />
    </div>
  );
};

export const TradeLayoutLoading = () => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-1">
      <MarketTickerBarSkeleton />
      <div className="flex min-h-0 flex-1 gap-1 max-md:block max-md:overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <div className="bg-card h-[52px] w-full shrink-0 rounded-2xl px-2 py-1 max-md:h-14 max-md:bg-transparent max-md:px-4 max-md:pt-3 max-md:pb-0">
            <MarketSkeleton />
          </div>
          <div className="flex min-h-0 flex-1 gap-1 max-md:block">
            <div className="min-h-0 flex-1">
              <h2 className="sr-only">Price Chart</h2>
              <KlineLoading />
            </div>
            <RecentTradesSkeleton className="bg-card w-1/3 max-w-55 rounded-2xl p-2 max-md:hidden" />
          </div>
          <Skeleton className="bg-card h-11 w-full shrink-0 rounded-2xl max-md:h-48" />
        </div>
        <Skeleton className="bg-card w-[340px] shrink-0 rounded-2xl max-md:hidden" />
      </div>
    </div>
  );
};
