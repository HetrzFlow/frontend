import { Dispatch, FC, SetStateAction } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Loading } from '@repo/ui';
import type { HistoryRecord } from '@/common';

import OrderItem from './OrderItem';

interface HistoryRecordsProps {
  isLoading: boolean;
  data: HistoryRecord[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalPages: number;
}

const HistoryRecordsSm: FC<HistoryRecordsProps> = ({ isLoading, data }) => {
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
      tx_digest,
      direction,
      fee,
      pnl,
      isClose,
      index_coin,
      size_delta,
      position_type,
      event_type,
      price,
      collateral_delta,
      timestamp,
    }) => {
      return (
        <OrderItem
          key={id}
          digest={tx_digest}
          targetCoin={index_coin}
          size={size_delta}
          orderType={position_type}
          eventType={event_type}
          price={price}
          collateral={collateral_delta}
          fee={fee}
          pnl={pnl}
          isClose={isClose}
          timestamp={timestamp}
          direction={direction}
        />
      );
    },
  );
};

export default HistoryRecordsSm;
