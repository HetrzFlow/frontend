import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { dateFormat } from '@repo/lib/format';
import { Separator, ShareIcon } from '@repo/ui';
import { hasTradeLeverage } from '@/common/utils/tradeEventType';

import Collateral from '../../components/Collateral';
import InstSm from '../../components/InstSm';
import Price from '../../components/Price';
import Size from '../../components/Size';
import Digest from '../Digest';
import ActionType from '../EventType';
import HistoryFee from '../Fee';
import PnL, { getHistoryPnl } from '../PnL';

interface OrderItemProps {
  instId: string;
  marketSymbol?: string;
  size: string;
  price: string;
  entryPrice?: string;
  exitPrice?: string;
  collateralAmount: string;
  collateralTokenAddress: string;
  collateralTokenPx: string;
  digest: string;
  orderType: string;
  eventType: string;
  actionType: string;
  isClose: boolean;
  isOpen: boolean;
  isHyper?: boolean;
  initialCollateralAmount: string;
  collateralDeltaAmount: string;
  sizeInUsd: string;
  uncappedBasePnlUsd?: string;
  liquidationFee?: string;
  feesUsd?: string;
  feeDiscountUsd?: string;
  openCloseFeeUsd?: string;
  originalOpenCloseFeeUsd?: string;
  fundingFeeUsd?: string;
  borrowingFeeUsd?: string;
  lossRebateUsd?: string;
  priceImpactUsd?: string;
  timestamp: number;
  isLong: boolean;
  leverage?: string;
  profitSharingUsd?: string;
  onOpenShareDialog?: (pnl: string) => void;
  isCreditMarket?: boolean;
}

const OrderItem: FC<OrderItemProps> = ({
  instId,
  marketSymbol,
  size,
  price,
  entryPrice,
  exitPrice,
  collateralAmount,
  collateralTokenAddress,
  collateralTokenPx,
  digest,
  eventType,
  actionType,
  isClose,
  isOpen,
  isHyper,
  initialCollateralAmount,
  collateralDeltaAmount,
  sizeInUsd,
  uncappedBasePnlUsd,
  liquidationFee,
  feesUsd,
  feeDiscountUsd,
  openCloseFeeUsd,
  originalOpenCloseFeeUsd,
  fundingFeeUsd,
  borrowingFeeUsd,
  lossRebateUsd,
  priceImpactUsd,
  timestamp,
  isLong,
  leverage,
  onOpenShareDialog,
  isCreditMarket,
  profitSharingUsd,
}) => {
  const { t } = useLingui();
  const showLever = hasTradeLeverage(actionType);
  const effectiveLeverage = showLever ? leverage : undefined;
  const pnl = getHistoryPnl({
    isClose,
    uncappedBasePnlUsd,
    priceImpactUsd,
    liquidationFee,
    feesUsd,
    feeDiscountUsd,
    lossRebateUsd,
    profitSharingUsd,
  });

  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-b-0">
      <div className="flex justify-between">
        <InstSm
          instId={instId}
          fallbackName={marketSymbol}
          isLong={isLong}
          isHyper={isHyper}
          lever={effectiveLeverage}
          isCreditMarket={isCreditMarket}
          showSeparator
        >
          <Separator orientation="vertical" className="!h-4" />
          <ActionType value={eventType} />
        </InstSm>
        {onOpenShareDialog && pnl && (
          <ShareIcon
            size={20}
            className="text-t-350"
            onClick={() => onOpenShareDialog(pnl)}
          />
        )}
      </div>
      <div className="scrollbar-none grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Size`}</span>
          <Size size={size} showSign className="text-t-1100" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Collateral`}</span>
          <Collateral
            collateralAmount={collateralAmount}
            price={collateralTokenPx}
            collateralTokenAddress={collateralTokenAddress}
            marketAddress={instId}
            isHyper={isHyper}
            lossRebateUsd={lossRebateUsd}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Entry Price`}</span>
          <Price
            marketAddress={instId}
            price={entryPrice || (isOpen ? price : '')}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Fees`}</span>
          <HistoryFee
            actionType={actionType}
            isHyper={isHyper}
            openCloseFeeUsd={openCloseFeeUsd}
            originalOpenCloseFeeUsd={originalOpenCloseFeeUsd}
            fundingFeeUsd={fundingFeeUsd}
            borrowingFeeUsd={borrowingFeeUsd}
            priceImpactUsd={priceImpactUsd}
            liquidationFeeUsd={liquidationFee}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Exit Price`}</span>
          <Price
            marketAddress={instId}
            price={exitPrice || (!isOpen ? price : '')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`PnL`}</span>
          <PnL
            isClose={isClose}
            isHyper={isHyper}
            initialCollateralAmount={initialCollateralAmount}
            collateralDeltaAmount={collateralDeltaAmount}
            collateralTokenPx={collateralTokenPx}
            sizeDeltaUsd={size}
            sizeInUsd={sizeInUsd}
            uncappedBasePnlUsd={uncappedBasePnlUsd}
            priceImpactUsd={priceImpactUsd}
            liquidationFee={liquidationFee}
            feesUsd={feesUsd}
            feeDiscountUsd={feeDiscountUsd}
            lossRebateUsd={lossRebateUsd}
            marketAddress={instId}
            onOpenShareDialog={onOpenShareDialog}
            profitSharingUsd={profitSharingUsd}
          />
        </div>
      </div>
      <div className="text-t-270 flex justify-between text-xs">
        <span>{t`Time`}</span>
        <span>{dateFormat(timestamp, 'yyyy/MM/dd HH:mm:ss')}</span>
      </div>
      <div className="text-t-270 flex justify-between text-xs">
        <span>{t`Txns`}</span>
        <Digest digest={digest} className="text-xs" />
      </div>
    </div>
  );
};

export default OrderItem;
