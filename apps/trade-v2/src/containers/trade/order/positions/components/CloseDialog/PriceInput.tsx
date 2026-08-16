import { FC, useEffect, useMemo, useRef } from 'react';

import { useLingui } from '@lingui/react/macro';

import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, NumberInput } from '@repo/ui';
import {
  useInstStore,
  tpPxValidator,
  slPxValidator,
  useMarketConfigs,
  useMarketValues,
  usePositionConstants,
  getCreditAwareUsdPriceSymbol,
} from '@/common';
import InputValidationTooltip from '@/components/InputValidationTooltip';

import { ORDER_TYPE } from '@/constants/enum';
import { HYPER_SL_LOSS_CEIL, MARKET_PX } from '@/constants/trade';
import { useMaxProfitRate } from '@/hooks/useMarketsStats';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import { calcPositionFees } from '@/lib/trade/formulas';
import { usePosition } from '../../context';

const PriceInput: FC<{
  className?: string;
  orderType: ORDER_TYPE;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, orderType, value, onChange }) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const position = usePosition();
  const {
    isLong,
    marketAddress,
    entryPrice,
    sizeInUsd,
    collateralAmount,
    collateralTokenAddress,
  } = position;
  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInsts()[marketAddress], state.getCoins()]),
  );
  const maxProfitRate = useMaxProfitRate(inst);
  const collateralToken = coins[collateralTokenAddress];
  const collateralTokenPx = usePriceTickerExecutionPrice({
    symbol: getCreditAwareUsdPriceSymbol({
      isCreditMarket: position.isCreditMarket,
      tokenSymbol: collateralToken?.symbol,
    }),
    isIncrease: false,
    isLong,
    priceType: 'min',
    throttleWait: 5000,
  });

  const isMarket = orderType === ORDER_TYPE.market;
  const hasPriceValue = !!+value;
  const marketPx = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: false,
    isLong,
  });
  const isZFP = position.isZFP;
  const indexTokenDecimals = inst?.indexTokenAddress
    ? coins[inst.indexTokenAddress]?.decimals
    : undefined;

  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // handle orderType and px
  useEffect(() => {
    // delay to run, because react form hook is async exec
    if (isMarket && value !== MARKET_PX) {
      setTimeout(() => {
        onChangeRef.current(MARKET_PX);
      }, 0);
    }

    if (!isMarket && value === MARKET_PX) {
      setTimeout(() => {
        onChangeRef.current('');
      }, 0);
    }
  }, [isMarket, value]);

  // unmount reset price input value
  useEffect(() => {
    return () => {
      // async update
      setTimeout(() => {
        onChangeRef.current(MARKET_PX);
      }, 0);
    };
  }, []);

  // tpsl price validation
  const { message: priceValidateResult, adjustedValue } = useMemo(() => {
    if (!hasPriceValue) {
      return { message: '', adjustedValue: '' };
    }

    const isGtMarkPx = calc(value).gt(marketPx);
    const collateralUsd = calc(collateralTokenPx || '')
      .times(collateralAmount)
      .toFixed();
    const { borrowFee, fundingFee, totalPriceImpact, closeFee } =
      calcPositionFees({
        position,
        collateralTokenPx,
        indexTokenPx: marketPx,
        indexTokenDecimals,
        marketConfigs,
        marketValues,
        isZFP,
      });
    const allFeeUsd = calc(borrowFee)
      .plus(fundingFee)
      .plus(closeFee)
      .minus(totalPriceImpact)
      .toFixed();
    return (isLong && isGtMarkPx) || (!isLong && !isGtMarkPx)
      ? tpPxValidator({
          isLong,
          px: MARKET_PX,
          symbol: inst?.symbol ?? '',
          hasPosition: true,
          tpPx: value,
          nextEntryPx: entryPrice,
          nextSizeUsd: sizeInUsd,
          nextCollateralUsd: collateralUsd,
          allFeeUsd,
          pxDispDecimal: inst?.pxDispDecimal,
          markPx: marketPx,
          displayPosition: 'input',
          maxProfitRate,
        })
      : slPxValidator({
          isLong,
          px: MARKET_PX,
          symbol: inst?.symbol ?? '',
          position,
          slPx: value,
          nextEntryPx: entryPrice,
          nextSizeUsd: sizeInUsd,
          nextCollateralUsd: collateralUsd,
          pxDispDecimal: inst?.pxDispDecimal,
          allFeeUsd,
          markPx: marketPx,
          displayPosition: 'input',
          collateralTokenPx,
          marketConfigs,
          marketValues,
          minCollateralUsd: positionConstants?.minCollateralUsd,
          indexTokenDecimals,
          hyperSlLossCeil: isZFP ? HYPER_SL_LOSS_CEIL : undefined,
        });
  }, [
    collateralAmount,
    collateralTokenPx,
    entryPrice,
    inst?.pxDispDecimal,
    inst?.symbol,
    isLong,
    isZFP,
    marketConfigs,
    marketPx,
    marketValues,
    maxProfitRate,
    indexTokenDecimals,
    position,
    positionConstants?.minCollateralUsd,
    sizeInUsd,
    value,
    hasPriceValue,
  ]);

  // determine TP/SL direction label when price is entered
  const priceDirectionLabel = useMemo(() => {
    if (isMarket || !hasPriceValue || value === MARKET_PX || !marketPx)
      return null;
    const isGtMarkPx = calc(value).gt(marketPx);
    const pxDiff = calc(value).minus(marketPx);
    const isTp = (isLong && isGtMarkPx) || (!isLong && !isGtMarkPx);
    const pxDiffStr = truncateFormat(pxDiff, inst?.pxDispDecimal, {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always',
    });
    const orderTypeStr = isTp ? t`Take Profit` : t`Stop Loss`;
    const directionArrow = pxDiff.gte(0) ? '↑' : '↓';

    return (
      <div className="text-short text-t-350 flex items-center gap-2 text-xs">
        <span
          className={cn(
            'rounded-lg px-3 py-1',
            isTp ? 'text-up bg-up/10' : 'text-down bg-down/10',
          )}
        >
          {directionArrow} {orderTypeStr}
        </span>
        {t`Mark`} {pxDiffStr}
      </div>
    );
  }, [isMarket, hasPriceValue, value, marketPx, isLong, t, inst]);

  return (
    <InputValidationTooltip
      className={cn(
        'flex flex-col gap-2 transition-[height]',
        className,
        isMarket ? 'h-0' : priceDirectionLabel ? 'h-[129px]' : 'h-[103px]',
      )}
      triggerClassName="invisible absolute top-13 left-5 text-2xl font-medium"
      triggerValue={truncateFormat(value, inst?.pxDispDecimal, {
        stripTrailingZeros: true,
      })}
      hasError={!!priceValidateResult}
      message={priceValidateResult}
      onMessageClick={() => onChange(adjustedValue)}
      tooltipContentClassName="pointer-events-auto"
      tooltipContentProps={{
        inDialog: true,
        side: 'top',
        sideOffset: 0,
      }}
      tooltipContainer={document.body}
    >
      {({ onBlur, onFocus }) => (
        <NumberInput
          className={cn(
            'bg-bg-4 mt-2 h-full p-3',
            priceValidateResult
              ? 'border-destructive focus-within:border-destructive'
              : '',
          )}
          variant="ghost"
          label={
            <div className="text-secondary-foreground flex w-full items-center text-sm">
              <span>{t`Price`}</span>
              <span className="ml-auto">
                {t`Mark`}:{' '}
                <span
                  className="text-t-1100 cursor-pointer"
                  onClick={() => onChange(marketPx ?? '')}
                >
                  {truncateFormat(marketPx ?? '', inst?.pxDispDecimal, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </span>
              </span>
            </div>
          }
          inputWrapClassName="h-9"
          inputClassName="font-plex text-2xl h-[28px]"
          labelClassName="text-muted-foreground text-sm font-normal"
          suffix={
            <div className="flex items-center gap-2 text-2xl font-medium">
              {'USD'}
            </div>
          }
          extraClassName="mt-2"
          extra={priceDirectionLabel}
          disabled={isMarket}
          value={isMarket ? marketPx : value === MARKET_PX ? '' : value}
          onValueChange={onChange}
          decimal={inst?.pxDispDecimal}
          locale={locale}
          max={10 ** 10}
          placeholder={'0.00'}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      )}
    </InputValidationTooltip>
  );
};

export default PriceInput;
