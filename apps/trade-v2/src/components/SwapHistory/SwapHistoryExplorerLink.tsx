'use client';

import { useLingui } from '@lingui/react/macro';

import { ArrowUpRightIcon, cn } from '@repo/ui';

import {
  formatSwapHistoryTimestamp,
  getSwapExplorerHref,
} from './model';

type Props = {
  txHash: string;
  timestampMs: number;
  className?: string;
  timestampClassName?: string;
};

export default function SwapHistoryExplorerLink({
  txHash,
  timestampMs,
  className,
  timestampClassName,
}: Props) {
  const { t } = useLingui();

  return (
    <a
      href={getSwapExplorerHref(txHash)}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        'group/inner flex cursor-pointer items-center justify-end gap-1 text-xs',
        className,
      )}
      aria-label={t`Open transaction`}
    >
      <span className={cn('font-plex justify-end', timestampClassName)}>
        {formatSwapHistoryTimestamp(timestampMs)}
      </span>
      <span className="text-t-430 group-hover/inner:text-t-1100">
        <ArrowUpRightIcon size={16} />
      </span>
    </a>
  );
}
