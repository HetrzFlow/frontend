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
}

const PositionsSm: FC<PositionsProps> = ({
  isLoading,
  data,
  onClose,
  onEditCollateral,
  onShowOrders,
  onOpenShareDialog,
}) => {
  const { t } = useLingui();

  if (isLoading) {
    return <Loading className="h-20 rounded-xl bg-transparent" />;
  }

  if (!data.length) {
    return (
      <div className={'text-t-350 mt-6 h-20 text-center text-sm'}>
        {t`No matching results found.`}
      </div>
    );
  }

  return data.map(
    ({
      id,
      targetCoin,
      size,
      leverage,
      collateral,
      isLong,
      entryPrice,
      entryFundingRate,
    }) => (
      <PosItem
        key={id}
        id={id}
        targetCoin={targetCoin}
        size={size}
        leverage={leverage}
        collateral={collateral}
        isLong={isLong}
        entryPrice={entryPrice}
        entryFundingRate={entryFundingRate}
        onClose={onClose}
        onEditCollateral={onEditCollateral}
        onShowOrders={onShowOrders}
        onOpenShareDialog={onOpenShareDialog}
      />
    ),
  );
};

export default PositionsSm;
