import { useId } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ROUND_MODE } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';
import {
  normalizeDashboardUsdNumber,
  normalizeDashboardUsdString,
  useDashboardCardsQuery,
} from '@/queries/bsc/dashboard';
import type { DashboardCardsData } from '@/services/rest/dashboard';
import { DashboardOverviewLoadingShell } from '../DashboardLoadingShell';
import {
  DashboardOverviewTooltip,
  DashboardOverviewTooltipBoundary,
} from './DashboardOverviewTooltip.client';
import type { MessageDescriptor } from '@lingui/core';

const OVERVIEW_TOOLTIPS: Record<
  DashboardOverviewMetricKey,
  { value: MessageDescriptor; change: MessageDescriptor }
> = {
  totalVolume: {
    value: msg`Total Volume: Cumulative trading volume plus liquidity operations, updated hourly.`,
    change: msg`Net change in total volume over the last 14 days.`,
  },
  openInterest: {
    value: msg`Open Interest: Total notional value of all open positions at the latest snapshot.`,
    change: msg`Net change in open interest over the last 14 days.`,
  },
  totalUsers: {
    value: msg`Total Users: Cumulative unique addresses that have interacted with the protocol.`,
    change: msg`New users in the last 14 days.`,
  },
  totalValueLocked: {
    value: msg`Total Value Locked: Total liquidity deposited in all pools at the latest snapshot.`,
    change: msg`Net change in TVL over the last 14 days.`,
  },
  totalFees: {
    value: msg`Total Fees: Cumulative protocol fees from trading, swaps, and liquidity operations.`,
    change: msg`Net change in fees collected over the last 14 days.`,
  },
};

type DashboardOverviewMetricKey =
  | 'totalVolume'
  | 'openInterest'
  | 'totalUsers'
  | 'totalValueLocked'
  | 'totalFees';

type DashboardOverviewValueType = 'currency' | 'number';

interface DashboardOverviewItem {
  key: DashboardOverviewMetricKey;
  title: MessageDescriptor;
  value: string;
  change14d: number;
  sparkline: number[];
  valueType: DashboardOverviewValueType;
}

interface DashboardOverviewProps {
  initialData?: DashboardCardsData;
}

function formatCurrency(value: string) {
  return unitFormat(value, 2, {
    style: 'currency',
    currency: 'USD',
    round: ROUND_MODE.ROUND,
    unitDecimal: 2,
  });
}

function formatNumber(value: string) {
  return unitFormat(value, 0, {
    round: ROUND_MODE.ROUND,
    unitDecimal: 2,
  });
}

function formatChange14d(value: number, type: DashboardOverviewValueType) {
  const sign = value >= 0 ? '+' : '-';
  const magnitude = Math.abs(value);
  if (type === 'number') {
    return `${sign}${unitFormat(magnitude, 0, {
      round: ROUND_MODE.ROUND,
      unitDecimal: 2,
    })}`;
  }
  return `${sign}${unitFormat(magnitude, 2, {
    style: 'currency',
    currency: 'USD',
    round: ROUND_MODE.ROUND,
    unitDecimal: 2,
  })}`;
}

function parseSparkline(
  raw: Array<string | number> | null | undefined,
): number[] | undefined {
  if (!raw?.length) return undefined;
  const out: number[] = [];
  for (const item of raw) {
    const parsed =
      typeof item === 'number'
        ? item
        : Number.isFinite(Number(item))
          ? Number(item)
          : undefined;
    if (parsed === undefined) return undefined;
    out.push(parsed);
  }
  return out;
}

function buildDashboardOverviewItems(
  data: DashboardCardsData | undefined,
): DashboardOverviewItem[] | undefined {
  if (!data) return undefined;

  const totalVolume = normalizeDashboardUsdString(data.total_volume);
  const openInterest = normalizeDashboardUsdString(data.open_interest);
  const totalValueLocked = normalizeDashboardUsdString(data.total_value_locked);
  const totalFees = normalizeDashboardUsdString(data.total_fees);

  const totalUsers = data.total_users;
  if (!Number.isFinite(totalUsers)) return undefined;

  const volChg14d = normalizeDashboardUsdNumber(data.total_volume_change_14d);
  const oiChg14d = normalizeDashboardUsdNumber(data.open_interest_change_14d);
  const usersChg14d = data.total_users_change_14d;
  const tvlChg14d =
    normalizeDashboardUsdNumber(data.total_value_locked_change_14d) ?? 0;
  const feesChg14d = normalizeDashboardUsdNumber(data.total_fees_change_14d);

  const volSpark = parseSparkline(data.total_volume_sparkline_14d);
  const oiSpark = parseSparkline(data.open_interest_sparkline_14d);
  const usersSpark = parseSparkline(data.total_users_sparkline_14d);
  const tvlSpark =
    parseSparkline(data.total_value_locked_sparkline_14d) ??
    (totalValueLocked === undefined
      ? undefined
      : [Number(totalValueLocked), Number(totalValueLocked)]);
  const feesSpark = parseSparkline(data.total_fees_sparkline_14d);

  if (
    totalVolume === undefined ||
    openInterest === undefined ||
    totalValueLocked === undefined ||
    totalFees === undefined ||
    volChg14d === undefined ||
    oiChg14d === undefined ||
    usersChg14d === undefined ||
    tvlChg14d === undefined ||
    feesChg14d === undefined ||
    !volSpark ||
    !oiSpark ||
    !usersSpark ||
    !tvlSpark ||
    !feesSpark
  ) {
    return undefined;
  }

  return [
    {
      key: 'totalVolume',
      title: msg`Total Volume`,
      value: totalVolume,
      change14d: volChg14d,
      sparkline: volSpark,
      valueType: 'currency',
    },
    {
      key: 'openInterest',
      title: msg`Open Interest`,
      value: openInterest,
      change14d: oiChg14d,
      sparkline: oiSpark,
      valueType: 'currency',
    },
    {
      key: 'totalFees',
      title: msg`Total Fees`,
      value: totalFees,
      change14d: feesChg14d,
      sparkline: feesSpark,
      valueType: 'currency',
    },
    {
      key: 'totalValueLocked',
      title: msg`Total Value Locked`,
      value: totalValueLocked,
      change14d: tvlChg14d,
      sparkline: tvlSpark,
      valueType: 'currency',
    },
    {
      key: 'totalUsers',
      title: msg`Total Users`,
      value: String(totalUsers),
      change14d: usersChg14d,
      sparkline: usersSpark,
      valueType: 'number',
    },
  ];
}

