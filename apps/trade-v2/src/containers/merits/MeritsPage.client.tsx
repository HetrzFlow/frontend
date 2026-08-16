'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavItems } from '@repo/common/hooks';
import {
  ArrowRightIcon,
  Button,
  ChevronDownIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogTitle,
  InfoCircleIcon,
  ShareNetworkIcon,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import { ConnectBtn } from '@/common/components';
import { useReferralCodes } from '@/common/hooks';
import {
  useGenesisLpEstimate,
  useGenesisMeritsEpoch,
  useGenesisMeritsSeasons,
  useGenesisMeritsUserSummary,
  useGenesisVaultConfig,
} from '@/queries/bsc/genesis';
import type {
  GenesisLpEstimate,
  GenesisVaultConfig,
} from '@/services/rest/genesis';
import {
  calculateEstimate,
  EMPTY_MERITS_CATALOG,
  formatMerits,
  formatMeritsRank,
  getBreakdownPercentages,
  getCountdown,
  getInitialScope,
  getMeritsTopPercent,
  getMeritsOverview,
  getPublicSeason,
  toMeritsBreakdown,
  toMeritsCatalog,
  toMeritsEpoch,
  type MeritsBreakdownItem,
  type MeritsCatalog,
  type MeritsEpoch,
  type MeritsOverview,
  type MeritsScope,
  type MeritsSeason,
  type MeritsSourceId,
} from './model';
import { useMeritsRank } from './useMeritsRank';

const MeritsShareDialog = dynamic(
  () =>
    import('./MeritsShareDialog').then((module) => module.MeritsShareDialog),
  { ssr: false },
);

const ASSET_ROOT = '/trade-static/merits';
// TODO: Replace with the final Merits GitBook URL when Product provides it.
const MERITS_LEARN_MORE_URL = '/docs';

const sourceAssets: Record<MeritsSourceId, string> = {
  trading: `${ASSET_ROOT}/source-trading.svg`,
  liquidity: `${ASSET_ROOT}/source-liquidity.svg`,
  referral: `${ASSET_ROOT}/source-referral.svg`,
  swap: `${ASSET_ROOT}/source-swap-disconnected.svg`,
};

const sourceAssetDimensions: Record<
  MeritsSourceId,
  { width: number; height: number }
> = {
  trading: { width: 15.9668, height: 17.2998 },
  liquidity: { width: 20, height: 20 },
  referral: { width: 20, height: 20 },
  swap: { width: 20, height: 20 },
};

const breakdownColors: Record<MeritsSourceId, string> = {
  trading: '#1c5561',
  liquidity: '#008383',
  referral: '#9bcfe5',
  swap: '#0f6c83',
};

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-t-1100 text-sm font-medium tracking-[-0.56px]">
    {children}
  </h2>
);

const GlassCard = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`border-border bg-white/[0.01] backdrop-blur-[20px] ${className}`}
  >
    {children}
  </div>
);

