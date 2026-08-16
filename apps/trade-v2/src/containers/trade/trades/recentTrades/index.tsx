import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';

import { cn } from '@repo/ui';
import { useHydrated } from '@/common/hooks';
import { usePlatformHistoryOrders } from '@/services/rest/order';
import { useRecentTradesStream } from '@/services/ws/recentTrades';
import { useTradeGlobalStore } from '@/stores/trade/global';
import Detail from './Detail';
import List from './List';
import RatioBar from './RatioBar';
import RecentTradesSkeleton from './Skeleton';

export interface RecentTradesProps {
  className?: string;
}

const ENABLE_RECENT_TRADES_WS = true;

const RecentTrades = ({ className }: RecentTradesProps) => {
  const { t } = useLingui();
  const instId = useTradeGlobalStore((state) => state.instId);
  const recentTradesStream = useRecentTradesStream(instId, {
    enabled: ENABLE_RECENT_TRADES_WS,
  });
  const recentTradesPolling = usePlatformHistoryOrders({
    instId,
    enabled: !ENABLE_RECENT_TRADES_WS,
  });
  const { data, isLoading } = ENABLE_RECENT_TRADES_WS
    ? recentTradesStream
    : recentTradesPolling;
  const tradesData = data ?? [];

  const hasHydrated = useHydrated();

  const [detailIndex, setDetailIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPositionTop, setDetailPositionTop] = useState(0);

  const handleMouseEnter = (index: number, top: number) => {
    setDetailOpen(true);
    setDetailIndex(index);
    setDetailPositionTop(top);
  };
  const handleMouseLeave = () => {
    setDetailOpen(false);
  };

  if (isLoading || !hasHydrated) {
    return <RecentTradesSkeleton className={className} />;
  }

  return (
    <div className={cn('relative h-full max-md:text-xs', className)}>
      <div className="text-t-270 flex px-2 select-none">
        <span className="w-4/9">{t`Price`}</span>
        <span className="w-2/9">{t`Size`}</span>
        <span className="w-1/3 text-right">{t`Time`}</span>
      </div>
      <div className="relative h-[calc(100%-48px)]">
        {!tradesData.length ? (
          <div className="text-t-270 pt-10 text-center">
            {t`No recent trades yet.`}
          </div>
        ) : (
          <List
            data={tradesData}
            instId={instId}
            handleRowMouseEnter={handleMouseEnter}
            handleRowMouseLeave={handleMouseLeave}
          />
        )}
      </div>
      <RatioBar data={tradesData} />

      <Detail
        open={detailOpen}
        top={detailPositionTop}
        instId={instId}
        itemData={tradesData[detailIndex]}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default RecentTrades;
