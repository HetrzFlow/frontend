import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY_SHORT, truncateFormat } from '@repo/lib/format';
import {
  cn,
  NumberInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  useHzSdk,
  useInstStore,
  useOpenOrders,
} from '@/common';
import { slPxValidator, tpPxValidator } from '@/common/validators';
import {
  HYPER_SL_LOSS_CEIL,
  MARKET_PX,
  MAX_LOSS_RATE,
} from '@/constants/trade';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';
import { useMaxProfitRate } from '@/hooks/useMarketsStats';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import { findFirstLimitIncreaseOrder } from '@/lib/trade/order';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePositionSizeAndFees } from '../../../positionSizeAndFees';
import { useIsZFP } from '../hooks/useIsZFP';
import { isTpSlValueSet } from '../tpSlUtils';

interface InputGroupProps {
  isTp: boolean;
  isLong: boolean;
  value: string;
  isPending?: boolean;
  onChange: (value: string) => void;
  onPnlPercentChange?: (pnlPercent: string) => void;
}

const InputGroup: FC<InputGroupProps> = ({
  isTp,
  isPending,
  isLong,
  value,
  onChange,
  onPnlPercentChange,
}) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const hzSdk = useHzSdk();
  const curInputTypeRef = useRef<'px' | 'pnlPercent'>('px');
  const valueRef = useRef(value);
  valueRef.current = value;
  const [pnl, setPnl] = useState('');
  const [pnlPercentInputValue, setPnlPercentInputValue] = useState('');
  const pnlPercentInputValueRef = useRef(pnlPercentInputValue);
  pnlPercentInputValueRef.current = pnlPercentInputValue;

  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInsts()[instId]);
  const isZFP = useIsZFP();
  const maxProfitRate = useMaxProfitRate(inst);
  const coins = useInstStore((state) => state.getCoins());
  const collateralTokenAddress = isLong
    ? inst?.longTokenAddress
    : inst?.shortTokenAddress;
  const symbol = inst?.symbol ?? '';
  const collateralToken = coins[collateralTokenAddress || ''];
  const displayTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress,
  });
  const displayToken = coins[displayTokenAddress || ''] || collateralToken;
  const collateralTokenPx = usePriceTickerExecutionPrice({
    symbol: getCreditAwareUsdPriceSymbol({
      isCreditMarket: inst?.category === CREDIT_MARKET_CATEGORY,
      tokenSymbol: collateralToken?.symbol,
    }),
    isIncrease: true,
    isLong,
    priceType: 'min',
    throttleWait: 5000,
  });
  const { data: orders } = useOpenOrders();
  const px = useWatch({ name: 'px' });

  const { data: feeData } = usePositionSizeAndFees(
    collateralTokenAddress,
    collateralTokenAddress,
    isZFP,
  );

  const {
    curEntryPx,
    nextEntryPx,
    nextSize,
    nextCollateralUsd,
    nextCloseFee,
    nextTotalPriceImpact,
    nextLiqPx,
  } = useCalcFinalPosition({
    inst,
    isLong,
    deltaSize: feeData?.size || '0',
    deltaCollateralAmount: feeData?.collateralAmount || '0',
    collateralTokenAddress: collateralTokenAddress || '',
    px,
    isZFP,
  });

  const updatePnlPercent = (tpSlPx: string) => {
    if (!isTpSlValueSet(tpSlPx)) {
      setPnlPercentInputValue('');
      setPnl('');
      onPnlPercentChange?.('');
      return;
    }

    const pnl =
      nextEntryPx &&
      tpSlPx &&
      nextCollateralUsd &&
      !calc(nextCollateralUsd).eq(0)
        ? calc(tpSlPx)
            .div(nextEntryPx)
            .minus(1)
            .times(isLong ? 1 : -1)
            .times(nextSize)
            .minus(nextCloseFee.minus(nextTotalPriceImpact))
            .toFixed()
        : '';

    const pnlPercent = pnl
      ? calc(pnl)
          .div(nextCollateralUsd)
          .times(isTp ? 1 : -1)
          .times(100)
          .toFixed()
      : '';

    const maxValue = isTp ? `${maxProfitRate * 100}` : `${MAX_LOSS_RATE * 100}`;
    const clampedPercent = pnlPercent
      ? calc(pnlPercent).minus(maxValue).abs().div(maxValue).lt(0.001)
        ? maxValue
        : pnlPercent
      : pnlPercent;
    setPnlPercentInputValue(clampedPercent);
    setPnl(pnl);
    onPnlPercentChange?.(clampedPercent);
  };

  const updatePx = (pnlPercentValue: string) => {
    if (!isTpSlValueSet(pnlPercentValue)) {
      setPnl('');
      onChange('');
      return;
    }

    const pnlValue = calc(pnlPercentValue)
      .div(100)
      .times(isTp ? 1 : -1)
      .times(nextCollateralUsd)
      .toFixed();
    setPnl(pnlValue);
    const tpPx =
      nextEntryPx && pnlPercentValue && !calc(nextSize).eq(0)
        ? calc(pnlValue)
            .plus(nextCloseFee.minus(nextTotalPriceImpact))
            .div(nextSize)
            .times(isLong ? 1 : -1)
            .plus(1)
            .times(nextEntryPx)
            .toFixed()
        : '';

    onChange(calc(tpPx).lt(0) ? '' : tpPx);
  };

  const handlePxInput = (inputValue: string) => {
    curInputTypeRef.current = 'px';
    onChange(inputValue);
  };

  const handlePnlPercentInput = (inputValue: string) => {
    curInputTypeRef.current = 'pnlPercent';
    setPnlPercentInputValue(inputValue);
    onPnlPercentChange?.(isTpSlValueSet(inputValue) ? inputValue : '');
    updatePx(inputValue === '-' ? '' : inputValue);
  };

  useEffect(() => {
    if (curInputTypeRef.current === 'px') {
      updatePnlPercent(valueRef.current);
    } else if (curInputTypeRef.current === 'pnlPercent') {
      updatePx(pnlPercentInputValueRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instId, feeData?.size, px]);

  useEffect(() => {
    if (curInputTypeRef.current === 'px') {
      updatePnlPercent(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const { message: tpSlPxErrorText, adjustedValue } = useMemo(() => {
    if (!isTpSlValueSet(value)) {
      return { message: undefined, adjustedValue: undefined };
    }

    const firstLimitOrder = findFirstLimitIncreaseOrder({
      orders: orders || [],
      isLong,
      marketAddress: inst?.marketTokenAddress || '',
      isZFP,
    });
    return isPending
      ? { message: undefined, adjustedValue: undefined }
      : isTp
        ? tpPxValidator({
            isLong,
            px: firstLimitOrder?.triggerPrice || MARKET_PX,
            symbol,
            hasPosition: !!curEntryPx,
            tpPx: value,
            nextEntryPx,
            nextSizeUsd: nextSize,
            allFeeUsd: nextCloseFee.minus(nextTotalPriceImpact).toFixed(),
            nextCollateralUsd,
            pxDispDecimal: inst?.pxDispDecimal,
            displayPosition: 'input',
            maxProfitRate,
          })
        : slPxValidator({
            isLong,
            px: firstLimitOrder?.triggerPrice || MARKET_PX,
            symbol,
            hasPosition: !!curEntryPx,
            slPx: value,
            nextEntryPx,
            nextSizeUsd: nextSize,
            allFeeUsd: nextCloseFee.minus(nextTotalPriceImpact).toFixed(),
            nextCollateralUsd,
            pxDispDecimal: inst?.pxDispDecimal,
            displayPosition: 'input',
            liqPx: nextLiqPx,
            hyperSlLossCeil: isZFP ? HYPER_SL_LOSS_CEIL : undefined,
          });
  }, [
    orders,
    isPending,
    isTp,
    isZFP,
    isLong,
    symbol,
    curEntryPx,
    value,
    nextEntryPx,
    nextSize,
    nextCloseFee,
    nextTotalPriceImpact,
    nextCollateralUsd,
    inst,
    nextLiqPx,
    maxProfitRate,
  ]);

  const pnlBN = calc(pnl);
  const pnlIsValid = !pnlBN.isNaN() && isTpSlValueSet(value);

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const focusInputRef = useRef(false);
  const hoverInputRef = useRef(false);

  const priceIsNegtive = Number(pnlPercentInputValue) && !value;
  const priceIsNagtiveText = isTp ? t`Invalid TP Price` : t`Invalid SL Price`;
  const tooltipContainerRef = useRef(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span>{isTp ? t`Take Profit` : t`Stop Loss`}</span>
        <span
          className={
            pnlBN.gt(0)
              ? 'text-up'
              : pnlBN.lt(0)
                ? 'text-down'
                : isTp
                  ? 'text-up'
                  : 'text-down'
          }
        >
          {pnlIsValid
            ? `${truncateFormat(
                pnlBN.div(collateralTokenPx || ''),
                displayToken?.szDispDecimal,
                {
                  signDisplay: 'always',
                },
              )} ${displayToken?.symbol || ''}`
            : EMPTY_DISPLAY_SHORT}
        </span>
      </div>
      <div
        className="font-plex mt-1 flex justify-between gap-2"
        ref={tooltipContainerRef}
      >
        <Tooltip open={(!!tpSlPxErrorText || !!priceIsNegtive) && tooltipOpen}>
          <TooltipTrigger className="w-[calc(50%+12px)] shrink-0 grow-0">
            <NumberInput
              className={cn(
                'px-3 py-1',
                tpSlPxErrorText || priceIsNegtive
                  ? 'border-destructive focus-within:border-destructive'
                  : '',
              )}
              variant="ghost"
              value={value}
              maxLength={30}
              max={10 ** 10}
              inputClassName="text-xs"
              suffix={isTp ? t`TP Price` : t`SL Price`}
              onValueChange={handlePxInput}
              prefix="$"
              decimal={inst?.pxDispDecimal}
              locale={locale}
              prefixClassname="text-t-270 pr-2"
              suffixClassName="text-t-430 pl-2"
              onBlur={() => {
                setTooltipOpen(false);
                focusInputRef.current = false;
              }}
              onFocus={() => {
                setTooltipOpen(true);
                focusInputRef.current = true;
              }}
              onMouseEnter={() => {
                setTooltipOpen(true);
                hoverInputRef.current = true;
              }}
              onMouseLeave={() => {
                hoverInputRef.current = false;
                setTimeout(() => {
                  if (!focusInputRef.current && !hoverInputRef.current) {
                    setTooltipOpen(false);
                  }
                }, 300);
              }}
            />
          </TooltipTrigger>
          <TooltipContent
            container={tooltipContainerRef.current}
            side="top"
            sideOffset={0}
            className={cn(
              'mx-2 flex cursor-pointer items-center',
              tpSlPxErrorText || priceIsNegtive ? '' : 'hidden',
            )}
            collisionBoundary={
              typeof window !== 'undefined'
                ? document.querySelector('.tradingContainer')
                : undefined
            }
            onClick={() => {
              handlePxInput(adjustedValue ?? '');
            }}
            onMouseEnter={() => (hoverInputRef.current = true)}
            onMouseLeave={() => {
              hoverInputRef.current = false;
              setTimeout(() => {
                if (!focusInputRef.current && !hoverInputRef.current) {
                  setTooltipOpen(false);
                }
              }, 300);
            }}
          >
            {priceIsNegtive ? priceIsNagtiveText : tpSlPxErrorText}
          </TooltipContent>
        </Tooltip>
        <NumberInput
          className="w-[calc(50%-20px)] shrink-0 grow-0 px-3 py-1"
          inputClassName="text-right text-xs"
          variant="ghost"
          maxLength={30}
          min={-Infinity}
          max={isTp ? maxProfitRate * 100 : MAX_LOSS_RATE * 100}
          value={pnlPercentInputValue}
          prefix={isTp ? t`Gain` : t`Loss`}
          suffix="%"
          decimal={2}
          locale={locale}
          prefixClassname="text-t-430 text-xs pr-2"
          suffixClassName="text-t-270 pl-2"
          onValueChange={handlePnlPercentInput}
        />
      </div>
    </div>
  );
};

export default InputGroup;
