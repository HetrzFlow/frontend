import { FC } from 'react';
import Image from 'next/image';
import { cn } from '@repo/ui';
import { LEADERBOARD_ASSET_BASE, resolveLeaderboardRankBadge } from './display';

interface RankBadgeProps {
  rank: number;
  className?: string;
}

export const RankBadge: FC<RankBadgeProps> = ({ rank, className }) => {
  const badge = resolveLeaderboardRankBadge(rank);

  if (badge.kind === 'text') {
    return (
      <span
        className={cn(
          'block w-7 text-center text-[13px] leading-normal tracking-[-0.52px] text-white md:w-7',
          className,
        )}
      >
        {badge.value}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'relative block h-3 w-10 md:mx-auto md:w-[25.6px]',
        className,
      )}
    >
      <Image
        src={`${LEADERBOARD_ASSET_BASE}/rank-${badge.rank}-mobile.svg`}
        alt=""
        width={40}
        height={12}
        className="h-3 w-10 md:hidden"
      />
      <Image
        src={`${LEADERBOARD_ASSET_BASE}/rank-${badge.rank}-desktop.svg`}
        alt=""
        width={26}
        height={12}
        className="hidden h-3 w-[25.6px] md:block"
      />
    </span>
  );
};
