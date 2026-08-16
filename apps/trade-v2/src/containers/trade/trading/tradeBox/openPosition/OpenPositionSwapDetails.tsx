'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { useLingui } from '@lingui/react/macro';
import { percentFormat } from '@repo/lib/format';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  InfoCircleIcon,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from '@repo/ui';
import { Slippage } from '@/common';
import { SWAP_SLIPPAGE_OPTIONS } from '@/common/components/slippageState';
import CaretUpIcon from '@/components/Swap/icons/CaretUp';
import PythIcon from '@/components/Swap/icons/Pyth';
import SwapProgressIcon from '@/components/Swap/icons/SwapProgress';
import { swapMessages, translateSwapMessage } from '@/components/Swap/messages';
import { RouteRow } from '@/components/Swap/Route';
import type { OpenPositionSwapController } from './hooks/useOpenPositionSwap';

const InfoRow = ({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex h-[17px] items-center justify-between gap-4 text-xs">
    <span className="text-t-270">{label}</span>
    <div className="min-w-0 text-right">{children}</div>
  </div>
);

const OpenPositionSwapDetails = ({
  swap,
}: {
  swap: OpenPositionSwapController;
}) => {
  const { i18n, t } = useLingui();
  const [open, setOpen] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    if (swap.isQuoteUnavailable || swap.priceDifference.status === 'worse') {
      setOpen(true);
    }
  }, [swap.isQuoteUnavailable, swap.priceDifference.status]);

  if (!swap.isSwapPayment) return null;

  const showSkeleton = swap.isLoading && !swap.quotedCollateralAmount;
  const staleClassName =
    swap.isLoading && swap.quotedCollateralAmount ? 'opacity-50' : undefined;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {swap.isQuoteUnavailable ? (
        <Alert showClose={false} className="items-start p-2 text-xs">
          <AlertTitle>{t`Quote unavailable`}</AlertTitle>
          <AlertDescription className="text-xs opacity-70">
            {t`No valid swap quote is available. Please try again.`}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="border-border overflow-hidden rounded-xl border text-xs">
        <div className="flex h-10 items-stretch px-3">
          <button
            type="button"
            className="text-t-270 flex min-w-0 flex-1 items-center text-left"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {t`Swap Details`}
          </button>
          <button
            type="button"
            data-swap-quote-refresh
            className="text-accent flex h-full items-center px-1 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={swap.isLoading}
            aria-label={t`Refresh quote`}
            onClick={() => {
              setProgressKey((value) => value + 1);
              void swap.refreshQuote();
            }}
          >
            <SwapProgressIcon key={progressKey} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex h-full items-center pl-1"
            aria-label={open ? t`Collapse` : t`Expand`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <CaretUpIcon
              className={cn(
                'text-white transition-transform duration-300 ease-in-out',
                !open && 'rotate-180',
              )}
            />
          </button>
        </div>
        <div
          aria-hidden={!open}
          inert={!open}
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none',
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={cn('flex flex-col gap-2 px-3 pb-2', staleClassName)}
            >
              <InfoRow label={i18n._(swapMessages.swapSlippage)}>
                <Slippage
                  type="text"
                  value={swap.slippage}
                  triggerLabel={percentFormat(swap.slippage, 2, {
                    stripTrailingZeros: true,
                  })}
                  onValueChange={swap.setSlippage}
                  options={SWAP_SLIPPAGE_OPTIONS}
                  className="text-xs"
                  riskWarning={{
                    lowThreshold: '0.003',
                    highThreshold: '0.01',
                    lowMessage: i18n._(swapMessages.lowSlippageWarning),
                    highMessage: i18n._(swapMessages.highSlippageWarning),
                  }}
                />
              </InfoRow>
              <InfoRow label={i18n._(swapMessages.minCollateral)}>
                {showSkeleton ? (
                  <Skeleton className="h-3 w-20 rounded-sm" />
                ) : swap.isQuoteUnavailable ? (
                  '-'
                ) : (
                  swap.minimumCollateral
                )}
              </InfoRow>
              <InfoRow
                label={
                  <span className="inline-flex items-center gap-1">
                    {t`Price Difference`}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-t-270 hover:text-t-1100 inline-flex shrink-0 items-center"
                          aria-label={t`Price Difference information`}
                        >
                          <InfoCircleIcon size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={4}
                        className="bg-bg-4 flex w-80 max-w-[calc(100vw-32px)] flex-col gap-2 rounded-xl p-2 text-xs"
                        arrowClassName="hidden"
                      >
                        <p className="text-t-1100">
                          {swap.priceDifference.status === 'market-closed'
                            ? i18n.t(swapMessages.referenceMarketClosed)
                            : t`Price difference compares this swap's estimated execution price with the Pyth reference price and may vary with trade size.`}
                        </p>
                        <div className="text-t-270 flex items-center gap-1">
                          <PythIcon className="shrink-0" />
                          <span>{t`Reference price source: Pyth Network`}</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                }
              >
                {showSkeleton ? (
                  <Skeleton className="h-3 w-20 rounded-sm" />
                ) : swap.priceDifference.status === 'within' ? (
                  translateSwapMessage(i18n, swapMessages.withinDifference, {
                    difference: swap.priceDifference.percentage,
                  })
                ) : swap.priceDifference.status === 'worse' ? (
                  translateSwapMessage(i18n, swapMessages.worseThanPyth, {
                    difference: swap.priceDifference.percentage,
                  })
                ) : (
                  '-'
                )}
              </InfoRow>
              {showSkeleton ? (
                <InfoRow label={t`Route`}>
                  <Skeleton className="h-3 w-20 rounded-sm" />
                </InfoRow>
              ) : (
                <RouteRow
                  status={swap.routeStatus}
                  streams={swap.routeStreams}
                  summary={swap.routeSummary}
                  payToken={swap.payToken}
                  receiveToken={swap.receiveToken}
                  payAmount={swap.payAmount}
                  receiveAmount={swap.quotedCollateralAmount}
                  disabled={swap.isLoading}
                  variant="trade"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenPositionSwapDetails;
