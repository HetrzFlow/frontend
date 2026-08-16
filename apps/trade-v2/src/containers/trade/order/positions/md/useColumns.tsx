import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ColumnDef } from '@tanstack/react-table';

import { calc } from '@repo/lib/calc';
import {
  getCreditAwareUsdPriceSymbol,
  useInstStore,
  type Position,
} from '@/common';

import type { ORDER_TYPE } from '@/constants/enum';
import { getCachedPriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import Collateral from '../../components/Collateral';
import Inst from '../../components/Inst';
import MarkPrice from '../../components/MarkPrice';
import Price from '../../components/Price';
import Size from '../../components/Size';
import Close from '../components/Close';
import CloseAll from '../components/CloseAll';
import LiqPrice from '../components/LiqPrice';
import PnL from '../components/PnL';
import TpSl from '../components/TpSl';

export const useColumns = ({
  onClose,
  onCloseAll,
  onEditCollateral,
  onShowOrders,
  onOpenShareDialog,
  onOpenTpSlOrdersDialog,
}: {
  onClose: (
    positionId: string,
    defaultValues?: {
      orderType: ORDER_TYPE;
    },
  ) => void;
  onCloseAll: () => void;
  onEditCollateral: (positionId: string) => void;
  onShowOrders: (positionId: string) => void;
  onOpenShareDialog: (positionId: string) => void;
  onOpenTpSlOrdersDialog: (position: Position) => void;
}) => {
  const coins = useInstStore((state) => state.getCoins());
  const { t } = useLingui();
  return useMemo(() => {
    return [
      {
        id: 'instId',
        header: t`Symbol`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            sizeInUsd,
            collateralAmount,
            collateralTokenAddress,
            isLong,
            marketAddress,
            isZFP,
            isCreditMarket,
          } = getValue() as Position;

          const collateralTokenPx = getCachedPriceTickerExecutionPrice(
            getCreditAwareUsdPriceSymbol({
              isCreditMarket,
              tokenSymbol: coins[collateralTokenAddress]?.symbol,
            }),
            { isIncrease: false, isLong, priceType: 'min' },
          );
          const leverage = calc(sizeInUsd)
            .div(calc(collateralAmount).times(collateralTokenPx || ''))
            .toFixed();
          return (
            <Inst
              marketAddress={marketAddress}
              lever={leverage}
              isLong={isLong}
              isHyper={isZFP}
              isCreditMarket={isCreditMarket}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-35 w-[12%]',
        },
      },
      {
        id: 'size',
        header: t`Size`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { id, sizeInUsd } = getValue() as Position;
          return (
            <Size
              size={sizeInUsd}
              closeOrderCount={0}
              onOpenOrdersDialog={() => {
                onShowOrders(id);
              }}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-25 w-[11%]',
        },
      },
      {
        id: 'pnl',
        header: t`Net Value`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            id,
            marketAddress,
            isLong,
            sizeInUsd,
            collateralAmount,
            entryPrice,
            collateralTokenAddress,
            pendingBorrowingFeesUsd,
            pendingImpactAmount,
            fundingFeeAmount,
            isZFP,
            pendingLossRebateUsd,
          } = getValue() as Position;

          return (
            <PnL
              marketAddress={marketAddress}
              isLong={isLong}
              size={sizeInUsd}
              collateralAmount={collateralAmount}
              collateralTokenAddress={collateralTokenAddress}
              pendingBorrowingFeesUsd={pendingBorrowingFeesUsd}
              pendingImpactAmount={pendingImpactAmount}
              fundingFeeAmount={fundingFeeAmount}
              entryPrice={entryPrice}
              onOpenShareDialog={() => onOpenShareDialog(id)}
              isHyper={isZFP}
              pendingLossRebateUsd={pendingLossRebateUsd}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-40 w-[13%]',
        },
      },
      {
        id: 'collateral',
        header: t`Collateral`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            collateralAmount,
            collateralTokenAddress,
            id,
            marketAddress,
            isZFP,
            pendingLossRebateUsd,
            isCreditMarket,
            isLong,
          } = getValue() as Position;
          const collateralTokenPx = getCachedPriceTickerExecutionPrice(
            getCreditAwareUsdPriceSymbol({
              isCreditMarket,
              tokenSymbol: coins[collateralTokenAddress]?.symbol,
            }),
            { isIncrease: false, isLong, priceType: 'min' },
          );
          return (
            <Collateral
              marketAddress={marketAddress}
              collateralAmount={collateralAmount}
              collateralTokenAddress={collateralTokenAddress}
              price={collateralTokenPx}
              editable
              isHyper={isZFP}
              lossRebateUsd={pendingLossRebateUsd}
              lossRebatePending
              onEdit={() => {
                onEditCollateral(id);
              }}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-25 w-[11%]',
        },
      },
      {
        id: 'entryPrice',
        header: t`Entry Price`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { entryPrice, marketAddress, isOpening } =
            getValue() as Position;
          return (
            <Price
              marketAddress={marketAddress}
              price={entryPrice}
              placeholderText={isOpening ? t`Opening` : undefined}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-40 w-[13%]',
        },
      },
      {
        id: 'liqPrice',
        header: t`Mark/Liq. Price`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const position = getValue() as Position;
          const {
            entryPrice,
            sizeInUsd,
            collateralAmount,
            collateralTokenAddress,
            isLong,
            id,
            marketAddress,
          } = position;
          return (
            <>
              <MarkPrice marketAddress={marketAddress} />
              <LiqPrice
                id={id}
                position={position}
                marketAddress={marketAddress}
                entryPrice={entryPrice}
                sizeInUsd={sizeInUsd}
                collateralAmount={collateralAmount}
                collateralTokenAddress={collateralTokenAddress}
                isLong={isLong}
              />
            </>
          );
        },
        meta: {
          headerClassName: 'min-w-40 w-[13%]',
        },
      },
      {
        id: 'tpSl',
        header: t`TP/SL Price`,
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const position = getValue() as Position;
          const { marketAddress, isLong, collateralTokenAddress } = position;
          return (
            <TpSl
              position={position}
              marketAddress={marketAddress}
              isLong={isLong}
              collateralTokenAddress={collateralTokenAddress}
              onOpenTpSlOrdersDialog={onOpenTpSlOrdersDialog}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-45 w-[14%]',
        },
      },
      {
        id: 'actions',
        header: ({ table }) => {
          const positions = table.getRowModel().rows.map((v) => v.original);
          return (
            <CloseAll positions={positions} onCloseAll={onCloseAll}></CloseAll>
          );
        },
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { id, marketAddress } = getValue() as Position;
          return (
            <Close id={id} marketAddress={marketAddress} onClose={onClose} />
          );
        },
        meta: {
          headerClassName: 'w-[8%] min-w-20',
        },
      },
    ] as ColumnDef<Position>[];
  }, [
    onClose,
    onCloseAll,
    onEditCollateral,
    onOpenShareDialog,
    onShowOrders,
    onOpenTpSlOrdersDialog,
    coins,
    t,
  ]);
};
