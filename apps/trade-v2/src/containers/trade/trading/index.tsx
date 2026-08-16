import { cn, Loading, ScrollBox } from '@repo/ui';
import { useHydrated } from '@/common/hooks/useHydrated';
import TradeBox from './tradeBox';

const Trading = ({ className }: { className?: string }) => {
  const hasHydrated = useHydrated();
  if (!hasHydrated) return <Loading className="h-full w-full" />;

  return (
    <ScrollBox
      className={cn('flex h-full flex-col')}
      scrollClassName={className}
    >
      <TradeBox />
    </ScrollBox>
  );
};

Trading.displayName = 'Trading';

export default Trading;
