'use client';

import { FC, ReactNode, useEffect, useState } from 'react';

import { ROUND_MODE } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import {
  cn,
  CreditIcon,
  HyperLevIcon,
  Separator,
  TrendingDownIcon,
  TrendingUpIcon,
} from '@repo/ui';
import { CREDIT_MARKET_CATEGORY, useGlobalStore, useInstStore } from '@/common';

interface InstProps {
  isLong: boolean;
  instId?: string;
  marketAddress?: string;
  fallbackName?: string;
  lever?: string;
  isHyper?: boolean;
  isCreditMarket?: boolean;
  orderType?: ReactNode;
  showSeparator?: boolean;
  children?: ReactNode;
}

const InstSm: FC<InstProps> = ({
  isLong,
  instId,
  marketAddress,
  fallbackName,
  lever,
  isHyper,
  isCreditMarket,
  orderType,
  showSeparator,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[instId || marketAddress || ''];
  const showCreditMarker =
    isCreditMarket ?? inst?.category === CREDIT_MARKET_CATEGORY;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'flex size-5 items-center justify-center rounded-sm',
          isLong ? 'bg-up' : 'bg-down',
        )}
      >
        {isLong ? (
          <TrendingUpIcon size={16} className="text-accent-foreground" />
        ) : (
          <TrendingDownIcon size={16} className="text-accent-foreground" />
        )}
      </div>
      <div className="flex items-center justify-between gap-1.5 text-base font-medium">
        <span className="text-base">
          {mounted ? inst?.name || fallbackName || '' : ''}
        </span>

        {(showCreditMarker || lever) && (
          <>
            {showSeparator && (
              <Separator orientation="vertical" className="!h-4" />
            )}
            <span
              className={cn(
                'flex items-center gap-0.5 text-[10px]',
                isHyper
                  ? 'bg-hyper-lev/10 text-hyper-lev rounded-sm px-1 py-0.5'
                  : 'text-t-270 font-plex',
              )}
            >
              {isHyper && <HyperLevIcon size={14} />}
              {lever &&
                `${truncateFormat(lever, leverDecimal, { stripTrailingZeros: true, round: ROUND_MODE.ROUND })}x`}
              {showCreditMarker && (
                <CreditIcon size={12} className="text-accent shrink-0" />
              )}
            </span>
          </>
        )}
        {orderType && (
          <>
            {showSeparator && (
              <Separator orientation="vertical" className="!h-4" />
            )}
            <span className="text-t-270">{orderType}</span>
          </>
        )}
        {children}
      </div>
    </div>
  );
};

export default InstSm;
