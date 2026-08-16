import { useMemo } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { msg } from '@lingui/core/macro';
import { i18n } from '@repo/i18n/client';

import { dateFormat } from '@repo/lib/format';
import { ArrowUpRightIcon } from '@repo/ui';
import { useHzSdk, type HistoryRecord } from '@/common';
import Collateral from '../../components/Collateral';
import Inst from '../../components/Inst';
import Price from '../../components/Price';
import Size from '../../components/Size';
import TreeFilter from '../../components/TreeFilter';
import EventType from '../EventType';
import HistoryFee from '../Fee';
import { useHistoryActionFilter } from '../historyActionFilter';
import PnL, { getHistoryPnlPercent } from '../PnL';
import type { HistorySharePayload } from '../types';
import type { ColumnDef } from '@tanstack/react-table';

const ActionFilterHeader = () => {
  const { label, value, options, onValueChange } = useHistoryActionFilter();

  return (
    <TreeFilter
      label={label}
      value={value}
      options={options}
      onValueChange={onValueChange}
    />
  );
};

export const useColumns = ({
  onOpenShareDialog,
}: {
  onOpenShareDialog?: (payload: HistorySharePayload) => void;
} = {}) => {
  const hzSdk = useHzSdk();
  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';
  return useMemo(() => {
    return [
      {
        accessorKey: 'index_coin',
        header: i18n._(msg`Symbol`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            instId,
            market_symbol,
            is_long,
            leverage,
            is_zfp,
            isCreditMarket,
          } = getValue() as HistoryRecord;
          return (
            <Inst
              instId={instId}
              fallbackName={market_symbol}
              isLong={is_long}
              lever={leverage || undefined}
              isHyper={is_zfp}
              isCreditMarket={isCreditMarket}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-35 w-[11%]',
        },
      },
      {
        id: 'action',
        header: () => <ActionFilterHeader />,
        accessorFn: (row) => row,
        filterFn: () => {
          return true;
        },
        cell: ({ getValue }) => {
          const { action_type } = getValue() as HistoryRecord;
          return <EventType value={action_type} />;
        },
        meta: {
          headerClassName: 'min-w-50 w-[14%]',
        },
      },

      {
        accessorKey: 'size_delta',
        header: i18n._(msg`Size`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { size_delta_usd } = getValue() as HistoryRecord;

          return (
            <Size size={size_delta_usd} showSign className="text-t-1100" />
          );
        },
        meta: {
          headerClassName: 'min-w-25 w-[10%]',
        },
      },
      {
        accessorKey: 'collateral_delta',
        header: i18n._(msg`Collateral`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            collateral_delta_amount,
            collateral_token_address,
            collateralTokenPx,
            is_zfp,
            loss_rebate_usd,
            instId,
          } = getValue() as HistoryRecord;
          return (
            <Collateral
              collateralAmount={collateral_delta_amount}
              collateralTokenAddress={collateral_token_address}
              marketAddress={instId}
              showSign
              price={collateralTokenPx}
              isHyper={is_zfp}
              lossRebateUsd={loss_rebate_usd}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-25 w-[10%]',
        },
      },
      {
        accessorKey: 'entry_price',
        header: i18n._(msg`Entry Price`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { entry_price, market_address } = getValue() as HistoryRecord;
          return entry_price ? (
            <Price marketAddress={market_address} price={entry_price} />
          ) : (
            <span className="text-t-430">-</span>
          );
        },
        meta: {
          headerClassName: 'min-w-30 w-[9%]',
        },
      },
      {
        accessorKey: 'fee',
        header: i18n._(msg`Fees`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const row = getValue() as HistoryRecord;

          return (
            <HistoryFee
              actionType={row.action_type}
              isHyper={row.is_zfp}
              openCloseFeeUsd={row.open_close_fee_usd}
              originalOpenCloseFeeUsd={row.original_open_close_fee_usd}
              fundingFeeUsd={row.funding_fee_usd}
              borrowingFeeUsd={row.borrowing_fee_usd}
              priceImpactUsd={row.price_impact_usd}
              liquidationFeeUsd={row.liquidation_fee}
            />
          );
        },
        meta: {
          headerClassName: 'min-w-25 w-[9%]',
        },
      },
      {
        accessorKey: 'exit_price',
        header: i18n._(msg`Exit Price`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const {
            exit_price,
            liquidation_price,
            execution_price,
            market_address,
            isOpen,
            order_type,
          } = getValue() as HistoryRecord;
          const isLiquidation = order_type === 'liquidated';
          const resolvedExitPrice = isLiquidation
            ? liquidation_price || exit_price || execution_price
            : exit_price || execution_price;
          return !isOpen && resolvedExitPrice ? (
            <Price marketAddress={market_address} price={resolvedExitPrice} />
          ) : (
            <span className="text-t-430">-</span>
          );
        },
        meta: {
          headerClassName: 'min-w-30 w-[9%]',
        },
      },
      {
        accessorKey: 'pnl',
        header: i18n._(msg`PnL`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const row = getValue() as HistoryRecord;
          const {
            uncapped_base_pnl_usd,
            initialCollateralAmount,
            collateralTokenPx,
            collateral_delta_amount,
            execution_price,
            instId,
            is_long,
            hasPnl,
            is_zfp,
            liquidation_fee,
            loss_rebate_usd,
            price_impact_usd,
            referral_trader_discount_amount,
            size_delta_usd,
            size_in_usd,
            totalFeeUsd,
            entry_price,
            exit_price,
            leverage,
            profit_sharing_usd,
          } = row;

          if (!hasPnl) {
            return <span className="text-t-430">--</span>;
          }

          return (
            <PnL
              isClose
              isHyper={is_zfp}
              initialCollateralAmount={initialCollateralAmount}
              collateralDeltaAmount={collateral_delta_amount}
              collateralTokenPx={collateralTokenPx}
              sizeDeltaUsd={size_delta_usd}
              sizeInUsd={size_in_usd}
              uncappedBasePnlUsd={uncapped_base_pnl_usd}
              priceImpactUsd={price_impact_usd}
              liquidationFee={liquidation_fee}
              feesUsd={totalFeeUsd}
              feeDiscountUsd={referral_trader_discount_amount}
              lossRebateUsd={loss_rebate_usd}
              marketAddress={instId}
              profitSharingUsd={profit_sharing_usd}
              onOpenShareDialog={
                onOpenShareDialog
                  ? (pnl: string) =>
                      onOpenShareDialog({
                        pnlUsd: pnl,
                        pnlPercent: getHistoryPnlPercent({
                          pnl: pnl,
                          initialCollateralAmount,
                          collateralTokenPx,
                          sizeDeltaUsd: size_delta_usd,
                          sizeInUsd: size_in_usd,
                        }),
                        isLong: is_long,
                        marketAddress: instId,
                        entryPrice: entry_price,
                        exitPrice: exit_price || execution_price,
                        sizeDeltaUsd: size_delta_usd,
                        collateralDeltaAmount: collateral_delta_amount,
                        collateralTokenPx,
                        leverage,
                        isZFP: is_zfp,
                      })
                  : undefined
              }
            />
          );
        },
        meta: {
          headerClassName: 'min-w-25 w-[9%]',
        },
      },
      {
        accessorKey: 'timestamp',
        header: i18n._(msg`Time / Hash`),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const { action_time_ms, tx_hash } = getValue() as HistoryRecord;

          return (
            <a
              href={`${explorerHost}/tx/${tx_hash}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={
                'group/inner flex cursor-pointer items-center justify-end gap-1 text-xs'
              }
            >
              <span className="font-plex justify-end">
                {dateFormat(action_time_ms, 'yyyy/MM/dd HH:mm:ss')}
              </span>
              <span className="text-t-430 group-hover/inner:text-t-1100">
                <ArrowUpRightIcon size={16} />
              </span>
            </a>
          );
        },
        meta: {
          headerClassName: 'min-w-45 w-[16%]',
        },
      },
    ] as ColumnDef<HistoryRecord>[];
  }, [explorerHost, onOpenShareDialog]);
};
