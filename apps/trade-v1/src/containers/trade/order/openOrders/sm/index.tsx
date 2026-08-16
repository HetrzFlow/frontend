import { Dispatch, FC, SetStateAction } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Loading } from '@repo/ui';
import type { Order } from '@/common';

import OrderItem from './OrderItem';

interface OpenOrdersProps {
  data: Order[];
  isLoading: boolean;
  onCancel: (order: Order[]) => void;
  onEditPrice: (id: string) => void;
  total: number;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}
const OpenOrdersSm: FC<OpenOrdersProps> = ({
  isLoading,
  data,
  onCancel,
  onEditPrice,
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

  return data.map((itemData) => {
    const {
      orderId,
      targetCoin,
      size,
      triggerPrice,
      triggerAboveThreshold,
      isLong,
      isLimit,
      payCoin,
      payCoinAmount,
      collateralUsd,
      timestamp,
    } = itemData;

    return (
      <OrderItem
        key={orderId}
        orderId={orderId}
        targetCoin={targetCoin}
        size={size}
        triggerPrice={triggerPrice}
        triggerAboveThreshold={triggerAboveThreshold}
        isLong={isLong}
        isLimit={isLimit}
        payCoin={payCoin}
        payCoinAmount={payCoinAmount}
        collateralUsd={collateralUsd}
        timestamp={timestamp}
        onCancel={() => onCancel([itemData])}
        onEditPrice={onEditPrice}
      />
    );
  });
};

export default OpenOrdersSm;
