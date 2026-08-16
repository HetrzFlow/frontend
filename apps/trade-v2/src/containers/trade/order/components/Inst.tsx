'use client';

import { FC, useEffect, useState } from 'react';
import { ROUND_MODE } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, CreditIcon, HyperLevIcon } from '@repo/ui';
import { CREDIT_MARKET_CATEGORY, useGlobalStore, useInstStore } from '@/common';

interface InstProps {
  instId?: string;
  marketAddress?: string;
  fallbackName?: string;
  isLong: boolean;
  lever?: string;
  isHyper?: boolean; // Hyper mode flag
  isCreditMarket?: boolean;
}

const Inst: FC<InstProps> = ({
  instId,
  marketAddress,
  fallbackName,
  isLong,
  lever,
  isHyper = false,
  isCreditMarket,
}) => {
  const [mounted, setMounted] = useState(false);
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[instId || marketAddress || ''];
  const showCreditMarker =
    isCreditMarket ?? inst?.category === CREDIT_MARKET_CATEGORY;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'flex h-8 w-[3px] items-center justify-center rounded-full',
          isLong ? 'bg-up' : 'bg-down',
        )}
      />
      <div className="flex flex-col items-start justify-between gap-0.5">
        <div className="flex items-center gap-1">
          {mounted && inst?.name ? (
            <span>{inst?.name}</span>
          ) : (
            <span>{fallbackName || instId || '-'}</span>
          )}
        </div>
        {(showCreditMarker || isHyper || lever) && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-[10px]',
              isHyper
                ? 'bg-hyper-lev/10 text-hyper-lev rounded-sm px-1 py-0.5'
                : 'text-t-270',
            )}
          >
            {isHyper && <HyperLevIcon size={14} />}
            {lever && (
              <span>{`${truncateFormat(lever, leverDecimal, {
                stripTrailingZeros: true,
                round: ROUND_MODE.ROUND,
              })}x`}</span>
            )}
            {showCreditMarker && (
              <CreditIcon size={12} className="text-accent shrink-0" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inst;
