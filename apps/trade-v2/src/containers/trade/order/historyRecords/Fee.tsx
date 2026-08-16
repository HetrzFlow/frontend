import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import {
  cn,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { useGlobalStore } from '@/common';
import ListItem from '@/components/ListItem';

import HyperProfitShareDescription from '../components/HyperProfitShareDescription';

const ZERO_FEE_ACTION_PREFIXES = [
  'created_',
  'updated_',
  'cancelled_',
  'failed_',
];

const FUNDING_BORROWING_FEE_ACTIONS = new Set([
  'market_open',
  'market_increase',
  'market_close',
  'market_decrease',
  'limit_open',
  'limit_increase',
  'limit_close',
  'limit_decrease',
  'tp_close',
  'tp_decrease',
  'sl_close',
  'sl_decrease',
  'deposit',
  'withdrawal',
]);

const PRICE_IMPACT_ACTIONS = new Set([
  'market_close',
  'market_decrease',
  'limit_close',
  'limit_decrease',
  'tp_close',
  'tp_decrease',
  'sl_close',
  'sl_decrease',
  'liquidated',
]);

const OPEN_FEE_ACTIONS = new Set([
  'market_open',
  'market_increase',
  'limit_open',
  'limit_increase',
]);

const CLOSE_FEE_ACTIONS = new Set([
  'market_close',
  'market_decrease',
  'limit_close',
  'limit_decrease',
  'tp_close',
  'tp_decrease',
  'sl_close',
  'sl_decrease',
  'liquidated',
]);

const NO_OPEN_CLOSE_FEE_ACTIONS = new Set(['deposit', 'withdrawal']);

const hasFeeValue = (value: string) => !calc(value || 0).isZero();

const formatUsd = (value: string, displayDecimals: number) =>
  truncateFormat(value, displayDecimals, {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always',
    showNegativeZero: true,
  });

const feeCostToDisplayValue = (value: string) =>
  calc(value || 0)
    .times(-1)
    .toFixed();

interface HistoryFeeProps {
  actionType: string;
  isHyper?: boolean;
  openCloseFeeUsd?: string;
  originalOpenCloseFeeUsd?: string;
  fundingFeeUsd?: string;
  borrowingFeeUsd?: string;
  priceImpactUsd?: string;
  liquidationFeeUsd?: string;
}

const HistoryFee: FC<HistoryFeeProps> = ({
  actionType,
  isHyper,
  openCloseFeeUsd = '0',
  originalOpenCloseFeeUsd,
  fundingFeeUsd = '0',
  borrowingFeeUsd = '0',
  priceImpactUsd = '0',
  liquidationFeeUsd = '0',
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const isZeroFeeLifecycleAction = ZERO_FEE_ACTION_PREFIXES.some((prefix) =>
    actionType.startsWith(prefix),
  );

  if (isZeroFeeLifecycleAction) {
    const zeroFeeDisplay = formatUsd('-0', usdAmountDisplayDecimal);
    return (
      <span className="font-plex block w-20 text-xs max-md:text-sm">
        {zeroFeeDisplay}
      </span>
    );
  }

  const isLiquidation = actionType === 'liquidated';
  const showFundingBorrowingFees =
    FUNDING_BORROWING_FEE_ACTIONS.has(actionType) ||
    hasFeeValue(fundingFeeUsd) ||
    hasFeeValue(borrowingFeeUsd);
  const showPriceImpact = PRICE_IMPACT_ACTIONS.has(actionType);
  const showLiquidationFee = isLiquidation;
  const showOpenCloseFee = !NO_OPEN_CLOSE_FEE_ACTIONS.has(actionType);
  const openCloseFeeLabel = OPEN_FEE_ACTIONS.has(actionType)
    ? t`Open Fee`
    : CLOSE_FEE_ACTIONS.has(actionType)
      ? t`Close Fee`
      : t`Open/Close Fee`;
  const originalOpenCloseFee =
    originalOpenCloseFeeUsd === undefined
      ? openCloseFeeUsd
      : originalOpenCloseFeeUsd;

  const actualDisplayValue = calc(priceImpactUsd || 0)
    .minus(showOpenCloseFee ? openCloseFeeUsd || 0 : 0)
    .minus(showFundingBorrowingFees ? fundingFeeUsd || 0 : 0)
    .minus(showFundingBorrowingFees ? borrowingFeeUsd || 0 : 0)
    .minus(showLiquidationFee ? liquidationFeeUsd || 0 : 0)
    .toFixed();
  const originalDisplayValue = calc(priceImpactUsd || 0)
    .minus(showOpenCloseFee ? originalOpenCloseFee || 0 : 0)
    .minus(showFundingBorrowingFees ? fundingFeeUsd || 0 : 0)
    .minus(showFundingBorrowingFees ? borrowingFeeUsd || 0 : 0)
    .minus(showLiquidationFee ? liquidationFeeUsd || 0 : 0)
    .toFixed();
  const discountApplied = !calc(originalDisplayValue).eq(actualDisplayValue);
  const actualDisplay = formatUsd(actualDisplayValue, usdAmountDisplayDecimal);

  return (
    <Tooltip>
      <div className="font-plex flex w-max flex-col items-start justify-center gap-0.5 max-md:flex-row-reverse max-md:items-center max-md:gap-1">
        <TooltipTrigger
          className={cn(
            'w-max text-left text-xs underline decoration-dotted underline-offset-2 max-md:text-sm',
            discountApplied ? 'text-accent' : '',
          )}
        >
          {actualDisplay}
        </TooltipTrigger>
        {discountApplied && (
          <span className="text-t-430 text-[10px]/tight line-through max-md:text-xs">
            {formatUsd(originalDisplayValue, usdAmountDisplayDecimal)}
          </span>
        )}
      </div>
      <TooltipContent className="flex w-65 flex-col gap-1 px-2 py-2">
        {showOpenCloseFee && (
          <ListItem
            label={openCloseFeeLabel}
            value={formatUsd(
              feeCostToDisplayValue(openCloseFeeUsd),
              usdAmountDisplayDecimal,
            )}
          />
        )}
        {showFundingBorrowingFees && (
          <>
            <ListItem
              label={t`Funding Fee`}
              value={formatUsd(
                feeCostToDisplayValue(fundingFeeUsd),
                usdAmountDisplayDecimal,
              )}
            />
            <ListItem
              label={t`Borrowing Fee`}
              value={formatUsd(
                feeCostToDisplayValue(borrowingFeeUsd),
                usdAmountDisplayDecimal,
              )}
            />
          </>
        )}
        {showPriceImpact && (
          <ListItem
            label={t`Price Impact`}
            value={formatUsd(priceImpactUsd, usdAmountDisplayDecimal)}
          />
        )}
        {showLiquidationFee && (
          <ListItem
            label={t`Liquidation Fee`}
            value={formatUsd(
              feeCostToDisplayValue(liquidationFeeUsd),
              usdAmountDisplayDecimal,
            )}
          />
        )}
        {isHyper && (
          <>
            <Separator className="my-1" />
            <span className="text-t-270 text-left">
              <HyperProfitShareDescription />
            </span>
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default HistoryFee;
