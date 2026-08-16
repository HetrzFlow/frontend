import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, NumberInput } from '@repo/ui';
import {
  usePriceTickerStream,
  useInstStore,
  type Position,
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  useMarketConfigs,
  useMarketValues,
  usePositionConstants,
} from '@/common';
import {
  limitPriceValidator,
  slPxValidator,
  tpPxValidator,
} from '@/common/validators';
import InputValidationTooltip from '@/components/InputValidationTooltip';

import { HYPER_SL_LOSS_CEIL, MARKET_PX } from '@/constants/trade';
import { useMaxProfitRate } from '@/hooks/useMarketsStats';
import { calcPositionFees } from '@/lib/trade/formulas';
import { useOrder, useSizeEditCtx } from './context';

const PriceInput: FC<{
  className?: string;
  value: string;
  onChange: (value: string) => void;
  position?: Position;
}> = ({ className, value, onChange, position }) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const {
    isLong,
    marketAddress,
    isLimit,
    isTpSl,
    initialCollateralTokenAddress,
    isTp,
    isSl,
  } = useOrder();
  const { sizeEditable } = useSizeEditCtx();
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const inst = insts[marketAddress];
  const maxProfitRate = useMaxProfitRate(inst);
  const collateralToken = coins[initialCollateralTokenAddress];
  const indexTokenDecimals = inst?.indexTokenAddress
    ? coins[inst.indexTokenAddress]?.decimals
    : undefined;
  const markPx =
    usePriceTickerStream(inst?.symbol, { throttleWait: 5000 }).data[0]?.p ?? '';
  const collateralTokenPx = usePriceTickerStream(
    getCreditAwareUsdPriceSymbol({
      isCreditMarket: inst?.category === CREDIT_MARKET_CATEGORY,
      tokenSymbol: collateralToken?.symbol,
    }),
    {
      throttleWait: 5000,
    },
  ).data[0]?.p;

  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();

  const allFeeUsd = useMemo(() => {
    if (!position) {
      return '0';
    }

    const { borrowFee, fundingFee, totalPriceImpact, closeFee } =
      calcPositionFees({
        position,
        collateralTokenPx,
        indexTokenPx: markPx,
        indexTokenDecimals,
        marketConfigs,
        marketValues,
        isZFP: position?.isZFP,
      });
    return calc(borrowFee)
      .plus(fundingFee)
      .plus(closeFee)
      .minus(totalPriceImpact)
      .toFixed();
  }, [
    position,
    collateralTokenPx,
    markPx,
    marketConfigs,
    marketValues,
    indexTokenDecimals,
  ]);

  const [message, adjustedValue] = useMemo(() => {
    let _message;
    let _adjustedValue: string | undefined = undefined;
    if (isLimit) {
      _message = limitPriceValidator({
        isLong,
        px: value,
        symbol: inst?.symbol ?? '',
        markPx: markPx,
      });
      _adjustedValue = markPx;
    }
    if (isTp) {
      const result = tpPxValidator({
        tpPx: value,
        symbol: inst?.symbol ?? '',
        px: MARKET_PX,
        pxDispDecimal: inst?.pxDispDecimal,
        isLong,
        hasPosition: !!position,
        nextSizeUsd: position?.sizeInUsd,
        nextCollateralUsd:
          position?.collateralAmount && collateralTokenPx
            ? calc(position?.collateralAmount)
                .times(collateralTokenPx)
                .toFixed()
            : '',
        allFeeUsd,
        nextEntryPx: position?.entryPrice,
        displayPosition: 'input',
        markPx,
        maxProfitRate,
      });
      _message = result.message;
      _adjustedValue = result.adjustedValue;
    }
    if (isSl) {
      const result = slPxValidator({
        slPx: value,
        symbol: inst?.symbol ?? '',
        px: MARKET_PX,
        pxDispDecimal: inst?.pxDispDecimal,
        isLong,
        position,
        nextSizeUsd: position?.sizeInUsd,
        nextCollateralUsd:
          position?.collateralAmount && collateralTokenPx
            ? calc(position?.collateralAmount)
                .times(collateralTokenPx)
                .toFixed()
            : '',
        allFeeUsd,
        nextEntryPx: position?.entryPrice,
        displayPosition: 'input',
        markPx,
        collateralTokenPx,
        marketConfigs,
        marketValues,
        minCollateralUsd: positionConstants?.minCollateralUsd,
        indexTokenDecimals,
        hyperSlLossCeil: position?.isZFP ? HYPER_SL_LOSS_CEIL : undefined,
      });
      _message = result.message;
      _adjustedValue = result.adjustedValue;
    }

    return [_message, _adjustedValue];
  }, [
    allFeeUsd,
    collateralTokenPx,
    inst?.pxDispDecimal,
    inst?.symbol,
    isLimit,
    isLong,
    isSl,
    isTp,
    markPx,
    maxProfitRate,
    position,
    indexTokenDecimals,
    value,
    marketConfigs,
    marketValues,
    positionConstants?.minCollateralUsd,
  ]);

  const hasError = !!message;

  return (
    <InputValidationTooltip
      className={className}
      triggerClassName="font-plex invisible absolute top-13 left-5 text-2xl font-medium"
      triggerValue={truncateFormat(value, inst?.pxDispDecimal, {
        stripTrailingZeros: true,
      })}
      hasError={hasError}
      message={message}
      onMessageClick={() => {
        if (adjustedValue) {
          onChange(adjustedValue);
        }
      }}
      tooltipContentProps={{
        inDialog: true,
        side: 'top',
        sideOffset: 0,
      }}
    >
      {({ onBlur, onFocus }) => (
        <NumberInput
          className={cn(
            'bg-bg-4 mt-2 p-4',
            hasError
              ? 'border-destructive focus-within:border-destructive'
              : '',
          )}
          variant="ghost"
          label={
            <div className="text-secondary-foreground flex w-full items-center text-sm">
              <span>
                {sizeEditable && isTp
                  ? t`Take Profit Price`
                  : sizeEditable && isSl
                    ? t`Stop Loss Price`
                    : isTpSl
                      ? t`Trigger Price`
                      : t`Price`}
              </span>
              <span className="ml-auto">
                {t`Mark`}:{' '}
                <span
                  className="text-t-1100 cursor-pointer"
                  onClick={() => onChange(markPx ?? '')}
                >
                  {truncateFormat(markPx ?? '', inst?.pxDispDecimal, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </span>
              </span>
            </div>
          }
          inputWrapClassName="h-[40px]"
          inputClassName="font-plex text-2xl h-[28px]"
          labelClassName="text-muted-foreground text-sm font-normal"
          suffix={
            <div className="flex items-center gap-2 text-2xl font-medium">
              {'USD'}
            </div>
          }
          value={value}
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
