import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { ColumnDef } from '@tanstack/react-table';
import { i18n } from '@repo/i18n/client';

import { Button, ShareIcon, XLgIcon } from '@repo/ui';
import type { Position } from '@/common';

import Collateral from '../../components/Collateral';
import MarkPrice from '../../components/MarkPrice';
import Price from '../../components/Price';
import Size from '../../components/Size';
import Inst from '../Inst';
import LiqPrice from '../LiqPrice';
import PnL from '../PnL';

export const useColumns = ({
  onClose,
  onCloseAll,
  onEditCollateral,
  onShowOrders,
  onOpenShareDialog,
}: {
  onClose: (positionId: string) => void;
  onCloseAll: () => void;
  onEditCollateral: (positionId: string) => void;
  onShowOrders: (positionId: string) => void;
  onOpenShareDialog: (positionId: string) => void;
}) => {
  return useMemo(() => {
    return [
      {
        id: 'instId',
        header: i18n._(msg`Symbol`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { targetCoin, leverage, isLong } = getValue() as Position;
          return (
            <Inst targetCoin={targetCoin} lever={leverage} isLong={isLong} />
          );
        },
        meta: {
          headerClassName: 'min-w-18',
        },
      },
      {
        id: 'size',
        header: i18n._(msg`Size`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { id, size, isLong } = getValue() as Position;
          return (
            <Size
              size={size}
              className={isLong ? 'text-up' : 'text-down'}
              closeOrderCount={0}
              onOpenOrdersDialog={() => {
                onShowOrders(id);
              }}
            />
          );
        },
      },
      {
        id: 'entryPrice',
        header: i18n._(msg`Entry Price`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { targetCoin, entryPrice } = getValue() as Position;
          return <Price targetCoin={targetCoin} price={entryPrice} />;
        },
      },
      {
        id: 'markPrice',
        header: i18n._(msg`Mark Price`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { targetCoin } = getValue() as Position;
          return <MarkPrice targetCoin={targetCoin} />;
        },
      },
      {
        id: 'liqPrice',
        header: i18n._(msg`Liq. Price`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            targetCoin,
            entryPrice,
            size,
            collateral,
            entryFundingRate,
            isLong,
            id,
          } = getValue() as Position;
          return (
            <LiqPrice
              id={id}
              targetCoin={targetCoin}
              entryPrice={entryPrice}
              size={size}
              collateral={collateral}
              entryFundingRate={`${entryFundingRate}`}
              isLong={isLong}
            />
          );
        },
      },
      {
        id: 'collateral',
        header: i18n._(msg`Collateral`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { collateral, id } = getValue() as Position;
          return (
            <Collateral
              collateral={collateral}
              editable
              onEdit={() => {
                onEditCollateral(id);
              }}
            />
          );
        },
      },
      {
        id: 'pnl',
        header: i18n._(msg`Net Value`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            targetCoin,
            isLong,
            size,
            collateral,
            entryPrice,
            entryFundingRate,
          } = getValue() as Position;
          return (
            <PnL
              targetCoin={targetCoin}
              isLong={isLong}
              size={size}
              collateral={collateral}
              entryPrice={entryPrice}
              entryFundingRate={entryFundingRate}
            />
          );
        },
      },
      {
        id: 'actions',
        header: ({ table }) => {
          const count = table.getRowModel().rows.length;
          return (
            <Button
              variant="link"
              size="sm"
              disabled={!count}
              className="pr-0 hover:no-underline"
              onClick={() => {
                onCloseAll();
              }}
            >
              {i18n._(msg`Close all`)}
            </Button>
          );
        },
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { id } = getValue() as Position;
          return (
            <div className="flex items-center justify-end gap-3">
              <ShareIcon
                size={16}
                className="text-t-430 hover:text-t-1100 cursor-pointer"
                onClick={() => {
                  // share dialog
                  onOpenShareDialog(id);
                }}
              />
              <XLgIcon
                size={16}
                className="text-t-430 hover:text-t-1100 cursor-pointer"
                onClick={() => {
                  onClose(id);
                }}
              />
            </div>
          );
        },
        meta: {
          headerClassName: 'w-15',
        },
      },
    ] as ColumnDef<Position>[];
  }, [onClose, onCloseAll, onEditCollateral, onOpenShareDialog, onShowOrders]);
};
