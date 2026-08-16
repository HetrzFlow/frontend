'use client';

import { FC } from 'react';

import { calc } from '@repo/lib/calc';
import {
  usePositions,
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  useInstStore,
} from '@/common';
import ShareDialog from '@/containers/trade/order/components/ShareDialog';
import {
  getCachedMarketExecutionPrice,
  getCachedPriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';

import { useStableDialogValue } from './hooks/useStableDialogValue';

interface PositionShareDialogProps {
  positionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PositionShareDialog: FC<PositionShareDialogProps> = ({
  positionId,
  open,
  onOpenChange,
}) => {
  const { data: positions } = usePositions();
  const livePosition = positions?.find((v) => v.id === positionId);
  const position = useStableDialogValue(livePosition, {
    open,
    resetKey: positionId,
  });

  const {
    isLong = true,
    marketAddress = '',
    entryPrice = '',
    sizeInUsd,
    collateralAmount,
    collateralTokenAddress,
    isZFP,
  } = position || {};
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const inst = insts[marketAddress];

  const markPrice =
    getCachedMarketExecutionPrice({
      symbol: inst?.symbol,
      indexTokenAddress: inst?.indexTokenAddress,
      isIncrease: false,
      isLong,
    }) || '';
  const collateralTokenPx =
    getCachedPriceTickerExecutionPrice(
      getCreditAwareUsdPriceSymbol({
        isCreditMarket: inst?.category === CREDIT_MARKET_CATEGORY,
        tokenSymbol: coins[collateralTokenAddress || '']?.symbol,
      }),
      { isIncrease: false, isLong, priceType: 'min' },
    ) || '';
  const leverage = calc(sizeInUsd || '')
    .div(calc(collateralAmount || '').times(collateralTokenPx))
    .toFixed();

  if (!position) return null;

  return (
    <ShareDialog
      open={open}
      onOpenChange={onOpenChange}
      isLong={isLong}
      instName={inst?.name || ''}
      instNameInImage={inst?.name.replace('/', '-') || ''}
      leverage={leverage}
      pxDispDecimal={inst?.pxDispDecimal}
      entryPrice={entryPrice}
      markPrice={markPrice}
      isZFP={isZFP}
    />
  );
};

export default PositionShareDialog;
