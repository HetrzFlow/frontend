import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import { Trans } from '@lingui/react/macro';
import { Skeleton } from '@repo/ui';
import type {
  LeaderboardRow,
  LeaderboardSortBy,
} from '@/services/rest/leaderboard';
import { EMPTY_VALUE, LEADERBOARD_ASSET_BASE, withUsdPrefix } from './display';

interface LeaderboardPodiumProps {
  rows: LeaderboardRow[];
  sortBy: LeaderboardSortBy;
  isLoading?: boolean;
}

interface PodiumRankProps {
  rank: 1 | 2 | 3;
  className: string;
  mobile?: boolean;
}

type PodiumPlacement = {
  rank: 1 | 2 | 3;
  desktop: {
    baseLeft: string;
    baseTop: string;
    textLeft: string;
    textTop: string;
    rankClassName: string;
  };
  mobile: {
    className: string;
    rankClassName: string;
    body: string;
    width: number;
    height: number;
  };
  colorClassName: string;
};

const getMetricLabel = (sortBy: LeaderboardSortBy): ReactNode => {
  if (sortBy === 'volume') return <Trans>Volume</Trans>;
  if (sortBy === 'winRate') return <Trans>Win Rate</Trans>;
  if (sortBy === 'referee') {
    return <Trans id="leaderboard.referee">Referee</Trans>;
  }
  return 'PnL';
};

const podiumPlacements: PodiumPlacement[] = [
  {
    rank: 1,
    desktop: {
      baseLeft: '395px',
      baseTop: '87.14px',
      textLeft: '50%',
      textTop: 'calc(50% + 30.5px)',
      rankClassName:
        'absolute left-[calc(50%-43px)] top-[25.5px] h-10 w-[85.333px]',
    },
    mobile: {
      className: 'absolute bottom-0 left-[118px] h-[187px] w-[107px]',
      rankClassName: 'absolute top-[5px] left-[32.17px] h-5 w-[42.667px]',
      body: 'podium-1-mobile.svg',
      width: 107,
      height: 150,
    },
    colorClassName: 'text-[#ffe583]',
  },
  {
    rank: 2,
    desktop: {
      baseLeft: '80px',
      baseTop: '109.14px',
      textLeft: 'calc(50% - 315px)',
      textTop: 'calc(50% + 52px)',
      rankClassName: 'absolute left-[182.33px] top-[48.5px] h-10 w-[85.333px]',
    },
    mobile: {
      className:
        'absolute bottom-[-0.18px] left-[1.97px] h-[130.175px] w-[107.025px]',
      rankClassName: 'absolute top-0 left-[32.18px] h-5 w-[42.667px]',
      body: 'podium-2-mobile.svg',
      width: 107,
      height: 102,
    },
    colorClassName: 'text-[#ced6e0]',
  },
  {
    rank: 3,
    desktop: {
      baseLeft: '710px',
      baseTop: '129.14px',
      textLeft: 'calc(50% + 315px)',
      textTop: 'calc(50% + 72.5px)',
      rankClassName: 'absolute right-[182.33px] top-[74px] h-10 w-[85.333px]',
    },
    mobile: {
      className: 'absolute bottom-[0.2px] left-[234px] h-[102.805px] w-[107px]',
      rankClassName: 'absolute top-0 left-[32.17px] h-5 w-[42.667px]',
      body: 'podium-3-mobile.svg',
      width: 107,
      height: 75,
    },
    colorClassName: 'text-[#f1803e]',
  },
];

const getMetricValue = (
  row: LeaderboardRow | undefined,
  sortBy: LeaderboardSortBy,
) => {
  if (!row) {
    return EMPTY_VALUE;
  }

  if (sortBy === 'volume') {
    return withUsdPrefix(row.volume30d);
  }

  if (sortBy === 'winRate') {
    return row.winRate;
  }

  if (sortBy === 'referee') {
    return row.refereeAllTime;
  }

  return withUsdPrefix(row.pnl30d);
};

