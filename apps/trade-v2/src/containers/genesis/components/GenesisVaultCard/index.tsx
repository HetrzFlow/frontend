'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import {
  percentFormat,
  thoFormat,
  truncateFormat,
  unitFormat,
} from '@repo/lib/format';
import { Skeleton } from '@repo/ui';
import type {
  GenesisMeritsEpoch,
  GenesisMeritsSeason,
  GenesisOverview,
  GenesisVaultConfig,
} from '@/services/rest/genesis';
import {
  GENESIS_INTEGER_FORMAT_OPTIONS,
  GENESIS_USD_FORMAT_OPTIONS,
} from '../../lib/constants';
import { useGenesisRealtimeLockedIn } from '../../lib/genesisOverview';
import { GenesisMetricLabel } from '../GenesisMetricLabel';

interface GenesisVaultCardProps {
  config?: GenesisVaultConfig;
  isProgressReady?: boolean;
  overview?: GenesisOverview;
  meritsSeason?: GenesisMeritsSeason;
  meritsEpoch?: GenesisMeritsEpoch | null;
}

const GenesisVaultCardSkeleton = () => (
  <section
    aria-hidden="true"
    className="grid h-[205px] w-full grid-cols-[minmax(0,630fr)_minmax(0,442fr)] gap-2 max-lg:h-auto max-lg:grid-cols-1 max-lg:gap-3"
  >
    <div className="min-w-0 rounded-2xl border p-4 max-md:h-[319px]">
      <div className="flex h-6 items-center gap-2 max-md:h-[19px]">
        <Skeleton className="h-6 w-28 max-md:h-[19px] max-md:w-24" />
        <Skeleton className="size-2 rounded-full" />
        <Skeleton className="h-[14px] w-8" />
      </div>

      <div className="mt-4 grid h-12 grid-cols-[194px_1fr] gap-3 max-md:block max-md:h-[100px]">
        <div>
          <Skeleton className="h-[14px] w-24" />
          <Skeleton className="mt-1 h-[29px] w-20" />
        </div>
        <div className="flex h-10 items-center max-md:mt-3">
          <Skeleton className="h-5 w-full rounded-none" />
        </div>
      </div>

      <div className="my-4 h-px bg-white/10" />

      <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
        <div className="relative max-md:h-12">
          <Skeleton className="h-[14px] w-20" />
          <Skeleton className="mt-1 h-[29px] w-16" />
          <Skeleton className="absolute top-0 right-1 size-10 rounded-full" />
        </div>
        <div className="relative max-md:h-12">
          <Skeleton className="h-[14px] w-24" />
          <Skeleton className="mt-1 h-[29px] w-36" />
          <Skeleton className="absolute top-0 right-1 size-10 rounded-full" />
        </div>
      </div>
    </div>

    <div className="relative min-w-0 overflow-hidden rounded-2xl border p-4 max-md:h-[177px]">
      <div
        aria-hidden="true"
        className="absolute -top-16 right-[-54px] size-56 rounded-full bg-[radial-gradient(circle,rgba(0,223,235,0.18),rgba(0,223,235,0.03)_45%,transparent_70%)]"
      />
      <div className="relative grid grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-[14px] w-8" />
          <Skeleton className="mt-1 h-[29px] w-16" />
        </div>
        <div>
          <Skeleton className="h-[14px] w-20" />
          <Skeleton className="mt-1 h-[29px] w-14" />
        </div>
      </div>
      <div className="relative my-4 h-px bg-white/10 max-md:my-[10px]" />
      <div className="relative flex items-start justify-between">
        <Skeleton className="h-[14px] w-16" />
        <Skeleton className="h-[29px] w-20" />
      </div>
      <div className="relative mt-4 space-y-3 max-md:mt-[9px] max-md:space-y-[10px]">
        <div className="flex justify-between">
          <Skeleton className="h-[14px] w-28" />
          <Skeleton className="h-[14px] w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-[14px] w-24" />
          <Skeleton className="h-[14px] w-14" />
        </div>
      </div>
    </div>
  </section>
);

