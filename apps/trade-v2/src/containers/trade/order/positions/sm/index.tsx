import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Loading } from '@repo/ui';
import type { Position } from '@/common';

import PosItem from './PosItem';

interface PositionsProps {
  isLoading: boolean;
  data: Position[];
  onClose: (positionId: string) => void;
  onCloseAll: () => void;
  onEditCollateral: (positionId: string) => void;
  onShowOrders: (positionId: string) => void;
  onOpenShareDialog: (positionId: string) => void;
  onOpenTpSlOrdersDialog: (position: Position) => void;
  focusedPositionId: string | null;
}

const PositionsSm: FC<PositionsProps> = ({
  isLoading,
  data,
  onClose,
  onEditCollateral,
  onShowOrders,
  onOpenShareDialog,
  onOpenTpSlOrdersDialog,
  focusedPositionId,
}) => {
  const { t } = useLingui();

  if (isLoading) {
    return <Loading className="h-20 rounded-xl bg-transparent" />;
  }

  if (!data.length) {
    return (
      <div className={'text-t-350 mt-6 h-20 text-center text-sm'}>
        {t`No open positions found.`}
      </div>
    );
  }

  return data.map((position) => {
    const {
      id,
      marketAddress,
      sizeInUsd,
      collateralAmount,
      collateralTokenAddress,
      pendingBorrowingFeesUsd,
      pendingImpactAmount,
      fundingFeeAmount,
      isLong,
      entryPrice,
      pendingLossRebateUsd,
    } = position;
    const isZFP = (position as Position & { isZFP?: boolean }).isZFP;

    return (
      <div
        id={id === focusedPositionId ? `position-item-${id}` : undefined}
        key={id}
        style={{ scrollMarginTop: id === focusedPositionId ? 48 : undefined }}
      >
        <PosItem
          id={id}
          position={position}
          marketAddress={marketAddress}
          sizeInUsd={sizeInUsd}
          collateralAmount={collateralAmount}
          collateralTokenAddress={collateralTokenAddress}
          isLong={isLong}
          isHyper={isZFP}
          entryPrice={entryPrice}
          pendingBorrowingFeesUsd={pendingBorrowingFeesUsd}
          pendingImpactAmount={pendingImpactAmount}
          fundingFeeAmount={fundingFeeAmount}
          pendingLossRebateUsd={pendingLossRebateUsd}
          isCreditMarket={position.isCreditMarket}
          onClose={onClose}
          onEditCollateral={onEditCollateral}
          onShowOrders={onShowOrders}
          onOpenShareDialog={onOpenShareDialog}
          onOpenTpSlOrdersDialog={onOpenTpSlOrdersDialog}
        />
      </div>
    );
  });
};

export default PositionsSm;
