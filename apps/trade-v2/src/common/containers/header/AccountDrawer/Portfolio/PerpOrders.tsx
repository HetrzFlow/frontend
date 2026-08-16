import { FC, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { CoinIcon } from '@repo/common/components';
import { useNavItems } from '@repo/common/hooks';
import { thoFormat, truncateFormat, unitFormat } from '@repo/lib/format';
import {
  cn,
  CreditIcon,
  PaginationLoadMore,
  PaginationNoMore,
  XLgIcon,
} from '@repo/ui';

import { CREDIT_MARKET_CATEGORY } from '@/common/constants';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';
import { getInactiveTpSlOrderIds } from '@/lib/trade/order';
import { useTradeGlobalStore } from '@/stores/trade/global';

import { useCancelOrder } from '../../../../hooks/useCancelOrder';
import { PAGE_LIMIT, useOpenOrders } from '../../../../services/rest/order';
import { usePositions } from '../../../../services/rest/position';
import { useGlobalStore } from '../../../../stores/globalStore';
import { useInstStore } from '../../../../stores/instStore';
import { useStore } from '../../store';
import ListLayout from '../components/ListLayout';
import Side from '../components/Side';

// order item
const PerpOrderItem = ({
  instId,
  marketAddress,
  isLong,
  isMarket,
  size,
  isOpen,
  triggerPriceAboveAllowed,
  triggerPrice,
  isInactive,
  onCancel,
}: {
  instId?: string;
  marketAddress?: string;
  isLong: boolean;
  isOpen: boolean;
  size: string;
  isMarket: boolean;
  collateralAmount: string;
  collateralTokenAddress: string;
  triggerPriceAboveAllowed?: boolean;
  triggerPrice: string;
  isInactive?: boolean;
  onCancel: () => void;
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[instId || marketAddress || ''];
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;

  return (
    <div className="group/self relative cursor-pointer border-t py-3 text-xs">
      <div className="group-hover/self:bg-bg-4 absolute inset-1 -right-2 -left-2 -z-1 rounded-lg transition-[background] duration-400" />
      <div className="flex items-center gap-2">
        <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />
        <span className="font-medium">{inst?.name || ''}</span>
        <span
          className={cn(
            'ml-1 rounded-sm px-2 py-0.5 text-xs',
            isLong ? 'text-up bg-up/10' : 'text-down bg-down/10',
          )}
        >
          <Side
            isBuy={(isOpen && isLong) || (!isOpen && !isLong)}
            isLong={isLong}
          />
        </span>
        {isCreditMarket ? (
          <CreditIcon size={14} className="text-accent shrink-0" />
        ) : null}
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
      <div className="mt-3 grid w-full grid-cols-[4fr_3fr]">
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Size`}</span>
          <span className="font-plex text-sm break-all">
            {unitFormat(size, usdAmountDisplayDecimal, {
              minNumber: 1000000,
              unitDecimal: 3,
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            })}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-secondary-foreground text-xs">{t`Price`}</span>
          <span className="font-plex text-sm">
            {isMarket
              ? t`Market Price`
              : triggerPriceAboveAllowed !== undefined
                ? triggerPriceAboveAllowed
                  ? '≥'
                  : '≤'
                : ''}
            {!isMarket &&
              truncateFormat(triggerPrice, inst?.pxDispDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
          </span>
        </div>
      </div>
      {isInactive ? (
        <div className="bg-warning/10 text-warning mt-3 flex w-full items-center justify-center rounded-lg px-2 py-1 text-xs">
          {t`Inactive: Cancel to avoid unexpected close on entry`}
        </div>
      ) : null}
    </div>
  );
};

const PerpOrders: FC = () => {
  const router = useRouter();
  const { t } = useLingui();
  const insts = useInstStore((state) => state.getInsts());
  const setInst = useTradeGlobalStore((state) => state.setInst);
  const { data: orders, isFetching, refetch } = useOpenOrders();
  const { data: positions } = usePositions();
  const { mutate: onCancel } = useCancelOrder({
    refetchOrders: refetch,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [orderOpem, setOrderOpen] = useStore(
    useShallow((state) => [state.orderOpen, state.setOrderOpen]),
  );
  const inactiveOrderIds = useMemo(
    () => getInactiveTpSlOrderIds(orders, positions),
    [orders, positions],
  );
  const data = (orders || []).slice(0, currentPage * PAGE_LIMIT);
  const count = orders?.length || 0;
  const hasInactiveTpSlOrders = inactiveOrderIds.size > 0;

  const { trade } = useNavItems();
  if (!count) return null;

  return (
    <ListLayout
      open={orderOpem}
      onOpenChange={setOrderOpen}
      title={
        <div className="text-t-1100 flex items-center gap-1 font-medium">
          {t`Orders`}
          <span className="relative inline-flex">
            <span className="bg-t-1100/10 inline-block min-w-5 rounded-sm p-0.5 align-middle text-xs">
              {thoFormat(count)}
            </span>
            {hasInactiveTpSlOrders ? (
              <span className="bg-warning absolute top-0 right-0 size-[5px] rounded-full" />
            ) : null}
          </span>
        </div>
      }
      listContent={
        <div>
          <div className="flex flex-col">
            {data.map((order) => {
              const {
                marketAddress,
                id,
                isOpen,
                isMarket,
                isLong,
                triggerPrice,
                triggerAboveThreshold,
                sizeDeltaUsd,
                initialCollateralDeltaAmount,
                initialCollateralTokenAddress,
              } = order;
              const inst = insts[marketAddress];
              // jump to trade page
              const href = inst
                ? `${trade.link}/${buildTradeRouteInstIdByCategory(
                    inst.name,
                    inst.category,
                  )}?orderTab=perpOrders&orderFocus=${encodeURIComponent(id)}`
                : `${trade.link}?orderTab=perpOrders&orderFocus=${encodeURIComponent(id)}`;
              return (
                <Link
                  key={id}
                  href={href}
                  onMouseEnter={() => router.prefetch(href)}
                  onClick={() => inst && setInst(inst)}
                >
                  <PerpOrderItem
                    marketAddress={marketAddress}
                    isOpen={isOpen}
                    isLong={isLong}
                    isMarket={isMarket}
                    size={sizeDeltaUsd}
                    collateralAmount={initialCollateralDeltaAmount}
                    collateralTokenAddress={initialCollateralTokenAddress}
                    triggerPriceAboveAllowed={triggerAboveThreshold}
                    triggerPrice={triggerPrice}
                    isInactive={inactiveOrderIds.has(id)}
                    onCancel={() => onCancel([order])}
                  />
                </Link>
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
