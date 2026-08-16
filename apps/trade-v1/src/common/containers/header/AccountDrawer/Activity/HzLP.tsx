import { FC, memo, useMemo, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { dateFormat, EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import {
  ArrowLeftRightIcon,
  Loading,
  PaginationLoadMore,
  PaginationNoMore,
  ScrollBox,
} from '@repo/ui';
import { IMAGES_MAP } from '../../../../assets';
import CoinIcon from '../../../../components/CoinIcon';
import {
  useHzLPDetail,
  useUserHzLPActivity,
} from '../../../../services/rest/hzlp';
import { COIN_CONFIGS } from '../../../../services/rest/inst';
import { useInstStore } from '../../../../stores/instStore';
import { useWalletStore } from '../../../../stores/walletStore';

const RecordItem = ({
  payCoinType,
  payCoinAmount: payCoinAmountWithDecimal,
  receiveCoinType,
  receiveCoinAmount: receiveCoinAmountWithDecimal,
  timestamp,
  digest,
}: {
  id: string;
  payCoinType: string;
  payCoinAmount: string;
  receiveCoinType: string;
  receiveCoinAmount: string;
  timestamp: number;
  digest: string;
}) => {
  const { t } = useLingui();

  const explorerHost = useWalletStore((state) => state.getExplorerHost());

  const { data: hzlpDetail } = useHzLPDetail();
  const coins = useInstStore((state) => state.getCoins());
  const [pxIsReversed, setPxIsRecersed] = useState(false);

  const [payCoinSymbol, payCoinIcon, payCoinDecimal, payCoinDispDecimal] =
    useMemo(() => {
      const payCoinIsHzLP = payCoinType.toLowerCase().includes('hzlp');

      return payCoinIsHzLP
        ? [
            hzlpDetail?.symbol,
            IMAGES_MAP.coinIcons.HzLP,
            hzlpDetail?.hzlp_decimal,
            COIN_CONFIGS.HzLP.szDispDecimal,
          ]
        : [
            coins[payCoinType]?.symbol,
            coins[payCoinType]?.icon,
            coins[payCoinType]?.decimal,
            coins[payCoinType]?.szDispDecimal,
          ];
    }, [payCoinType, hzlpDetail, coins]);
  const [
    receiveCoinSymbol,
    receiveCoinIcon,
    receiveCoinDecimal,
    receiveCoinDispDecimal,
  ] = useMemo(() => {
    const receiveCoinIsHzLP = receiveCoinType.toLowerCase().includes('hzlp');

    return receiveCoinIsHzLP
      ? [
          hzlpDetail?.symbol,
          IMAGES_MAP.coinIcons.HzLP,
          hzlpDetail?.hzlp_decimal,
          COIN_CONFIGS.HzLP.szDispDecimal,
        ]
      : [
          coins[receiveCoinType]?.symbol,
          coins[receiveCoinType]?.icon,
          coins[receiveCoinType]?.decimal,
          coins[receiveCoinType]?.szDispDecimal,
        ];
  }, [receiveCoinType, hzlpDetail, coins]);

  const payCoinAmount = calc(payCoinAmountWithDecimal).div(
    calc(10).pow(payCoinDecimal || ''),
  );
  const receiveCoinAmount = calc(receiveCoinAmountWithDecimal).div(
    calc(10).pow(receiveCoinDecimal || ''),
  );

  return (
    <a
      href={`${explorerHost}/txblock/${digest}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      <div className="border-border hover:bg-bg-3 rounded-xl border p-4 text-base transition-[background] duration-400">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-t-270 mr-auto text-sm">{t`Pay`}</span>
          <CoinIcon size={24} src={payCoinIcon} alt={payCoinSymbol} />
          <span className={'text-base'}>
            {truncateFormat(payCoinAmount, payCoinDispDecimal, {
              stripTrailingZeros: true,
              showMinDecimalValue: true,
            })}{' '}
            {payCoinSymbol}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 font-medium">
          <span className="text-t-270 mr-auto text-sm">{t`Receive`}</span>
          <CoinIcon size={24} src={receiveCoinIcon} alt={receiveCoinSymbol} />
          <span className={'text-base'}>
            {truncateFormat(receiveCoinAmount, receiveCoinDispDecimal, {
              stripTrailingZeros: true,
              showMinDecimalValue: true,
            })}{' '}
            {receiveCoinSymbol}
          </span>
        </div>
        <div className="text-t-350 font-plex mt-3 flex items-center gap-2 text-sm">
          <span>1 {pxIsReversed ? receiveCoinSymbol : payCoinSymbol}</span>
          <ArrowLeftRightIcon
            className="text-accent cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setPxIsRecersed(!pxIsReversed);
            }}
            size={14}
          />
          <span className="flex items-center">
            {payCoinAmount && receiveCoinAmount
              ? truncateFormat(
                  pxIsReversed
                    ? calc(payCoinAmount).div(receiveCoinAmount)
                    : calc(receiveCoinAmount).div(payCoinAmount),
                  pxIsReversed ? payCoinDispDecimal : receiveCoinDispDecimal,
                  { stripTrailingZeros: true, showMinDecimalValue: true },
                )
              : EMPTY_DISPLAY}{' '}
            {pxIsReversed ? payCoinSymbol : receiveCoinSymbol}
          </span>
        </div>
        <div className="text-secondary-foreground font-plex mt-3 text-sm">
          {dateFormat(timestamp, 'yyyy/MM/dd HH:mm:ss')}
        </div>
      </div>
    </a>
  );
};

const HzLP: FC = () => {
  const { t } = useLingui();
  const {
    data: records,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
  } = useUserHzLPActivity();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = records?.pages.length || 0;

  const data =
    records?.pages.slice(0, currentPage).flatMap((v) => v?.items || []) || [];

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
            input_coin: payCoinType,
            input_amount: payCoinAmount,
            output_coin: receiveCoinType,
            min_out: receiveCoinAmount,
            execute_timestamp_ms: timestamp,
            tx_digest: digest,
          }) => {
            return (
              <RecordItem
                key={id}
                id={id}
                payCoinType={payCoinType}
                payCoinAmount={payCoinAmount}
                receiveCoinType={receiveCoinType}
                receiveCoinAmount={receiveCoinAmount}
                timestamp={timestamp}
                digest={digest}
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

export default memo(HzLP);