const MeritsBackground = ({
  disconnected,
  predeposit,
}: {
  disconnected: boolean;
  predeposit: boolean;
}) => (
  <div
    className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${
      disconnected ? 'bg-bg-1' : ''
    }`}
  >
    <div className="absolute inset-x-0 top-0 h-[871px]">
      <Image
        src="/trade-static/common/light-rays-effect.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top mix-blend-screen"
      />
      <div className="to-bg-1 absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-b from-transparent" />
    </div>
    {disconnected ? (
      <>
        <div className="absolute top-0 left-0 h-[871px] w-full overflow-hidden max-md:hidden">
          <div className="absolute top-0 left-1/2 h-full w-[1791.771px] -translate-x-1/2">
            <div className="absolute top-[-40.95%] right-0 bottom-[83.05%] w-[899.204px]">
              <div className="absolute inset-[-87.27%_-48.95%]">
                <Image
                  src={`${ASSET_ROOT}/light-ray.svg`}
                  alt=""
                  fill
                  priority
                  sizes="1780px"
                />
              </div>
            </div>
            <div className="absolute top-[-40.95%] bottom-[83.05%] left-0 w-[899.204px]">
              <div className="absolute inset-[-87.27%_-48.95%]">
                <Image
                  src={`${ASSET_ROOT}/light-ray.svg`}
                  alt=""
                  fill
                  priority
                  sizes="1780px"
                />
              </div>
            </div>
            <div className="absolute top-[-3646px] left-[-403px] flex h-[5046.487px] w-[4840.822px] items-center justify-center mix-blend-plus-lighter">
              <Image
                src={`${ASSET_ROOT}/star.png`}
                alt=""
                width={7466}
                height={8292}
                priority
                sizes="3733px"
                className="h-[4145.633px] w-[3732.511px] max-w-none rotate-[24.39deg]"
              />
            </div>
            <div className="absolute top-[-3364.55px] left-[-2908.31px] flex h-[5046.487px] w-[4840.822px] items-center justify-center mix-blend-plus-lighter">
              <Image
                src={`${ASSET_ROOT}/star.png`}
                alt=""
                width={7466}
                height={8292}
                priority
                sizes="3733px"
                className="h-[4145.633px] w-[3732.511px] max-w-none rotate-[24.39deg]"
              />
            </div>
          </div>
        </div>
        <div className="to-bg-1 absolute top-0 left-0 h-[871px] w-full bg-gradient-to-b from-transparent max-md:hidden" />
        <div className="absolute top-[-261.432px] left-1/2 flex size-[1277.922px] -translate-x-1/2 items-center justify-center max-md:hidden">
          <div className="relative size-[976.784px] rotate-[-22.684deg]">
            <Image
              src={`${ASSET_ROOT}/coins.png`}
              alt=""
              fill
              priority
              sizes="977px"
              className="object-cover"
            />
            <Image
              src={`${ASSET_ROOT}/coins.png`}
              alt=""
              fill
              priority
              sizes="977px"
              className="object-cover blur-[16px]"
              style={{
                WebkitMaskImage:
                  'linear-gradient(291.6deg, transparent 44%, black 63.2%)',
                maskImage:
                  'linear-gradient(291.6deg, transparent 44%, black 63.2%)',
              }}
            />
          </div>
        </div>
      </>
    ) : (
      <div className="absolute top-0 left-1/2 h-[1682px] w-[1792px] -translate-x-1/2 max-md:hidden">
        <Image
          src={`${ASSET_ROOT}/hero-desktop.png`}
          alt=""
          width={4096}
          height={2305}
          priority
          sizes="(min-width: 1440px) calc(100vw + 74px), 1514px"
          className="absolute top-[-390px] left-[calc(50%+40px)] h-[852px] w-[max(1514px,calc(100vw+74px))] max-w-none -translate-x-1/2 object-cover opacity-70 mix-blend-plus-lighter [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%_-_96px),transparent_100%)] [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%_-_96px),transparent_100%)]"
        />
        <Image
          src={`${ASSET_ROOT}/star.png`}
          alt=""
          width={7466}
          height={8292}
          priority
          sizes="3733px"
          className="absolute top-[-2914px] left-[-2354px] h-[4146px] w-[3733px] max-w-none rotate-[24.39deg] mix-blend-plus-lighter"
        />
      </div>
    )}
    <div className="absolute top-0 left-1/2 hidden h-[634px] w-full -translate-x-1/2 overflow-hidden max-md:block">
      <Image
        src={`${ASSET_ROOT}/hero-mobile.png`}
        alt=""
        width={4096}
        height={2305}
        priority
        sizes="968px"
        className="absolute top-[-138px] left-[-140px] h-[545px] w-[968px] max-w-none rotate-[5.24deg] object-cover opacity-70 mix-blend-plus-lighter [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%_-_96px),transparent_100%)] [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%_-_96px),transparent_100%)]"
      />
      <Image
        src={`${ASSET_ROOT}/star.png`}
        alt=""
        width={7466}
        height={8292}
        priority
        sizes="1842px"
        className="absolute top-[-1438px] left-[-1443px] h-[2045px] w-[1842px] max-w-none rotate-[24.39deg] mix-blend-plus-lighter"
      />
    </div>
    {disconnected ? (
      <Image
        src={`${ASSET_ROOT}/coins.png`}
        alt=""
        width={3000}
        height={3000}
        sizes="900px"
        className="absolute top-[250px] left-1/2 hidden w-[900px] max-w-none -translate-x-1/2 rotate-[-22deg] opacity-80 blur-[12px] max-md:block"
      />
    ) : null}
    {predeposit ? (
      <Image
        src={`${ASSET_ROOT}/predeposit-coins.png`}
        alt=""
        width={3000}
        height={3000}
        sizes="1000px"
        className="absolute top-[-420px] left-1/2 w-[1000px] max-w-none -translate-x-1/2 rotate-[24deg] opacity-70 blur-[8px] max-md:top-[-210px] max-md:w-[620px]"
      />
    ) : null}
    <div className="absolute top-0 left-1/2 h-[1682px] w-[max(1988px,100vw)] -translate-x-1/2 opacity-[0.58] mix-blend-soft-light">
      <div
        className="bg-top-left absolute inset-0 opacity-[0.74]"
        style={{
          backgroundImage: 'url("/trade-static/common/noise-effect.png")',
          backgroundSize: '1076.337px 358.779px',
        }}
      />
    </div>
  </div>
);

const StatusPill = ({ status }: { status: MeritsSeason['status'] }) => (
  <span
    aria-hidden
    className={`flex size-3 shrink-0 animate-pulse items-center justify-center rounded-full [animation-duration:2.4s] motion-reduce:animate-none ${status === 'active' ? 'bg-[#00DFEB]/[0.08]' : 'bg-white/[0.08]'}`}
  >
    <span
      className={`size-1.5 rounded-full ${status === 'active' ? 'bg-[#00DFEB]' : 'bg-white/50'}`}
    />
  </span>
);

const AllSeasonsIcon = () => (
  <Image
    src={`${ASSET_ROOT}/all-seasons.svg`}
    alt=""
    width={12}
    height={12}
    className="size-3 shrink-0"
  />
);

const SelectedCheckIcon = () => (
  <Image
    src={`${ASSET_ROOT}/selected-check.svg`}
    alt=""
    width={16}
    height={16}
    className="size-4 shrink-0"
  />
);

const SeasonSelector = ({
  catalog,
  scope,
  onScopeChange,
}: {
  catalog: MeritsCatalog;
  scope: MeritsScope;
  onScopeChange: (scope: MeritsScope) => void;
}) => {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const season = catalog.seasons.find((item) => item.id === scope);
  const options = catalog.seasons.filter((item) => item.status !== 'upcoming');

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative z-30 w-fit">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className="border-border flex h-8 w-max items-center gap-2 rounded-full border bg-[#00DFEB]/10 px-4 text-sm font-medium tracking-[-0.56px] text-white backdrop-blur-[10px]"
      >
        {scope === 'all' ? (
          <AllSeasonsIcon />
        ) : (
          <StatusPill status={season?.status ?? 'ended'} />
        )}
        <span className="shrink-0 whitespace-nowrap">
          {scope === 'all'
            ? t`All Seasons`
            : `${season?.name ?? ''} ${season?.status === 'active' ? t`LIVE` : t`Ended`}`}
        </span>
        {season ? (
          <span className="text-t-270 shrink-0 font-normal whitespace-nowrap">
            {season.dateRange}
          </span>
        ) : null}
        <ChevronDownIcon
          size={16}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={t`Season`}
          className="absolute top-10 left-1/2 flex w-full min-w-[253px] -translate-x-1/2 flex-col gap-2 rounded-xl bg-[#00DFEB]/[0.05] p-2 shadow-[-40px_10px_80px_0_rgba(0,0,0,0.1)] backdrop-blur-[40px]"
        >
          <button
            type="button"
            role="option"
            aria-selected={scope === 'all'}
            onClick={() => {
              onScopeChange('all');
              setOpen(false);
            }}
            className="relative flex h-3.5 w-full items-center justify-between text-left text-xs leading-[1.2] before:pointer-events-none before:absolute before:-inset-1 before:rounded-lg before:transition-colors before:content-[''] hover:before:bg-white/5 focus-visible:before:bg-white/5"
          >
            <span className="flex items-center gap-2">
              <AllSeasonsIcon />
              {t`All Seasons`}
            </span>
            {scope === 'all' ? <SelectedCheckIcon /> : null}
          </button>
          <div aria-hidden className="bg-border h-px w-full" />
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={scope === option.id}
              onClick={() => {
                onScopeChange(option.id);
                setOpen(false);
              }}
              className="relative flex h-8 w-full items-start justify-between gap-2 text-left text-xs leading-[1.2] before:pointer-events-none before:absolute before:-inset-1 before:rounded-lg before:transition-colors before:content-[''] hover:before:bg-white/5 focus-visible:before:bg-white/5"
            >
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <StatusPill status={option.status} />
                  {option.name}{' '}
                  {option.status === 'active' ? t`LIVE` : t`Ended`}
                </span>
                <span className="text-t-350">{option.dateRange}</span>
              </span>
              {scope === option.id ? <SelectedCheckIcon /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const Countdown = ({
  endAt,
  now,
  className = '',
  card = false,
}: {
  endAt: number;
  now: number;
  className?: string;
  card?: boolean;
}) => {
  const { t } = useLingui();
  const countdown = getCountdown(endAt, now);
  const units = [
    [countdown.days, t({ message: 'D', context: 'Genesis countdown days' })],
    [countdown.hours, t({ message: 'H', context: 'Genesis countdown hours' })],
    [
      countdown.minutes,
      t({ message: 'M', context: 'Genesis countdown minutes' }),
    ],
    [
      countdown.seconds,
      t({ message: 'S', context: 'Genesis countdown seconds' }),
    ],
  ] as const;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`text-t-350 whitespace-nowrap ${card ? 'text-[13px] tracking-[-0.52px]' : 'text-xs'}`}
      >{t`Ends in`}</span>
      <div className="flex items-center gap-2">
        {units.map(([value, unit], index) => (
          <div key={unit} className="flex items-center gap-2">
            {index ? (
              <span className="h-2 w-0.5 rounded-sm bg-white/30" />
            ) : null}
            <span className="border-border flex items-center gap-0.5 rounded-lg border px-2 py-1">
              <strong className="text-base leading-5 font-semibold tracking-[-0.64px]">
                {value}
              </strong>
              <span className="text-t-350 text-xs">{unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ShareButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useLingui();
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="text-accent hover:text-accent h-6 gap-1 rounded-lg bg-[#092f33] px-3 text-[13px] leading-normal font-medium tracking-[-0.52px] hover:bg-[#083a3d]"
    >
      <ShareNetworkIcon size={16} />
      {t`Boost My Merits`}
    </Button>
  );
};

const MetricLabel = ({
  children,
  tooltip,
}: {
  children: ReactNode;
  tooltip?: string;
}) => (
  <span className="text-t-270 flex items-center gap-1 text-xs leading-[14px]">
    {children}
    {tooltip ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={typeof children === 'string' ? children : tooltip}
            className="text-t-270 hover:text-t-1100 inline-flex items-center"
          >
            <InfoCircleIcon size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={5}
          className="z-[70] max-w-80 rounded-2xl p-3 text-xs"
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    ) : null}
  </span>
);

const EpochPanel = ({
  epoch,
  seasonName,
  overview,
  estimateData,
  loading,
  delayed,
  unavailable,
  now,
  onShare,
}: {
  epoch: MeritsEpoch;
  seasonName: string;
  overview: MeritsOverview;
  estimateData?: GenesisLpEstimate;
  loading: boolean;
  delayed: boolean;
  unavailable: boolean;
  now: number;
  onShare: () => void;
}) => {
  const { t } = useLingui();
  const tooltip = t`Updates every second using your latest score share. Your score share refreshes every 5 seconds. This is an estimate and may change; final Merits are determined when the Epoch ends.`;
  const estimate = estimateData ? calculateEstimate(estimateData, now) : null;

  return (
    <section className="flex flex-col gap-6 px-4 pt-3 pb-10 max-md:px-0 max-md:pb-3">
      <div className="flex flex-col items-center gap-3 max-md:items-start">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-medium tracking-[-1.2px] uppercase">
            {t`Epoch`} {seasonName}
          </h2>
          <span className="text-accent flex items-center gap-1 text-xs">
            <StatusPill status="active" /> {t`Live`}
          </span>
        </div>
        <Countdown endAt={epoch.endAt} now={now} />
      </div>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-4">
        <div className="flex flex-col items-center justify-center gap-2 max-md:items-start">
          <MetricLabel tooltip={tooltip}>{t`Your Estimated`}</MetricLabel>
          <div className="flex min-h-7 items-center gap-2">
            {loading || unavailable || estimate === null ? (
              <Skeleton className="h-7 w-36" />
            ) : (
              <strong className="text-2xl leading-[30px] font-medium tracking-[-0.96px]">
                {formatMerits(estimate, 2)} {t`Merits`}
              </strong>
            )}
            {!loading && !unavailable && estimate !== null ? (
              <ShareButton onClick={onShare} />
            ) : null}
          </div>
          {delayed ? (
            <span className="text-xs text-[#f8ff94]">{t`Data delayed`}</span>
          ) : null}
        </div>
        <div className="border-border flex flex-col items-center justify-center gap-2 border-l max-md:items-start max-md:border-t max-md:border-l-0 max-md:pt-4">
          <MetricLabel
            tooltip={t`Merits are distributed in cycles called Epochs. This pool is the total Merits shared by all participants in the current Epoch. Your Estimated shows your projected share of it, based on your contribution so far. The final amount is settled when the Epoch ends.`}
          >
            {t`Epoch Pool`}
          </MetricLabel>
          <strong className="text-2xl font-medium tracking-[-0.96px]">
            {formatMerits(epoch.pool)} {t`Merits`}
          </strong>
        </div>
      </div>
      <span className="sr-only">{formatMerits(overview.settledMerits)}</span>
    </section>
  );
};

const RankValue = ({
  rank,
  variant = 'split',
}: {
  rank: MeritsOverview['rank'];
  variant?: 'split' | 'inline';
}) => {
  const { t } = useLingui();
  const topPercent = getMeritsTopPercent(rank.position, rank.topPercent);
  const topRank =
    topPercent === null ? (
      <Skeleton
        aria-hidden
        className={
          variant === 'inline'
            ? 'h-6 w-[83px] shrink-0 rounded-lg'
            : 'ml-auto h-4 w-14 shrink-0 rounded-md'
        }
      />
    ) : (
      <Link
        href="/leaderboard"
        className={
          variant === 'inline'
            ? 'bg-accent/15 text-accent flex h-6 shrink-0 items-center gap-1 rounded-lg px-3 text-[13px] font-medium tracking-[-0.52px]'
            : 'text-accent ml-auto flex shrink-0 items-center text-sm font-medium tracking-[-0.56px]'
        }
      >
        {variant === 'inline' ? (
          <Image
            src={`${ASSET_ROOT}/top-rank-arrow.svg`}
            alt=""
            width={16}
            height={16}
            className="size-4"
          />
        ) : null}
        {t`Top ${topPercent}%`}
        {variant === 'split' ? (
          <Image
            src={`${ASSET_ROOT}/top-rank-arrow.svg`}
            alt=""
            width={16}
            height={16}
            className="size-4"
          />
        ) : null}
      </Link>
    );

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center gap-2">
        <strong className="text-2xl leading-none font-medium tracking-[-0.96px]">
          {formatMeritsRank(rank.position)}
        </strong>
        {topRank}
      </div>
    );
  }

  return (
    <>
      <strong className="text-xl leading-none font-medium tracking-[-0.8px]">
        {formatMeritsRank(rank.position)}
      </strong>
      {topRank}
    </>
  );
};

const SeasonSummary = ({ overview }: { overview: MeritsOverview }) => {
  const { t } = useLingui();
  return (
    <GlassCard className="relative flex min-h-[164px] flex-col gap-4 overflow-hidden rounded-3xl border p-4 max-md:min-h-[156px] max-md:rounded-2xl max-md:p-[11px]">
      <div className="pointer-events-none absolute top-[8.5px] right-[19px] size-[100px] overflow-hidden">
        <div
          className="absolute -top-[15px] -left-[15px] size-[130px]"
          style={{
            WebkitMaskImage: `url("${ASSET_ROOT}/season-balance-mask.svg")`,
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskSize: '130px 130px',
            maskImage: `url("${ASSET_ROOT}/season-balance-mask.svg")`,
            maskRepeat: 'no-repeat',
            maskSize: '130px 130px',
          }}
        >
          <Image
            src={`${ASSET_ROOT}/season-balance-coins.png`}
            alt=""
            width={1024}
            height={1024}
            sizes="130px"
            className="size-full object-cover"
          />
        </div>
      </div>
      <span className="h-[26px] text-sm font-medium tracking-[-0.56px]">
        {t`Season Merits`}
      </span>
      <strong className="text-xl leading-none font-medium tracking-[-0.8px]">
        {formatMerits(overview.settledMerits)} {t`Merits`}
      </strong>
      <div className="border-border hidden h-0 border-t max-md:-mb-px max-md:block" />
      <div className="border-border mt-auto flex items-center gap-3 border-t pt-4 max-md:mt-0 max-md:border-t-0 max-md:pt-0">
        <div className="relative size-8 shrink-0 overflow-hidden">
          <Image
            src={`${ASSET_ROOT}/rank.svg`}
            alt=""
            width={22}
            height={29}
            className="absolute top-px left-[5px] h-[29px] w-[22px]"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-t-350 text-xs leading-[14px]">
            {t`Your season rank`}
          </span>
          <div className="flex items-center">
            <RankValue rank={overview.rank} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

const Breakdown = ({
  items,
  loading,
  error,
}: {
  items?: MeritsBreakdownItem[];
  loading: boolean;
  error: boolean;
}) => {
  const { t } = useLingui();
  const names: Record<MeritsSourceId, string> = {
    trading: t`Trading`,
    liquidity: t`Liquidity`,
    referral: t`Referral`,
    swap: t`Swap`,
  };
  if (loading || error || !items)
    return <Skeleton className="h-[164px] rounded-2xl" />;
  const percentages = getBreakdownPercentages(items);
  const showProgress = items.length > 1;

  return (
    <GlassCard className="relative flex min-h-[164px] flex-col gap-4 overflow-hidden rounded-2xl border p-4 max-md:min-h-[189px] max-md:p-[11px]">
      <div className="pointer-events-none absolute top-[calc(50%+101.03px)] right-[-151.58px] flex size-[648.178px] -translate-y-1/2 items-center justify-center">
        <div className="flex-none rotate-[-6.46deg]">
          <div className="relative size-[585.952px] blur-[10px]">
            <Image
              src={`${ASSET_ROOT}/breakdown-coins.png`}
              alt=""
              width={1780}
              height={1780}
              sizes="586px"
              className="absolute inset-0 size-full max-w-none object-cover opacity-[0.21]"
            />
          </div>
        </div>
      </div>
      <h3 className="relative text-sm font-medium tracking-[-0.56px]">
        {t`Season Merits Composition`}
      </h3>
      <div className="relative flex w-full flex-1 flex-col justify-end gap-9 rounded-xl max-md:gap-5">
        {showProgress ? (
          <div className="flex h-1.5 w-full overflow-hidden rounded-full">
            {items.map((item, index) => (
              <span
                key={item.source}
                style={{
                  width: `${percentages[index]}%`,
                  backgroundColor: breakdownColors[item.source],
                }}
              />
            ))}
          </div>
        ) : null}
        <div className="flex w-full items-center gap-3 max-md:grid max-md:grid-cols-[minmax(0,1fr)_0_minmax(0,1fr)] max-md:gap-x-3 max-md:gap-y-3">
          {items.map((item, index) => (
            <div key={item.source} className="contents">
              {index > 0 ? (
                <span
                  className={`border-border h-[42px] w-0 shrink-0 border-l max-md:h-[47px] ${index % 2 === 0 ? 'max-md:hidden' : ''}`}
                />
              ) : null}
              <div className="flex min-w-0 flex-1 items-center max-md:h-[47px]">
                <div className="flex flex-col items-start justify-center gap-1">
                  <span className="text-t-270 flex items-center gap-1 text-xs leading-[1.2] whitespace-nowrap">
                    <span
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: breakdownColors[item.source],
                      }}
                    />
                    {names[item.source]}
                  </span>
                  <strong className="text-xl leading-normal font-medium tracking-[-0.8px] whitespace-nowrap max-md:text-2xl max-md:tracking-[-0.96px]">
                    {formatMerits(item.amount)}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

const PredepositSummary = ({ overview }: { overview: MeritsOverview }) => {
  const { t } = useLingui();
  return (
    <GlassCard className="relative flex min-h-[96px] items-center overflow-hidden rounded-2xl p-4 max-md:flex-col max-md:items-stretch max-md:gap-4">
      <Image
        src={`${ASSET_ROOT}/predeposit-coins.png`}
        alt=""
        width={3000}
        height={3000}
        sizes="500px"
        className="pointer-events-none absolute -right-[110px] -bottom-[280px] w-[560px] max-w-none opacity-20 blur-[8px]"
      />
      <div className="relative flex flex-1 flex-col gap-1">
        <span className="text-t-350 text-xs">{t`Season Merits`}</span>
        <strong className="text-xl font-medium">
          {formatMerits(overview.settledMerits)} {t`Merits`}
        </strong>
      </div>
      <div className="border-border relative flex flex-1 items-center gap-3 border-l pl-6 max-md:border-t max-md:border-l-0 max-md:pt-4 max-md:pl-0">
        <Image
          src={`${ASSET_ROOT}/rank.svg`}
          alt=""
          width={22}
          height={29}
          className="h-8 w-auto"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-t-350 text-xs">{t`Your Rank`}</span>
          <div className="flex items-center">
            <RankValue rank={overview.rank} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

const EarnCards = ({
  season,
  predepositConfig,
}: {
  season: MeritsSeason;
  predepositConfig?: GenesisVaultConfig;
}) => {
  const { t } = useLingui();
  const navItems = useNavItems();
  const sourceCopy: Record<
    MeritsSourceId,
    { name: string; description: string; href: string }
  > = {
    trading: {
      name: t`Trading`,
      description: t`Closed trades earn Merits. Bigger flow may earn more.`,
      href: '/trade',
    },
    liquidity: {
      name: t`Liquidity`,
      description: t`Liquidity activity earns Merits based on campaign rules.`,
      href: '/pools',
    },
    referral: {
      name: t`Referral`,
      description: t`Invitees' activity earns you extra, by tier.`,
      href: '/referral',
    },
    swap: {
      name: t`Swap`,
      description: t`Swaps earn Merits based on campaign rules.`,
      href: '/trade',
    },
  };
  if (season.variant === 'pre_deposit' && !predepositConfig) {
    return <Skeleton className="h-[232px] rounded-2xl" />;
  }
  const apr = predepositConfig?.apr ?? 0;
  const boost = predepositConfig?.boostMultiplier ?? 0;
  const days = predepositConfig?.maturityDays ?? 0;
  const seasonName = season.name;
  const predepositItems = [
    {
      name: t`Get an invite code`,
      description: t`This round is invite-only. Get a code from an existing depositor or official channels, then connect your wallet.`,
      icon: `${ASSET_ROOT}/predeposit-vault.svg`,
      iconWidth: 20,
      iconHeight: 20,
      href: navItems.vaults.link,
    },
    {
      name: t`Deposit USD1 / U`,
      description: t`Deposit into the Genesis Vault. First come, first served; deposits close when the cap is filled.`,
      icon: `${ASSET_ROOT}/predeposit-deposit.svg`,
      iconWidth: 20,
      iconHeight: 20,
      href: navItems.pools.link,
    },
    {
      name: t`Hold to earn ${apr}% APR and ${boost}x boost`,
      description: t`Merits accrue daily and are settled at the end of ${seasonName}. Hold your deposit for ${days} consecutive days to unlock the ${boost}x boost and claim ${apr}% APR cash yield. You may withdraw at any time, but the withdrawn amount will lose both rewards.`,
      icon: `${ASSET_ROOT}/predeposit-hold.svg`,
      iconWidth: 20,
      iconHeight: 20,
      href: navItems.genesis.link,
    },
  ];
  const items =
    season.variant === 'pre_deposit'
      ? predepositItems
      : season.enabledSources.map((source) => ({
          ...sourceCopy[source],
          icon: sourceAssets[source],
          iconWidth: sourceAssetDimensions[source].width,
          iconHeight: sourceAssetDimensions[source].height,
        }));

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>{t`How to earn`}</SectionTitle>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-3">
        {items.map((item, index) => {
          const content = (
            <>
              <div className="flex items-center justify-between">
                <Image
                  src={item.icon}
                  alt=""
                  width={item.iconWidth}
                  height={item.iconHeight}
                />
                <ArrowRightIcon size={16} className="text-accent" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-medium max-md:leading-[19px]">
                  {item.name}
                </h3>
                <p className="text-t-270 text-[13px] tracking-[-0.52px] max-md:leading-[15px]">
                  {item.description}
                </p>
              </div>
            </>
          );
          const className = `border-border bg-white/[0.01] flex min-h-[96px] flex-col gap-3 rounded-xl border p-3 backdrop-blur-[20px] max-md:min-h-[94px] max-md:p-[11px] ${season.variant === 'pre_deposit' && index === 2 ? 'col-span-2 max-md:col-span-1' : ''}`;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${className} focus-visible:ring-accent transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:outline-none`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const FaqItem = ({
  question,
  answer,
  defaultOpen,
}: {
  question: string;
  answer: ReactNode;
  defaultOpen: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="focus-visible:ring-accent flex w-full cursor-pointer items-center justify-between gap-3 text-left text-base font-medium focus-visible:ring-2 focus-visible:outline-none max-md:leading-[19px]">
        {question}
        <ChevronDownIcon
          size={16}
          className="shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="text-t-270 pt-2 text-[13px] tracking-[-0.52px] max-md:leading-[15px]">
          {answer}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
};

const Faq = ({ sourceNames }: { sourceNames: string }) => {
  const { t } = useLingui();
  const items = [
    {
      question: t`When do my Merits update?`,
      answer: t`Estimated Merits update every second during the Epoch and are finalized when it ends.`,
    },
    {
      question: t`What earns Merits?`,
      answer: (
        <Trans>
          The current Season can award Merits through {sourceNames}. Your Season
          Merits balance only includes settled Merits and does not include the
          current estimate.
        </Trans>
      ),
    },
    {
      question: t`How does TGE distribution work?`,
      answer: t`Merits may be used for downstream rewards. Reward claiming happens in Credit, not on the Merits page.`,
    },
    {
      question: t`Why can estimated Merits change?`,
      answer: t`Time progress and your latest score share can both change the estimate. Final Merits are determined when the Epoch ends.`,
    },
  ];
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>{t`FAQ`}</SectionTitle>
      <div className="border-border flex flex-col gap-6 rounded-2xl border p-3 max-md:p-[11px]">
        {items.map((item, index) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </section>
  );
};

const RewardsProgress = ({
  status,
}: {
  status: NonNullable<MeritsOverview['rewardStatus']>;
}) => {
  const { t } = useLingui();
  const current =
    status === 'settling'
      ? 0
      : status === 'settled'
        ? 1
        : status === 'formula'
          ? 2
          : 3;
  const steps = [
    [t`Season settled`, t`This season's Merits are finalized.`],
    [t`Formula confirmed`, t`The operations formula is confirmed.`],
    [t`Rewards ready`, t`Claim rewards in Credit.`],
  ];
  return (
    <section className="flex flex-col gap-6 max-md:gap-0">
      <div className="relative grid grid-cols-3 py-5 max-md:grid-cols-1 max-md:gap-10 max-md:py-3">
        <div className="pointer-events-none absolute inset-x-0 top-9 grid grid-cols-3 max-md:hidden">
          <span className="relative h-px after:absolute after:left-[calc(50%+24px)] after:h-px after:w-[calc(100%-48px)] after:bg-white/10" />
          <span className="relative h-px after:absolute after:left-[calc(50%+24px)] after:h-px after:w-[calc(100%-48px)] after:bg-white/10" />
        </div>
        <span
          aria-hidden
          className="bg-accent absolute top-[51px] left-4 hidden h-8 w-px max-md:block"
        />
        <span
          aria-hidden
          className="bg-accent absolute top-[129px] left-4 hidden h-8 w-px max-md:block"
        />
        {steps.map(([title, description], index) => (
          <div
            key={title}
            className="relative flex flex-col items-center gap-3 text-center max-md:flex-row max-md:items-start max-md:text-left"
          >
            <span
              className={`z-10 flex size-8 items-center justify-center rounded-full text-xs ${index < current ? 'bg-accent/15 text-accent' : index === current ? 'bg-accent/15 text-accent' : 'bg-white/10 text-white/70'}`}
            >
              {index < current ? (
                <Image
                  src={`${ASSET_ROOT}/check.svg`}
                  alt=""
                  width={16}
                  height={16}
                />
              ) : (
                index + 1
              )}
            </span>
            <div className="flex flex-col gap-1">
              <strong className="text-base font-medium max-md:leading-[19px]">
                {title}
              </strong>
              <span className="text-t-270 text-[13px] max-md:leading-[15px]">
                {description}
              </span>
            </div>
          </div>
        ))}
      </div>
      {status !== 'settling' ? (
        <Link
          href="/credit"
          className="bg-accent/15 hover:bg-accent/20 focus-visible:bg-accent/20 flex items-center justify-center gap-1 rounded-lg p-2.5 transition-colors max-md:-order-1 max-md:mb-5 max-md:min-h-[52px] max-md:bg-[#092f33] max-md:hover:bg-[#083a3d] max-md:focus-visible:bg-[#083a3d]"
        >
          <span className="flex shrink-0 items-center gap-2 max-md:min-w-0 max-md:flex-1 max-md:shrink">
            <Image
              src={`${ASSET_ROOT}/reward-finalized.svg`}
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0"
            />
            <span className="bg-[linear-gradient(90deg,#F8FF94_0%,#00DFEB_100%)] bg-clip-text text-[13px] leading-normal font-medium tracking-[-0.52px] whitespace-nowrap text-transparent max-md:leading-4 max-md:whitespace-normal">
              {status === 'credited'
                ? t`Season Merits are finalized. Your Credit rewards have been added to your balance.`
                : t`Season Merits are finalized. Rewards are ready to claim in Credit.`}
            </span>
          </span>
          <Image
            src={`${ASSET_ROOT}/reward-arrow-forward.svg`}
            alt=""
            width={16}
            height={16}
            className="size-4 shrink-0"
          />
        </Link>
      ) : (
        <div className="rounded-lg bg-white/5 p-2.5 text-center text-[13px] text-white/70">{t`Merits are being distributed. Final results will appear after settlement completes.`}</div>
      )}
    </section>
  );
};

const AllSeasons = ({
  catalog,
  overview,
  now,
  onScopeChange,
  onShare,
}: {
  catalog: MeritsCatalog;
  overview: MeritsOverview;
  now: number;
  onScopeChange: (scope: MeritsScope) => void;
  onShare: () => void;
}) => {
  const { t } = useLingui();
  const activeSeasons = catalog.seasons.filter(
    (season) => season.status === 'active',
  );
  return (
    <>
      <section className="grid grid-cols-2 gap-4 px-4 pt-3 pb-10 max-md:grid-cols-1 max-md:px-0 max-md:pb-6">
        <div className="flex flex-col items-center gap-2 max-md:items-start">
          <MetricLabel>{t`All Seasons Merits`}</MetricLabel>
          <div className="flex items-center gap-2">
            <strong className="text-2xl font-medium">
              {formatMerits(overview.settledMerits)} {t`Merits`}
            </strong>
            <ShareButton onClick={onShare} />
          </div>
        </div>
        <div className="border-border flex flex-col items-center gap-2 border-l max-md:items-start max-md:border-t max-md:border-l-0 max-md:pt-4">
          <MetricLabel>{t`Your rank`}</MetricLabel>
          <div className="flex w-full items-center justify-center">
            <RankValue rank={overview.rank} variant="inline" />
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <SectionTitle>{t`Earn Merits`}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {activeSeasons.map((season) => (
            <button
              type="button"
              key={season.id}
              onClick={() => onScopeChange(season.id)}
              className={`border-border bg-accent/10 hover:bg-accent/15 relative h-[83px] overflow-hidden rounded-2xl border p-[15px] text-left backdrop-blur-[20px] transition-colors ${activeSeasons.length === 1 ? 'col-span-2 max-md:col-span-1' : ''}`}
            >
              <div
                className={`absolute flex items-center justify-center ${activeSeasons.length === 1 ? 'top-[-109.76px] left-[-125.53px] h-[282.06px] w-[531.87px]' : 'top-[-62.75px] left-[-52.89px] h-[188.04px] w-[354.58px] max-md:top-[-109.76px] max-md:left-[-125.53px] max-md:h-[282.06px] max-md:w-[531.87px]'}`}
              >
                <div className="flex-none rotate-[21.17deg]">
                  <div
                    className={`relative ${activeSeasons.length === 1 ? 'h-[96.03px] w-[533.17px]' : 'h-[64.02px] w-[355.45px] max-md:h-[96.03px] max-md:w-[533.17px]'}`}
                  >
                    <Image
                      src={`${ASSET_ROOT}/season-card-glow-a.svg`}
                      alt=""
                      width={653}
                      height={216}
                      className={`absolute top-[-60px] left-[-60px] max-w-none ${activeSeasons.length === 1 ? 'h-[216.03px] w-[653.17px]' : 'h-[144.02px] w-[435.45px] max-md:h-[216.03px] max-md:w-[653.17px]'}`}
                    />
                  </div>
                </div>
              </div>
              <div
                className={`absolute flex h-[209.05px] w-[472.42px] items-center justify-center mix-blend-plus-lighter ${activeSeasons.length === 1 ? 'top-[-83.48px] left-[-121.63px]' : 'top-[-80.07px] left-[-129.02px] max-md:top-[-83.48px] max-md:left-[-121.63px]'}`}
              >
                <div className="flex-none rotate-[18.45deg]">
                  <div className="relative h-[61.02px] w-[477.66px]">
                    <Image
                      src={`${ASSET_ROOT}/season-card-glow-b.svg`}
                      alt=""
                      width={578}
                      height={161}
                      className="absolute top-[-50px] left-[-50px] h-[161.02px] w-[577.66px] max-w-none"
                    />
                  </div>
                </div>
              </div>
              <div className="relative flex h-full flex-col gap-1">
                <div className="flex h-[19px] items-start justify-between">
                  <span className="flex items-center gap-1 text-base leading-[1.2] font-medium whitespace-nowrap">
                    <Image
                      src={`${ASSET_ROOT}/season-${season.index === 1 ? 'one' : 'two'}.svg`}
                      alt=""
                      width={16}
                      height={16}
                      className="size-4 shrink-0"
                    />
                    {season.name} {t`Live`}
                  </span>
                  <Image
                    src={`${ASSET_ROOT}/season-card-arrow.svg`}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 shrink-0"
                  />
                </div>
                <Countdown
                  endAt={season.endAt}
                  now={now}
                  card
                  className="w-full items-end justify-between"
                />
              </div>
            </button>
          ))}
        </div>
      </section>
      <Faq sourceNames={t`the sources enabled for each Season`} />
    </>
  );
};

const LoadingBody = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-[170px] rounded-2xl" />
    <div className="grid grid-cols-[442px_1fr] gap-2 max-md:grid-cols-1">
      <Skeleton className="h-[162px] rounded-2xl" />
      <Skeleton className="h-[162px] rounded-2xl" />
    </div>
  </div>
);

