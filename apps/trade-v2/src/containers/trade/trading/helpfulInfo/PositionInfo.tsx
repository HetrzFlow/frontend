import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { openPosFeeDoc } from '@repo/common/constants';
import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import {
  useInstStore,
  useGlobalStore as useCommonGlobalStore,
  useMarketConfigs,
  useMarketValues,
  CREDIT_MARKET_CATEGORY,
} from '@/common';
import { useLossRebateEstimate } from '@/common/hooks/useLossRebateEstimate';
import { usePositions } from '@/common/services/rest/position';
import ListItem from '@/components/ListItem';
import { ReferralDiscountBadge } from '@/components/ReferralDiscount';
import { TRADE_TYPE } from '@/constants/enum';
import { useCreditTokenBalance } from '@/containers/credit/hooks';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';
import { useReferralDiscountRate } from '@/hooks/useReferralDiscount';
import { findPositionByMode } from '@/lib/trade/position';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePositionSizeAndFees } from '../positionSizeAndFees';
import { useTradeStore } from '../store';
import { useIsZFP } from '../tradeBox/openPosition/hooks/useIsZFP';
import Details from './Details';

interface PositionInfoProps {
  isLong: boolean;
}

const PositionInfo: FC<PositionInfoProps> = ({ isLong }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [tradeType, formData] = useTradeStore(
    useShallow((state) => [state.tradeType, state.formData]),
  );

  const instId = useTradeGlobalStore((state) => state.instId);
  const [inst] = useInstStore(
    useShallow((state) => [state.getInst(state, instId)]),
  );
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;
  const isZFP = useIsZFP();
  const { data: creditTokenBalance } = useCreditTokenBalance();
  const showNormalMarketCreditFeeTooltip =
    !isZFP && !isCreditMarket && (creditTokenBalance ?? 0n) > 0n;
  const showCreditMarketFeeTooltip = !isZFP && isCreditMarket;
  const showCreditFeeTooltip =
    showNormalMarketCreditFeeTooltip || showCreditMarketFeeTooltip;

  const { data: positions = [] } = usePositions();
  const curPosition = inst?.marketTokenAddress
    ? findPositionByMode({
        positions,
        marketAddress: inst.marketTokenAddress,
        isLong,
        isZFP,
      })
    : undefined;

  const positionTradeType =
    tradeType === TRADE_TYPE.short ? TRADE_TYPE.short : TRADE_TYPE.long;
  const {
    paySz: { coin: payCoin = '' },
    px,
  } = formData[positionTradeType];

  const collateralCoin = isLong
    ? inst?.longTokenAddress
    : inst?.shortTokenAddress;

  const { data: feeData } = usePositionSizeAndFees(
    payCoin,
    collateralCoin,
    isZFP,
  );

  const openFee = feeData?.openFee || 0;
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();

  const swapFee = 0;
  const curCollateralAmount = feeData?.collateralAmount || '';
  const size = feeData?.size || '';
  const feeDiscountUsd = feeData?.feeDiscountUsd || '0';
  const hasFeeDiscount = calc(feeDiscountUsd).gt(0);

  const {
    curEntryPx,
    curSize,
    curCollateralUsd,
    deltaCollateralUsd,
    curLiqPx,
    curLeverage,
    curBorrowFee,
    curFundingFee,
    nextEntryPx,
    nextCollateralUsd,
    nextLiqPx,
    nextLeverage,
  } = useCalcFinalPosition({
    inst,
    isLong,
    deltaSize: size,
    deltaCollateralAmount: curCollateralAmount,
    collateralTokenAddress: collateralCoin || '',
    px,
    isZFP,
  });

  const { data: marketConfig } = useMarketConfigs(inst);
  const { data: marketValuesForMarket } = useMarketValues(inst);

  const lossRebateEstimate = useLossRebateEstimate({
    collateral: deltaCollateralUsd.gt(0) ? deltaCollateralUsd.toFixed() : 0,
    sizeDelta: size,
    marketConfig,
    marketValues: marketValuesForMarket,
    isLong,
    isZFP,
  });

  const effectiveOpenFee = isZFP ? 0 : openFee;
  const discountedOpenFee = calc(effectiveOpenFee).minus(feeDiscountUsd);
  const fees = calc(discountedOpenFee)
    .plus(swapFee)
    .plus(curBorrowFee)
    .plus(curFundingFee);
  const originalFees = calc(effectiveOpenFee)
    .plus(swapFee)
    .plus(curBorrowFee)
    .plus(curFundingFee);

  const dispFees = truncateFormat(
    calc(fees).times(-1),
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always',
      showNegativeZero: true,
    },
  );
  const smDialogOpen = useTradeStore((state) => state.smDialogOpen);
  const feeLabelText = showCreditFeeTooltip ? (
    <Tooltip>
      <TooltipTrigger className="decoration-t-430 underline decoration-dotted underline-offset-3">
        {t`Fees`}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        inDialog={smDialogOpen}
        collisionBoundary={document.querySelector('.tradingContainer')}
        collisionPadding={smDialogOpen ? 16 : 8}
      >
        {showCreditMarketFeeTooltip
          ? t`Fee is paid by Credit(1 Credit = 1 USDT).`
          : t`Auto-accrued into your Accumulated Fee Rebate.`}
      </TooltipContent>
    </Tooltip>
  ) : (
    <span>{t`Fees`}</span>
  );

  return (
    <div className="flex flex-col gap-2 text-xs">
      <ListItem
        label={
          <span className="flex items-center gap-1">
            {hasFeeDiscount && !isZFP && !isCreditMarket ? (
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
              <span className="text-hyper-lev mr-1">{t`0 Open Fee`}</span>
            )}
            {hasFeeDiscount && !isZFP && !isCreditMarket && (
              <span className="text-t-430 mr-1 line-through">
                {truncateFormat(
                  calc(originalFees).times(-1),
                  usdAmountDisplayDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                    signDisplay: 'always',
                    showNegativeZero: true,
                  },
                )}
              </span>
            )}
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  'decoration-t-430 decoration-dotted underline-offset-3',
                  dispFees === EMPTY_DISPLAY
                    ? 'cursor-auto no-underline'
                    : 'underline',
                  hasFeeDiscount && !isZFP && !isCreditMarket
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
                  inDialog={smDialogOpen}
                  collisionBoundary={document.querySelector(
                    '.tradingContainer',
                  )}
                >
                  <>
                    <ListItem
                      label={`${t`Open Fee`}:`}
                      value={truncateFormat(
                        calc(
                          hasFeeDiscount && !isZFP && !isCreditMarket
                            ? discountedOpenFee
                            : effectiveOpenFee,
                        ).times(-1),
                        usdAmountDisplayDecimal,
                        {
                          style: 'currency',
                          currency: 'USD',
                          showNegativeZero: true,
                        },
                      )}
                    />
                    {curEntryPx && (
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
                      </>
                    )}
                    <span>
                      <a
                        className="text-accent underline underline-offset-2"
                        href={openPosFeeDoc || 'https://'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t`Read more`}
                      </a>{' '}
                    </span>
                  </>
                </TooltipContent>
              )}
            </Tooltip>
          </>
        }
      />

      <div className={cn('flex flex-col gap-2 text-xs')}>
        <Details
          hasPosition={!!curEntryPx}
          isZFP={isZFP}
          isCreditMarket={isCreditMarket}
          curEntryPrice={curEntryPx}
          nextEntryPrice={nextEntryPx}
          curSize={curSize || '0'}
          curCollateral={curCollateralUsd || '0'}
          nextCollateral={nextCollateralUsd}
          curLeverage={curLeverage}
          nextLeverage={nextLeverage}
          curLiqPrice={curLiqPx}
          nextLiqPrice={+size ? nextLiqPx : ''}
          lossRebateEstimate={lossRebateEstimate}
          curPendingLossRebateUsd={curPosition?.pendingLossRebateUsd}
          lossRebateRate={marketConfig?.lossRebateRate}
        />
      </div>
    </div>
  );
};

export default PositionInfo;
