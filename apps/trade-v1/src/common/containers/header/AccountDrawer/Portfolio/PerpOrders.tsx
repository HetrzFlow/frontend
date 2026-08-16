import { FC, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { normalizeStructTag } from '@mysten/sui/utils';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat, unitFormat } from '@repo/lib/format';
import { cn, PaginationLoadMore, PaginationNoMore, XLgIcon } from '@repo/ui';
import CoinIcon from '../../../../components/CoinIcon';
import { useCancelOrder } from '../../../../hooks/useCancelOrder';
import { PAGE_LIMIT, useOpenOrders } from '../../../../services/rest/order';
import { usePriceTickerStream } from '../../../../services/ws/tickers';
import { useGlobalStore } from '../../../../stores/globalStore';
import { useInstStore } from '../../../../stores/instStore';
import { useContextData } from '../../context';
import { useStore } from '../../store';
import ListLayout from '../components/ListLayout';
import Side from '../components/Side';

// order item
const PerpOrderItem = ({
  targetCoin,
  isBuy,
  isLong,
  isLimit,
  size,
  payCoin,
  payCoinAmount,
  triggerPriceAboveAllowed,
  triggerPrice,
  onCancel,
  collateralUsd,
}: {
  targetCoin: string;
  isBuy: boolean;
  isLong: boolean;
  isLimit: boolean;
  size: string;
  collateralUsd?: string;
  payCoin?: string;
  payCoinAmount?: string;
  triggerPriceAboveAllowed?: boolean;
  triggerPrice: string;
  onCancel: () => void;
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const insts = useInstStore((state) => state.getInstsArr());
  const inst = insts.find((v) => normalizeStructTag(v.coinType) === targetCoin);
  const payCoinObj = useInstStore((state) => state.getCoins())[payCoin || ''];
  const payCoinPx = usePriceTickerStream(
    payCoinObj ? `${payCoinObj.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;

  const payCoinIsTargetCoin = payCoin === targetCoin;
  const finalPayCoinPx = payCoinIsTargetCoin ? triggerPrice : payCoinPx;

  return (
    <div className="border-border hover:bg-bg-3 cursor-pointer rounded-xl border p-4 text-base transition-[background] duration-400">
      <div className="flex items-center gap-2">
        <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />
        <span className="font-medium">{inst?.name || ''}</span>
        <span
          className={cn(
            'ml-1 rounded-sm px-2 py-1 text-xs',
            isBuy ? 'text-up bg-up/10' : 'text-down bg-down/10',
          )}
        >
          <Side isBuy={isBuy} isLong={isLong} />
        </span>
        <XLgIcon
          size={16}
          className="hover:text-t-1100 text-t-430 ml-auto cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onCancel();
          }}
        />
      </div>
      <div className="mt-3 grid w-full grid-cols-[4fr_3fr_3fr]">
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Size`}</span>
          <span className="font-plex text-sm break-all">
            {unitFormat(size, usdAmountDisplayDecimal, {
              minNumber: 1000000,
              unitDecimal: 3,
              style: 'currency',
              currency: 'USD',
            })}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Collateral`}</span>
          <span className="font-plex text-sm">
            {unitFormat(
              collateralUsd ||
                calc(payCoinAmount || '')
                  .div(payCoinObj ? Math.pow(10, payCoinObj.decimal) : '')
                  .times(finalPayCoinPx || ''),
              usdAmountDisplayDecimal,
              {
                minNumber: 1000000,
                unitDecimal: 3,
                style: 'currency',
                currency: 'USD',
              },
            )}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-secondary-foreground text-xs">{t`Price`}</span>
          <span className="font-plex text-sm">
            {!isLimit
              ? t`Market Price`
              : triggerPriceAboveAllowed !== undefined
                ? triggerPriceAboveAllowed
                  ? '≥'
                  : '≤'
                : ''}
            {isLimit &&
              truncateFormat(triggerPrice, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
          </span>
        </div>
      </div>
    </div>
  );
};

const PerpOrders: FC = () => {
  const { i18n, t } = useLingui();
  const { locale } = i18n;
  const { inTradePage } = useContextData();
  const { data: orders, isFetching, refetch } = useOpenOrders();
  const { mutate: onCancel } = useCancelOrder({ refetchOrders: refetch });
  const [currentPage, setCurrentPage] = useState(1);
  const data = orders?.slice(0, currentPage * PAGE_LIMIT) || [];
  const count = orders?.length || 0;
  const [orderOpem, setOrderOpen] = useStore(
    useShallow((state) => [state.orderOpen, state.setOrderOpen]),
  );

  if (!count) return null;

  return (
    <ListLayout
      open={orderOpem}
      onOpenChange={setOrderOpen}
      title={
        <div className="text-t-350 flex w-full justify-between">
          <span>
            {i18n._({
              id: 'header.openOrders',
              message:
                '{count, plural, one {Perp Order (#)} other {Perp Orders (#)}}',
              values: { count },
            })}
          </span>
        </div>
      }
      listContent={
        <div>
          <div className="flex flex-col gap-2">
            {data.map((order) => {
              const {
                orderId,
                isBuy,
                isLong,
                isLimit,
                triggerPrice,
                triggerAboveThreshold,
                size,
                targetCoin,
                payCoin,
                payCoinAmount,
                collateralUsd,
              } = order;
              // jump to trade page
              return inTradePage ? (
                <PerpOrderItem
                  key={orderId}
                  targetCoin={targetCoin}
                  isBuy={isBuy}
                  isLong={isLong}
                  isLimit={isLimit}
                  size={size}
                  payCoin={payCoin}
                  payCoinAmount={payCoinAmount}
                  collateralUsd={collateralUsd}
                  triggerPriceAboveAllowed={triggerAboveThreshold}
                  triggerPrice={triggerPrice}
                  onCancel={() => onCancel([order])}
                />
              ) : (
                <a
                  key={orderId}
                  href={`${process.env.NEXT_PUBLIC_TRADE_URL || ''}/${locale}/trade?orderTab=perpOrders`}
                >
                  <PerpOrderItem
                    key={orderId}
                    targetCoin={targetCoin}
                    isBuy={isBuy}
                    isLong={isLong}
                    isLimit={isLimit}
                    size={size}
                    payCoin={payCoin}
                    payCoinAmount={payCoinAmount}
                    collateralUsd={collateralUsd}
                    triggerPriceAboveAllowed={triggerAboveThreshold}
                    triggerPrice={triggerPrice}
                    onCancel={() => onCancel([order])}
                  />
                </a>
              );
            })}
          </div>

          {/* pagination load */}
          {currentPage * PAGE_LIMIT < count && (
            <PaginationLoadMore
              className="mt-4"
              isFetching={isFetching}
              onClick={() => {
                setCurrentPage((prev) => prev + 1);
              }}
            >
              {t`Click to load more`}
            </PaginationLoadMore>
          )}
          {/* no data */}
          {currentPage * PAGE_LIMIT >= count && currentPage > 1 && (
            <PaginationNoMore className="mt-4">{t`End of list`}</PaginationNoMore>
          )}
        </div>
      }
    />
  );
};

export default PerpOrders;