const PodiumRank = ({ rank, className, mobile }: PodiumRankProps) => (
  <div className={className}>
    <span
      className={[
        'absolute z-1 -translate-x-1/2 leading-none font-bold tracking-[-0.04em]',
        rank === 1
          ? 'text-[#ffe583]'
          : rank === 2
            ? 'text-[#ced6e0]'
            : 'text-[#f1803e]',
        mobile ? 'top-[-0.5px] text-base' : 'top-[-1px] text-[32px]',
      ].join(' ')}
      style={{ left: rank === 3 ? 'calc(50% + 1px)' : '50%' }}
    >
      {rank}
    </span>
    <Image
      src={`${LEADERBOARD_ASSET_BASE}/podium-rank-${rank}-${
        mobile ? 'mobile' : 'desktop'
      }.svg`}
      alt=""
      fill
      sizes={mobile ? '43px' : '86px'}
      className="object-fill"
      priority
    />
  </div>
);

const DesktopPodiumBase = ({ left, top }: { left: string; top: string }) => (
  <>
    <div
      className="absolute h-[151.68px] w-[289.92px] bg-gradient-to-b from-white/[0.06] to-transparent"
      style={{ left, top: `calc(${top} + 23.04px)` }}
    />
    <div className="absolute h-[23.04px] w-[289.92px]" style={{ left, top }}>
      <Image
        src={`${LEADERBOARD_ASSET_BASE}/podium-top.svg`}
        alt=""
        fill
        sizes="290px"
        className="scale-y-[-1] object-fill"
        priority
      />
    </div>
  </>
);

const PodiumText = ({
  row,
  value,
  label,
  className,
  valueClassName,
  mobile,
  style,
}: {
  row?: LeaderboardRow;
  value: string;
  label: ReactNode;
  className: string;
  valueClassName: string;
  mobile?: boolean;
  style?: CSSProperties;
}) => (
  <div
    className={[
      'absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center whitespace-nowrap',
      mobile ? 'gap-[1.474px]' : 'gap-1',
      className,
    ].join(' ')}
    style={style}
  >
    <span className="text-t-270 text-xs">{row?.trader ?? EMPTY_VALUE}</span>
    <span
      className={[
        'font-extrabold tracking-[-0.04em] italic',
        mobile ? 'text-base' : 'text-[32px] leading-none',
        valueClassName,
      ].join(' ')}
    >
      {value}
    </span>
  </div>
);

const PodiumSkeletonText = ({
  label,
  className,
  mobile,
  style,
}: {
  label: ReactNode;
  className: string;
  mobile?: boolean;
  style?: CSSProperties;
}) => (
  <div
    className={[
      'absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center whitespace-nowrap',
      mobile ? 'gap-[1.474px]' : 'gap-1',
      className,
    ].join(' ')}
    style={style}
  >
    <Skeleton className={mobile ? 'h-[14px] w-20' : 'h-3 w-24'} />
    <Skeleton className={mobile ? 'h-[19px] w-[57px]' : 'h-8 w-24'} />
  </div>
);