const SegmentedProgress = ({ value }: { value: number }) => {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className="relative h-10 w-full overflow-hidden"
    >
      <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#bfcfff1a_0_2px,transparent_2px_6px)]" />
      <div
        className="absolute top-1/2 left-0 h-5 -translate-y-1/2 overflow-hidden transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${value}%` }}
      >
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(0,223,235,0.24)_0%,#00dfeb_100%)] [mask-image:repeating-linear-gradient(90deg,#000_0_2px,transparent_2px_6px)]" />
      </div>
      <div
        aria-hidden="true"
        className="bg-accent absolute inset-y-0 w-0.5 -translate-x-1/2 transition-[left] duration-700 ease-out motion-reduce:transition-none"
        style={{ left: `${value}%` }}
      />
    </div>
  );
};

const MetricVideoIcon = ({
  movSrc,
  webmSrc,
  mp4Src,
}: {
  movSrc: string;
  webmSrc: string;
  mp4Src: string;
}) => (
  <video
    aria-hidden="true"
    autoPlay
    muted
    loop
    playsInline
    preload="metadata"
    className="pointer-events-none absolute top-0 right-0 size-12 object-cover"
  >
    <source src={movSrc} type='video/quicktime; codecs="hvc1"' />
    <source src={webmSrc} type="video/webm" />
    <source src={mp4Src} type="video/mp4" />
  </video>
);

