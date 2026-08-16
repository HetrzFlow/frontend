import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { ColumnDef } from '@tanstack/react-table';
import { i18n } from '@repo/i18n/client';

import { Order } from '@/common';

import Inst from '../../components/Inst';
import Size from '../../components/Size';
import Type from '../../components/Type';
import Cancel from '../components/Cancel';
import CancelAll from '../components/CancelAll';
import ExecutionDistance from '../components/ExecutionDistance';
import TriggerPrice from '../components/TriggerPrice';
import OrderTypeFilter from '../OrderTypeFilter';

export const useColumns = ({
  inactiveOrderIds,
  onCancel,
  onEditPrice,
}: {
  inactiveOrderIds: Set<string>;
  onCancel: (order: Order[]) => void;
  onEditPrice: (id: string) => void;
}) => {
  return useMemo(() => {
    return [
      {
        accessorKey: 'timestamp',
        header: i18n._(msg`Symbol`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { isLong, marketAddress } = getValue() as Order;
          return <Inst marketAddress={marketAddress} isLong={isLong} />;
        },
        meta: {
          headerClassName: 'min-w-35 w-[15%]',
        },
      },
      {
        accessorKey: 'orderType',
        header: () => <OrderTypeFilter />,
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { id, orderType } = getValue() as Order;

          return (
            <Type type={orderType} isInactive={inactiveOrderIds.has(id)} />
          );
        },
        meta: {
          headerClassName: 'min-w-30 w-[12%]',
        },
      },
      {
        accessorKey: 'size',
        header: i18n._(msg`Size`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { sizeDeltaUsd } = getValue() as Order;
          return <Size size={sizeDeltaUsd} showSign />;
        },
        meta: {
          headerClassName: 'min-w-25 w-[11%]',
        },
      },
      {
        accessorKey: 'triggerPrice',
        header: i18n._(msg`Price`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            triggerPrice,
            triggerAboveThreshold,
            isLong,
            isZFP,
            id,
            marketAddress,
            isSl,
          } = getValue() as Order;
          return (
            <TriggerPrice
              marketAddress={marketAddress}
              isLong={isLong}
              isZFP={isZFP}
              price={triggerPrice}
              triggerPriceAboveAllowed={triggerAboveThreshold}
              isSl={isSl}
              editOrderId={id}
              onEditPrice={onEditPrice}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-40 w-[16%]',
        },
      },
      {
        accessorKey: 'executionDistance',
        header: i18n._(msg`Execution Distance`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { triggerPrice, marketAddress, isLong, isLimit, isTp, isSl } =
            getValue() as Order;
          return (
            <ExecutionDistance
              marketAddress={marketAddress}
              triggerPrice={triggerPrice}
              isLong={isLong}
              isLimit={isLimit}
              isTp={isTp}
              isSl={isSl}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-50 w-[24%]',
        },
      },
      {
        accessorKey: 'action',
        header: ({ table }) => {
          const orders = table
            .getFilteredRowModel()
            .rows.map((v) => v.original);
          return <CancelAll orders={orders} onCancel={onCancel}></CancelAll>;
        },
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const order = getValue() as Order;
          return <Cancel order={order} onCancel={onCancel} />;
        },
        meta: {
          headerClassName: 'w-[10%] min-w-20',
        },
      },
    ] as ColumnDef<Order>[];
  }, [inactiveOrderIds, onCancel, onEditPrice]);
};
