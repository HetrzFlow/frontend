'use client';

import { useEffect, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { CoinIcon } from '@repo/common/components';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  MEDIA_SIZES,
  Skeleton,
  cn,
  useMediaQuery,
} from '@repo/ui';

import { formatSwapTokenAmount } from './format';
import RouteExpandIcon from './icons/RouteExpand';
import { swapMessages, translateSwapMessage } from './messages';
import { getSwapProvider } from './providerRegistry';
import { RouteSankeyGraph } from './RouteSankeyGraph';
import { shouldLoadRouteTokens } from './routeState';
import {
  getRouteTokenAddresses,
  type RouteTokenLoadStatus,
  useRouteTokens,
} from './useRouteTokens';
import type {
  ExternalSwapRouteStatus,
  getExternalSwapRouteSummary,
} from './routeState';
import type { SwapPanelVariant } from './swapPanelModel';
import type { SwapToken } from './useSwapTokens';
import type { ExternalSwapRouteStream } from '@hertzflow/sdk-v2/types/externalSwap';

type RouteSummary = ReturnType<typeof getExternalSwapRouteSummary>;

const Provider = ({
  code,
  collapsed = false,
}: {
  code: string;
  collapsed?: boolean;
}) => {
  const provider = getSwapProvider(code);
  const ProviderIcon = provider.Icon;

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {ProviderIcon ? (
        <ProviderIcon size={14} className="shrink-0" />
      ) : (
        <Skeleton className="bg-bg-7 size-3.5 shrink-0 rounded-full" />
      )}
      <span className="truncate">
        {collapsed ? provider.familyName : provider.displayName}
      </span>
    </span>
  );
};

const RouteEndpoint = ({
  token,
  amount,
  compact = false,
}: {
  token?: SwapToken;
  amount: string;
  compact?: boolean;
}) =>
  token ? (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1 text-[13px]/[1.2] tracking-[-0.52px]',
        compact && 'max-w-[48%] min-w-0',
      )}
    >
      <CoinIcon src={token.logoURI} alt={token.symbol} size={20} />
      <span className={cn(compact && 'min-w-0 truncate')}>
        {formatSwapTokenAmount(amount || 0)}
      </span>
      <span className="text-t-350 shrink-0">{token.symbol}</span>
    </div>
  ) : (
    <Skeleton className="bg-bg-7 h-5 w-24 rounded-lg" />
  );

type RouteDetailsProps = {
  streams: ExternalSwapRouteStream[];
  payToken?: SwapToken;
  receiveToken?: SwapToken;
  payAmount: string;
  receiveAmount: string;
  open: boolean;
  mobile?: boolean;
  tokenByAddress: Record<string, SwapToken>;
  statusByAddress: Record<string, RouteTokenLoadStatus>;
};

const RouteDetails = ({
  streams,
  payToken,
  receiveToken,
  payAmount,
  receiveAmount,
  mobile = false,
  tokenByAddress,
  statusByAddress,
}: RouteDetailsProps) => {
  const { i18n, t } = useLingui();
  const n = streams.length;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col gap-3 overflow-hidden',
        mobile
          ? 'min-h-0 max-w-full min-w-0 flex-1 overflow-hidden'
          : 'w-full min-w-0',
      )}
    >
      <div
        className={cn(
          'flex items-start justify-between gap-6',
          mobile && 'pr-8',
        )}
      >
        <DialogTitle className="text-base/[normal] font-semibold">
          {t`Route`}
        </DialogTitle>
        {mobile ? (
          <div className="bg-bg-4 flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-xs tracking-[-0.48px]">
            <span className="shrink-0">
              {translateSwapMessage(i18n, swapMessages.routeStreams, { n })}
            </span>
            <span className="text-t-350 truncate">
              {payToken?.symbol} &gt; {receiveToken?.symbol}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center justify-between gap-3">
        <RouteEndpoint token={payToken} amount={payAmount} compact={mobile} />
        <RouteEndpoint
          token={receiveToken}
          amount={receiveAmount}
          compact={mobile}
        />
      </div>

      <div
        className={cn(
          'flex min-h-0 w-full min-w-0 overflow-hidden',
          mobile && 'flex-1',
        )}
      >
        <RouteSankeyGraph
          streams={streams}
          tokenByAddress={tokenByAddress}
          statusByAddress={statusByAddress}
          constrained
        />
      </div>
    </div>
  );
};

const DesktopRouteDialog = (props: RouteDetailsProps) => (
  <DialogContent
    data-swap-launcher-child-layer
    position="center"
    className="font-borna bg-bg-3 !flex max-h-[min(652px,calc(100dvh-32px))] !w-[677px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-2xl p-3"
    aria-describedby={undefined}
  >
    <RouteDetails {...props} />
  </DialogContent>
);

