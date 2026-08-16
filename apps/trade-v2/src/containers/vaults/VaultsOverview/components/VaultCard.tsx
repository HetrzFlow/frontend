'use client';

import { useMemo, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { Trans } from '@lingui/react/macro';
import { formatUnits } from 'viem';
import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat, unitFormat } from '@repo/lib/format';
import {
  Button,
  cn,
  HzIcon,
  Skeleton,
  SkeletonLayout,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  MEDIA_SIZES,
  useMediaQuery,
} from '@repo/ui';
import { HZV_TOKEN_DECIMALS, IMAGES_MAP, useGlobalStore } from '@/common';
import { useHydrated } from '@/common/hooks/useHydrated';
import { useInstStore } from '@/common/stores/instStore';
import ModuleCard from '@/components/ModuleCard';
import StatusMarker from '@/components/StatusMarker';
import { marketIsOpen } from '@/hooks/useMarketsStats';
import { isEffectively24x7 } from '@/lib/market/dateConverter';
import type { VaultDepositCapMetric } from '@/queries/bsc/vaults';
import { MarketExposureItem, VaultItem } from '@/services/rest/vaults';
import { USDT_NAME } from '@/stores/pools/trade';
import {
  useHzvValuesData,
  useVaultHoldingsUsd,
} from '@/stores/synthetics/marketsData/selectors';

const VAULT_CARD_VIDEO_SRC = '/trade-static/videos/vaultcard.mp4';
const MAX_ICONS = 3;
const ICON_SIZE = 32;
const PROGRESS_RING_SIZE = 33;
const PROGRESS_RING_COLOR = '#00DFEB';

type HzvValueItem = {
  hlvValue?: bigint;
  hlvTotalSupply?: bigint;
};

function getHzvValueByVaultAddress(
  hzvValues: Record<string, HzvValueItem> | undefined,
  vaultAddress: string | undefined,
): HzvValueItem | undefined {
  if (!hzvValues || !vaultAddress) return undefined;
  const lowerAddress = vaultAddress.toLowerCase();
  for (const [key, value] of Object.entries(hzvValues)) {
    if (key.toLowerCase() === lowerAddress) {
      return value;
    }
  }
  return undefined;
}

