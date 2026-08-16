import { FC, useRef, useCallback } from 'react';

import { OrderType } from '@hertzflow/sdk-v2/types/orders';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { dateFormat } from '@repo/lib/format';
import {
  Button,
  LoaderCircleIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';

import type { Order } from '@/common';
import MarketIsClosedTooltip from '@/components/MarketIsClosedTooltip';
import { useOrderTypeText } from '@/hooks/useOrderText';
import InstSm from '../../components/InstSm';
import Size from '../../components/Size';
import ExecutionDistance from '../components/ExecutionDistance';
import TriggerPrice from '../components/TriggerPrice';
import { useOpenOrdersStore } from '../store';
import type { UseMutateAsyncFunction } from '@tanstack/react-query';

interface OrderItemProps {
  order: Order;
  isInactive: boolean;
  onCancelOrders: UseMutateAsyncFunction<void, Error, Order[], unknown>;
  onEditPrice: (orderId: string) => void;
}

const OrderItem: FC<OrderItemProps> = ({
  order,
  isInactive,
  onCancelOrders,
  onEditPrice,
}) => {
  const { t } = useLingui();
  const {
    marketAddress,
    sizeDeltaUsd,
    triggerPrice,
    triggerAboveThreshold,
    isLong,
    id: orderId,
    timestamp,
    isMarket,
    orderType,
    isLimit,
    isTp,
    isSl,
  } = order;
  const [
    isProcessingAll,
    isStoreProcessing,
    isAnyProcessing,
    setProcessingItemId,
  ] = useOpenOrdersStore(
    useShallow((state) => [
      state.isProcessingAll,
      state.processingItemId === orderId,
      state.processingItemId !== null,
      state.setProcessingItemId,
    ]),
  );
  // const coins = useInstStore((state) => state.getCoins());
  // const insts = useInstStore((state) => state.getInsts());

  // const collateralTokenMarkPx = usePriceTickerStream(
  //   `${coins[collateralTokenAddress]?.symbol}/USD`,
  // ).data[0]?.p;
  // const collateralTokenPx =
  //   insts[instId]?.indexTokenAddress === collateralTokenAddress
  //     ? triggerPrice
  //     : collateralTokenMarkPx;

  // const leverage = calc(size)
  //   .div(calc(collateralAmount).times(collateralTokenPx || ''))
  //   .toFixed();
  const orderTypeText = useOrderTypeText(orderType);
  const orderTypeNode = isInactive ? (
    <Tooltip>
      <TooltipTrigger className="decoration-t-350 cursor-pointer underline decoration-dotted underline-offset-2">
        {orderTypeText}
      </TooltipTrigger>
      <TooltipContent className="max-w-70">
        {t`Activates on your next trade and may close your position on entry. Cancel if unintended.`}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span>{orderTypeText}</span>
  );

  // Use ref to keep function reference stable
  const orderRef = useRef(order);
  const onCancelOrdersRef = useRef(onCancelOrders);
  orderRef.current = order;
  onCancelOrdersRef.current = onCancelOrders;

  // Local ref to track if this specific item is processing
  const isProcessingRef = useRef(false);

  const handleCancel = useCallback(async () => {
    // Prevent duplicate clicks using local ref
    if (isProcessingRef.current || isProcessingAll || isAnyProcessing) return;

    isProcessingRef.current = true;
    setProcessingItemId(orderId);

    try {
      await onCancelOrdersRef.current([orderRef.current]);
    } finally {
      isProcessingRef.current = false;
      setProcessingItemId(null);
    }
  }, [isProcessingAll, isAnyProcessing, setProcessingItemId, orderId]);

  const isThisItemProcessing = isStoreProcessing || isProcessingRef.current;
  const isDisabled = isThisItemProcessing || isProcessingAll || isAnyProcessing;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex justify-between">
        <InstSm
          marketAddress={marketAddress}
          isLong={isLong}
          // lever={leverage}
          orderType={
            <span className="flex items-center gap-1">
              {orderTypeNode}
              {isInactive ? (
                <span className="bg-warning/10 text-warning inline-flex h-4 items-center rounded-sm px-2 text-[10px] leading-none">
                  {t`Inactive`}
                </span>
              ) : null}
            </span>
          }
        />
      </div>
      <div className="scrollbar-none grid grid-cols-[3fr_2fr_2fr] gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Size`}</span>
          <Size size={sizeDeltaUsd} closeOrderCount={0} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Price`}</span>
          <TriggerPrice
            marketAddress={marketAddress}
            isLong={isLong}
            isZFP={order.isZFP}
            isSl={orderType === OrderType.StopLossDecrease}
            price={triggerPrice}
            isMarket={isMarket}
            triggerPriceAboveAllowed={triggerAboveThreshold}
            editOrderId={orderId}
            onEditPrice={onEditPrice}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-right text-xs">{t`Execution Distance`}</span>
          <ExecutionDistance
            marketAddress={marketAddress}
            triggerPrice={triggerPrice}
            isLong={isLong}
            isLimit={isLimit}
            isTp={isTp}
            isSl={isSl}
          />
        </div>
      </div>

      <div className="text-t-270 flex justify-between text-xs">
        <span>{t`Time`}</span>
        <span>{dateFormat(timestamp, 'yyyy/MM/dd HH:mm:ss')}</span>
      </div>
      <MarketIsClosedTooltip marketAddress={marketAddress}>
        <Button
          className="bg-bg-5 hover:bg-bg-5/90 h-[36px] w-full text-xs"
          disabled={isDisabled}
          onClick={handleCancel}
        >
          {isThisItemProcessing ? (
            <>
              <LoaderCircleIcon size={16} className="animate-spin" />
              {t`Cancelling`}
            </>
          ) : (
            t`Cancel`
          )}
        </Button>
      </MarketIsClosedTooltip>
    </div>
  );
};

export default OrderItem;
