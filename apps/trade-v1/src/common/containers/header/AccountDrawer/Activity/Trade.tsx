import { FC, memo, useMemo, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { dateFormat, truncateFormat } from '@repo/lib/format';
import {
  ArrowUpRightIcon,
  cn,
  Loading,
  PaginationLoadMore,
  PaginationNoMore,
  ScrollBox,
} from '@repo/ui';
import CoinIcon from '../../../../components/CoinIcon';
import { useHistoryRecords } from '../../../../services/rest/position';
import { useGlobalStore } from '../../../../stores/globalStore';
import { useInstStore } from '../../../../stores/instStore';
import { useWalletStore } from '../../../../stores/walletStore';

const RecordItem = ({
  targetCoin,
  isLong,
  size,
  event_type,
  execPrice,
  orderTime,
  isClose,
  pnl,
  digest,
}: {
  targetCoin: string;
  isLong: boolean;
  size: string;
  execPrice: string;
  orderTime: number;
  pnl: string;
  digest: string;
  isClose: boolean;
  event_type: string;
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const explorerHost = useWalletStore((state) => state.getExplorerHost());

  const inst = useInstStore((state) => state.getInstsArr()).find(
    (v) => v.coinType === targetCoin,
  );
  const coins = useInstStore((state) => state.getCoins());
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;

  const [isBuy, typeText] = useMemo(() => {
    switch (event_type) {
      case 'open_long':
        return [true, t`Open Long`];
      case 'close_long':
        return [false, t`Close Long`];
      case 'increase_long':
        return [true, t`Increase Long`];
      case 'decrease_long':
        return [false, t`Decrease Long`];
      case 'open_short':
        return [false, t`Open Short`];
      case 'close_short':
        return [true, t`Close Short`];
      case 'increase_short':
        return [false, t`Increase Short`];
      case 'decrease_short':
        return [true, t`Decrease Short`];
      case 'liquidated':
        return [!isLong, t`Liquidated`];
      default:
        return [true, ''];
    }
  }, [event_type, isLong, t]);

  return (
    <a
      href={`${explorerHost}/txblock/${digest}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      <div className="border-border hover:bg-bg-3 rounded-xl border p-4 text-base transition-[background] duration-400">
        <div className="flex items-center gap-2">
          <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />
          <span className="font-medium">{inst?.id.split('/')[0] || ''}</span>
          {typeText && (
            <span
              className={cn(
                'ml-1 rounded-sm px-2 py-1 text-xs',
                event_type === 'liquidated'
                  ? 'text-destructive bg-destructive/10'
                  : isBuy
                    ? 'text-up bg-up/10'
                    : 'text-down bg-down/10',
              )}
            >
              {typeText}
            </span>
          )}

          <ArrowUpRightIcon
            className="text-t-430 hover:text-t-1100 ml-auto cursor-pointer"
            size={16}
          />
        </div>
        <div className="mt-3 flex grid w-full grid-cols-[4fr_3fr_3fr]">
          <div className="flex flex-col gap-1">
            <span className="text-secondary-foreground text-xs">{t`Size`}</span>
            <span className={cn('font-plex text-sm')}>
              {truncateFormat(size, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
                signDisplay: 'always',
              })}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-secondary-foreground text-xs">{t`Price`}</span>
            <span className="font-plex text-sm">
              {truncateFormat(execPrice, pxDispDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          </div>
          {isClose ? (
            <div className="flex flex-col gap-1 text-right">
              <span className="text-secondary-foreground text-xs">{t`PnL`}</span>
              <span
                className={cn(
                  'font-plex text-sm',
                  calc(pnl).lt(0) ? 'text-down' : '',
                  calc(pnl).gt(0) ? 'text-up' : '',
                )}
              >
                {truncateFormat(pnl, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: 'exceptZero',
                })}
              </span>
            </div>
          ) : null}
        </div>
        <div className="text-secondary-foreground font-plex mt-3 text-xs">
          {dateFormat(orderTime, 'yyyy/MM/dd HH:mm:ss')}
        </div>
      </div>
    </a>
  );
};

const Trade: FC = () => {
  const { t } = useLingui();

  const {
    data: records,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
  } = useHistoryRecords({});
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = records?.pages.length || 0;

  const data =
    records?.pages.slice(0, currentPage).flatMap((v) => v!.items) || [];
  if (isFetching && currentPage === 1) {
    return <Loading className="mt-20 bg-transparent" />;
  }
  if (!data.length)
    return (
      <p className="text-t-430 mt-2 text-center text-sm">{t`No results`}</p>
    );

  return (
    <ScrollBox
      scrollClassName="scrollbar-none flex max-md:h-[calc(100dvh-424px)] h-[calc(100dvh-262px)] flex-col gap-3 overflow-y-auto px-6"
      shadowClassName="to-bg-drawer-shadow absolute bottom-0 mx-6 h-12 w-[calc(100%-calc(var(--spacing)*12))] bg-gradient-to-b from-transparent"
    >
      <div className="flex flex-col gap-2">
        {data.map(
          ({
            id,
            direction,
            index_coin,
            event_type,
            size_delta,
            pnl,
            price,
            timestamp,
            tx_digest,
            isClose,
          }) => {
            return (
              <RecordItem
                key={id}
                isLong={direction === 'long'}
                targetCoin={index_coin}
                event_type={event_type}
                size={size_delta}
                execPrice={price}
                orderTime={timestamp}
                isClose={isClose}
                pnl={pnl}
                digest={tx_digest}
              />
            );
          },
        )}
        {/* pagination load */}
        {(hasNextPage || currentPage < totalPages) && (
          <PaginationLoadMore
            className="my-2"
            isFetching={isFetchingNextPage}
            onClick={() => {
              fetchNextPage();
              setCurrentPage((prev) => prev + 1);
            }}
          >
            {t`Click to load more`}
          </PaginationLoadMore>
        )}
        {/* no data */}
        {!hasNextPage && currentPage >= totalPages && (
          <PaginationNoMore className="my-2">{t`End of list`}</PaginationNoMore>
        )}
      </div>
    </ScrollBox>
  );
};

export default memo(Trade);
