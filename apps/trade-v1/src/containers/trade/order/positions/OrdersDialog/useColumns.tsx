import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { ColumnDef } from '@tanstack/react-table';
import { i18n } from '@repo/i18n/client';

import { dateFormat, thoFormat } from '@repo/lib/format';
import { Button } from '@repo/ui';
import { Order } from '@/common';

import Size from '../../components/Size';

export const useColumns = ({
  onCancel,
}: {
  onCancel: (orders: Order[]) => void;
}) => {
  return useMemo(
    () =>
      [
        {
          id: 'index',
          meta: {
            headerClassName: 'h-3.5 pb-2',
            bodyClassName: 'font-plex py-2',
          },
          header: i18n._(msg`No.`),
          cell: ({ row }) => {
            return thoFormat(row.index + 1);
          },
        },
        {
          accessorKey: 'size',
          header: i18n._(msg`Size`),
          meta: {
            headerClassName: 'h-3.5 pb-2',
            bodyClassName: 'py-2',
          },
          cell: ({ getValue }) => {
            const size = getValue() as string;
            return <Size size={size} />;
          },
        },
        {
          id: 'triggerPrice',
          header: i18n._(msg`Trigger Price`),
          meta: {
            headerClassName: 'h-3.5 pb-2',
            bodyClassName: 'font-plex py-2',
          },
          accessorFn: (row) => row,
          cell: ({ getValue }) => {
            const { triggerAboveThreshold, triggerPrice } = getValue() as Order;
            return `${triggerAboveThreshold ? '≥' : '≤'} ${thoFormat(
              triggerPrice,
              {
                style: 'currency',
                currency: 'USD',
              },
            )}`;
          },
        },
        {
          accessorKey: 'time',
          meta: {
            headerClassName: 'h-3.5 pb-2',
            bodyClassName: 'font-plex py-2',
          },
          header: i18n._(msg`Order Time`),
          cell: ({ getValue }) => {
            const orderTime = getValue() as string;
            return dateFormat(orderTime, 'yyyy/MM/dd HH:mm:ss');
          },
        },
        {
          id: 'actions',
          meta: {
            headerClassName: 'h-3.5 pb-2 ',
            bodyClassName: ' py-2',
          },
          accessorFn: (row) => row,
          header: ({ table }) => {
            return (
              <span
                className="decoration-t-430 text-primary-foreground cursor-pointer underline underline-offset-2"
                onClick={() => {
                  const orders = table
                    .getRowModel()
                    .rows.map((v) => v.original);
                  onCancel(orders);
                }}
              >
                {i18n._(msg`Cancel all`)}
              </span>
            );
          },
          cell: ({ getValue }) => {
            const order = getValue() as Order;
            return (
              <Button
                variant="link"
                size="xs"
                className="pr-0 hover:no-underline"
                onClick={() => {
                  onCancel([order]);
                }}
              >
                {i18n._(msg`Cancel`)}
              </Button>
            );
          },
        },
      ] as ColumnDef<Order>[],
    [],
  );
};
