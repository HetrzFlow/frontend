import { FC, useEffect } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { useFormContext, UseFormReturn, useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { closePosFeeDoc } from '@repo/common/constants';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import {
  Checkbox,
  cn,
  CreditIcon,
  InfoCircleIcon,
  Label,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
} from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
  getCreditAwareUsdPriceSymbol,
  useInstStore,
  useGlobalStore,
  useHydrated,
  useMarketConfigs,
} from '@/common';
import ListItem from '@/components/ListItem';
import { ReferralDiscountBadge } from '@/components/ReferralDiscount';
import BasicSlippage from '@/components/Slippage';
import { ORDER_TYPE } from '@/constants/enum';
import { useCreditTokenBalance } from '@/containers/credit/hooks';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';
import { useMarketMaxLeverage } from '@/hooks/useMarketsStats';
import { useReferralDiscountRate } from '@/hooks/useReferralDiscount';
import { getEffectiveReferralDiscountUsd } from '@/lib/credit/creditReferral';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import { usePreferenceStore } from '@/stores/trade/preference';
import HyperProfitShareDescription from '../../../components/HyperProfitShareDescription';
import { usePosition } from '../../context';
import { useClosePosSizeAndFees } from './hooks/closePositionSizeAndFees';
import { useFormChangeAction } from './hooks/useFormAction';

interface HelpfulInfoProps {
  orderType: ORDER_TYPE;
}

