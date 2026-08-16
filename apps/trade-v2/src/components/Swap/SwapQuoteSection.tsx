'use client';

import { useState, type ReactNode } from 'react';

import { useLingui } from '@lingui/react/macro';

import { percentFormat } from '@repo/lib/format';
import {
  Button,
  InfoCircleIcon,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from '@repo/ui';
import { Slippage } from '@/common';
import { useIsConnect } from '@/common/chainClient/hooks';
import ConnectBtn from '@/common/components/ConnectBtn';
import { SWAP_SLIPPAGE_OPTIONS } from '@/common/components/slippageState';

import HighPriceDifferenceAlert from './HighPriceDifferenceAlert';
import CaretUpIcon from './icons/CaretUp';
import PythIcon from './icons/Pyth';
import RateSwapIcon from './icons/RateSwap';
import SwapProgressIcon from './icons/SwapProgress';
import SwapQuoteProgressIcon from './icons/SwapQuoteProgress';
import { swapMessages, translateSwapMessage } from './messages';
import { RouteRow } from './Route';
import { getSwapPrimaryAction, type SwapPanelVariant } from './swapPanelModel';
import type { SwapPanelController } from './useSwapPanel';

type QuoteModel = SwapPanelController['model']['quote'];
type ActionButtonModel = SwapPanelController['model']['actionButton'];
type SwapPanelActions = SwapPanelController['actions'];

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

export const SwapQuoteSection = ({
  variant,
  model,
  actionButton,
  actionButtonClassName,
  detailsInitiallyOpen = false,
  actions,
}: {
  variant: SwapPanelVariant;
  model: QuoteModel;
  actionButton: ActionButtonModel;
  actionButtonClassName?: string;
  detailsInitiallyOpen?: boolean;
  actions: Pick<
    SwapPanelActions,
    'setSlippage' | 'toggleRateDirection' | 'refreshQuote' | 'submit'
  >;
}) => {
  const { i18n, t } = useLingui();
  const [detailsOpen, setDetailsOpen] = useState(detailsInitiallyOpen);
  const [progressKey, setProgressKey] = useState(0);
  const isConnected = useIsConnect();
  const primaryAction = getSwapPrimaryAction(isConnected, model.payAmount);
  const showQuoteSkeleton = model.isLoading && !model.receiveAmount;
  const staleQuoteClassName =
    model.isLoading && model.receiveAmount ? 'opacity-50' : undefined;
  const primaryButtonClassName = cn(
    'w-full transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-[1ms]',
    variant === 'widget' && 'disabled:bg-bg-4 disabled:hover:bg-bg-4',
    actionButtonClassName,
  );

  return (
    <>
      <div className="flex flex-col">
        {primaryAction !== 'connect-wallet' ? (
          <Button
            type="button"
            variant="accent"
            disabled={primaryAction === 'enter-amount' || actionButton.disabled}
            aria-busy={actionButton.status === 'loading'}
            className={primaryButtonClassName}
            onClick={() => void actions.submit()}
          >
            {actionButton.status === 'insufficient-gas' ? (
              i18n._(swapMessages.insufficientBnb)
            ) : primaryAction === 'enter-amount' ? (
              i18n._(swapMessages.enterAmount)
            ) : actionButton.status === 'insufficient' &&
              actionButton.payTokenSymbol ? (
              translateSwapMessage(i18n, swapMessages.insufficientToken, {
                token: actionButton.payTokenSymbol,
              })
            ) : actionButton.status === 'loading' ? (
              <>
                <SwapQuoteProgressIcon aria-hidden="true" />
                {t`Fetching quote…`}
              </>
            ) : actionButton.status === 'submitting' ? (
              t`Swapping…`
            ) : actionButton.status === 'approve' &&
              actionButton.payTokenSymbol ? (
              `${t`Approve`} ${actionButton.payTokenSymbol}`
            ) : actionButton.status === 'confirm' ? (
              t`Confirm Swap`
            ) : actionButton.status === 'unavailable' ? (
              t`Quote unavailable`
            ) : (
              t`Swap`
            )}
          </Button>
        ) : (
          <ConnectBtn className={primaryButtonClassName}>
            {i18n._(swapMessages.connectWallet)}
          </ConnectBtn>
        )}
        {!model.isLoading && model.priceDifference.isHigh ? (
          <HighPriceDifferenceAlert
            difference={model.priceDifference.percentage}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <InfoRow label={t`Slippage`}>
          <Slippage
            type="text"
            value={model.slippage}
            triggerLabel={percentFormat(model.slippage, 2, {
              stripTrailingZeros: true,
            })}
            onValueChange={actions.setSlippage}
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
        <InfoRow label={t({ message: 'Rate', context: 'Swap' })}>
          <div className={staleQuoteClassName}>
            {showQuoteSkeleton ? (
              <Skeleton className="h-3 w-20 rounded-sm" />
            ) : model.rate !== '--' && model.payToken && model.receiveToken ? (
              <span className="inline-flex items-center gap-1">
                <span>
                  1{' '}
                  {model.isRateInverted
                    ? model.receiveToken.symbol
                    : model.payToken.symbol}
                </span>
                <button
                  type="button"
                  className="text-accent inline-flex shrink-0"
                  aria-label={t`Invert rate`}
                  onClick={actions.toggleRateDirection}
                >
                  <RateSwapIcon />
                </button>
                <span>
                  {model.rate}{' '}
                  {model.isRateInverted
                    ? model.payToken.symbol
                    : model.receiveToken.symbol}
                </span>
              </span>
            ) : (
              '-'
            )}
          </div>
        </InfoRow>
        <InfoRow label={t`Fee`}>-</InfoRow>

        <div className="border-border overflow-hidden rounded-xl border text-xs">
          <div className="flex h-10 items-stretch px-3">
            <button
              type="button"
              className="text-t-270 flex min-w-0 flex-1 items-center text-left"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((open) => !open)}
            >
              {t`Swap Details`}
            </button>
            <button
              type="button"
              data-swap-quote-refresh
              className="text-accent flex h-full items-center px-1 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t`Refresh quote`}
              disabled={model.disabled}
              onClick={() => {
                setProgressKey((key) => key + 1);
                actions.refreshQuote();
              }}
            >
              <SwapProgressIcon key={progressKey} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="flex h-full items-center pl-1"
              aria-label={detailsOpen ? t`Collapse` : t`Expand`}
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((open) => !open)}
            >
              <CaretUpIcon
                className={cn(
                  'text-white transition-transform duration-300 ease-in-out',
                  !detailsOpen && 'rotate-180',
                )}
              />
            </button>
          </div>
          <div
            aria-hidden={!detailsOpen}
            inert={!detailsOpen}
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none',
              detailsOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                className={cn(
                  'flex flex-col gap-2 px-3 pb-2',
                  staleQuoteClassName,
                )}
              >
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
                          className="bg-bg-4 flex w-80 max-w-[calc(100vw-32px)] flex-col gap-2 rounded-xl p-2 text-xs/[1.2]"
                          arrowClassName="hidden"
                        >
                          <p className="text-t-1100">
                            {model.priceDifference.status === 'market-closed'
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
                  {showQuoteSkeleton ? (
                    <Skeleton className="h-3 w-20 rounded-sm" />
                  ) : model.priceDifference.status === 'within' ? (
                    translateSwapMessage(i18n, swapMessages.withinDifference, {
                      difference: model.priceDifference.percentage,
                    })
                  ) : model.priceDifference.status === 'worse' ? (
                    translateSwapMessage(i18n, swapMessages.worseThanPyth, {
                      difference: model.priceDifference.percentage,
                    })
                  ) : (
                    '-'
                  )}
                </InfoRow>
                <InfoRow label={t`Minimum Received`}>
                  {showQuoteSkeleton ? (
                    <Skeleton className="h-3 w-20 rounded-sm" />
                  ) : (
                    model.minimumReceived
                  )}
                </InfoRow>
                {showQuoteSkeleton ? (
                  <InfoRow label={t`Route`}>
                    <Skeleton className="h-3 w-20 rounded-sm" />
                  </InfoRow>
                ) : (
                  <RouteRow
                    status={model.routeStatus}
                    streams={model.routeStreams}
                    summary={model.routeSummary}
                    payToken={model.payToken}
                    receiveToken={model.receiveToken}
                    payAmount={model.payAmount}
                    receiveAmount={model.receiveAmount}
                    disabled={model.disabled}
                    variant={variant}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
