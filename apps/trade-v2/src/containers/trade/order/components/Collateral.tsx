import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat, unitFormat } from '@repo/lib/format';
import {
  cn,
  PencilLineIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
} from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  useGlobalStore,
  useInstStore,
  useMarketIsDisabled,
  useMarketConfigs,
  usePriceTickerStream,
} from '@/common';
import MarketIsClosedTooltip from '@/components/MarketIsClosedTooltip';

interface CollateralProps {
  collateralAmount: string;
  collateralTokenAddress: string;
  marketAddress?: string;
  showSign?: boolean;
  price?: string;
  editable?: boolean;
  className?: string;
  isHyper?: boolean;
  lossRebateUsd?: string;
  lossRebatePending?: boolean;
  onEdit?: () => void;
}

const Collateral: FC<CollateralProps> = ({
  collateralAmount,
  collateralTokenAddress,
  marketAddress,
  showSign,
  price,
  editable,
  className,
  isHyper,
  lossRebateUsd,
  lossRebatePending,
  onEdit,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  const inst = marketAddress ? insts[marketAddress] : undefined;
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;
  const collateralTokenMarkPx = usePriceTickerStream(
    getCreditAwareUsdPriceSymbol({
      isCreditMarket,
      tokenSymbol: coins[collateralTokenAddress]?.symbol,
    }),
  ).data[0]?.p;
  const collateralTokenPx = price || collateralTokenMarkPx;

  const { data: marketConfig } = useMarketConfigs(inst);

  const marketIsDisabled = useMarketIsDisabled(marketAddress);
  const showLrIcon =
    !isCreditMarket && !isHyper && !!lossRebateUsd && calc(lossRebateUsd).gt(0);
  const lrRate =
    showLrIcon && marketConfig?.lossRebateRate
      ? percentFormat(
          calc(marketConfig.lossRebateRate.toString()).div(
            CONTRACT_USD_MULTIPLIER,
          ),
          0,
        )
      : '';

  return (
    <div
      className={cn(
        'font-plex flex items-center gap-1 leading-tight max-md:text-sm',
        className,
      )}
    >
      {showLrIcon ? (
        <VerifiedIcon size={14} className="text-loss-rebate shrink-0" />
      ) : null}
      {showLrIcon ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-2">
              {unitFormat(
                calc(collateralAmount).times(collateralTokenPx || ''),
                usdAmountDisplayDecimal,
                {
                  minNumber: 1000000,
                  unitDecimal: 3,
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: showSign ? 'exceptZero' : 'auto',
                },
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px]">
            <p>
              {t`Loss Rebate is determined at execution, based on post-trade OI skew, and remains fixed for the position's lifetime.`}
            </p>
            <p className="mt-3 flex items-center justify-between gap-2">
              <span>
                {t`Loss Rebate:`} {lrRate ? `(${lrRate})` : ''}
              </span>
              <span className="text-up">
                {`${lossRebatePending ? '≤ ' : ''}${truncateFormat(
                  lossRebateUsd,
                  usdAmountDisplayDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                  },
                )}`}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
      ) : (
        unitFormat(
          calc(collateralAmount).times(collateralTokenPx || ''),
          usdAmountDisplayDecimal,
          {
            minNumber: 1000000,
            unitDecimal: 3,
            style: 'currency',
            currency: 'USD',
            signDisplay: showSign ? 'exceptZero' : 'auto',
          },
        )
      )}
      {editable && (
        <MarketIsClosedTooltip marketAddress={marketAddress}>
          <PencilLineIcon
            size={14}
            className={cn(
              'text-t-430 hover:text-t-1100 cursor-pointer',
              marketIsDisabled ? 'cursor-not-allowed' : '',
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (marketIsDisabled) return;

              // add/reduce collateral dialog
              if (onEdit) {
                onEdit();
              }
            }}
          />
        </MarketIsClosedTooltip>
      )}
    </div>
  );
};

export default Collateral;