const HelpfulInfo: FC<HelpfulInfoProps> = ({ orderType }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const {
    marketAddress,
    entryPrice: entryPrice,
    sizeInUsd: curSize,
    collateralAmount: curCollateralAmount,
    collateralTokenAddress,
    isLong,
  } = usePosition();
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const inst = insts[marketAddress];
  const { data: marketConfig } = useMarketConfigs(inst);
  const maxNormalLeverage = useMarketMaxLeverage(inst);
  const form = useFormContext();
  const position = usePosition();
  const { onKeepLeverageChange } = useFormChangeAction({
    form: form as unknown as UseFormReturn<{
      orderType: ORDER_TYPE;
      px: string;
      size: string;
      receiveCoinType: string;
    }>,
    position,
  });

  const collateralCoinType = isLong
    ? inst?.longTokenAddress
    : inst?.shortTokenAddress;

  const pxDispDecimal = inst?.pxDispDecimal;

  const px = useWatch({ name: 'px' });
  const size = useWatch({ name: 'size' }) || 0;
  const receiveCoinType = useWatch({ name: 'receiveCoinType' });
  const keepLeverageFromStore = usePreferenceStore(
    (state) => state.keepLeverage,
  );
  const isZFP = position.isZFP;

  const marketPx = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: false,
    isLong,
  });

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
  const collateralInUsd = calc(curCollateralAmount).times(
    collateralTokenPx || '',
  );
  const currentLeverageForMaxCheck = collateralInUsd.isZero()
    ? calc(0)
    : calc(curSize).div(collateralInUsd);
  const maxLeverage = maxNormalLeverage;
  const isKeepLeverageDisabledByMaxLeverage =
    !isZFP && !!maxLeverage && currentLeverageForMaxCheck.gt(maxLeverage);
  const keepLeverage = isKeepLeverageDisabledByMaxLeverage
    ? false
    : isZFP
      ? true
      : keepLeverageFromStore;

  useEffect(() => {
    if (isKeepLeverageDisabledByMaxLeverage && keepLeverageFromStore) {
      onKeepLeverageChange(false);
    }
  }, [
    isKeepLeverageDisabledByMaxLeverage,
    keepLeverageFromStore,
    onKeepLeverageChange,
  ]);

  const { data } = useClosePosSizeAndFees(collateralCoinType, receiveCoinType);
  const closeEstimatePx =
    orderType === ORDER_TYPE.market ? data?.closePx || marketPx : px;
  const priceImapct = data?.priceImpact;
  const priceImpactLt0 = calc(priceImapct || 0).lt(0);

  const closeFee = data?.closeFee || 0;
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();
  // In Hyper mode, close fee is 0 but borrow/funding fees still apply
  const effectiveCloseFee = isZFP ? '0' : closeFee;
  const isFullClose = calc(size).gte(curSize);
  const isKeepLeverageDisabled =
    isFullClose || isZFP || isKeepLeverageDisabledByMaxLeverage;
  const isKeepLeverageChecked =
    !isFullClose && !isKeepLeverageDisabledByMaxLeverage && keepLeverage;

  const {
    curLeverage,
    curLiqPx,
    curBorrowFee,
    curFundingFee,
    curCollateralUsd,
    nextLeverage: nextLeverage,
    nextCollateralUsd: nextCollateralUsd,
    nextSize,
    nextLiqPx,
  } = useCalcFinalPosition({
    inst,
    isLong,
    deltaSize: calc(size).times(-1).toFixed(),
    deltaCollateralAmount:
      keepLeverage || isFullClose
        ? calc(curCollateralAmount).times(size).times(-1).div(curSize).toFixed()
        : '0',
    collateralTokenAddress: collateralTokenAddress,
    px: px,
    position,
  });

  // PnL matching PnL.tsx "PnL After Fee" formula:
  // netPnl = grossPnl(markPx) - borrowFee - fundingFee - closeFee + priceImpact
  const grossPnl = calc(curSize)
    .div(entryPrice)
    .times(closeEstimatePx)
    .minus(curSize)
    .times(isLong ? 1 : -1);
  const curPnl = grossPnl;
  const curPnlPct = collateralInUsd.isZero()
    ? calc(0)
    : curPnl.div(collateralInUsd);

  const nextGrossPnl = isFullClose
    ? calc(0)
    : calc(nextSize)
        .div(entryPrice)
        .times(closeEstimatePx)
        .minus(nextSize)
        .times(isLong ? 1 : -1);
  // Accrued fees (borrow/funding) are fully settled on close, so remaining position has none
  const nextPnl = isFullClose ? calc(0) : nextGrossPnl;
  const nextCollateralInUsd = isFullClose ? calc(0) : calc(nextCollateralUsd);
  const nextPnlPct =
    isFullClose || nextCollateralInUsd.isZero()
      ? calc(0)
      : nextPnl.div(nextCollateralInUsd);

  const fees = calc(effectiveCloseFee)
    .plus(curBorrowFee)
    .plus(curFundingFee)
    .minus(priceImpactLt0 ? priceImapct || 0 : 0); // networkFeeUsdValue.plus(
  const feeDiscountUsd = getEffectiveReferralDiscountUsd({
    isCreditMarket: !!position.isCreditMarket,
    feeUsd: closeFee,
    referralDiscountRate,
  });
  const hasFeeDiscount = calc(feeDiscountUsd).gt(0);
  const discountedCloseFee = calc(effectiveCloseFee).minus(feeDiscountUsd);
  const discountedFees = calc(discountedCloseFee)
    .plus(curBorrowFee)
    .plus(curFundingFee)
    .minus(priceImpactLt0 ? priceImapct || 0 : 0);
  const { data: creditTokenBalance } = useCreditTokenBalance();
  const showNormalMarketCreditFeeTooltip =
    !isZFP && !position.isCreditMarket && (creditTokenBalance ?? 0n) > 0n;
  const showCreditMarketFeeTooltip = !isZFP && position.isCreditMarket;
  const showCreditFeeTooltip =
    showNormalMarketCreditFeeTooltip || showCreditMarketFeeTooltip;
  const pendingLossRebateUsd = calc(position.pendingLossRebateUsd || 0);
  const lossRebateRate = marketConfig?.lossRebateRate
    ? percentFormat(
        calc(marketConfig.lossRebateRate.toString()).div(
          CONTRACT_USD_MULTIPLIER,
        ),
        0,
      )
    : '';

  const collateralDeltaRatio = curCollateralUsd.lte(0)
    ? calc(0)
    : calc
        .max(calc(curCollateralUsd).minus(nextCollateralInUsd), 0)
        .div(curCollateralUsd);
  const collateralProratedPendingLossRebateUsd =
    pendingLossRebateUsd.times(collateralDeltaRatio);
  const marketCloseLossRebateUsd = calc.min(
    calc.max(calc(curPnl).times(-1), 0),
    collateralProratedPendingLossRebateUsd,
  );
  const lossRebateFmtOpts = {
    style: 'currency' as const,
    currency: 'USD',
    showMinDecimalValue: true,
  };
  const lossRebateDisplay =
    orderType === ORDER_TYPE.market
      ? truncateFormat(
          marketCloseLossRebateUsd,
          usdAmountDisplayDecimal,
          lossRebateFmtOpts,
        )
      : collateralProratedPendingLossRebateUsd.gt(0)
        ? `≤ ${truncateFormat(
            collateralProratedPendingLossRebateUsd,
            usdAmountDisplayDecimal,
            lossRebateFmtOpts,
          )}`
        : truncateFormat(0, usdAmountDisplayDecimal, lossRebateFmtOpts);

  const dispFees = truncateFormat(
    calc(discountedFees).times(-1),
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
      showNegativeZero: true,
    },
  );
  const feeLabelText = showCreditFeeTooltip ? (
    <Tooltip>
      <TooltipTrigger className="decoration-t-430 underline decoration-dotted underline-offset-3">
        {t`Fees`}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        inDialog
        container={document.querySelector('.closePosDialog')}
        collisionBoundary={document.querySelector('.closePosDialog')}
        collisionPadding={16}
      >
        {showCreditMarketFeeTooltip
          ? t`Fee is paid by Credit(1 Credit = 1 USDT).`
          : t`Auto-accrued into your Accumulated Fee Rebate.`}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span>{t`Fees`}</span>
  );

  const isHydrated = useHydrated();

  if (!isHydrated) return;

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex items-center gap-2">
        <Label
          className={cn(
            'text-t-1100 hover:text-t-270 flex cursor-pointer gap-2 text-sm hover:transition-[color]',
            isFullClose || isKeepLeverageDisabledByMaxLeverage
              ? 'text-t-270 cursor-not-allowed'
              : '',
          )}
        >
          <Checkbox
            className="m-0.5 size-4 rounded-full"
            disabled={isKeepLeverageDisabled}
            checked={isKeepLeverageChecked}
            onCheckedChange={(checked) => {
              onKeepLeverageChange(checked as boolean);
            }}
          />
          {t`Keep Leverage`}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoCircleIcon
              size={14}
              className="text-t-350 hover:text-t-1100 mt-px cursor-pointer"
            />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="w-[260px]"
            inDialog
            container={document.querySelector('.closePosDialog')}
            collisionBoundary={document.querySelector('.closePosDialog')}
            collisionPadding={16}
          >
            {isKeepLeverageDisabledByMaxLeverage ? (
              t`Keep Leverage is disabled because the current leverage is above the market maximum.`
            ) : isZFP ? (
              t`Keep Leverage: Always enabled in Hyper mode`
            ) : (
              <Trans>
                When enabled, leverage stays the same and collateral is released
                proportionally.
                <br />
                When disabled, only position size is reduced, collateral
                unchanged.
              </Trans>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
      {/* leverage */}
      {!keepLeverage && !isFullClose && (
        <>
          <ListItem
            label={t`Leverage`}
            value={
              calc(nextLeverage).gt(0) ? (
                <>
                  <span className="text-t-270">
                    {truncateFormat(curLeverage, leverDecimal, {
                      stripTrailingZeros: true,
                      round: ROUND_MODE.ROUND,
                    })}
                    x{' → '}
                  </span>
                  {truncateFormat(nextLeverage, leverDecimal, {
                    stripTrailingZeros: true,
                    round: ROUND_MODE.ROUND,
                  })}
                  x
                </>
              ) : (
                `${truncateFormat(curLeverage, leverDecimal, { stripTrailingZeros: true, round: ROUND_MODE.ROUND })}x`
              )
            }
          />
        </>
      )}
      {/* position size */}
      <ListItem
        label={t`Size`}
        value={
          size ? (
            <>
              <span className="text-t-270">
                {truncateFormat(curSize, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
                {' → '}
              </span>
              {truncateFormat(nextSize, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </>
          ) : (
            truncateFormat(curSize, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
            })
          )
        }
      />
      {/* collateral usd */}
      <ListItem
        label={t`Collateral`}
        value={
          size && !curCollateralUsd.eq(nextCollateralInUsd) ? (
            <>
              <span className="text-t-270 inline-flex items-center gap-1">
                {truncateFormat(curCollateralUsd, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
                {' → '}
              </span>
              <span className="inline-flex items-center gap-1">
                {truncateFormat(nextCollateralInUsd, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
                {position.isCreditMarket ? (
                  <CreditIcon size={12} className="text-accent" />
                ) : null}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1">
              {truncateFormat(curCollateralUsd, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
              {position.isCreditMarket ? (
                <CreditIcon size={12} className="text-accent" />
              ) : null}
            </span>
          )
        }
      />
      {/* PnL */}
      <ListItem
        label={
          <Tooltip>
            <TooltipTrigger className="decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-3">
              {t`PnL`}
            </TooltipTrigger>
            <TooltipContent
              side="top"
              inDialog
              container={document.querySelector('.closePosDialog')}
              className="w-max"
              collisionBoundary={document.querySelector('.closePosDialog')}
              collisionPadding={16}
            >
              {t`Calculated as a percentage of collateral`}
            </TooltipContent>
          </Tooltip>
        }
        value={
          size ? (
            <>
              <span className="text-t-270">
                {`${truncateFormat(curPnl, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: 'always',
                })} (${percentFormat(curPnlPct, 2, { signDisplay: 'always' })})`}
                {' → '}
              </span>
              {`${truncateFormat(nextPnl, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
                signDisplay: 'always',
              })} (${percentFormat(nextPnlPct, 2, { signDisplay: 'always' })})`}
            </>
          ) : (
            `${truncateFormat(curPnl, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            })} (${percentFormat(curPnlPct, 2, { signDisplay: 'always' })})`
          )
        }
      />
      <ListItem
        label={t`Liq. Price`}
        value={
          size ? (
            <>
              <span className="text-t-270">
                {truncateFormat(
                  calc(curLiqPx).lte(0) ? '' : curLiqPx,
                  pxDispDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                  },
                )}
                {' → '}
              </span>
              {truncateFormat(
                calc(nextLiqPx).lte(0) ? '' : nextLiqPx,
                pxDispDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            </>
          ) : (
            <>
              {truncateFormat(
                calc(curLiqPx).lte(0) ? '' : curLiqPx,
                pxDispDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            </>
          )
        }
      />
      {!isZFP && !position.isCreditMarket && (
        <ListItem
          label={
            <span className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger className="decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-3">
                  {t`Loss Rebate`}
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="w-60"
                  inDialog
                  container={document.querySelector('.closePosDialog')}
                  collisionBoundary={document.querySelector('.closePosDialog')}
                  collisionPadding={16}
                >
                  {t`Loss Rebate is determined at execution, based on post-trade OI skew, and remains fixed for the position's lifetime.`}
                </TooltipContent>
              </Tooltip>
              <span className="text-loss-rebate flex items-center gap-0.5">
                <VerifiedIcon size={12} />
                {lossRebateRate ? lossRebateRate : ''}
              </span>
            </span>
          }
          value={<span>{lossRebateDisplay}</span>}
        />
      )}
      {/* slippage */}
      {orderType === ORDER_TYPE.market && (
        <BasicSlippage
          inDialog
          container={document.querySelector('.closePosDialog')}
          collisionBoundary={document.querySelector('.closePosDialog')}
          collisionPadding={16}
        />
      )}
      <Separator />
      <ListItem
        label={t`Mark Price`}
        value={truncateFormat(marketPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      <ListItem
        label={t`Entry Price`}
        value={truncateFormat(entryPrice, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      <Separator />
      <ListItem
        label={
          <span className="flex items-center gap-1">
            {hasFeeDiscount && !isZFP && !position.isCreditMarket ? (
              <span className="flex items-center gap-1">
                {feeLabelText}
                <ReferralDiscountBadge discountRate={referralDiscountRate} />
              </span>
            ) : (
              feeLabelText
            )}
          </span>
        }
        labelClassName="h-4 flex items-center"
        value={
          <>
            {isZFP && (
              <span className="text-hyper-lev mr-1">{t`0 Close Fee`}</span>
            )}
            {hasFeeDiscount && !isZFP && !position.isCreditMarket && (
              <span className="text-t-430 mr-1 line-through">
                {truncateFormat(calc(fees).times(-1), usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: 'always',
                  showNegativeZero: true,
                })}
              </span>
            )}
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  'decoration-t-430 decoration-dotted underline-offset-3',
                  dispFees === EMPTY_DISPLAY
                    ? 'cursor-auto no-underline'
                    : 'underline',
                  hasFeeDiscount && !isZFP && !position.isCreditMarket
                    ? 'text-accent'
                    : '',
                )}
              >
                {dispFees}
              </TooltipTrigger>
              {dispFees !== EMPTY_DISPLAY && (
                <TooltipContent
                  side="left"
                  className="flex w-[224px] flex-col gap-0.5"
                  inDialog
                  container={document.querySelector('.closePosDialog')}
                  collisionBoundary={document.querySelector('.closePosDialog')}
                  collisionPadding={16}
                >
                  <>
                    <ListItem
                      label={`${t`Close Fee`}:`}
                      value={truncateFormat(
                        calc(
                          hasFeeDiscount && !isZFP && !position.isCreditMarket
                            ? discountedCloseFee
                            : effectiveCloseFee,
                        ).times(-1),
                        usdAmountDisplayDecimal,
                        {
                          style: 'currency',
                          currency: 'USD',
                          showNegativeZero: true,
                        },
                      )}
                    />
                    <ListItem
                      label={`${t`Borrow Fee Due`}:`}
                      value={truncateFormat(
                        calc(curBorrowFee).times(-1),
                        usdAmountDisplayDecimal,
                        {
                          style: 'currency',
                          currency: 'USD',
                          showNegativeZero: true,
                        },
                      )}
                    />
                    <ListItem
                      label={`${t`Funding Fee Due`}:`}
                      value={truncateFormat(
                        calc(curFundingFee).times(-1),
                        usdAmountDisplayDecimal,
                        {
                          style: 'currency',
                          currency: 'USD',
                          showNegativeZero: true,
                        },
                      )}
                    />
                    {priceImpactLt0 && (
                      <ListItem
                        label={`${t`Price Impact`}:`}
                        value={truncateFormat(
                          calc(priceImapct || 0),
                          usdAmountDisplayDecimal,
                          {
                            style: 'currency',
                            currency: 'USD',
                            showNegativeZero: true,
                          },
                        )}
                      />
                    )}
                    {isZFP && (
                      <>
                        <Separator className="my-1" />
                        <span className="text-t-270 text-left">
                          <HyperProfitShareDescription />
                        </span>
                      </>
                    )}
                    <span className="text-left">
                      <a
                        className="text-accent underline underline-offset-2"
                        href={closePosFeeDoc || 'https://'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t`Read more`}
                      </a>
                    </span>
                  </>
                </TooltipContent>
              )}
            </Tooltip>
          </>
        }
      />
    </div>
  );
};

export default HelpfulInfo;
