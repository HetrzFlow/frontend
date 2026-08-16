'use client';

import { useLingui } from '@lingui/react/macro';

import { CoinIcon } from '@repo/common/components';
import { cn } from '@repo/ui';
import type { SwapHistoryRecord } from '@/services/rest/swap';

import {
  getSwapHistoryAmounts,
  getSwapHistoryPair,
} from './model';
import SwapHistoryExplorerLink from './SwapHistoryExplorerLink';

function SwapActivityRow({ record }: { record: SwapHistoryRecord }) {
  const { t } = useLingui();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <CoinIcon
          src={record.payToken.logoUri}
          alt={record.payToken.symbol}
          size={24}
          className="shrink-0"
        />
        <span className="text-t-1100 text-sm font-medium">
          {getSwapHistoryPair(record)}
        </span>
        <span className="bg-accent/10 text-accent rounded-sm px-2 py-0.5 text-xs">
          {t`Swap Succeeded`}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-t-350">{t`Value`}</span>
        <span className="text-t-1100">{getSwapHistoryAmounts(record)}</span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-t-350">{t`Time / Hash`}</span>
        <SwapHistoryExplorerLink
          txHash={record.txHash}
          timestampMs={record.timestampMs}
        />
      </div>
    </div>
  );
}

export default function SwapActivityList({
  records,
}: {
  records: SwapHistoryRecord[];
}) {
  return (
    <div className="border-border flex flex-col rounded-xl border p-3">
      {records.map((record, index) => (
        <div
          key={record.id}
          className={cn(index > 0 ? 'border-border mt-3 border-t pt-3' : '')}
        >
          <SwapActivityRow record={record} />
        </div>
      ))}
    </div>
  );
}