const PageState = ({ kind }: { kind: 'empty' | 'upcoming' }) => {
  const { t } = useLingui();
  const copy =
    kind === 'empty'
      ? [
          t`No Merits Seasons yet`,
          t`Published Seasons will appear here when they are available.`,
        ]
      : [t`Merits are coming soon`, t`The next Season has not started yet.`];
  return (
    <GlassCard className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl p-8 text-center">
      <h2 className="text-3xl font-medium tracking-[-1.2px]">{copy[0]}</h2>
      <p className="text-t-270 text-sm">{copy[1]}</p>
    </GlassCard>
  );
};

const DisconnectedView = ({ season }: { season?: MeritsSeason }) => {
  const { t } = useLingui();
  const publicSources = season?.enabledSources ?? [];
  const names: Record<MeritsSourceId, string> = {
    trading: t`Trading`,
    liquidity: t`Liquidity`,
    referral: t`Referral`,
    swap: t`Swap`,
  };
  const descriptions: Record<MeritsSourceId, string> = {
    trading: t`Closed trades earn Merits. Bigger flow may earn more.`,
    liquidity: t`Liquidity activity earns Merits based on campaign rules.`,
    referral: t`Invitees' activity earns you extra, by tier.`,
    swap: t`Swaps earn Merits based on campaign rules.`,
  };
  return (
    <div className="relative z-10 mx-auto w-full max-w-[1080px] pt-[10px] max-md:px-4 max-md:pt-[74px]">
      <div className="flex flex-col gap-[7px]">
        <h1 className="text-[32px] leading-[normal] font-medium tracking-[-1.28px] max-md:text-2xl">{t`Merits`}</h1>
        <p className="text-t-270 text-sm tracking-[-0.56px]">{t`Connect your wallet to see your Merits and rank.`}</p>
        <Link
          href={MERITS_LEARN_MORE_URL}
          className="text-accent text-sm font-medium tracking-[-0.56px]"
        >{t`Learn more`}</Link>
      </div>
      <div className="mt-[11px] flex h-[525px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/[0.01] p-4 backdrop-blur-[10px] max-md:mt-6 max-md:h-[390px]">
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <h2 className="text-[42px] leading-[1.2] font-medium tracking-[-1.68px] max-md:text-[30px]">{t`Your Merits start here`}</h2>
          <p className="text-t-270 text-xs">{t`Connect your wallet to view your Merits.`}</p>
          <ConnectBtn className="h-[46px] rounded-xl px-10">{t`Connect Wallet`}</ConnectBtn>
        </div>
      </div>
      <div className="mt-3 flex w-full items-stretch gap-3 max-md:flex-col">
        {publicSources.map((source, index) => (
          <div key={source} className="contents">
            <div className="flex h-[101px] min-w-0 flex-1 items-center rounded-3xl border border-white/10 bg-black/[0.01] p-3 backdrop-blur-[10px] max-md:h-auto max-md:min-h-[96px] max-md:rounded-xl">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="flex size-5 shrink-0 items-center justify-center">
                  <Image
                    src={
                      source === 'swap'
                        ? `${ASSET_ROOT}/source-swap-disconnected.svg`
                        : sourceAssets[source]
                    }
                    alt=""
                    width={sourceAssetDimensions[source].width}
                    height={sourceAssetDimensions[source].height}
                  />
                </span>
                <strong className="text-base leading-[1.2] font-medium">
                  {names[source]}
                </strong>
                <span className="text-t-270 text-[13px] leading-[normal] tracking-[-0.52px]">
                  {descriptions[source]}
                </span>
              </div>
            </div>
            {index < publicSources.length - 1 ? (
              <span
                aria-hidden
                className="flex w-4 shrink-0 items-center justify-center max-md:hidden"
              >
                <Image
                  src={`${ASSET_ROOT}/source-connector.svg`}
                  alt=""
                  width={5.33333}
                  height={21.3333}
                  className="h-[21.333px] w-[5.333px] max-w-none rotate-90"
                />
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MeritsPageClient = () => {
  const { t } = useLingui();
  const connectionStatus = useConnectionStatus();
  const connected = connectionStatus === 'connected';
  const seasonsQuery = useGenesisMeritsSeasons();
  const catalog = seasonsQuery.data
    ? toMeritsCatalog(seasonsQuery.data)
    : EMPTY_MERITS_CATALOG;
  const [selectedScope, setSelectedScope] = useState<MeritsScope | null>(null);
  const scope: MeritsScope =
    selectedScope &&
    (selectedScope === 'all' ||
      catalog.seasons.some((season) => season.id === selectedScope))
      ? selectedScope
      : getInitialScope(catalog);
  const [now, setNow] = useState(() => Date.now());
  const [shareOpen, setShareOpen] = useState(false);
  const refreshedEpochEnd = useRef(0);
  const selectedSeason = catalog.seasons.find((season) => season.id === scope);
  const epochQuery = useGenesisMeritsEpoch(
    connected && selectedSeason?.status === 'active'
      ? selectedSeason.seasonId
      : undefined,
  );
  const epoch = epochQuery.data ? toMeritsEpoch(epochQuery.data) : null;
  const estimateQuery = useGenesisLpEstimate({
    enabled: connected && Boolean(epoch),
  });
  const summaryQuery = useGenesisMeritsUserSummary(
    scope === 'all' ? 'all' : selectedSeason?.seasonId,
    { enabled: connected },
  );
  const predepositConfigQuery = useGenesisVaultConfig({
    enabled:
      connected &&
      selectedSeason?.status === 'active' &&
      selectedSeason.variant === 'pre_deposit',
  });
  const rankQuery = useMeritsRank({ enabled: connected });
  const referralQuery = useReferralCodes();
  const overview = getMeritsOverview(
    summaryQuery.data?.settledTotalMerits,
    rankQuery.data,
  );
  const breakdown =
    summaryQuery.data && selectedSeason
      ? toMeritsBreakdown(summaryQuery.data, selectedSeason.enabledSources)
      : undefined;
  const referralCode = referralQuery.items[0];
  const shareData = referralCode
    ? {
        referralCode: referralCode.referral_code,
        shareLink: referralCode.share_link,
      }
    : undefined;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      !epoch ||
      now < epoch.endAt ||
      refreshedEpochEnd.current === epoch.endAt
    ) {
      return;
    }
    refreshedEpochEnd.current = epoch.endAt;
    void Promise.all([epochQuery.refetch(), seasonsQuery.refetch()]);
  }, [epoch, epochQuery, now, seasonsQuery]);

  const publicSeason = getPublicSeason(catalog);
  const sourceNamesById: Record<MeritsSourceId, string> = {
    trading: t`Trading`,
    liquidity: t`Liquidity`,
    referral: t`Referral`,
    swap: t`Swap`,
  };
  const sourceNames = (selectedSeason?.enabledSources ?? [])
    .map((source) => sourceNamesById[source])
    .join(', ');
  const predeposit = selectedSeason?.variant === 'pre_deposit';

  if (!connected) {
    return (
      <main className="bg-bg-1 relative min-h-full overflow-hidden pb-24 text-white">
        <MeritsBackground disconnected predeposit={false} />
        <DisconnectedView season={publicSeason} />
      </main>
    );
  }

  const published = catalog.seasons.filter(
    (season) => season.status !== 'upcoming',
  );
  const isUpcomingOnly =
    !published.length &&
    catalog.seasons.some((season) => season.status === 'upcoming');
  const estimate = estimateQuery.data
    ? calculateEstimate(estimateQuery.data, now)
    : null;
  const shareUnavailable =
    shareOpen &&
    !shareData &&
    !referralQuery.isLoading &&
    !referralQuery.isFetching;

  return (
    <main className="bg-bg-1 relative min-h-full overflow-hidden pb-28 text-white max-md:pb-32">
      <MeritsBackground disconnected={false} predeposit={Boolean(predeposit)} />
      <div className="relative z-10 mx-auto w-full max-w-[1080px] pt-[30px] max-md:px-4 max-md:pt-5">
        <header className="flex flex-col items-center gap-6 max-md:items-start max-md:gap-2">
          <h1 className="text-[62px] leading-none font-medium tracking-[-2.48px] max-md:text-2xl max-md:leading-[29px] max-md:tracking-[-0.96px]">{t`Merits`}</h1>
          <p className="text-t-270 text-center text-sm tracking-[-0.56px] max-md:text-left">{t`Track your Merits, see your rank, and discover ways to earn more.`}</p>
          <Link
            href={MERITS_LEARN_MORE_URL}
            className="text-accent hidden text-sm font-medium max-md:block"
          >{t`Learn more`}</Link>
          {published.length ? (
            <div className="mt-0 max-md:mt-3">
              <SeasonSelector
                catalog={catalog}
                scope={scope}
                onScopeChange={setSelectedScope}
              />
            </div>
          ) : null}
        </header>

        <div className="mt-10 flex flex-col gap-6 max-md:mt-5 max-md:gap-5">
          {isUpcomingOnly ? <PageState kind="upcoming" /> : null}
          {!seasonsQuery.isLoading && !catalog.seasons.length ? (
            <PageState kind="empty" />
          ) : null}
          {seasonsQuery.isLoading || seasonsQuery.isError ? (
            <LoadingBody />
          ) : null}
          {!seasonsQuery.isLoading &&
          !seasonsQuery.isError &&
          scope === 'all' ? (
            <AllSeasons
              catalog={catalog}
              overview={overview}
              now={now}
              onScopeChange={setSelectedScope}
              onShare={() => setShareOpen(true)}
            />
          ) : null}
          {!seasonsQuery.isLoading &&
          !seasonsQuery.isError &&
          selectedSeason &&
          scope !== 'all' ? (
            <>
              {!epoch && (epochQuery.isLoading || epochQuery.isError) ? (
                <Skeleton className="h-[170px] rounded-2xl" />
              ) : null}
              {epoch ? (
                <EpochPanel
                  epoch={epoch}
                  seasonName={selectedSeason.name}
                  overview={overview}
                  estimateData={estimateQuery.data}
                  loading={estimateQuery.isLoading}
                  delayed={estimateQuery.isRefetchError}
                  unavailable={
                    estimateQuery.isError && estimateQuery.data === undefined
                  }
                  now={now}
                  onShare={() => setShareOpen(true)}
                />
              ) : null}
              {selectedSeason.status === 'ended' || overview.rewardStatus ? (
                <RewardsProgress status={overview.rewardStatus ?? 'settled'} />
              ) : null}
              {predeposit ? (
                <PredepositSummary overview={overview} />
              ) : (
                <div className="grid grid-cols-[442px_1fr] gap-2 max-md:grid-cols-1 max-md:gap-5">
                  <SeasonSummary overview={overview} />
                  <Breakdown
                    items={breakdown}
                    loading={summaryQuery.isLoading}
                    error={summaryQuery.isError}
                  />
                </div>
              )}
              {selectedSeason.status === 'active' ? (
                <EarnCards
                  season={selectedSeason}
                  predepositConfig={predepositConfigQuery.data}
                />
              ) : null}
              <Faq sourceNames={sourceNames || t`the enabled sources`} />
            </>
          ) : null}
        </div>
      </div>

      {shareOpen && shareData ? (
        <MeritsShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          overview={overview}
          estimate={estimate}
          active={selectedSeason?.status === 'active' && Boolean(epoch)}
          shareData={shareData}
        />
      ) : null}
      {shareUnavailable ? (
        <Dialog open onOpenChange={setShareOpen}>
          <DialogContent className="border-border bg-bg-1 w-[calc(100vw-32px)] max-w-[460px] rounded-3xl border p-4 text-white">
            <DialogTitle className="text-base font-medium">{t`Share Merits`}</DialogTitle>
            <p className="text-t-270 text-sm">{t`We could not load your share details. Please try again.`}</p>
            <Button
              onClick={() => void referralQuery.refetch()}
              className="bg-accent hover:bg-accent/90 mt-2 text-black"
            >{t`Retry`}</Button>
          </DialogContent>
        </Dialog>
      ) : null}
    </main>
  );
};
