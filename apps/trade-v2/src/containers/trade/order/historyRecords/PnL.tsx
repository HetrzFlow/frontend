'use client';

import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import {
  cn,
  Separator,
  ShareIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
} from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
  useGlobalStore,
  useInstStore,
  useMarketConfigs,
} from '@/common';
import ListItem from '@/components/ListItem';

import HyperProfitShareDescription from '../components/HyperProfitShareDescription';

interface PnLProps {
  isClose: boolean;
  isHyper?: boolean;
  initialCollateralAmount: string;
  collateralDeltaAmount: string;
  collateralTokenPx: string;
  sizeDeltaUsd: string;
  sizeInUsd: string;
  uncappedBasePnlUsd?: string;
  priceImpactUsd?: string;
  liquidationFee?: string;
  feesUsd?: string;
  feeDiscountUsd?: string;
  lossRebateUsd?: string;
  profitSharingUsd?: string;
  marketAddress?: string;
  onOpenShareDialog?: (pnl: string) => void;
}

interface HistoryPnlPercentParams {
  pnl: string;
  initialCollateralAmount: string;
  collateralTokenPx: string;
  sizeDeltaUsd: string;
  sizeInUsd: string;
}

interface HistoryPnlParams {
  isClose: boolean;
  uncappedBasePnlUsd?: string;
  priceImpactUsd?: string;
  liquidationFee?: string;
  feesUsd?: string;
  feeDiscountUsd?: string;
  lossRebateUsd?: string;
  profitSharingUsd?: string;
}

export const getHistoryPnl = ({
  isClose,
  uncappedBasePnlUsd,
  priceImpactUsd,
  liquidationFee,
  feesUsd,
  feeDiscountUsd,
  lossRebateUsd,
  profitSharingUsd,
}: HistoryPnlParams) => {
  if (!isClose || !uncappedBasePnlUsd) {
    return '';
  }

  const grossPnl = calc(uncappedBasePnlUsd);

  if (grossPnl.isNaN()) {
    return '';
  }

  const discountedFeesUsd = calc.max(
    calc(feesUsd || 0).minus(feeDiscountUsd || 0),
    0,
  );

  return grossPnl
    .plus(lossRebateUsd || 0)
    .minus(discountedFeesUsd)
    .plus(priceImpactUsd || 0)
    .minus(liquidationFee || 0)
    .minus(profitSharingUsd || 0)
    .toFixed();
};

export const getHistoryPnlPercent = ({
  pnl,
  initialCollateralAmount,
  collateralTokenPx,
  sizeDeltaUsd,
  sizeInUsd,
}: HistoryPnlPercentParams) => {
  const initialCollateralUsd = calc(initialCollateralAmount || 0)
    .abs()
    .times(collateralTokenPx || 0);
  const sizeDeltaUsdAbs = calc(sizeDeltaUsd || 0).abs();
  const positionSizeBeforeDecreaseUsd = calc(sizeInUsd || 0)
    .abs()
    .plus(sizeDeltaUsdAbs);

  if (!initialCollateralUsd.gt(0) || !positionSizeBeforeDecreaseUsd.gt(0)) {
    return '0';
  }

  const pnlPercentBasisUsd = initialCollateralUsd.times(
    sizeDeltaUsdAbs.div(positionSizeBeforeDecreaseUsd),
  );

  return pnlPercentBasisUsd.gt(0)
    ? calc(pnl || 0)
        .div(pnlPercentBasisUsd)
        .toFixed()
    : '0';
};