export const LeaderboardPodium = ({
  rows,
  sortBy,
  isLoading,
}: LeaderboardPodiumProps) => {
  const byRank = new Map(rows.slice(0, 3).map((row) => [row.rank, row]));
  const label = getMetricLabel(sortBy);
  const placements = podiumPlacements.map((placement) => ({
    ...placement,
    row: byRank.get(placement.rank),
  }));
  const activePlacements = placements.filter((placement) => placement.row);

  if (activePlacements.length === 0) {
    if (isLoading) {
      return <LeaderboardPodiumFallback sortBy={sortBy} />;
    }

    return null;
  }

  return (
    <section
      className="relative h-[196px] w-full overflow-hidden rounded-[5.081px] md:h-[260px] md:rounded-2xl"
      aria-label="Top three leaderboard traders"
    >
      <div className="hidden md:block">
        {activePlacements.map((placement) => (
          <DesktopPodiumBase
            key={`desktop-base-${placement.rank}`}
            left={placement.desktop.baseLeft}
            top={placement.desktop.baseTop}
          />
        ))}
        {activePlacements.map((placement) => (
          <PodiumText
            key={`desktop-text-${placement.rank}`}
            row={placement.row}
            value={getMetricValue(placement.row, sortBy)}
            label={label}
            className="w-[264px]"
            valueClassName={placement.colorClassName}
            style={{
              left: placement.desktop.textLeft,
              top: placement.desktop.textTop,
            }}
          />
        ))}
      </div>
      <div className="absolute top-0 left-1/2 h-[187px] w-[343px] -translate-x-1/2 md:hidden">
        {activePlacements.map((placement) => (
          <div
            key={`mobile-${placement.rank}`}
            className={placement.mobile.className}
          >
            <PodiumRank
              rank={placement.rank}
              className={placement.mobile.rankClassName}
              mobile
            />
            <div
              className="absolute left-0 w-full"
              style={{ top: placement.rank === 1 ? 33 : 28 }}
            >
              <Image
                src={`${LEADERBOARD_ASSET_BASE}/${placement.mobile.body}`}
                alt=""
                width={placement.mobile.width}
                height={placement.mobile.height}
                className="h-auto w-full"
                priority
              />
            </div>
            <PodiumText
              row={placement.row}
              value={getMetricValue(placement.row, sortBy)}
              label={label}
              className={
                placement.rank === 1
                  ? 'top-[74px] left-1/2 w-[97.294px]'
                  : 'top-[69px] left-1/2 w-[97.294px]'
              }
              valueClassName={placement.colorClassName}
              mobile
            />
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        {activePlacements.map((placement) => (
          <PodiumRank
            key={`desktop-rank-${placement.rank}`}
            rank={placement.rank}
            className={placement.desktop.rankClassName}
          />
        ))}
      </div>
    </section>
  );
};

export const LeaderboardPodiumFallback = ({
  sortBy = 'pnl',
}: {
  sortBy?: LeaderboardSortBy;
}) => {
  const label = getMetricLabel(sortBy);

  return (
    <section
      className="relative h-[196px] w-full overflow-hidden rounded-[5.081px] md:h-[260px] md:rounded-2xl"
      aria-label="Top three leaderboard traders"
    >
      <div className="hidden md:block">
        {podiumPlacements.map((placement) => (
          <DesktopPodiumBase
            key={`desktop-base-${placement.rank}`}
            left={placement.desktop.baseLeft}
            top={placement.desktop.baseTop}
          />
        ))}
        {podiumPlacements.map((placement) => (
          <PodiumSkeletonText
            key={`desktop-text-${placement.rank}`}
            label={label}
            className="w-[264px]"
            style={{
              left: placement.desktop.textLeft,
              top: placement.desktop.textTop,
            }}
          />
        ))}
      </div>
      <div className="absolute top-0 left-1/2 h-[187px] w-[343px] -translate-x-1/2 md:hidden">
        {podiumPlacements.map((placement) => (
          <div
            key={`mobile-${placement.rank}`}
            className={placement.mobile.className}
          >
            <PodiumRank
              rank={placement.rank}
              className={placement.mobile.rankClassName}
              mobile
            />
            <div
              className="absolute left-0 w-full"
              style={{ top: placement.rank === 1 ? 33 : 28 }}
            >
              <Image
                src={`${LEADERBOARD_ASSET_BASE}/${placement.mobile.body}`}
                alt=""
                width={placement.mobile.width}
                height={placement.mobile.height}
                className="h-auto w-full"
                priority
              />
            </div>
            <PodiumSkeletonText
              label={label}
              className={
                placement.rank === 1
                  ? 'top-[74px] left-1/2 w-[97.294px]'
                  : 'top-[69px] left-1/2 w-[97.294px]'
              }
              mobile
            />
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        {podiumPlacements.map((placement) => (
          <PodiumRank
            key={`desktop-rank-${placement.rank}`}
            rank={placement.rank}
            className={placement.desktop.rankClassName}
          />
        ))}
      </div>
    </section>
  );
};
