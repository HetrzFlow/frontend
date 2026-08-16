import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { ColumnDef } from '@tanstack/react-table';
import { i18n } from '@repo/i18n/client';

import { calc } from '@repo/lib/calc';
import { dateFormat } from '@repo/lib/format';
import { SortUpDownIcon } from '@repo/ui';
import type { HistoryRecord } from '@/common';

import Collateral from '../../components/Collateral';
import Filter from '../../components/Filter';
import Inst from '../../components/Inst';
import Price from '../../components/Price';
import Size from '../../components/Size';
import Digest from '../Digest';
import EventType from '../EventType';
import Fee from '../Fee';
import OrderType from '../OrderType';
import PnL from '../PnL';

export const useColumns = () => {
  return useMemo(() => {
    return [
      {
        accessorKey: 'timestamp',
        header: ({ column }) => {
          const sort = column.getIsSorted();
          return (
            <span
              className="flex cursor-pointer items-center gap-1 select-none"
              onClick={() => column.toggleSorting(sort === 'asc')}
            >
              {i18n._(msg`Time`)}
              <SortUpDownIcon
                upClassName={sort === 'asc' ? 'text-t-270' : 'text-t-430/50'}
                downClassName={sort === 'desc' ? 'text-t-270' : 'text-t-430/50'}
              />
            </span>
          );
        },
        cell: ({ getValue }) => {
          const timestamp = getValue() as number;
          return (
            <span className="font-plex text-sm">
              {dateFormat(timestamp, 'yyyy/MM/dd HH:mm:ss')}
            </span>
          );
        },
        enableSorting: false,
        meta: {
          headerClassName: 'min-w-35',
        },
      },
      {
        accessorKey: 'index_coin',
        header: i18n._(msg`Symbol`),
        cell: ({ getValue }) => {
          const indexCoin = getValue() as string;
          return <Inst targetCoin={indexCoin} />;
        },
        meta: {
          headerClassName: 'min-w-18',
        },
      },
      {
        accessorKey: 'type',
        header: ({ column }) => {
          const value = column.getFilterValue() as string;
          const options = [
            {
              value: 'all',
              label: i18n._(msg`All`),
            },
            {
              value: 'market',
              label: i18n._(msg`Market`),
            },
            {
              value: 'limit',
              label: i18n._(msg`Limit`),
            },
          ];
          return (
            <Filter
              label={i18n._(msg`Type`)}
              value={value}
              options={options}
              onValueChange={column.setFilterValue}
            />
          );
        },
        filterFn: () => {
          return true;
        },
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { position_type } = getValue() as HistoryRecord;

          return <OrderType value={position_type} />;
        },
        meta: {
          headerClassName: 'min-w-16',
        },
      },
      {
        id: 'action',
        header: ({ column, table }) => {
          const typeFilterValue = table.getColumn('type')?.getFilterValue();
          const value = column.getFilterValue() as string;
          const options = [
            {
              value: 'all',
              label: i18n._(msg`All`),
            },
          ];
          if (['all', 'market', 'limit'].includes(typeFilterValue as string)) {
            options.push(
              {
                value: 'open_long',
                label: i18n._(msg`Open Long`),
              },
              {
                value: 'open_short',
                label: i18n._(msg`Open Short`),
              },
              {
                value: 'increase_long',
                label: i18n._(msg`Increase Long`),
              },
              {
                value: 'increase_short',
                label: i18n._(msg`Increase Short`),
              },
              {
                value: 'close_long',
                label: i18n._(msg`Close Long`),
              },
              {
                value: 'close_short',
                label: i18n._(msg`Close Short`),
              },
              {
                value: 'decrease_long',
                label: i18n._(msg`Decrease Long`),
              },
              {
                value: 'decrease_short',
                label: i18n._(msg`Decrease Short`),
              },
            );
          }
          options.push({
            value: 'liquidated',
            label: i18n._(msg`Liquidated`),
          });
          return (
            <Filter
              label={i18n._(msg`Action`)}
              value={value}
              options={options}
              onValueChange={column.setFilterValue}
            />
          );
        },
        accessorFn: (row) => row,
        filterFn: () => {
          return true;
        },
        cell: ({ getValue }) => {
          const { event_type } = getValue() as HistoryRecord;
          return <EventType value={event_type} />;
        },
        meta: {
          headerClassName: 'min-w-24',
        },
      },
      {
        accessorKey: 'price',
        header: i18n._(msg`Price`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { index_coin, price } = getValue() as HistoryRecord;
          return <Price targetCoin={index_coin} price={price} />;
        },
      },
      {
        accessorKey: 'size_delta',
        header: i18n._(msg`Size`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { size_delta } = getValue() as HistoryRecord;

          return <Size size={size_delta} showSign className="text-t-1100" />;
        },
      },
      {
        accessorKey: 'collateral_delta',
        header: i18n._(msg`Collateral`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { collateral_delta } = getValue() as HistoryRecord;
          return (
            <Collateral collateral={calc(collateral_delta).abs().toFixed()} />
          );
        },
      },
      {
        accessorKey: 'fee',
        header: i18n._(msg`Fee`),
        cell: ({ getValue }) => {
          const fee = getValue() as string;
          return <Fee fee={fee} />;
        },
      },
      {
        accessorKey: 'pnl',
        header: i18n._(msg`PnL`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { pnl, isClose } = getValue() as HistoryRecord;
          return <PnL pnl={pnl} isClose={isClose} />;
        },
      },
      {
        accessorKey: 'tx_digest',
        header: i18n._(msg`Txns`),
        cell: ({ getValue }) => {
          const digest = getValue() as string;
          return <Digest className="justify-end" digest={digest} />;
        },
      },
    ] as ColumnDef<HistoryRecord>[];
  }, []);
};
