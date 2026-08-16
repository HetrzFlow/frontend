'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Trans } from '@lingui/react/macro';
import { IMAGES_MAP, useInstStore } from '@/common';
import ModuleCard from '@/components/ModuleCard';
import {
  STRATEGY_MARKET_COLORS,
  STRATEGY_MARKET_OTHERS_COLOR,
} from '@/constants/enum';
import { toValidChecksumAddress } from '@/lib/address';
import { useVaultRemainingCaps } from '@/queries/bsc/vaults';
import StrategyBannerSkeleton from './Skeleton';

type StrategyBannerProps = {
  vaultAddress: string;
};

type ExposureToken = {
  id: string;
  symbol: string;
  name: string;
  weight: number;
  color: string;
  isOthers?: boolean;
};

const formatWeight = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0%';
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

const DONUT_SIZE_PX = 96;
const DONUT_RING_WIDTH_PX = 6;
const DONUT_SEGMENT_GAP_PX = 1;
const DONUT_SEGMENT_GAP_PERCENT =
  (DONUT_SEGMENT_GAP_PX * 100) /
  (Math.PI * (DONUT_SIZE_PX - DONUT_RING_WIDTH_PX));

function OthersIcon() {
  return (
    <div className="bg-bg-3 flex size-5 items-center justify-center rounded-full text-xs">
      ...
    </div>
  );
}

function DonutChart({ exposureTokens }: { exposureTokens: ExposureToken[] }) {
  let cursor = 0;
  const gradient =
    exposureTokens.length === 0
      ? '#16242a 0 100%'
      : exposureTokens
          .map((token) => {
            const start = cursor;
            cursor += Math.max(0, token.weight);
            const gap = Math.min(DONUT_SEGMENT_GAP_PERCENT, cursor - start);
            const end = Math.max(start, cursor - gap);
            return [
              `${token.color} ${start}% ${end}%`,
              gap > 0 ? `var(--bg-2) ${end}% ${cursor}%` : '',
            ]
              .filter(Boolean)
              .join(', ');
          })
          .join(', ');

  return (
    <div className="flex size-31 shrink-0 items-center justify-center">
      <div
        className="relative size-24 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        aria-hidden
      >
        <div className="bg-bg-2 absolute inset-1.5 flex items-center justify-center rounded-full">
          <span className="text-t-1100 text-center text-xs font-medium">
            <Trans>
              Market
              <br />
              Exposure
            </Trans>
          </span>
        </div>
      </div>
    </div>
  );
}

function ExposureLegendRow({ token }: { token: ExposureToken }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="inline-block size-2 shrink-0 rounded-full"
          style={{ backgroundColor: token.color }}
        />
        {token.isOthers ? (
          <OthersIcon />
        ) : (
          <Image
            src={
              IMAGES_MAP.instIcons[
                token.symbol as keyof typeof IMAGES_MAP.instIcons
              ] ?? IMAGES_MAP.instIcons['BTC/USD']
            }
            alt={token.name}
            width={20}
            height={20}
            className="rounded-full"
          />
        )}
        <span className="text-t-270 truncate text-xs">
          {token.isOthers ? <Trans>Others</Trans> : token.name}
        </span>
      </div>
      <span className="text-t-1100 shrink-0 text-xs">
        {formatWeight(token.weight)}
      </span>
    </div>
  );
}

export const StrategyBanner = ({ vaultAddress }: StrategyBannerProps) => {
  const { marketExposure } = useVaultRemainingCaps(vaultAddress);
  const insts = useInstStore((state) => state.getInsts());

  const exposureTokens = useMemo<ExposureToken[] | null>(() => {
    const exposure = marketExposure;
    if (exposure === undefined) return null;

    const parsed = exposure
      .map((item) => {
        if (!item.market_address) return null;
        const checksumAddress = toValidChecksumAddress(item.market_address);
        const inst =
          (checksumAddress ? insts[checksumAddress] : undefined) ??
          insts[item.market_address];
        const symbol = inst?.symbol ?? item.symbol;
        const name = inst?.name ?? item.symbol;
        if (!symbol || !name) return null;

        try {
          return {
            id: item.market_address,
            symbol,
            name,
            amount: BigInt(item.distribution_amount),
            cap: BigInt(item.max_cap),
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        if (a.amount === b.amount) {
          if (a.cap !== b.cap) return a.cap > b.cap ? -1 : 1;
          return a.symbol.localeCompare(b.symbol);
        }
        return a.amount > b.amount ? -1 : 1;
      });

    const total = parsed.reduce((sum, item) => sum + item.amount, 0n);
    const withWeight = parsed.map((item, index) => ({
      ...item,
      weight: total > 0n ? Number((item.amount * 10000n) / total) / 100 : 0,
      color:
        STRATEGY_MARKET_COLORS[
          Math.min(index, STRATEGY_MARKET_COLORS.length - 1)
        ]!,
    }));

    if (withWeight.length <= 5) {
      return withWeight.map((item) => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        color: item.color,
        weight: item.weight,
      }));
    }

    const topFour = withWeight.slice(0, 4).map((item) => ({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      color: item.color,
      weight: item.weight,
    }));
    const othersWeight = withWeight
      .slice(4)
      .reduce((sum, item) => sum + item.weight, 0);

    return [
      ...topFour,
      {
        id: 'others',
        symbol: 'Others',
        name: 'Others',
        color: STRATEGY_MARKET_OTHERS_COLOR,
        weight: othersWeight,
        isOthers: true,
      },
    ];
  }, [insts, marketExposure]);

  if (exposureTokens === null) {
    return <StrategyBannerSkeleton />;
  }

  return (
    <ModuleCard className="max-md:bg-bg-2 rounded-2xl p-3 max-md:p-3">
      {exposureTokens.length === 0 ? (
        <div className="text-t-270 flex h-[132px] items-center justify-center rounded-xl text-xs md:h-[260px]">
          --
        </div>
      ) : (
        <div className="flex w-full items-center gap-2 md:flex-col">
          <DonutChart exposureTokens={exposureTokens} />
          <div className="min-w-0 flex-1 space-y-2 md:w-full md:flex-none">
            {exposureTokens.map((token) => (
              <ExposureLegendRow key={token.id} token={token} />
            ))}
          </div>
        </div>
      )}
    </ModuleCard>
  );
};