export const GenesisVaultCard = ({
  config,
  isProgressReady = true,
  overview,
  meritsSeason,
  meritsEpoch,
}: GenesisVaultCardProps) => {
  const { t } = useLingui();
  const realtimeLockedIn = useGenesisRealtimeLockedIn(
    config,
    overview,
    meritsSeason,
    meritsEpoch,
  );
  const cap = Number(config?.capToken ?? 0);
  const deposited = Number(config?.depositedToken ?? 0);
  const pct = cap > 0 ? Math.min((deposited / cap) * 100, 100) : 0;
  const [displayedPct, setDisplayedPct] = useState(0);

  useEffect(() => {
    const updateProgress = () => setDisplayedPct(pct);
    const fallbackTimer = isProgressReady
      ? undefined
      : window.setTimeout(updateProgress, 5_000);

    if (isProgressReady) updateProgress();

    return () => {
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };
  }, [isProgressReady, pct]);

  if (!config) {
    return <GenesisVaultCardSkeleton />;
  }

  const maturityDays = config.maturityDays;
  const formattedMaturityDays = thoFormat(
    maturityDays,
    GENESIS_INTEGER_FORMAT_OPTIONS,
  );
  const formattedBoostMultiplier = thoFormat(
    config.boostMultiplier,
    GENESIS_INTEGER_FORMAT_OPTIONS,
  );
  const apyLabel = percentFormat(config.apr / 100, 2, {
    stripTrailingZeros: true,
  });
  const status =
    config.phase === 'not_started'
      ? t`Coming Soon`
      : config.phase === 'ended'
        ? t`Ended`
        : t`Live`;

  return (
    <section className="grid h-[205px] w-full grid-cols-[minmax(0,630fr)_minmax(0,442fr)] gap-2 max-lg:h-auto max-lg:grid-cols-1 max-lg:gap-3">
      <div className="min-w-0 rounded-2xl border p-4 max-md:h-[319px]">
        <div className="flex h-6 items-center gap-2 max-md:h-[19px]">
          <h2 className="text-t-1100 text-xl font-medium max-md:text-base">
            {t`Genesis Vault`}
          </h2>
          <span
            className={`size-2 rounded-full ${
              config.phase === 'ended' ? 'bg-t-430' : 'bg-accent'
            }`}
          />
          <span
            className={`text-xs ${
              config.phase === 'ended' ? 'text-t-350' : 'text-accent'
            }`}
          >
            {status}
          </span>
        </div>

        <div className="mt-4 grid h-12 grid-cols-[194px_1fr] gap-3 max-md:block max-md:h-[100px]">
          <div>
            <p className="text-t-350 text-xs">{t`Overall Progress`}</p>
            <p className="text-t-1100 mt-1 text-2xl font-medium">
              {percentFormat(displayedPct / 100, 2, {
                showMinDecimalValue: true,
                stripTrailingZeros: true,
              })}
            </p>
          </div>
          <div className="max-md:mt-3">
            <SegmentedProgress value={displayedPct} />
          </div>
        </div>

        <div className="my-4 h-px bg-white/10" />

        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <div className="relative max-md:h-12">
            <p className="text-t-350 text-xs">{t`Early Birds`}</p>
            <p className="text-t-1100 mt-1 text-2xl font-medium">
              {unitFormat(config.earlyBirds, 0)}
            </p>
            <MetricVideoIcon
              movSrc="/trade-static/genesis/bird.mov"
              webmSrc="/trade-static/genesis/bird.webm"
              mp4Src="/trade-static/genesis/bird.mp4"
            />
          </div>
          <div className="relative max-md:h-12">
            <p className="text-t-350 text-xs">{t`Total Deposits`}</p>
            <p className="text-t-1100 mt-1 text-2xl font-medium">
              {unitFormat(config.depositedToken, 2, GENESIS_USD_FORMAT_OPTIONS)}
              <span className="text-t-350">
                /{unitFormat(config.capToken, 2, GENESIS_USD_FORMAT_OPTIONS)}
              </span>
            </p>
            <MetricVideoIcon
              movSrc="/trade-static/genesis/bar.mov"
              webmSrc="/trade-static/genesis/bar.webm"
              mp4Src="/trade-static/genesis/chart.mp4"
            />
          </div>
        </div>
      </div>

      <div className="relative min-w-0 overflow-hidden rounded-2xl border p-4 max-md:h-[177px]">
        <Image
          src="/trade-static/genesis/bg-1.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 767px) calc(100vw - 32px), 442px"
          className="pointer-events-none object-cover select-none"
        />
        <div className="relative grid grid-cols-2 gap-6">
          <div>
            <GenesisMetricLabel
              label={t`APY`}
              tooltip={t`How interest accrues: After mainnet launch, your deposit becomes pool liquidity — your principal is exposed to pool performance (trader PnL) and can lose value. The ${apyLabel} APY is a raw estimate based on testnet data and is not guaranteed.`}
            />
            <p className="text-t-1100 mt-1 text-2xl font-medium">~{apyLabel}</p>
          </div>
          <div>
            <GenesisMetricLabel
              label={t`Merits Boost`}
              tooltip={t`Hold ${formattedMaturityDays} days for ${formattedBoostMultiplier}× Merits on that deposit. Withdraw early, keep only 1×.`}
            />
            <p className="text-t-1100 mt-1 text-2xl font-medium">
              {thoFormat(
                config.boostMultiplier,
                GENESIS_INTEGER_FORMAT_OPTIONS,
              )}
              X
            </p>
          </div>
        </div>
        <div className="relative my-4 h-px bg-white/10 max-md:my-[10px]" />
        <div className="relative flex items-start justify-between">
          <GenesisMetricLabel
            label={t`Matures In`}
            tooltip={t`Each deposit matures after ${formattedMaturityDays} continuous days.`}
          />
          <p className="text-t-1100 text-right text-2xl font-medium">
            {t`${formattedMaturityDays} Days`}
          </p>
        </div>
        <div className="relative mt-4 space-y-3 max-md:mt-[9px] max-md:space-y-[10px]">
          <div className="flex justify-between text-xs">
            <GenesisMetricLabel
              label={t`Merits Locked In`}
              tooltip={t`Estimated total boosted Merits across all deposits if held for ${formattedMaturityDays} days. Accrues over the season, settled each epoch.`}
            />
            <span className="text-t-1100">
              {truncateFormat(
                realtimeLockedIn?.meritsLocked ?? config.meritsLocked,
                2,
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
