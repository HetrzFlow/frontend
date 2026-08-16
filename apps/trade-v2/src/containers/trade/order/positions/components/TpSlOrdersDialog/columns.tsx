import { useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@repo/ui';
import type { Order } from '@/common';

import {
  ActionsCell,
  EstPnlCell,
  EstReceiveCell,
  PriceCell,
  SizeCell,
} from './cells';

type DisplayUnit = '%' | '$';

const renderUnitHeader = (
  unit: DisplayUnit,
  label: string,
  onClick: () => void,
) => (
  <Button
    variant="ghost"
    size="xs"
    className="text-t-350 hover:text-t-1100 gap-1 px-0 text-left hover:bg-transparent"
    onClick={onClick}
  >
    <span className="text-accent">{unit}</span>
    <span>{label}</span>
  </Button>
);

export function useColumns({
  sizeDisplayUnit,
  pxDispDecimal,
  onToggleSizeDisplayUnit,
  onEdit,
  onDelete,
}: {
  sizeDisplayUnit: DisplayUnit;
  pxDispDecimal?: number;
  onToggleSizeDisplayUnit: () => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}) {
  const { t } = useLingui();

  return useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: 'size',
        header: () =>
          renderUnitHeader(sizeDisplayUnit, t`Size`, onToggleSizeDisplayUnit),
        accessorFn: (row) => row,
        cell: ({ getValue }) => (
          <SizeCell order={getValue() as Order} displayUnit={sizeDisplayUnit} />
        ),
        meta: { headerClassName: 'w-[20%]' },
      },
      {
        id: 'price',
        header: t`Price`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => (
          <PriceCell
            order={getValue() as Order}
            pxDispDecimal={pxDispDecimal}
          />
        ),
        meta: { headerClassName: 'w-[22%]' },
      },
      {
        id: 'estPnl',
        header: t`Est. PnL`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => <EstPnlCell order={getValue() as Order} />,
        meta: { headerClassName: 'w-[20%]' },
      },
      {
        id: 'estReceive',
        header: t`Est. Receive`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => <EstReceiveCell order={getValue() as Order} />,
        meta: { headerClassName: 'w-[20%]' },
      },
      {
        id: 'actions',
        header: t`Action`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => (
          <ActionsCell
            order={getValue() as Order}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
        meta: { headerClassName: 'w-[18%]' },
      },
    ],
    [
      t,
      sizeDisplayUnit,
      pxDispDecimal,
      onToggleSizeDisplayUnit,
      onEdit,
      onDelete,
    ],
  );
}
