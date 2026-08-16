import { FC, useCallback, useRef } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import { Button, cn, LoaderCircleIcon, PencilLineIcon, XIcon } from '@repo/ui';
import type { Order } from '@/common';
import { useGlobalStore } from '@/common';

import { useTpSlProcessingStore, useTpSlTablePosition } from './context';
import { useOrderEstimate } from './hooks/useOrderEstimate';

type DisplayUnit = '%' | '$' | '';

const SIGN_ALWAYS = { signDisplay: 'always' } as const;
const USD_FORMAT = { style: 'currency', currency: 'USD' } as const;

export const SizeCell: FC<{
  order: Order;
  displayUnit: DisplayUnit;
}> = ({ order, displayUnit }) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const position = useTpSlTablePosition();
  const sizeDeltaUsd = order.sizeDeltaUsd;
  const sizePct = calc(sizeDeltaUsd).div(position.sizeInUsd).toFixed();

  const dispText =
    displayUnit === ''
      ? `${truncateFormat(sizeDeltaUsd, usdAmountDisplayDecimal, USD_FORMAT)} (${percentFormat(sizePct, 2)})`
      : displayUnit === '%'
        ? percentFormat(sizePct, 2)
        : truncateFormat(sizeDeltaUsd, usdAmountDisplayDecimal, USD_FORMAT);

  return <span className="text-t-1100 max-md:text-sm">{dispText}</span>;
};

export const PriceCell: FC<{
  order: Order;
  pxDispDecimal?: number;
}> = ({ order, pxDispDecimal }) => {
  const prefix = order.triggerAboveThreshold ? '\u2265 ' : '\u2264 ';
  return (
    <span className="text-t-1100 max-md:text-sm">
      {prefix}
      {truncateFormat(order.triggerPrice, pxDispDecimal, USD_FORMAT)}
    </span>
  );
};

export const EstPnlCell: FC<{
  order: Order;
}> = ({ order }) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const { estPnl } = useOrderEstimate(order);

  const isPositive = calc(estPnl).gt(0);
  const isNegative = calc(estPnl).lt(0);

  return (
    <span
      className={cn(
        'max-md:text-sm',
        isPositive ? 'text-up' : isNegative ? 'text-down' : 'text-t-1100',
      )}
    >
      {truncateFormat(estPnl, usdAmountDisplayDecimal, {
        ...USD_FORMAT,
        ...SIGN_ALWAYS,
      })}
    </span>
  );
};

export const EstReceiveCell: FC<{
  order: Order;
}> = ({ order }) => {
  const {
    estReceive,
    collateralToken,
    collateralTokenPx,
    receiveToken,
    receiveTokenPx,
  } = useOrderEstimate(order);

  const token = receiveToken ?? collateralToken;
  const tokenPx = receiveTokenPx ?? collateralTokenPx;
  const receiveInToken =
    tokenPx && calc(tokenPx).gt(0)
      ? calc(estReceive).div(tokenPx).toFixed()
      : estReceive;

  return (
    <span className="text-t-1100 max-md:text-sm">
      {truncateFormat(
        receiveInToken,
        token?.szDispDecimal,
        SIGN_ALWAYS,
      )}{' '}
      {token?.symbol}
    </span>
  );
};

export const ActionsCell: FC<{
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}> = ({ order, onEdit, onDelete }) => {
  const [
    isProcessingAll,
    isThisProcessing,
    isAnyProcessing,
    setProcessingItemId,
  ] = useTpSlProcessingStore(
    useShallow((state) => [
      state.isProcessingAll,
      state.processingItemId === order.id,
      state.processingItemId !== null,
      state.setProcessingItemId,
    ]),
  );

  const isProcessingRef = useRef(false);
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;

  const handleDelete = useCallback(async () => {
    if (isProcessingRef.current || isProcessingAll || isAnyProcessing) return;
    isProcessingRef.current = true;
    setProcessingItemId(order.id);
    try {
      await onDeleteRef.current(order);
    } finally {
      isProcessingRef.current = false;
      setProcessingItemId(null);
    }
  }, [order, isProcessingAll, isAnyProcessing, setProcessingItemId]);

  const isBusy = isThisProcessing || isProcessingRef.current;
  const isDisabled = isBusy || isProcessingAll || isAnyProcessing;

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="text-t-1100 hover:text-t-1100 hover:bg-bg-3 size-5 rounded-sm"
        disabled={isDisabled}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(order);
        }}
      >
        <PencilLineIcon size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-t-1100 hover:text-t-1100 hover:bg-bg-3 size-5 rounded-sm"
        disabled={isDisabled}
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
      >
        {isBusy ? (
          <LoaderCircleIcon size={16} className="animate-spin" />
        ) : (
          <XIcon size={16} />
        )}
      </Button>
    </div>
  );
};