function InfoTip({
  label,
  content,
  className,
}: {
  label: ReactNode;
  content: ReactNode;
  className?: string;
}) {
  const trigger = (
    <button
      type="button"
      className={cn(
        'text-t-350 decoration-t-430 inline-flex items-center text-xs underline decoration-dotted underline-offset-3',
        className,
      )}
    >
      {label}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent className="max-w-90 rounded-2xl p-3 text-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

function DepositButton({ href }: { href?: string }) {
  if (!href) {
    return (
      <Button
        type="button"
        variant="accent"
        size="sm"
        disabled
        className="h-auto cursor-not-allowed px-3 py-[5px] text-xs"
      >
        <Trans>Deposit</Trans>
      </Button>
    );
  }

  return (
    <Link href={href} className="text-accent" prefetch>
      <Button
        variant="accent"
        size="sm"
        className="h-auto px-3 py-[5px] text-xs font-medium"
      >
        <Trans>Deposit</Trans>
      </Button>
    </Link>
  );
}

function MarketExposureIcons({ items }: { items: MarketExposureItem[] }) {
  const ranked = useMemo(() => {
    const parsed = items
      .map((it) => {
        try {
          return {
            item: it,
            numerator: BigInt(it.distribution_amount ?? '0'),
            denominator: BigInt(it.max_cap ?? '0'),
          };
        } catch {
          return {
            item: it,
            numerator: 0n,
            denominator: 0n,
          };
        }
      })
      .sort((a, b) => {
        // Sort desc by (numerator/denominator). Treat 0 denom as smallest.
        if (a.denominator === 0n && b.denominator === 0n) return 0;
        if (a.denominator === 0n) return 1;
        if (b.denominator === 0n) return -1;
        const left = a.numerator * b.denominator;
        const right = b.numerator * a.denominator;
        if (left === right) return 0;
        return left > right ? -1 : 1;
      });

    return parsed.map((p) => p.item);
  }, [items]);

  const displayItems = ranked.slice(0, MAX_ICONS);
  const remaining = ranked.length - MAX_ICONS;

  // Placeholder when no market exposure
  if (ranked.length === 0) {
    return (
      <div
        className="text-t-350 mb-1 flex items-center text-sm"
        style={{ height: ICON_SIZE }}
      >
        --
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="flex">
        {displayItems.map((item, index) => (
          <div
            key={item.market_address}
            className="relative rounded-full"
            style={{
              marginLeft: index === 0 ? 0 : -ICON_SIZE / 2,
              zIndex: MAX_ICONS - index,
            }}
          >
            <Image
              src={
                IMAGES_MAP.instIcons[
                  item.symbol as keyof typeof IMAGES_MAP.instIcons
                ] ?? IMAGES_MAP.instIcons['BTC/USD']
              }
              alt={item.symbol}
              width={ICON_SIZE}
              height={ICON_SIZE}
              className="rounded-full"
            />
          </div>
        ))}
      </div>
      {remaining > 0 && <span className="ml-1 text-sm">+{remaining}</span>}
    </div>
  );
}

function ProgressRing({
  depositedUsd,
  totalCapUsd,
}: {
  depositedUsd: string;
  totalCapUsd: string;
}) {
  // Calculate percentage using calc to handle large BigInt strings
  const percentage = useMemo(() => {
    const cap = calc(totalCapUsd);
    if (cap.lte(0)) return 0;
    return calc(depositedUsd).div(cap).times(100).toNumber();
  }, [depositedUsd, totalCapUsd]);
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  const percentageLabel = `${Math.round(normalizedPercentage)}%`;

  const radius = 14;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedPercentage / 100) * circumference;

  return (
    <div className="relative inline-flex size-[33px] items-center justify-center">
      <svg width={PROGRESS_RING_SIZE} height={PROGRESS_RING_SIZE}>
        <circle
          cx={PROGRESS_RING_SIZE / 2}
          cy={PROGRESS_RING_SIZE / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={PROGRESS_RING_SIZE / 2}
          cy={PROGRESS_RING_SIZE / 2}
          r={radius}
          fill="none"
          stroke={PROGRESS_RING_COLOR}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${PROGRESS_RING_SIZE / 2} ${PROGRESS_RING_SIZE / 2})`}
        />
      </svg>
      <span className="text-t-270 pointer-events-none absolute text-[8px]">
        {percentageLabel}
      </span>
    </div>
  );
}

function DepositedProgress({
  depositedUsd,
  totalCapUsd,
}: {
  depositedUsd: string;
  totalCapUsd: string;
}) {
  const tooltipContent = (
    <Trans>
      Total deposits in the vault against its deposit cap. Reflects capacity
      used, not market value.
    </Trans>
  );
  const trigger = (
    <button type="button" className="inline-flex">
      <ProgressRing depositedUsd={depositedUsd} totalCapUsd={totalCapUsd} />
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent className="max-w-90 rounded-2xl p-3 text-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

function VaultCardTopVideo() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#081317]">
      <video
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src={VAULT_CARD_VIDEO_SRC} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,24,28,0)_0%,#0e181c_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_48%)]" />
    </div>
  );
}

type Props = {
  data?: VaultItem;
  depositCapMetric?: VaultDepositCapMetric;
};
export default function VaultCard({ data, depositCapMetric }: Props) {
  const { vault_name, net_apy, curator, vault_address } = data ?? {};
  const vaultDetailHref = vault_address
    ? `/vaults/${vault_address}`
    : undefined;
  const isHeaderLoading = vault_name === undefined && curator === undefined;
  const isApyLoading = net_apy === undefined;
  const exposureItems = data?.market_exposure;

  const insts = useInstStore((s) => s.getInstsArr());
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const statusInst = useMemo(() => {
    const symbols = data?.market_exposure?.flatMap((item) =>
      item.symbol ? [item.symbol] : [],
    );
    if (!symbols?.length) return undefined;
    const exposureInsts = insts.filter((inst) => symbols.includes(inst.symbol));
    const scheduledInsts = exposureInsts.filter(
      (inst) =>
        inst.schedule &&
        inst.schedule !== '24x7' &&
        !isEffectively24x7(inst.schedule),
    );
    if (!scheduledInsts.length) return undefined;
    const closedInst = scheduledInsts.find((inst) => !marketIsOpen(inst));
    return closedInst ?? scheduledInsts[0];
  }, [data?.market_exposure, insts]);

  const hzvValues = useHzvValuesData();
  const hzvValue = useMemo(
    () => getHzvValueByVaultAddress(hzvValues, vault_address),
    [hzvValues, vault_address],
  );

  const restTvlUsd = useMemo(() => {
    if (data?.tvl === undefined) return undefined;
    try {
      return BigInt(data.tvl);
    } catch {
      return undefined;
    }
  }, [data?.tvl]);
  const restSupply = useMemo(() => {
    if (data?.supply === undefined) return undefined;
    try {
      return BigInt(data.supply);
    } catch {
      return undefined;
    }
  }, [data?.supply]);
  const tvlUsd = hzvValue?.hlvValue ?? restTvlUsd;
  const supply = hzvValue?.hlvTotalSupply ?? restSupply;
  const tvlDisplay =
    tvlUsd === undefined
      ? ''
      : unitFormat(
          calc(tvlUsd.toString(10)).div(calc(10).pow(USD_DECIMALS)).toString(),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          },
        );
  const supplyDisplay =
    supply === undefined
      ? ''
      : unitFormat(
          calc(supply.toString(10))
            .div(calc(10).pow(HZV_TOKEN_DECIMALS))
            .toString(),
          2,
          {
            stripTrailingZeros: true,
          },
        );

  const { depositCapacityUsedUsd, effectiveTotalCapUsd: totalCapUsd } =
    depositCapMetric ?? {};
  const userHoldingsUsdt = useVaultHoldingsUsd(vault_address, data);
  const userHoldingsDisplay = useMemo(() => {
    if (userHoldingsUsdt === undefined) return '';
    return truncateFormat(
      formatUnits(userHoldingsUsdt, USD_DECIMALS),
      usdAmountDisplayDecimal,
      {
        stripTrailingZeros: true,
        showMinDecimalValue: true,
      },
    );
  }, [userHoldingsUsdt, usdAmountDisplayDecimal]);

  const mediaSize = useMediaQuery();
  const isHydrated = useHydrated();
  const isMobile = isHydrated && mediaSize === MEDIA_SIZES.SM;
  const cardBody = (
    <div className="bg-bg-2 relative isolate overflow-hidden rounded-2xl p-3 pt-20">
      {!isMobile && (
        <div className="bg-card pointer-events-none absolute inset-0 z-0" />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[150px] overflow-hidden rounded-2xl">
        <VaultCardTopVideo />
      </div>
      <div className="relative z-10 space-y-3">
        <HzIcon className="text-accent" size={24} />
        <SkeletonLayout isLoading={isHeaderLoading} className="h-[16.8px] w-28">
          <h3 className="flex items-center gap-1 text-sm font-medium">
            <span>
              {curator} {vault_name}
            </span>
            <StatusMarker inst={statusInst} />
          </h3>
        </SkeletonLayout>
        <div>
          <InfoTip
            label={<Trans>APY</Trans>}
            content={
              <Trans>
                Estimated annualized yield based on current market rates.
              </Trans>
            }
          />
          <SkeletonLayout isLoading={isApyLoading} className="h-10 w-20">
            <div className="text-[32px] font-semibold">
              {net_apy !== undefined
                ? percentFormat(net_apy, 2, {
                    showMinDecimalValue: true,
                    stripTrailingZeros: true,
                  })
                : ''}
            </div>
          </SkeletonLayout>
        </div>
        <div
          className={`flex justify-between ${tvlUsd !== undefined && supply !== undefined ? 'items-baseline' : ''}`}
        >
          <InfoTip
            label={<Trans>TVL/Supply</Trans>}
            content={
              <>
                <div>
                  <Trans>
                    TVL: Total value of assets locked in this strategy.
                  </Trans>
                </div>
                <div>
                  <Trans>Supply: Total number of vault tokens minted.</Trans>
                </div>
              </>
            }
          />
          <div>
            <div className="text-right">
              {tvlUsd === undefined ? (
                <Skeleton className="mb-1 ml-auto h-6 w-16" />
              ) : (
                tvlDisplay
              )}
            </div>
            <div className="text-t-350 text-right text-xs">
              {supply === undefined ? (
                <Skeleton className="ml-auto h-[14.4px] w-12" />
              ) : (
                `${supplyDisplay} HzV`
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <InfoTip
            label={<Trans>Market Exposure</Trans>}
            content={
              <Trans>
                The underlying assets and tokens held by this vault strategy.
              </Trans>
            }
          />
          {exposureItems === undefined ? (
            <Skeleton className="h-8 w-[68.7px]" />
          ) : (
            <MarketExposureIcons items={exposureItems} />
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-t-350 text-xs">
            <Trans>Deposited</Trans>
          </div>
          {depositCapacityUsedUsd === undefined || totalCapUsd === undefined ? (
            <Skeleton className="size-[33px] rounded-full" />
          ) : (
            <DepositedProgress
              depositedUsd={depositCapacityUsedUsd.toString(10)}
              totalCapUsd={totalCapUsd.toString(10)}
            />
          )}
        </div>
      </div>
    </div>
  );

  const cardFooter = (
    <div className="bg-bg-3 flex items-center justify-between rounded-b-2xl px-3 pt-3 pb-3">
      <div className="flex flex-col gap-1">
        <div className="text-t-350 text-xs">
          <Trans>Your Holdings</Trans>
        </div>
        {userHoldingsUsdt === undefined ? (
          <Skeleton className="h-[19.19px] w-20" />
        ) : (
          <div className="text-sm font-medium">
            {userHoldingsDisplay} {USDT_NAME}
          </div>
        )}
      </div>
      <DepositButton href={vaultDetailHref} />
    </div>
  );

  return (
    <div className="relative pb-2">
      {isMobile ? (
        <div className="bg-bg-3 rounded-2xl">
          {cardBody}
          {cardFooter}
        </div>
      ) : (
        <ModuleCard className="bg-bg-3 overflow-hidden rounded-2xl p-0">
          {cardBody}
          {cardFooter}
        </ModuleCard>
      )}
    </div>
  );
}
