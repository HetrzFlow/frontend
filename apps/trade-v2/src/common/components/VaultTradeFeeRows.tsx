'use client';

import { type Key, type ReactNode, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  ArrowLeftRightIcon,
  Button,
  cn,
  CountdownCircle,
  SkeletonLayout,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';

interface VaultTradeFeeRowsProps {
  direction: 'deposit' | 'withdraw';
  baseTokenName: string;
  quoteTokenName: string;
  directRate: string | null;
  reverseRate: string | null;
  isRateLoading?: boolean;
  isRateUnavailable?: boolean;
  onRateRefresh: () => void;
  rateRefreshKey: Key;
  rateRefreshDuration: number;
  feeValue?: ReactNode;
  slippageControl: ReactNode;
  inDialog?: boolean;
  collisionBoundary?: Element | null;
}

const VaultTradeFeeRows = ({
  direction,
  baseTokenName,
  quoteTokenName,
  directRate,
  reverseRate,
  isRateLoading = false,
  isRateUnavailable = false,
  onRateRefresh,
  rateRefreshKey,
  rateRefreshDuration,
  feeValue,
  slippageControl,
  inDialog,
  collisionBoundary,
}: VaultTradeFeeRowsProps) => {
  const { t } = useLingui();
  const [reversal, setReversal] = useState<{
    direction: VaultTradeFeeRowsProps['direction'];
    value: boolean;
  }>({
    direction,
    value: direction === 'withdraw',
  });
  const isReversed =
    reversal.direction === direction
      ? reversal.value
      : direction === 'withdraw';
  const displayedRate = isReversed ? reverseRate : directRate;
  const payingToken = isReversed ? quoteTokenName : baseTokenName;
  const receivingToken = isReversed ? baseTokenName : quoteTokenName;

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-t-270">{t`Rate`}</div>
        <div className="font-plex flex items-center justify-end gap-2">
          {isRateLoading ? (
            <div
              className={cn(
                'bg-bg-3 size-[14px] animate-pulse rounded-full',
                inDialog && 'bg-bg-4',
              )}
            />
          ) : isRateUnavailable ? (
            <span className="text-t-430">{t`Unavailable`}</span>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRateRefresh}
              aria-label={t`Refresh rate`}
              className="text-accent hover:text-accent size-[14px] p-0 hover:bg-transparent hover:opacity-90"
            >
              <CountdownCircle
                key={rateRefreshKey}
                size={14}
                duration={rateRefreshDuration}
              />
            </Button>
          )}

          <span>1 {payingToken}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setReversal({ direction, value: !isReversed })}
            aria-label={t`Reverse rate`}
            className="text-accent hover:text-accent size-[14px] p-0 hover:bg-transparent"
          >
            <ArrowLeftRightIcon size={14} />
          </Button>

          {isRateLoading ? (
            <SkeletonLayout
              isLoading
              className={cn('h-[14.4px] w-[65px]', inDialog && 'bg-bg-4')}
            >
              <span />
            </SkeletonLayout>
          ) : isRateUnavailable || displayedRate === null ? (
            <span className="text-t-430 min-w-[65px]">{t`Unavailable`}</span>
          ) : (
            <span className="min-w-[65px]">
              {displayedRate} {receivingToken}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-t-270">{t`Fees`}</div>
        {feeValue === undefined ? (
          <SkeletonLayout
            isLoading
            className={cn('h-[14.4px] w-[52px]', inDialog && 'bg-bg-4')}
          >
            <span />
          </SkeletonLayout>
        ) : (
          <div className="font-plex">{feeValue}</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger className="decoration-t-430 text-t-270 underline decoration-dotted underline-offset-3">
            {t`Slippage`}
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="w-[224px]"
            inDialog={inDialog}
            collisionBoundary={collisionBoundary}
            collisionPadding={0}
          >
            <p>
              {t`Slippage below 1% in versatile markets may cause failed execution and gas loss.`}
            </p>
          </TooltipContent>
        </Tooltip>
        {slippageControl}
      </div>
    </div>
  );
};

export default VaultTradeFeeRows;
