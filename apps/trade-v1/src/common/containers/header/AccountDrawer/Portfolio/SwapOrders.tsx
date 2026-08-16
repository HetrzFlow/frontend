import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useOpenSwapOrders, usePriceTickerStream } from '@/common/services';
import { useInstStore, useGlobalStore } from '@/common/stores';
import ListLayout from '../components/ListLayout';

// swap order item
const SwapOrderItem = ({
  payCoin,
  payCoinSz,
  receiveCoin,
  receiveCoinSz,
  triggerPrice,
}: {
  payCoin: string;
  payCoinSz: string;
  receiveCoin: string;
  receiveCoinSz: string;
  triggerPrice: string;
}) => {
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoins());
  return (
    <div className="border-border hover:bg-bg-3 cursor-pointer rounded-xl border p-4 text-base transition-[background] duration-400">
      <div className="grid w-full grid-cols-[4fr_3fr_3fr]">
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">
            {t`Pay`}{' '}
            {coins[payCoin]?.symbol ? `(${coins[payCoin]?.symbol})` : ''}
          </span>
          <span className="font-plex text-sm">
            {truncateFormat(payCoinSz, coins[payCoin]?.szDispDecimal, {
              stripTrailingZeros: true,
            })}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">
            {t`Receive`}{' '}
            {coins[receiveCoin]?.symbol
              ? `(${coins[receiveCoin]?.symbol})`
              : ''}
          </span>
          <span className="font-plex text-sm">
            {truncateFormat(receiveCoinSz, coins[receiveCoin]?.szDispDecimal, {
              stripTrailingZeros: true,
            })}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-secondary-foreground text-xs">
            {t`Price`}{' '}
            {coins[payCoin]?.symbol && coins[receiveCoin]?.symbol
              ? `(${coins[receiveCoin]?.symbol}/${coins[payCoin]?.symbol})`
              : ''}
          </span>
          <span className="font-plex text-sm">
            {truncateFormat(triggerPrice, 10, {
              stripTrailingZeros: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

const SwapOrders: FC = () => {
  const { t, i18n } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const coins = useInstStore((state) => state.getCoins());
  const { data: swapOrders } = useOpenSwapOrders();
  const instIds = swapOrders
    .filter((v) => coins[v.payCoin]?.symbol)
    .map((v) => `${coins[v.payCoin]?.symbol}/USD`);
  const { data: prices } = usePriceTickerStream(instIds);
  const count = swapOrders.length;
  const total = useMemo(() => {
    const pricesMap = Object.fromEntries(
      instIds.map((id, index) => [id, prices[index]?.[0]?.p]),
    );
    return swapOrders.reduce((acc, cur) => {
      const px = pricesMap?.[`${coins[cur.payCoin]?.symbol}/USD`];
      return acc.plus(px ? calc(cur.payCoinSz).times(px) : 0);
    }, calc(0));
  }, [swapOrders, instIds, prices, coins]);

  if (!count) return null;

  return (
    <ListLayout
      title={
        <div className="text-t-350 flex w-full justify-between">
          <span>
            {i18n._({
              id: 'header.swapOrder',
              message:
                '{count, plural, one {Swap Order (#)} other {Swap Orders (#)}}',
              values: { count },
            })}
          </span>
          <div className="flex gap-1">
            <span>{t`Total`}</span>
            <span className="text-t-1100 font-plex">
              {truncateFormat(total, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          </div>
        </div>
      }
      listContent={
        <>
          {swapOrders.map(
            ({
              id,
              payCoin,
              payCoinSz,
              receiveCoin,
              receiveCoinSz,
              triggerPrice,
            }) => {
              return (
                <SwapOrderItem
                  key={id}
                  payCoin={payCoin}
                  payCoinSz={payCoinSz}
                  receiveCoin={receiveCoin}
                  receiveCoinSz={receiveCoinSz}
                  triggerPrice={triggerPrice}
                />
              );
            },
          )}
        </>
      }
    />
  );
};

export default SwapOrders;