const PnL: FC<PnLProps> = ({
  isClose,
  isHyper,
  initialCollateralAmount,
  collateralDeltaAmount,
  collateralTokenPx,
  sizeDeltaUsd,
  sizeInUsd,
  uncappedBasePnlUsd,
  priceImpactUsd,
  liquidationFee,
  feesUsd,
  feeDiscountUsd,
  lossRebateUsd,
  marketAddress,
  profitSharingUsd,
  onOpenShareDialog,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const insts = useInstStore((state) => state.getInsts());
  const inst = marketAddress ? insts[marketAddress] : undefined;
  const { data: marketConfig } = useMarketConfigs(inst);

  const finalPnl = getHistoryPnl({
    isClose,
    uncappedBasePnlUsd,
    priceImpactUsd,
    liquidationFee,
    feesUsd,
    feeDiscountUsd,
    lossRebateUsd,
    profitSharingUsd,
  });

  if (!finalPnl) {
    return <span className="max-md:text-sm">{EMPTY_DISPLAY}</span>;
  }

  const grossPnl = calc(uncappedBasePnlUsd || 0);
  const collateralDeltaUsd = calc(collateralDeltaAmount || 0)
    .abs()
    .times(collateralTokenPx || 0);

  const grossPnlPercent = calc(
    getHistoryPnlPercent({
      pnl: grossPnl.toFixed(),
      initialCollateralAmount,
      collateralTokenPx,
      sizeDeltaUsd,
      sizeInUsd,
    }),
  );

  const totalFeesUsd = calc(feesUsd || 0);
  const discountedFeesUsd = calc.max(
    totalFeesUsd.minus(feeDiscountUsd || 0),
    0,
  );
  const priceImpact = priceImpactUsd ? calc(priceImpactUsd) : null;
  const liqFee = liquidationFee ? calc(liquidationFee) : null;

  const lossRebate = lossRebateUsd ? calc(lossRebateUsd) : null;
  const lossRebateRate = marketConfig?.lossRebateRate
    ? percentFormat(
        calc(marketConfig.lossRebateRate.toString()).div(
          CONTRACT_USD_MULTIPLIER,
        ),
        0,
      )
    : null;

  const netSettlementUsd = collateralDeltaUsd.plus(finalPnl);

  return (
    <Tooltip>
      <div className="flex gap-1">
        <TooltipTrigger
          className={cn(
            'decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-2 max-md:text-sm',
            calc(finalPnl).lt(0) ? 'text-down' : '',
            calc(finalPnl).gt(0) ? 'text-up' : '',
          )}
        >
          {`${truncateFormat(finalPnl, usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
            signDisplay: 'always',
          })} (${percentFormat(
            getHistoryPnlPercent({
              pnl: finalPnl,
              initialCollateralAmount,
              collateralTokenPx,
              sizeDeltaUsd,
              sizeInUsd,
            }),
            2,
            {
              signDisplay: 'always',
            },
          )})`}
        </TooltipTrigger>
        {isClose && onOpenShareDialog && (
          <ShareIcon
            size={14}
            className="text-t-430 hover:text-t-1100 cursor-pointer self-center max-md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              onOpenShareDialog(finalPnl);
            }}
          />
        )}
      </div>
      <TooltipContent side="top" className="w-65 px-2 py-2">
        {isHyper ? (
          <span>
            <HyperProfitShareDescription />
          </span>
        ) : (
          <div className="">
            <ListItem
              label={t`Collateral`}
              value={truncateFormat(
                collateralDeltaUsd,
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            />

            <div className="bg-bg-5 mt-2 flex flex-col gap-1 rounded-lg p-2">
              <ListItem
                label={t`Gross PnL`}
                value={
                  <span
                    className={
                      grossPnl.lt(0)
                        ? 'text-down'
                        : grossPnl.gt(0)
                          ? 'text-up'
                          : ''
                    }
                  >
                    {`${truncateFormat(grossPnl, usdAmountDisplayDecimal, {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'always',
                    })} (${percentFormat(grossPnlPercent, 2, {
                      signDisplay: 'always',
                    })})`}
                  </span>
                }
              />

              {lossRebate !== null && lossRebate.gt(0) && (
                <ListItem
                  label={
                    <span className="flex items-center gap-0.5">
                      <span>{t`Loss Rebate`}</span>
                      {lossRebateRate && (
                        <span className="text-loss-rebate flex items-center gap-0.5">
                          <VerifiedIcon size={12} />
                          {lossRebateRate}
                        </span>
                      )}
                    </span>
                  }
                  valueClassName="text-up"
                  value={truncateFormat(lossRebate, usdAmountDisplayDecimal, {
                    style: 'currency',
                    currency: 'USD',
                    signDisplay: 'always',
                  })}
                />
              )}

              {feesUsd !== undefined && (
                <ListItem
                  label={t`Fees`}
                  value={truncateFormat(
                    discountedFeesUsd.times(-1),
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'always',
                      showNegativeZero: true,
                    },
                  )}
                />
              )}

              {priceImpact !== null && (
                <ListItem
                  label={t`Price Impact`}
                  value={
                    <span>
                      {truncateFormat(priceImpact, usdAmountDisplayDecimal, {
                        style: 'currency',
                        currency: 'USD',
                        signDisplay: 'always',
                      })}
                    </span>
                  }
                />
              )}

              {liqFee !== null && liqFee.gt(0) && (
                <ListItem
                  label={t`Liquidation Fee`}
                  value={truncateFormat(
                    liqFee.times(-1),
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'always',
                      showNegativeZero: true,
                    },
                  )}
                />
              )}
            </div>

            <Separator className="my-2" />

            <ListItem
              label={t`Net Settlement`}
              value={truncateFormat(netSettlementUsd, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            />
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default PnL;
