import { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNavItems } from '@repo/common/hooks';
import { ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { usePriceTickerStream, useTickers } from '@/common/services';
import { useInstStore } from '@/common/stores';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';
import { calcPriceChange } from '@/lib/trade/formulas';
import { useTradeGlobalStore } from '@/stores/trade/global';

interface ItemProps {
  instId: string;
}

const Item: FC<ItemProps> = ({ instId }) => {
  const router = useRouter();

  const inst = useInstStore((state) => state.getInst(state, instId));
  const setInst = useTradeGlobalStore((state) => state.setInst);
  const symbol = inst?.symbol;
  const { data: priceData } = usePriceTickerStream(symbol);
  const { data: tickerData } = useTickers({
    marketAddress: inst?.marketTokenAddress,
    symbol: inst?.symbol,
  });

  const { p: last = '' } = priceData[0] || {};
  const { open_24h: priceOpen = '' } = tickerData || {};

  const { isUp, isDown, chg } = calcPriceChange(last, priceOpen);
  const dispChg = percentFormat(chg, 2, { signDisplay: 'never' });

  const { trade } = useNavItems();

  if (!last || !priceOpen || !inst) {
    return null;
  }

  const href = `${trade.link}/${buildTradeRouteInstIdByCategory(
    inst.name,
    inst.category,
  )}`;

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={() => router.prefetch(href)}
      onPointerDown={() => router.prefetch(href)}
      onClick={() => setInst(inst)}
      className="hover:bg-bg-3 flex shrink-0 items-center gap-1 rounded-xl px-2 font-semibold"
    >
      <span className="text-t-350 font-semibold">{inst?.name}</span>
      <span className="font-medium">
        {truncateFormat(priceData[0]?.p, inst?.pxDispDecimal, {
          round: ROUND_MODE.DOWN,
          style: 'currency',
          currency: 'USD',
        })}
      </span>
      <span
        className={cn(
          'ml-1 text-xs font-medium',
          isUp ? 'text-up' : '',
          isDown ? 'text-down' : '',
        )}
      >
        {isUp ? '↑' : ''}
        {isDown ? '↓' : ''}
        {dispChg === EMPTY_DISPLAY ? '' : dispChg}
      </span>
    </Link>
  );
};

export default Item;