const RouteDialog = (props: RouteDetailsProps) => (
  <DialogContent
    data-swap-launcher-child-layer
    position="center"
    className="font-borna bg-bg-3 !flex max-h-[min(400px,calc(100dvh-32px))] !w-[calc(100vw-32px)] !max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-2xl p-3 md:hidden"
    aria-describedby={undefined}
  >
    <RouteDetails {...props} mobile />
  </DialogContent>
);

export const RouteRow = ({
  status,
  streams,
  summary,
  payToken,
  receiveToken,
  payAmount,
  receiveAmount,
  disabled,
}: {
  status: ExternalSwapRouteStatus;
  streams: ExternalSwapRouteStream[];
  summary: RouteSummary;
  payToken?: SwapToken;
  receiveToken?: SwapToken;
  payAmount: string;
  receiveAmount: string;
  disabled: boolean;
  variant: SwapPanelVariant;
}) => {
  const { t } = useLingui();
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const [open, setOpen] = useState(false);
  const canExpand = status === 'ready' && !!summary?.canExpand;
  const canKeepOpen = status === 'ready' && streams.length > 0;
  const knownTokens = [payToken, receiveToken].filter(
    (token): token is SwapToken => !!token,
  );
  const routeTokenKey = getRouteTokenAddresses(streams, knownTokens).join(',');
  const [idleRouteKey, setIdleRouteKey] = useState<string>();
  const loadRouteTokens = shouldLoadRouteTokens({
    open,
    routeKey: routeTokenKey,
    idleRouteKey,
  });
  const { tokenByAddress, statusByAddress } = useRouteTokens({
    streams,
    payToken,
    receiveToken,
    enabled: canKeepOpen && loadRouteTokens,
  });

  useEffect(() => {
    if (
      !canKeepOpen ||
      !routeTokenKey ||
      typeof window.requestIdleCallback !== 'function'
    ) {
      return;
    }

    const callbackId = window.requestIdleCallback(() => {
      setIdleRouteKey(routeTokenKey);
    });

    return () => window.cancelIdleCallback(callbackId);
  }, [canKeepOpen, routeTokenKey]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(false);
    } else if (canExpand && !disabled) {
      setOpen(true);
    }
  };

  const expandButton = (
    <button
      type="button"
      className={`text-accent inline-flex size-3.5 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 ${summary?.canExpand ? '' : 'invisible'}`}
      aria-label={t`View route details`}
      disabled={!summary?.canExpand || disabled}
      onClick={isMobile ? () => handleOpenChange(true) : undefined}
    >
      <RouteExpandIcon />
    </button>
  );

  let value: React.ReactNode = <span className="text-t-430">--</span>;
  if (status === 'finding') {
    value = <span className="text-t-430">{t`Finding route…`}</span>;
  } else if (status === 'no-route') {
    value = <span className="text-t-430">{t`No route`}</span>;
  } else if (status === 'error') {
    value = <span className="text-t-430">{t`Quote unavailable`}</span>;
  } else if (status === 'ready' && summary) {
    value = (
      <span className="inline-flex min-w-0 items-center gap-1">
        <Provider code={summary.mainProviderCode} collapsed />
        {summary.extraStreamCount > 0 ? (
          <span className="text-t-350">+{summary.extraStreamCount}</span>
        ) : null}
        {summary.canExpand || open ? (
          isMobile ? (
            expandButton
          ) : (
            <DialogTrigger asChild>{expandButton}</DialogTrigger>
          )
        ) : null}
      </span>
    );
  }

  const row = (
    <div className="flex h-[17px] items-center justify-between gap-4 text-xs">
      <span className="text-t-270">{t`Route`}</span>
      <span className="min-w-0 text-right">{value}</span>
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={open && canKeepOpen} onOpenChange={handleOpenChange}>
        {row}
        {canKeepOpen ? (
          <RouteDialog
            streams={streams}
            payToken={payToken}
            receiveToken={receiveToken}
            payAmount={payAmount}
            receiveAmount={receiveAmount}
            open={open}
            tokenByAddress={tokenByAddress}
            statusByAddress={statusByAddress}
          />
        ) : null}
      </Dialog>
    );
  }

  return (
    <Dialog open={open && canKeepOpen} onOpenChange={handleOpenChange}>
      {row}
      {canKeepOpen ? (
        <DesktopRouteDialog
          streams={streams}
          payToken={payToken}
          receiveToken={receiveToken}
          payAmount={payAmount}
          receiveAmount={receiveAmount}
          open={open}
          tokenByAddress={tokenByAddress}
          statusByAddress={statusByAddress}
        />
      ) : null}
    </Dialog>
  );
};
