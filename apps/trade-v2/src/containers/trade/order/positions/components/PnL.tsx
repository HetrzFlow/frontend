import { FC, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import {
  cn,
  Separator,
  ShareIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import {
  useInstStore,
  useGlobalStore,
  useMarketConfigs,
  useMarketValues,
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
} from '@/common';

import ListItem from '@/components/ListItem';
import { useReferralDiscountRate } from '@/hooks/useReferralDiscount';
import { getEffectiveReferralDiscountUsd } from '@/lib/credit/creditReferral';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import { calcPositionFees } from '@/lib/trade/formulas';

import HyperProfitShareDescription from '../../components/HyperProfitShareDescription';

interface PnLProps {
  instId?: string;
  marketAddress?: string;
  size: string;
  collateralAmount: string;
  collateralTokenAddress: string;
  entryPrice: string;
  isLong: boolean;
  pendingBorrowingFeesUsd: string;
  pendingImpactAmount: string;
  fundingFeeAmount: string;
  isHyper?: boolean;
  pendingLossRebateUsd?: string;
  onOpenShareDialog?: () => void;
}

const PnL: FC<PnLProps> = ({
  instId,
  marketAddress,
  size,
  entryPrice,
  collateralAmount,
  collateralTokenAddress,
  isLong,
  pendingBorrowingFeesUsd,
  pendingImpactAmount,
  fundingFeeAmount,
  isHyper,
  // pendingLossRebateUsd,
  onOpenShareDialog,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const inst = insts[instId || marketAddress || ''];

  const marketPx = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: false,
    isLong,
  });

  const collateralTokenPx = usePriceTickerExecutionPrice({
    symbol: getCreditAwareUsdPriceSymbol({
      isCreditMarket: inst?.category === CREDIT_MARKET_CATEGORY,
      tokenSymbol: coins[collateralTokenAddress]?.symbol,
    }),
    isIncrease: false,
    isLong,
    priceType: 'min',
  });
  const collateralInUsd = calc(collateralAmount).times(collateralTokenPx || '');

  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();
  const {
    borrowFee: borrowFeeCalc,
    fundingFee,
    totalPriceImpact,
    closeFee,
  } = calcPositionFees({
    position: {
      sizeInUsd: size,
      isLong,
      pendingBorrowingFeesUsd,
      fundingFeeAmount,
      pendingImpactAmount,
    } as never,
    collateralTokenPx,
    indexTokenPx: marketPx,
    indexTokenDecimals: inst?.indexTokenAddress
      ? coins[inst.indexTokenAddress]?.decimals
      : undefined,
    marketConfigs,
    marketValues,
    isZFP: isHyper,
  });
  const feeDiscountUsd = getEffectiveReferralDiscountUsd({
    isCreditMarket,
    feeUsd: closeFee.toFixed(),
    referralDiscountRate,
  });
  const discountedCloseFee = calc(closeFee).minus(feeDiscountUsd);

  // net PnL = ((Size / entry price)*mark price  - Size) * (isLong ? 1 : -1) - Borrow Fee - Close Fee
  // net value = Collateral + PnL
  const [pnl, pnlPercent] = useMemo(() => {
    if (!marketPx) {
      return ['', '', '0'];
    }

    const _pnl = calc(size)
      .div(entryPrice)
      .times(marketPx)
      .minus(size)
      .times(isLong ? 1 : -1);
    return [_pnl, _pnl.div(collateralInUsd)];
  }, [size, entryPrice, collateralInUsd, marketPx, isLong]);

  const netPnl = calc(pnl)
    .minus(borrowFeeCalc)
    .minus(fundingFee)
    .minus(discountedCloseFee)
    .plus(totalPriceImpact);

  const isPositive = calc(pnl).gt(0);
  const isNegtive = calc(pnl).lt(0);

  return (
    <div className="font-plex flex flex-col justify-between gap-0.5 leading-tight">
      <div className="flex gap-1">
        <Tooltip>
          <div className="flex gap-1">
            <TooltipTrigger
              className={cn(
                'decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-2 max-md:text-2xl max-md:font-medium',
              )}
            >
              {truncateFormat(
                calc(netPnl).plus(collateralInUsd),
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            </TooltipTrigger>
            <ShareIcon
              size={14}
              className="text-t-430 hover:text-t-1100 cursor-pointer max-md:hidden"
              onClick={(e) => {
                e.stopPropagation();
                // share dialog
                if (onOpenShareDialog) {
                  onOpenShareDialog();
                }
              }}
            />
          </div>
          <TooltipContent side="top" className="w-62">
            <p>
              {isHyper ? (
                <HyperProfitShareDescription />
              ) : (
                t`Net Value = Collateral + Net PnL After Fees`
              )}
            </p>
            <Separator className="my-2" />
            <div className="flex flex-col gap-1">
              <ListItem
                label={t`Collateral`}
                value={truncateFormat(
                  collateralInUsd,
                  usdAmountDisplayDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                  },
                )}
              />
              <ListItem
                label={t`Gross PnL`}
                valueClassName={calc(pnl).lt(0) ? 'text-down' : 'text-up'}
                value={truncateFormat(pnl, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: 'always',
                })}
              />
              <div className="bg-bg-5 mt-1 flex flex-col gap-1 rounded-lg p-2">
                <ListItem
                  label={t`Borrow Fee Due`}
                  value={truncateFormat(
                    calc(borrowFeeCalc).times(-1),
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'always',
                      showNegativeZero: true,
                    },
                  )}
                />
                <ListItem
                  label={t`Funding Fee Due`}
                  value={truncateFormat(
                    calc(fundingFee).times(-1),
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'always',
                      showNegativeZero: true,
                    },
                  )}
                />
                {/* {!isHyper &&
                pendingLossRebateUsd &&
                calc(pendingLossRebateUsd).gt(0) && (
                  <ListItem
                    label={t`Loss Rebate`}
                    value={`≤ ${truncateFormat(
                      pendingLossRebateUsd,
                      usdAmountDisplayDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                        signDisplay: 'always',
                      },
                    )}`}
                  />
                )} */}
                <ListItem
                  label={t`Price Impact`}
                  value={truncateFormat(
                    calc(totalPriceImpact),
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'always',
                      showNegativeZero: true,
                    },
                  )}
                />

                {!isHyper && (
                  <ListItem
                    label={t`Close Fee`}
                    labelClassName="flex items-center"
                    value={truncateFormat(
                      calc(discountedCloseFee).times(-1),
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

              <Separator className="my-1" />
              <ListItem
                label={t`PnL After Fee`}
                valueClassName={calc(netPnl).lt(0) ? 'text-down' : 'text-up'}
                value={truncateFormat(netPnl, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: 'always',
                })}
              />
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <div
        className={cn(
          'text-xs',
          isNegtive ? 'text-down' : '',
          isPositive ? 'text-up' : '',
        )}
      >
        {`${truncateFormat(pnl, usdAmountDisplayDecimal, {
          signDisplay: 'always',
          style: 'currency',
          currency: 'USD',
        })} (${percentFormat(pnlPercent, 2, { signDisplay: 'always' })})`}
      </div>
    </div>
  );
};

export default PnL;
