import { FC, useCallback, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { cn } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  getPositionByInstFromCache,
  useCurrentAccountAddress,
  useHzSdk,
  useInstStore,
  useMarketConfigs,
  useMarketValues,
  usePositionConstants,
} from '@/common';
import { HYPER_SL_LOSS_CEIL, MAX_LOSS_RATE } from '@/constants/trade';
import { useMaxProfitRate } from '@/hooks/useMarketsStats';
import {
  getCachedMarketExecutionPrice,
  getCachedPriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import {
  calcCapTpPxAndSlPxOfPosition,
  calcLiqPxByPosition,
} from '@/lib/trade/formulas';
import Price from '../../components/Price';

interface PriceProps {
  marketAddress: string;
  isLong: boolean;
  isZFP?: boolean;
  price: string;
  triggerPriceAboveAllowed?: boolean;
  isMarket?: boolean;
  className?: string;
  isSl?: boolean;
  editOrderId?: string;
  onEditPrice?: (id: string) => void;
}

const StopLossTriggerPrice: FC<PriceProps> = ({
  marketAddress,
  isLong,
  isZFP,
  price,
  triggerPriceAboveAllowed,
  isMarket,
  className,
  editOrderId,
  onEditPrice,
}) => {
  const { t } = useLingui();
  const accountAddress = useCurrentAccountAddress();
  const hzSdk = useHzSdk();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const inst = insts[marketAddress];
  const maxProfitRate = useMaxProfitRate(inst);
  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();

  const slInValidText = useMemo(() => {
    const position = getPositionByInstFromCache({
      chainId: hzSdk?.chainId,
      marketAddress,
      isLong,
      isZFP,
      address: accountAddress,
    })[0];
    if (!position) {
      return '';
    }

    const indexTokenPx = getCachedMarketExecutionPrice({
      symbol: insts[marketAddress]?.symbol,
      indexTokenAddress: insts[marketAddress]?.indexTokenAddress,
      isIncrease: false,
      isLong,
    });
    const collateralToken = coins[position.collateralTokenAddress];
    const collateralTokenPx = getCachedPriceTickerExecutionPrice(
      getCreditAwareUsdPriceSymbol({
        isCreditMarket:
          position.isCreditMarket ||
          insts[marketAddress]?.category === CREDIT_MARKET_CATEGORY,
        tokenSymbol: collateralToken?.symbol,
      }),
      { isIncrease: false, isLong, priceType: 'min' },
    );

    const { slCapPx, slFloorPx } = calcCapTpPxAndSlPxOfPosition({
      position,
      maxProfitRate: maxProfitRate,
      maxLossRate: MAX_LOSS_RATE,
      minLossRate: HYPER_SL_LOSS_CEIL,
      collateralTokenPx: collateralTokenPx,
      indexTokenPx: indexTokenPx,
      indexTokenDecimals: insts[marketAddress]?.indexTokenAddress
        ? coins[insts[marketAddress]!.indexTokenAddress]?.decimals
        : undefined,
      marketConfigs,
      marketValues,
    });
    const liqPx = calcLiqPxByPosition({
      position,
      collateralTokenPx,
      indexTokenPx,
      indexTokenDecimals: insts[marketAddress]?.indexTokenAddress
        ? coins[insts[marketAddress]!.indexTokenAddress]?.decimals
        : undefined,
      marketConfigs,
      marketValues,
      minCollateralUsd: positionConstants?.minCollateralUsd,
    });
    let slInValidText = '';
    if (price) {
      if (
        (isLong && calc(price).lt(liqPx)) ||
        (!isLong && calc(price).gt(liqPx))
      ) {
        slInValidText = t`Invalid Stop Loss: Set SL Price is worse than Liq Price.`;
      } else if (
        (isLong && calc(price).lt(slCapPx)) ||
        (!isLong && calc(price).gt(slCapPx))
      ) {
        slInValidText = t`Invalid Stop Loss: Set SL Price is worse than the SL Price capped at -80% PnL%.`;
      } else if (
        slFloorPx !== undefined &&
        ((isLong && calc(price).gt(slFloorPx)) ||
          (!isLong && calc(price).lt(slFloorPx)))
      ) {
        slInValidText = t`Invalid Stop Loss: Set SL Price is beyond the SL Price capped at -30% PnL%.`;
      }
    }

    return slInValidText;
  }, [
    isLong,
    isZFP,
    marketConfigs,
    marketValues,
    positionConstants?.minCollateralUsd,
    accountAddress,
    coins,
    hzSdk?.chainId,
    insts,
    marketAddress,
    maxProfitRate,
    price,
    t,
  ]);
  const handleEdit = useCallback(() => {
    if (editOrderId) {
      onEditPrice?.(editOrderId);
    }
  }, [editOrderId, onEditPrice]);

  return (
    <Price
      isMarket={isMarket}
      className={cn(className, slInValidText ? 'text-destructive' : '')}
      marketAddress={marketAddress}
      price={price}
      triggerPriceAboveAllowed={triggerPriceAboveAllowed}
      onEdit={handleEdit}
      tooltipContent={slInValidText}
    />
  );
};

const TriggerPrice: FC<PriceProps> = ({
  isSl,
  className,
  isMarket,
  marketAddress,
  isZFP,
  editOrderId,
  onEditPrice,
  price,
  triggerPriceAboveAllowed,
  ...restProps
}) => {
  const handleEdit = useCallback(() => {
    if (editOrderId) {
      onEditPrice?.(editOrderId);
    }
  }, [editOrderId, onEditPrice]);

  if (!isSl) {
    return (
      <Price
        isMarket={isMarket}
        className={className}
        marketAddress={marketAddress}
        price={price}
        triggerPriceAboveAllowed={triggerPriceAboveAllowed}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <StopLossTriggerPrice
      {...restProps}
      className={className}
      isMarket={isMarket}
      isSl={isSl}
      marketAddress={marketAddress}
      isZFP={isZFP}
      editOrderId={editOrderId}
      onEditPrice={onEditPrice}
      price={price}
      triggerPriceAboveAllowed={triggerPriceAboveAllowed}
    />
  );
};

export default TriggerPrice;