const SPARKLINE_WIDTH = 88;
const SPARKLINE_HEIGHT = 28;
const SPARKLINE_PADDING = 2;
const SPARKLINE_BOTTOM_PADDING = 14;

interface DashboardSparklineProps {
  points: number[];
  color: string;
  fillOpacity: number;
}

const DashboardSparkline = ({
  points,
  color,
  fillOpacity,
}: DashboardSparklineProps) => {
  const gradientId = useId();
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const innerWidth = SPARKLINE_WIDTH - SPARKLINE_PADDING * 2;
  const innerHeight =
    SPARKLINE_HEIGHT - SPARKLINE_PADDING - SPARKLINE_BOTTOM_PADDING;
  const stepX = innerWidth / (points.length - 1);

  const coords = points.map((value, index) => {
    const x = SPARKLINE_PADDING + stepX * index;
    const y =
      SPARKLINE_PADDING + innerHeight - ((value - min) / range) * innerHeight;
    return { x, y };
  });

  const linePath = coords
    .map(
      ({ x, y }, index) =>
        `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(' ');

  const baselineY = SPARKLINE_HEIGHT - SPARKLINE_PADDING;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (!first || !last) return null;
  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${baselineY.toFixed(2)} L ${first.x.toFixed(2)} ${baselineY.toFixed(2)} Z`;

  return (
    <svg
      role="presentation"
      aria-hidden
      width={SPARKLINE_WIDTH}
      height={SPARKLINE_HEIGHT}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      preserveAspectRatio="none"
      className="pointer-events-none h-10 w-15 shrink-0 md:h-full md:w-full"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        stroke="none"
        className="dashboard-sparkline-area"
      />
      <path
        d={linePath}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dashboard-sparkline-line"
      />
    </svg>
  );
};

export const DashboardOverview = ({ initialData }: DashboardOverviewProps) => {
  const { i18n } = useLingui();
  const { data: cardsData } = useDashboardCardsQuery(initialData);
  const data = buildDashboardOverviewItems(cardsData);
  const showSkeleton = !data;

  if (showSkeleton) {
    return <DashboardOverviewLoadingShell />;
  }

  return (
    <DashboardOverviewTooltipBoundary className="mb-4 grid grid-cols-2 gap-2 md:mb-6 md:grid-cols-5 md:py-3">
      {data.map((item) => {
        const isUp = item.change14d >= 0;
        const trendColor = isUp ? 'var(--color-up)' : 'var(--color-down)';
        const trendClassName = isUp ? 'text-up' : 'text-down';
        const tips = OVERVIEW_TOOLTIPS[item.key];
        const itemTitle = i18n._(item.title);
        const trigger = (
          <div className="border-border bg-card/40 hover:bg-bg-3 relative flex h-[77px] cursor-pointer items-center gap-2 rounded-xl border p-2 text-left transition-colors">
            <div className="flex w-25 min-w-0 flex-col items-start gap-2 whitespace-nowrap max-md:flex-1">
              <h3 className="text-t-270 text-xs">{itemTitle}</h3>
              <p className="text-base font-medium md:text-sm">
                {item.valueType === 'number'
                  ? formatNumber(item.value)
                  : formatCurrency(item.value)}
              </p>
              <p className={`${trendClassName} text-xs/3.5`}>
                {formatChange14d(item.change14d, item.valueType)}
              </p>
            </div>
            <div className="absolute top-6 right-2 md:!static md:flex md:min-w-0 md:flex-1 md:items-center md:self-stretch">
              <DashboardSparkline
                points={item.sparkline}
                color={trendColor}
                fillOpacity={isUp ? 0.2 : 0.3}
              />
            </div>
          </div>
        );

        return (
          <DashboardOverviewTooltip
            key={item.key}
            tips={
              <>
                <div className="text-t-1100">{i18n._(tips.value)}</div>
                <div>{i18n._(tips.change)}</div>
              </>
            }
          >
            {trigger}
          </DashboardOverviewTooltip>
        );
      })}
    </DashboardOverviewTooltipBoundary>
  );
};
