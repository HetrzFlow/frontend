import { memo, useMemo } from 'react';
import { BN, calc } from '@repo/lib/calc';
import CommonRatioBar from '@/components/RatioBar';
import type { PlatformHistoryOrder } from '@/services/rest/order';

interface RatioBarProps {
  data: PlatformHistoryOrder[];
}

const RatioBar = ({ data }: RatioBarProps) => {
  const buyRatio = useMemo(() => {
    let longSize: BN = calc(0);
    let shortSize: BN = calc(0);

    data.forEach((item) => {
      if (item.is_long) {
        longSize = longSize.plus(item.size_delta_usd);
      } else {
        shortSize = shortSize.plus(item.size_delta_usd);
      }
    });

    const totalSize = longSize.plus(shortSize);
    return totalSize.eq(0)
      ? 0.5
      : Number(longSize.div(totalSize).toFixed(2));
  }, [data]);

  return (
    <div className="text-t-270 mt-1 flex flex-col gap-2">
      <CommonRatioBar leftRatio={buyRatio} percentDecimals={0} />
    </div>
  );
};

export default memo(RatioBar);
