'use client';

import { useLingui } from '@lingui/react/macro';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import type { GenesisRank } from '@/services/rest/genesis';

export const GenesisRankLabel = ({ rank }: { rank?: GenesisRank | null }) => {
  const { t } = useLingui();

  if (!rank) return '--';
  if (rank.type === 'exact') {
    const rankNumber = rank.rank;
    return `#${truncateFormat(rankNumber, 0)}`;
  }

  const percentileText = percentFormat(rank.percentile / 100, 0);
  return t`Top ${percentileText}`;
};
