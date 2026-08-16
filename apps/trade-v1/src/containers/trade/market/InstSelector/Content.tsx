import { FC, useCallback, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { useInstStore } from '@/common';
import { useTickers } from '@/services/rest/tickers';
import Item from './Item';

interface ContentProps {
  onOpenChange: (open: boolean) => void;
}

const Content: FC<ContentProps> = ({ onOpenChange }) => {
  const { t } = useLingui();
  const insts = useInstStore((state) => state.getInstsArr());
  const coins = useInstStore((state) => state.getCoins());
  const { data: tickersData } = useTickers();
  const sortedInsts = useMemo(() => {
    const tickersMap = Object.fromEntries(
      tickersData?.map((v) => [v.symbol, v]) || [],
    );

    return [...insts].sort((a, b) => {
      return calc(tickersMap[coins[a.baseCoin]?.symbol || '']?.volume || '').gt(
        tickersMap[coins[b.baseCoin]?.symbol || '']?.volume || '',
      )
        ? -1
        : 1;
    });
  }, [insts, tickersData, coins]);

  const handleItemClick = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <div className="flex flex-col text-sm md:py-4">
      <div className="text-t-270 mx-4 flex justify-between border-b pb-2 text-xs max-md:hidden">
        <span className="w-1/2">{t`Symbol`}</span>
        <span className="w-1/2 text-right">{t`Mark Price`}</span>
        {/* <span className="w-1/3 text-right">{t`24h Vol`}</span> */}
      </div>
      {sortedInsts.map(({ id }, i) => {
        return (
          <Item
            key={id}
            instId={id}
            onClick={handleItemClick}
            noBorder={i === insts.length - 1}
          />
        );
      })}
    </div>
  );
};

export default Content;
