import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { useLingui } from '@lingui/react/macro';
import { Loading } from '@repo/ui';
import type { HistoryRecord } from '@/common';

import { getHistoryPnlPercent } from '../PnL';
import OrderItem from './OrderItem';
import type { HistorySharePayload } from '../types';

interface HistoryRecordsProps {
  isLoading: boolean;
  data: HistoryRecord[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalPages: number;
  onOpenShareDialog: (payload: HistorySharePayload) => void;
}

const HistoryRecordsSm: FC<HistoryRecordsProps> = ({
  isLoading,
  data,
  currentPage,
  setCurrentPage,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  totalPages,
  onOpenShareDialog,
}) => {
  const { t } = useLingui();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const canLoadMore = hasNextPage || currentPage < totalPages;

  const handleLoadMore = useCallback(() => {
    if (isLoading || isFetchingNextPage || !canLoadMore) return;

    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      return;
    }

    fetchNextPage();
    setCurrentPage((prev) => prev + 1);
  }, [
    canLoadMore,
    currentPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    setCurrentPage,
    totalPages,
  ]);

  useEffect(() => {
    if (!canLoadMore || isLoading || isFetchingNextPage) return;

    const sentinel = sentinelRef.current;
    const scrollRoot = document.getElementById('historyRecords');
    if (
      !sentinel ||
      !scrollRoot ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    let requested = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || requested) return;
        requested = true;
        handleLoadMore();
      },
      {
        root: scrollRoot,
        rootMargin: '160px 0px 240px 0px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, handleLoadMore, isFetchingNextPage, isLoading]);

  if (isLoading) {
    return <Loading className="h-20 rounded-xl bg-transparent" />;
  }

  if (!data.length) {
    return (
      <div className={'text-t-350 mt-6 h-20 text-center text-sm'}>
        {t`No trading activities found.`}
      </div>
    );
  }

  return (
    <>
      {data.map(
        ({
          instId,
          market_symbol,
          log_index,
          tx_hash,
          uncapped_base_pnl_usd,
          initialCollateralAmount,
          totalFeeUsd,
          referral_trader_discount_amount,
          open_close_fee_usd,
          original_open_close_fee_usd,
          funding_fee_usd,
          borrowing_fee_usd,
          collateral_delta_amount,
          collateral_token_address,
          collateralTokenPx,
          action_time_ms,
          liquidation_fee,
          loss_rebate_usd,
          price_impact_usd,
          execution_price,
          entry_price,
          exit_price,
          order_type,
          display_order_type,
          action_type,
          size_delta_usd,
          size_in_usd,
          is_long,
          is_zfp,
          isOpen,
          hasPnl,
          leverage,
          isCreditMarket,
          profit_sharing_usd,
        }) => {
          return (
            <OrderItem
              key={`${tx_hash}_${log_index}`}
              instId={instId}
              marketSymbol={market_symbol}
              digest={tx_hash}
              size={size_delta_usd}
              orderType={display_order_type || order_type}
              eventType={action_type}
              actionType={action_type}
              price={execution_price}
              entryPrice={entry_price}
              exitPrice={exit_price}
              collateralAmount={collateral_delta_amount}
              collateralTokenAddress={collateral_token_address}
              collateralTokenPx={collateralTokenPx}
              feesUsd={totalFeeUsd}
              feeDiscountUsd={referral_trader_discount_amount}
              openCloseFeeUsd={open_close_fee_usd}
              originalOpenCloseFeeUsd={original_open_close_fee_usd}
              fundingFeeUsd={funding_fee_usd}
              borrowingFeeUsd={borrowing_fee_usd}
              isClose={hasPnl}
              isOpen={isOpen}
              isHyper={is_zfp}
              initialCollateralAmount={initialCollateralAmount}
              collateralDeltaAmount={collateral_delta_amount}
              sizeInUsd={size_in_usd}
              uncappedBasePnlUsd={uncapped_base_pnl_usd}
              liquidationFee={liquidation_fee}
              lossRebateUsd={loss_rebate_usd}
              priceImpactUsd={price_impact_usd}
              timestamp={action_time_ms}
              isLong={is_long}
              leverage={leverage}
              isCreditMarket={isCreditMarket}
              profitSharingUsd={profit_sharing_usd}
              onOpenShareDialog={
                hasPnl
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
      )}
      {canLoadMore ? <div ref={sentinelRef} className="h-1" /> : null}
      {isFetchingNextPage ? (
        <Loading className="h-12 rounded-xl bg-transparent" />
      ) : null}
    </>
  );
};

export default HistoryRecordsSm;
