import { memo, useEffect, useMemo, useRef } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { dwCollateralFeeDoc } from '@repo/common/constants';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import {
  Alert,
  AlertDescription,
  cn,
  CreditIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
} from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
  useGlobalStore,
  useMarketConfigs,
  usePriceTickerStream,
  useInstStore,
  useOpenOrders,
} from '@/common';
import ListItem from '@/components/ListItem';
import {
  HYPER_SL_LOSS_CEIL,
  MARKET_PX,
  MAX_LOSS_RATE,
} from '@/constants/trade';
import { useCreditTokenBalance } from '@/containers/credit/hooks';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';
import { useMaxProfitRate } from '@/hooks/useMarketsStats';
import { calcCapSlPx, calcCapTpPx } from '@/lib/trade/formulas';
import { findFirstTriggerTpAndSlOrder } from '@/lib/trade/order';
import { usePosition } from '../../context';
import { TYPE } from './enum';

const HelpfulInfo = () => {
  const { t } = useLingui();

  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const position = usePosition();
  const isZFP = position.isZFP;
  const {
    sizeInUsd: prevSz,
    collateralTokenAddress,
    marketAddress,
    isLong,
  } = position;
  const [insts] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const inst = insts[marketAddress];
  const maxProfitRate = useMaxProfitRate(inst);
  const { data: orders } = useOpenOrders();
  const indexTokenPx =
    usePriceTickerStream(inst?.symbol, {
      throttleWait: 5000,
    }).data[0]?.p ?? '';

  const form = useFormContext();
  const type = useWatch({ name: 'type' });
  const size = useWatch({ name: 'size' });
  const isDeposit = type === TYPE.deposit;

  const {
    curLiqPx,
    curLeverage,
    curBorrowFee,
    curFundingFee,
    curCollateralUsd,
    nextLeverage,
    nextLiqPx,
    nextCollateralUsd,
    nextEntryPx,
    nextCloseFee,
    nextSize,
  } = useCalcFinalPosition({
    inst,
    isLong,
    deltaSize: '0',
    deltaCollateralAmount: isDeposit ? size : calc(size).times(-1).toFixed(),
    collateralTokenAddress,
    px: MARKET_PX,
    position,
  });

  const {
    tpPriceIsWorse,
    finalTpPrice,
    tpPxThreshold,
    tpPriceIsInvalid,
    slPriceIsInvalid,
    slPriceIsWorseLiqPrice,
    slPriceIsWorseCapPrice,
    slPriceIsWorseFloorPrice,
    tpOrderTriggerPrice,
    slOrderTriggerPrice,
  } = useMemo(() => {
    const { tpOrder, slOrder } = findFirstTriggerTpAndSlOrder({
      isLong,
      marketAddress: marketAddress,
      orders: orders || [],
      isZFP,
    });

    // For withdraw: check if TP/SL prices become invalid
    // When withdrawing, SL cap range expands, so existing SL should still be valid
    // But TP might become invalid if it exceeds the new cap
    if (!isDeposit) {
      // Calculate thresholds based on new collateral
      const tpPxThreshold = calcCapTpPx({
        collateralUsd: nextCollateralUsd,
        sizeUsd: nextSize,
        maxProfitRate: maxProfitRate,
        allFeeUsd: nextCloseFee,
        entryPx: nextEntryPx || '',
        isLong,
      });

      const slPxThreshold = calcCapSlPx({
        collateralUsd: nextCollateralUsd,
        sizeUsd: nextSize,
        maxLossRate: MAX_LOSS_RATE,
        allFeeUsd: nextCloseFee,
        entryPx: nextEntryPx || '',
        isLong,
      });

      const tpPriceIsWorse =
        (isLong && calc(tpOrder?.triggerPrice || '').gt(tpPxThreshold)) ||
        (!isLong && calc(tpOrder?.triggerPrice || '').lt(tpPxThreshold));
      const finalTpPrice = tpPriceIsWorse
        ? tpPxThreshold
        : tpOrder?.triggerPrice || '';
      const tpPriceIsInvalid =
        (isLong && calc(finalTpPrice).lt(indexTokenPx)) ||
        (!isLong && calc(finalTpPrice).gt(indexTokenPx));
      const slPriceIsWorseLiqPrice =
        (isLong && calc(slOrder?.triggerPrice || '').lt(nextLiqPx)) ||
        (!isLong && calc(slOrder?.triggerPrice || '').gt(nextLiqPx));
      const slPriceIsWorseCapPrice =
        (isLong && calc(slOrder?.triggerPrice || '').lt(slPxThreshold)) ||
        (!isLong && calc(slOrder?.triggerPrice || '').gt(slPxThreshold));

      const slPriceIsInvalid = slPriceIsWorseLiqPrice || slPriceIsWorseCapPrice;

      return {
        tpPriceIsWorse,
        finalTpPrice,
        tpPxThreshold,
        tpPriceIsInvalid,
        slPriceIsInvalid,
        slPriceIsWorseLiqPrice,
        slPriceIsWorseCapPrice,
        slPriceIsWorseFloorPrice: false,
        tpOrderTriggerPrice: tpOrder?.triggerPrice || '',
        slOrderTriggerPrice: slOrder?.triggerPrice || '',
      };
    }

    // Hyper mode: calculate SL Price Ceil (-30%)
    const slPxCeil = calcCapSlPx({
      collateralUsd: nextCollateralUsd,
      sizeUsd: nextSize,
      maxLossRate: HYPER_SL_LOSS_CEIL,
      allFeeUsd: nextCloseFee,
      entryPx: nextEntryPx || '',
      isLong,
    });
    // For deposit (hyper mode): check if SL price is outside the allowed range [-80%, -30%]
    // When depositing, SL cap range shrinks, so existing SL might fall outside the new range
    // Long: original SL > -30% cap (too close to entry)
    // Short: original SL < -30% cap
    const slPriceIsWorseFloorPrice =
      isZFP && slOrder?.triggerPrice
        ? isLong
          ? calc(slOrder.triggerPrice).gt(slPxCeil)
          : calc(slOrder.triggerPrice).lt(slPxCeil)
        : false;

    return {
      tpPriceIsWorse: false,
      finalTpPrice: '',
      tpPriceIsInvalid: false,
      slPriceIsInvalid: slPriceIsWorseFloorPrice,
      slPriceIsWorseLiqPrice: false,
      slPriceIsWorseCapPrice: false,
      slPriceIsWorseFloorPrice,
      tpOrderTriggerPrice: tpOrder?.triggerPrice || '',
      slOrderTriggerPrice: slOrder?.triggerPrice || '',
    };
  }, [
    isDeposit,
    isZFP,
    marketAddress,
    maxProfitRate,
    orders,
    indexTokenPx,
    isLong,
    nextCloseFee,
    nextCollateralUsd,
    nextEntryPx,
    nextSize,
    nextLiqPx,
  ]);

  useEffect(() => {
    if (tpPriceIsWorse && tpPxThreshold) {
      form.setValue('tpPx', tpPxThreshold.toFixed());
    } else {
      form.setValue('tpPx', '');
    }
  }, [tpPriceIsWorse, form, tpPxThreshold]);

  const pxDispDecimal = inst?.pxDispDecimal;

  const dispFees = truncateFormat(
    calc(curFundingFee).plus(curBorrowFee).times(-1),
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
      showNegativeZero: true,
    },
  );
  const { data: creditTokenBalance } = useCreditTokenBalance();
  const containerRef = useRef(null);
  const showNormalMarketCreditFeeTooltip =
    !isZFP && !position.isCreditMarket && (creditTokenBalance ?? 0n) > 0n;
  const showCreditMarketFeeTooltip = !isZFP && position.isCreditMarket;
  const showCreditFeeTooltip =
    showNormalMarketCreditFeeTooltip || showCreditMarketFeeTooltip;
  const feeLabelText = showCreditFeeTooltip ? (
    <Tooltip>
      <TooltipTrigger className="decoration-t-430 underline decoration-dotted underline-offset-3">
        {t`Fees`}
      </TooltipTrigger>
      <TooltipContent side="top" inDialog container={containerRef.current}>
        {showCreditMarketFeeTooltip
          ? t`Fee is paid by Credit(1 Credit = 1 USDT).`
          : t`Auto-accrued into your Accumulated Fee Rebate.`}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span>{t`Fees`}</span>
  );
  const { data: marketConfig } = useMarketConfigs(inst);
  const lossRebateRate = marketConfig?.lossRebateRate
    ? percentFormat(
        calc(marketConfig.lossRebateRate.toString()).div(
          CONTRACT_USD_MULTIPLIER,
        ),
        0,
      )
    : '';
  const currentPendingLossRebateUsd = calc(position.pendingLossRebateUsd || 0);
  const nextPendingLossRebateUsd = useMemo(() => {
    if (isZFP) return calc(0);
    if (isDeposit) return currentPendingLossRebateUsd;
    if (currentPendingLossRebateUsd.lte(0) || calc(curCollateralUsd).lte(0)) {
      return calc(0);
    }

    return calc.max(
      0,
      currentPendingLossRebateUsd
        .times(nextCollateralUsd)
        .div(curCollateralUsd),
    );
  }, [
    isZFP,
    isDeposit,
    currentPendingLossRebateUsd,
    curCollateralUsd,
    nextCollateralUsd,
  ]);
  return (
    <div className="flex flex-col gap-2 text-xs" ref={containerRef}>
      {/* position size */}
      <ListItem
        label={t`Size`}
        value={truncateFormat(prevSz, usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      {/* collateral */}
      <ListItem
        label={t`Collateral`}
        value={
          size ? (
            <>
              <span className="text-t-270 inline-flex items-center gap-1">
                {truncateFormat(curCollateralUsd, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
                {' → '}
              </span>
              <span className="inline-flex items-center gap-1">
                {truncateFormat(nextCollateralUsd, usdAmountDisplayDecimal, {
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
      {/* leverage */}
      <ListItem
        label={t`Leverage`}
        value={
          size ? (
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
            `${truncateFormat(curLeverage, leverDecimal, {
              stripTrailingZeros: true,
              round: ROUND_MODE.ROUND,
            })}x`
          )
        }
      />
      {/* liq price */}
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
            truncateFormat(
              calc(curLiqPx).lte(0) ? '' : curLiqPx,
              pxDispDecimal,
              {
                style: 'currency',
                currency: 'USD',
              },
            )
          )
        }
      />
      {/* tp price */}
      {tpPriceIsWorse && (
        <ListItem
          label={t`TP Price`}
          valueClassName={tpPriceIsInvalid ? 'text-warning' : ''}
          value={
            <Tooltip>
              <TooltipTrigger className="decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-2">
                <span className="text-t-270">
                  {truncateFormat(tpOrderTriggerPrice, pxDispDecimal, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                  {' → '}
                </span>
                {truncateFormat(finalTpPrice, pxDispDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
              </TooltipTrigger>
              <TooltipContent side="left" className="w-80">
                {t`TP Price will be updated to reflect the following cap: Gain% (all positions) ≤ +2500% for LP protection.`}
              </TooltipContent>
            </Tooltip>
          }
        />
      )}
      {/* sl price */}
      {slPriceIsInvalid && (
        <ListItem
          label={t`SL Price`}
          valueClassName={slPriceIsInvalid ? 'text-warning' : ''}
          value={truncateFormat(slOrderTriggerPrice, pxDispDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        />
      )}
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
                  container={document.querySelector('.editCollateralDialog')}
                  collisionBoundary={document.querySelector(
                    '.editCollateralDialog',
                  )}
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
          value={
            !isDeposit && size ? (
              <>
                <span className="text-t-270">
                  {truncateFormat(
                    currentPendingLossRebateUsd,
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      showMinDecimalValue: true,
                    },
                  )}
                  {' → '}
                </span>
                {truncateFormat(
                  nextPendingLossRebateUsd,
                  usdAmountDisplayDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                    showMinDecimalValue: true,
                  },
                )}
              </>
            ) : (
              truncateFormat(
                currentPendingLossRebateUsd,
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                  showMinDecimalValue: true,
                },
              )
            )
          }
        />
      )}
      <ListItem
        label={<span className="flex items-center gap-1">{feeLabelText}</span>}
        value={
          <Tooltip>
            <TooltipTrigger
              className={cn(
                'decoration-t-430 text-right decoration-dotted underline-offset-3',
                dispFees === EMPTY_DISPLAY
                  ? 'cursor-auto no-underline'
                  : 'underline',
              )}
            >
              {dispFees}
            </TooltipTrigger>
            {dispFees !== EMPTY_DISPLAY && (
              <TooltipContent
                side="left"
                className="flex w-[224px] flex-col gap-0.5"
                inDialog
                container={containerRef.current}
              >
                <>
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
                  <span className="text-left">
                    <a
                      className="text-accent underline underline-offset-2"
                      href={dwCollateralFeeDoc || 'https://'}
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
        }
      />
      <Alert open={tpPriceIsInvalid || slPriceIsInvalid} showClose={false}>
        <AlertDescription>
          {tpPriceIsInvalid && (
            <span>{t`New Max TP Price is worse than market price. Reducing collateral may trigger IMMEDIATE TAKE PROFIT order execution.`}</span>
          )}
          {slPriceIsWorseLiqPrice ? (
            <span>{t`Set SL Price is worse than Liq. price. Reducing collateral may result in INVALID STOP LOSS order.`}</span>
          ) : slPriceIsWorseCapPrice ? (
            <span>{t`Set SL Price is worse than new SL Price capped at -80% PnL%. Reducing collateral may result in INVALID STOP LOSS order.`}</span>
          ) : slPriceIsWorseFloorPrice ? (
            <span>{t`Set SL Price is beyond new SL Price capped at -30% PnL%. Adding collateral may result in INVALID STOP LOSS order.`}</span>
          ) : (
            ''
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default memo(HelpfulInfo);
