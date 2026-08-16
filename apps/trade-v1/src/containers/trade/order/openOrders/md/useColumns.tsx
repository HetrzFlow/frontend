import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { ColumnDef } from '@tanstack/react-table';
import { i18n } from '@repo/i18n/client';

import { dateFormat } from '@repo/lib/format';
import { Button, SortUpDownIcon, XLgIcon } from '@repo/ui';
import { Order } from '@/common';

import Filter from '../../components/Filter';
import Inst from '../../components/Inst';
import Price from '../../components/Price';
import Side from '../../components/Side';
import Size from '../../components/Size';
import Collateral from '../Collateral';

export const useColumns = ({
  onCancel,
  onEditPrice,
}: {
  onCancel: (order: Order[]) => void;
  onEditPrice: (id: string) => void;
}) => {
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
          const time = getValue() as number;
          return (
            <span className="font-plex text-sm">
              {dateFormat(time, 'yyyy/MM/dd HH:mm:ss')}
            </span>
          );
        },
        sortUndefined: 'last',
        sortingFn: 'datetime',
        meta: {
          headerClassName: 'min-w-35',
        },
      },
      {
        accessorKey: 'targetCoin',
        header: i18n._(msg`Symbol`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const order = getValue() as Order;
          return <Inst targetCoin={order.targetCoin} />;
        },
        meta: {
          headerClassName: 'min-w-18',
        },
      },
      // {
      //   accessorKey: 'orderType',
      //   header: i18n._(msg`Type`),
      //   // header: ({ column, table }) => {
      //   //   const sideFilterValue = table.getColumn('side')?.getFilterValue();
      //   //   const value = column.getFilterValue() as string;

      //   //   const options = [
      //   //     {
      //   //       value: 'all',
      //   //       label: t`All`,
      //   //     },
      //   //   ];
      //   //   if (
      //   //     ['all', 'openLong', 'openShort'].includes(sideFilterValue as string)
      //   //   ) {
      //   //     options.push({
      //   //       value: 'limit',
      //   //       label: t`Limit`,
      //   //     });
      //   //   }
      //   //   if (
      //   //     ['all', 'closeLong', 'closeShort'].includes(
      //   //       sideFilterValue as string,
      //   //     )
      //   //   ) {
      //   //     options.push({
      //   //       value: 'trigger',
      //   //       label: t`Trigger`,
      //   //     });
      //   //   }
      //   //   return (
      //   //     <Filter
      //   //       label={t`Type`}
      //   //       value={value}
      //   //       options={options}
      //   //       onValueChange={column.setFilterValue}
      //   //     />
      //   //   );
      //   // },
      //   accessorFn: (row) => row,
      //   filterFn: (row, _, filterValue) => {
      //     if (filterValue === 'limit') {
      //       return row.original.isOpen;
      //     }
      //     if (filterValue === 'trigger') {
      //       return !row.original.isOpen;
      //     }
      //     return true;
      //   },
      //   cell: ({ getValue }) => {
      //     const { isLimit, isOpen } = getValue() as Order;
      //     const type = !isLimit
      //       ? ORDER_TYPE.market
      //       : isOpen
      //         ? ORDER_TYPE.limit
      //         : ORDER_TYPE.limit;
      //     // : ORDER_TYPE.trigger;
      //     return <Type type={type} />;
      //   },
      //   meta: {
      //     headerClassName: 'min-w-16',
      //   },
      // },
      {
        id: 'side',
        header: ({ column }) => {
          const typeFilterValue = 'all';
          // table
          //   .getColumn('orderType')
          //   ?.getFilterValue();
          const value = column.getFilterValue() as string;
          const options = [
            {
              value: 'all',
              label: i18n._(msg`All`),
            },
          ];
          if (['all', 'limit'].includes(typeFilterValue as string)) {
            options.push(
              {
                value: 'openLong',
                label: i18n._(msg`Open Long`),
              },
              {
                value: 'openShort',
                label: i18n._(msg`Open Short`),
              },
            );
          }
          if (['all', 'trigger'].includes(typeFilterValue as string)) {
            options.push(
              {
                value: 'closeLong',
                label: i18n._(msg`Close Long`),
              },
              {
                value: 'closeShort',
                label: i18n._(msg`Close Short`),
              },
            );
          }
          return (
            <Filter
              label={i18n._(msg`Side`)}
              value={value}
              options={options}
              onValueChange={column.setFilterValue}
            />
          );
        },
        accessorFn: (row) => row,
        filterFn: () => {
          // const { isBuy, isLong } = row.original;
          // if (filterValue === 'openLong') {
          //   return isBuy && isLong;
          // }
          // if (filterValue === 'openShort') {
          //   return !isBuy && !isLong;
          // }
          // if (filterValue === 'closeLong') {
          //   return !isBuy && isLong;
          // }
          // if (filterValue === 'closeShort') {
          //   return isBuy && !isLong;
          // }
          return true;
        },
        cell: ({ getValue }) => {
          const { isBuy, isLong } = getValue() as Order;
          return (
            <span className={isBuy ? 'text-up' : 'text-down'}>
              <Side isBuy={isBuy} isLong={isLong} />
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-24',
        },
      },
      {
        accessorKey: 'triggerPrice',
        header: i18n._(msg`Price`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            targetCoin,
            triggerPrice,
            triggerAboveThreshold,
            isLimit,
            orderId,
          } = getValue() as Order;
          return (
            <Price
              targetCoin={targetCoin}
              price={triggerPrice}
              triggerPriceAboveAllowed={triggerAboveThreshold}
              isMarket={!isLimit}
              onEdit={() => onEditPrice(orderId)}
            />
          );
        },
      },
      {
        accessorKey: 'size',
        header: i18n._(msg`Size`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { size } = getValue() as Order;
          return <Size size={size} />;
        },
      },
      {
        accessorKey: 'collateral',
        header: i18n._(msg`Collateral`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            payCoin,
            payCoinAmount,
            collateralUsd,
            triggerPrice,
            targetCoin,
          } = getValue() as Order;
          return (
            <Collateral
              payCoin={payCoin}
              payCoinAmount={payCoinAmount}
              collateralUsd={collateralUsd}
              triggerPrice={payCoin === targetCoin ? triggerPrice : ''}
            />
          );
        },
      },
      {
        accessorKey: 'actions',
        header: ({ table }) => {
          const orderCount = table.getFilteredRowModel().rows.length;
          return (
            <Button
              variant="link"
              size="sm"
              disabled={!orderCount}
              className="pr-0 hover:no-underline"
              onClick={() => {
                const orders = table
                  .getFilteredRowModel()
                  .rows.map((v) => v.original);
                onCancel(orders);
              }}
            >
              {orderCount
                ? i18n._(msg`Cancel all (${orderCount})`)
                : i18n._(msg`Cancel all`)}
            </Button>
          );
        },
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const order = getValue() as Order;
          return (
            <div className="flex justify-end">
              <XLgIcon
                size={16}
                className="text-t-430 hover:text-t-1100 cursor-pointer"
                onClick={() => {
                  onCancel([order]);
                }}
              />
            </div>
          );
        },
      },
    ] as ColumnDef<Order>[];
  }, [onCancel, onEditPrice]);
};
