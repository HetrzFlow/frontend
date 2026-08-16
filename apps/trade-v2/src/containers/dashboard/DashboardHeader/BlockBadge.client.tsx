'use client';

import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { useLingui } from '@lingui/react/macro';
import { dateFormat } from '@repo/lib/format';
import { useHzSdk } from '@/common/chainClient/hooks';
import type { DashboardCheckpoint } from '@/services/rest/dashboard';

export interface BlockBadgeProps {
  checkpoint: DashboardCheckpoint | null;
}

export const BlockBadge = ({ checkpoint }: BlockBadgeProps) => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';

  if (!checkpoint) return null;

  const blockHref = explorerHost
    ? `${explorerHost}/block/${checkpoint.block_number}`
    : '';

  return (
    <div className="text-t-270 flex items-center gap-1 rounded-[20px] text-sm md:mb-3">
      <div>{t`Block`}</div>
      {blockHref ? (
        <a
          href={blockHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-up hover:text-up/70 transition-[color]"
        >
          #{checkpoint.block_number}
        </a>
      ) : (
        <span className="text-up">#{checkpoint.block_number}</span>
      )}
      <div>{`(${dateFormat(checkpoint.block_timestamp * 1000, 'yyyy/MM/dd HH:mm:ss')})`}</div>
    </div>
  );
};
