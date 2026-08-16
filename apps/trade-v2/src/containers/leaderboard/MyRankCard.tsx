'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import { Trans, useLingui } from '@lingui/react/macro';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import {
  BoltIcon,
  CopyIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DiscordIcon,
  DownloadIcon,
  GlobeIcon,
  GroupIcon,
  ShareNetworkIcon,
  TelegramIcon,
  TwitterIcon,
  cn,
  toast,
} from '@repo/ui';
import { useReferralCodes } from '@/common/hooks';
import {
  buildLeaderboardReferralShareUrl,
  buildLeaderboardShareText,
  buildLeaderboardShareUrl,
  type LeaderboardShareValues,
} from '@/lib/referral/referralShare';
import { LEADERBOARD_BACKEND_TODO_VALUE } from '@/services/rest/leaderboard';
import {
  EMPTY_VALUE,
  LEADERBOARD_ASSET_BASE,
  getPnlTextClassName,
  withUsdPrefix,
} from './display';
import { MyRankCardSkeleton } from './LeaderboardLoadingParts';
import type { LeaderboardSummary } from './mockData';

interface MyRankCardProps {
  summary?: LeaderboardSummary;
  isLoading: boolean;
  isWalletConnected: boolean;
  totalRows: number;
}

const cardClassName =
  'relative overflow-hidden rounded-xl border border-border bg-white/[0.01] p-3 backdrop-blur-[20px]';
const REFERRAL_PATH = '/referral';
const WIN_RATE_BAR_WIDTH = 207;
const WIN_RATE_ANIMATION_DURATION_MS = 900;
const SHARE_BACKGROUND_TOP = -1;
const SHARE_DIALOG_BACKGROUND_WIDTH = 460;
const SHARE_DIALOG_BACKGROUND_HEIGHT = 529;
const SHARE_POSTER_BACKGROUND_WIDTH = 620;
const SHARE_POSTER_BACKGROUND_HEIGHT = 713;
const SHARE_GLASS_TOP = -7;
const SHARE_GLASS_LEFT = 119.5;
const SHARE_GLASS_WIDTH = 379.2;
const SHARE_POSTER_TOP = 70;
const SHARE_POSTER_LEFT = 16;
const SHARE_POSTER_WIDTH = 428;
const SHARE_POSTER_HEIGHT = 298.365;

const ReferralVolumeIcon = () => (
  <Image
    src={`${LEADERBOARD_ASSET_BASE}/activity-monitor.svg`}
    alt=""
    width={24}
    height={24}
    className="size-6"
    aria-hidden
    unoptimized
  />
);

const StatBlock = ({
  label,
  value,
  className,
  valueClassName,
}: {
  label: ReactNode;
  value: string;
  className?: string;
  valueClassName?: string;
}) => (
  <div
    className={cn(
      'flex h-12 flex-col items-start justify-center gap-1 last:h-[50px] md:h-auto md:last:h-auto',
      className,
    )}
  >
    <span className="text-[13px] leading-normal tracking-[-0.52px] text-white/70 md:text-[13px]">
      {label}
    </span>
    <span
      className={cn(
        'text-2xl font-medium tracking-[-0.96px] text-white',
        valueClassName,
      )}
    >
      {value}
    </span>
  </div>
);

const getWinRateProgress = (value: string) => {
  const numericValue = Number(value.replace('%', '').trim());

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(1, Math.max(0, numericValue / 100));
};

const WinRateBars = ({ value }: { value: string }) => {
  const gradientId = useId().replace(/:/g, '');
  const targetProgress = useMemo(() => getWinRateProgress(value), [value]);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    setAnimatedProgress(0);
    const frameId = window.requestAnimationFrame(() => {
      setAnimatedProgress(targetProgress);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [targetProgress]);

  const indicatorX = WIN_RATE_BAR_WIDTH * animatedProgress;
  const targetX = WIN_RATE_BAR_WIDTH * targetProgress;
  const transition = `${WIN_RATE_ANIMATION_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

  return (
    <svg
      preserveAspectRatio="none"
      width="207"
      height="40"
      viewBox={`0 0 ${WIN_RATE_BAR_WIDTH} 40`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-[207px] shrink-0"
      aria-hidden
    >
      <path
        d={`M0 20H${WIN_RATE_BAR_WIDTH}`}
        stroke="#BFCFFF"
        strokeOpacity="0.1"
        strokeWidth="20"
        strokeDasharray="2.18 4.37"
      />
      <g
        style={{
          clipPath: `inset(0 ${100 - animatedProgress * 100}% 0 0)`,
          transition: `clip-path ${transition}`,
        }}
      >
        <path
          d={`M0 20H${WIN_RATE_BAR_WIDTH}`}
          stroke={`url(#${gradientId})`}
          strokeWidth="20"
          strokeDasharray="2.18 4.37"
        />
      </g>
      <path
        d="M0 40V0"
        stroke="#00DFEB"
        strokeWidth="2"
        style={{
          transform: `translateX(${indicatorX}px)`,
          transition: `transform ${transition}`,
        }}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1={targetX}
          y1="22.5005"
          x2="1.00816"
          y2="20.4695"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.6" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const parseDisplayNumber = (value: string) => {
  const normalizedValue = value.replace(/[$,%]/g, '').replace(/,/g, '').trim();
  const suffix = normalizedValue.at(-1)?.toUpperCase();
  const multiplier =
    suffix === 'B'
      ? 1_000_000_000
      : suffix === 'M'
        ? 1_000_000
        : suffix === 'K'
          ? 1_000
          : 1;
  const numericText =
    multiplier === 1 ? normalizedValue : normalizedValue.slice(0, -1);

  return Number(numericText) * multiplier;
};

const formatShareUsd = (
  value: string | undefined,
  showPlus = false,
  minimumFractionDigits = 0,
) => {
  const text = value?.trim();

  if (
    !text ||
    text === EMPTY_VALUE ||
    text === LEADERBOARD_BACKEND_TODO_VALUE
  ) {
    return text || EMPTY_VALUE;
  }

  const numericValue = parseDisplayNumber(text);

  if (Number.isNaN(numericValue)) {
    throw new Error(`Invalid leaderboard share value: ${text}`);
  }

  const absoluteValue = Math.abs(numericValue);
  const units = [
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];
  const unit = units.find(({ threshold }) => absoluteValue >= threshold);
  const amount = unit
    ? `${(absoluteValue / unit.threshold).toFixed(2)}${unit.suffix}`
    : absoluteValue.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits,
      });
  const sign = numericValue < 0 ? '-' : showPlus ? '+' : '';

  return `${sign}$${amount}`;
};

const formatShareRank = (rank: string, locale: string) => {
  const topMatch = /^top\s+(.+%)$/i.exec(rank.trim());

  return topMatch && locale.startsWith('zh') ? `前 ${topMatch[1]}` : rank;
};

const getSharePnlTextClassName = (value?: string) => {
  const text = value?.trim();

  if (
    !text ||
    text === EMPTY_VALUE ||
    text === LEADERBOARD_BACKEND_TODO_VALUE
  ) {
    return 'text-white';
  }

  return text.startsWith('-') ? 'text-down' : 'text-up';
};

const ShareDialogBackground = () => (
  <>
    <Image
      src={`${LEADERBOARD_ASSET_BASE}/share-card-bg.png`}
      alt=""
      width={460}
      height={529}
      className="pointer-events-none absolute top-[-1px] left-0 object-cover"
      style={{
        width: SHARE_DIALOG_BACKGROUND_WIDTH,
        height: SHARE_DIALOG_BACKGROUND_HEIGHT,
      }}
      unoptimized
      priority
    />
    <Image
      src={`${LEADERBOARD_ASSET_BASE}/Group 2134581827.png`}
      alt=""
      width={379}
      height={267}
      className="pointer-events-none absolute h-auto max-w-none"
      style={{
        top: SHARE_GLASS_TOP,
        left: SHARE_GLASS_LEFT,
        width: SHARE_GLASS_WIDTH,
      }}
      unoptimized
      priority
    />
  </>
);

const SharePosterBackground = () => (
  <>
    <Image
      src={`${LEADERBOARD_ASSET_BASE}/share-card-bg.png`}
      alt=""
      width={460}
      height={529}
      className="pointer-events-none absolute max-w-none object-cover"
      style={{
        top: SHARE_BACKGROUND_TOP - SHARE_POSTER_TOP,
        left: -SHARE_POSTER_LEFT,
        width: SHARE_POSTER_BACKGROUND_WIDTH,
        height: SHARE_POSTER_BACKGROUND_HEIGHT,
      }}
      unoptimized
      priority
    />
    <Image
      src={`${LEADERBOARD_ASSET_BASE}/Group 2134581827.png`}
      alt=""
      width={379}
      height={267}
      className="pointer-events-none absolute h-auto max-w-none"
      style={{
        top: SHARE_GLASS_TOP - SHARE_POSTER_TOP,
        left: SHARE_GLASS_LEFT - SHARE_POSTER_LEFT,
        width: SHARE_GLASS_WIDTH,
        WebkitMaskImage:
          'linear-gradient(90deg, #000 0%, #000 68%, transparent 84%)',
        maskImage: 'linear-gradient(90deg, #000 0%, #000 68%, transparent 84%)',
      }}
      unoptimized
      priority
    />
  </>
);

const SharePosterStat = ({
  label,
  value,
  valueClassName,
}: {
  label: ReactNode;
  value: string;
  valueClassName?: string;
}) => (
  <div className="min-w-0">
    <span className="block text-[11px] leading-[1.2] text-white/70">
      {label}
    </span>
    <span
      className={cn(
        'mt-0 block truncate text-[36px] leading-[1.2] font-medium tracking-[-1.44px] text-white',
        valueClassName,
      )}
    >
      {value}
    </span>
  </div>
);

const waitForPosterImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      await image.decode();
    }),
  );
};

interface SharePosterProps {
  shareCardVolume: string;
  sharePnl: string;
  shareWinRate: string;
  shareRank: string;
  referralCode: string;
  posterQrValue: string;
  className?: string;
  style?: CSSProperties;
}

const SharePoster = forwardRef<HTMLDivElement, SharePosterProps>(
  (
    {
      shareCardVolume,
      sharePnl,
      shareWinRate,
      shareRank,
      referralCode,
      posterQrValue,
      className,
      style,
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'relative h-[298.365px] w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#21353d]',
        className,
      )}
      style={style}
    >
      <SharePosterBackground />
      <div className="relative z-1 flex h-full w-full flex-col gap-6 p-[19px]">
        <div className="flex h-8 items-center">
          <Image
            src={`${LEADERBOARD_ASSET_BASE}/share-logo.svg`}
            alt="HertzFlow"
            width={115}
            height={24}
            unoptimized
            priority
          />
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-3">
          <SharePosterStat
            label={<Trans>Total Volume</Trans>}
            value={shareCardVolume}
          />
          <SharePosterStat
            label={<Trans>Net PnL</Trans>}
            value={sharePnl}
            valueClassName={getSharePnlTextClassName(sharePnl)}
          />
          <SharePosterStat
            label={<Trans>Win Rate</Trans>}
            value={shareWinRate}
          />
          <SharePosterStat label={<Trans>Rank</Trans>} value={shareRank} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-[1.2] font-medium text-white">
              <Trans>Join me on HertzFlow</Trans>
            </p>
            <p className="mt-1 max-w-[249px] text-[11px] leading-[normal] tracking-[-0.44px] text-white/70 max-md:max-w-full">
              <Trans>
                Trade &amp; Earn on any asset with leverage – 100%
                self-custodial.
              </Trans>
            </p>
          </div>
          {referralCode && (
            <div className="flex min-w-0 shrink-0 items-center gap-1">
              <div className="flex min-w-0 flex-col gap-[5px] text-left text-[11px] leading-[1.2]">
                <p className="text-white/70">
                  <Trans>Referral Code</Trans>
                </p>
                <p className="max-w-[72px] truncate font-medium text-white">
                  {referralCode}
                </p>
              </div>
              <div className="flex size-[49px] items-center justify-center">
                {posterQrValue ? (
                  <QRCodeSVG
                    value={posterQrValue}
                    size={41}
                    bgColor="transparent"
                    fgColor="#FFFFFF"
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <span className="text-[9px] font-medium text-white/70">
                    {LEADERBOARD_BACKEND_TODO_VALUE}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ),
);

SharePoster.displayName = 'SharePoster';

const ShareActionButton = ({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
);

const shortenReferralLink = (referralCode: string, referralLink: string) =>
  referralCode ? `https://hertzflow...${referralCode}` : referralLink;

export const LeaderboardShareDialog = ({
  summary,
  degens,
}: {
  summary?: LeaderboardSummary;
  degens?: string | number;
}) => {
  const { i18n, t } = useLingui();
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [origin, setOrigin] = useState('');
  const { items: referralCodes } = useReferralCodes();
  const referralCode = referralCodes[0]?.referral_code ?? '';

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shareCardVolume = formatShareUsd(summary?.volume30d, true);
  const sharePnl = formatShareUsd(summary?.pnl30d, true, 2);
  const shareWinRate = summary
    ? (summary.winRate ?? LEADERBOARD_BACKEND_TODO_VALUE)
    : EMPTY_VALUE;
  const shareRank = formatShareRank(summary?.rank ?? EMPTY_VALUE, i18n.locale);
  const leaderboardShareValues = useMemo(
    () =>
      ({
        totalVolume: shareCardVolume,
        netPnl: sharePnl,
        winRate: shareWinRate,
        rank: shareRank,
        degens: String(degens ?? EMPTY_VALUE),
      }) satisfies LeaderboardShareValues,
    [degens, shareCardVolume, sharePnl, shareRank, shareWinRate],
  );
  const leaderboardShareUrl = useMemo(
    () =>
      origin
        ? referralCode
          ? buildLeaderboardShareUrl(
              origin,
              referralCode,
              leaderboardShareValues,
            )
          : buildLeaderboardReferralShareUrl(origin, leaderboardShareValues)
        : '',
    [leaderboardShareValues, origin, referralCode],
  );
  const referralLink =
    leaderboardShareUrl ||
    (origin ? `${origin}${REFERRAL_PATH}` : REFERRAL_PATH);
  const displayedReferralLink = referralLink
    ? shortenReferralLink(referralCode, referralLink)
    : LEADERBOARD_BACKEND_TODO_VALUE;
  const socialShareUrl = leaderboardShareUrl || referralLink;
  const posterQrValue = leaderboardShareUrl || referralLink;
  const shareText = useMemo(
    () => buildLeaderboardShareText(referralCode, leaderboardShareValues),
    [leaderboardShareValues, referralCode],
  );

  const copyReferralLink = useCallback(async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success(t`Referral link copied`, {
        id: `leaderboard-referral-link-${referralCode}`,
      });
    } catch {
      toast.error(t`Copy failed`);
    }
  }, [referralCode, referralLink, t]);

  const shareToX = useCallback(() => {
    if (!shareText || !socialShareUrl) return;

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(socialShareUrl)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [shareText, socialShareUrl]);

  const shareToTelegram = useCallback(() => {
    if (!shareText || !socialShareUrl) return;

    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(socialShareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [shareText, socialShareUrl]);

  const shareToDiscord = useCallback(async () => {
    if (!shareText || !socialShareUrl) return;

    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${socialShareUrl}`);
      toast.success(t`Share message copied - paste it in Discord`, {
        id: `leaderboard-discord-share-${referralCode}`,
      });
    } catch {
      toast.error(t`Copy failed`);
    }
    window.open(
      'https://discord.com/channels/@me',
      '_blank',
      'noopener,noreferrer',
    );
  }, [referralCode, shareText, socialShareUrl, t]);

  const downloadPoster = useCallback(async () => {
    if (!posterRef.current) return;

    try {
      setIsDownloading(true);
      const posterNode = posterRef.current;

      await waitForPosterImages(posterNode);
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });

      const dataUrl = await toPng(posterNode, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `HertzFlow-leaderboard-${referralCode || 'share'}.png`;
      link.click();
      toast.success(t`Image downloaded`);
    } catch {
      toast.error(t`Failed to download image`);
    } finally {
      setIsDownloading(false);
    }
  }, [referralCode, t]);

  const canShare = !!shareText && !!socialShareUrl;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-accent flex size-5 items-center justify-center"
          aria-label={t`Share your leaderboard performance`}
        >
          <ShareNetworkIcon size={16} aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent
        position="center"
        closeClassName="hidden"
        overlayClassName="bg-[#071010]/70 backdrop-blur-[8px]"
        className="h-[528.365px] w-[460px] max-w-[460px] gap-4 overflow-hidden rounded-xl border border-white/10 bg-[#21353d] p-4 max-md:!w-[calc(100vw-32px)] max-md:!max-w-[calc(100vw-32px)] md:max-w-[460px]"
      >
        <ShareDialogBackground />
        <div className="relative z-1 flex w-full min-w-0 flex-col gap-4">
          <div className="flex h-[38px] shrink-0 flex-col gap-1">
            <DialogTitle className="text-[16px] leading-[normal] font-medium tracking-[-0.64px] text-white">
              <Trans>Share</Trans>
            </DialogTitle>
            <DialogDescription className="sr-only">
              <Trans>Share your leaderboard performance.</Trans>
            </DialogDescription>
          </div>
          <SharePoster
            shareCardVolume={shareCardVolume}
            sharePnl={sharePnl}
            shareWinRate={shareWinRate}
            shareRank={shareRank}
            referralCode={referralCode}
            posterQrValue={posterQrValue}
          />

          <div className="flex h-[72px] min-w-0 items-center gap-2 rounded-2xl border border-white/10 px-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <Image
                src={`${LEADERBOARD_ASSET_BASE}/share-add-link.svg`}
                alt=""
                width={24}
                height={24}
                className="size-6"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-[13px] leading-[normal] tracking-[-0.52px] text-white/70">
                <Trans>Referral Link</Trans>
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[20px] leading-[normal] font-medium tracking-[-0.8px] text-white max-[390px]:text-[16px]">
                  {displayedReferralLink}
                </span>
                <button
                  type="button"
                  aria-label={t`Copy referral link`}
                  disabled={!referralLink}
                  onClick={copyReferralLink}
                  className="flex size-6 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CopyIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <ShareActionButton
              label={t`Share on X`}
              disabled={!canShare}
              onClick={shareToX}
            >
              <TwitterIcon size={24} />
            </ShareActionButton>
            <ShareActionButton
              label={t`Share on Discord`}
              disabled={!canShare}
              onClick={shareToDiscord}
            >
              <DiscordIcon size={24} />
            </ShareActionButton>
            <ShareActionButton
              label={t`Share on Telegram`}
              disabled={!canShare}
              onClick={shareToTelegram}
            >
              <TelegramIcon size={24} />
            </ShareActionButton>
            <ShareActionButton
              label={t`Download leaderboard image`}
              disabled={isDownloading}
              onClick={downloadPoster}
            >
              <DownloadIcon />
            </ShareActionButton>
          </div>
        </div>
      </DialogContent>
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-[-10000px]"
      >
        <SharePoster
          ref={posterRef}
          shareCardVolume={shareCardVolume}
          sharePnl={sharePnl}
          shareWinRate={shareWinRate}
          shareRank={shareRank}
          referralCode={referralCode}
          posterQrValue={posterQrValue}
          className="w-[428px]"
          style={{
            width: SHARE_POSTER_WIDTH,
            height: SHARE_POSTER_HEIGHT,
          }}
        />
      </div>
    </Dialog>
  );
};

export const MyRankCard = ({
  summary,
  isLoading,
  isWalletConnected,
  totalRows,
}: MyRankCardProps) => {
  const { t } = useLingui();

  if (isLoading) {
    return <MyRankCardSkeleton />;
  }

  if (!isWalletConnected) {
    return null;
  }

  const rank = summary?.rank ?? EMPTY_VALUE;
  const pnl = withUsdPrefix(summary?.pnl30d);
  const volume = withUsdPrefix(summary?.volume30d);
  const trades = summary
    ? (summary.trades ?? LEADERBOARD_BACKEND_TODO_VALUE)
    : EMPTY_VALUE;
  const referee = summary
    ? (summary.refereeAllTime ?? LEADERBOARD_BACKEND_TODO_VALUE)
    : EMPTY_VALUE;
  const referralVolume = summary
    ? (summary.referralVolume ?? LEADERBOARD_BACKEND_TODO_VALUE)
    : EMPTY_VALUE;
  const winRate = summary
    ? (summary.winRate ?? LEADERBOARD_BACKEND_TODO_VALUE)
    : EMPTY_VALUE;

  return (
    <section
      className="flex w-full flex-col gap-4"
      aria-label={t`Your performance`}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm leading-normal font-medium tracking-[-0.56px] text-white">
          <Trans>Your Performance</Trans>
        </h2>
        <LeaderboardShareDialog summary={summary} degens={totalRows} />
      </div>
      <div className="flex w-full flex-col gap-2 md:flex-row">
        <div
          className={cn(
            cardClassName,
            'h-[354px] w-full md:h-[280px] md:w-[712px]',
          )}
        >
          <Image
            src={`${LEADERBOARD_ASSET_BASE}/performance-icon.png`}
            alt=""
            width={610}
            height={380}
            className="pointer-events-none absolute top-0 right-0 h-auto w-[248px] max-w-none md:w-[305px]"
            priority
          />
          <div className="relative flex h-[136px] flex-col gap-[21px] md:h-[182px] md:justify-between md:gap-0">
            <div className="flex h-[53px] flex-col items-start gap-3">
              <GlobeIcon size={24} className="text-white" aria-hidden />
              <span className="text-sm leading-normal tracking-[-0.56px] text-white/70">
                <Trans>Rank</Trans>
              </span>
            </div>
            <span
              className={cn(
                'h-[62px] text-[52px] leading-normal font-medium tracking-[-2.08px] md:h-auto md:leading-none',
                rank === EMPTY_VALUE ? 'text-white' : 'text-accent',
              )}
            >
              {rank}
            </span>
          </div>
          <div className="border-border md:bg-border relative mt-3 h-0 w-full border-t md:h-px md:border-0" />
          <div className="relative mt-3 flex h-[170px] flex-col gap-3 md:h-[50px] md:flex-row md:items-center md:gap-4">
            <StatBlock
              label={<Trans>PnL</Trans>}
              value={pnl}
              className="md:w-[208px]"
              valueClassName={getPnlTextClassName(pnl)}
            />
            <div className="bg-border hidden h-full w-px md:block" />
            <StatBlock
              label={<Trans>Trades</Trans>}
              value={trades}
              className="md:w-[208px]"
            />
            <div className="bg-border hidden h-full w-px md:block" />
            <StatBlock
              label={<Trans>Volume</Trans>}
              value={volume}
              className="md:w-[208px]"
            />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-[360px]">
          <div className="flex w-full gap-2">
            <div
              className={cn(
                cardClassName,
                'h-[114px] min-w-0 flex-1 md:h-[136px]',
              )}
            >
              <div className="flex h-full flex-col justify-between">
                <GroupIcon size={24} className="text-white" aria-hidden />
                <StatBlock
                  label={<Trans id="leaderboard.referee">Referee</Trans>}
                  value={referee}
                />
              </div>
            </div>
            <div
              className={cn(
                cardClassName,
                'h-[114px] min-w-0 flex-1 md:h-[136px]',
              )}
            >
              <div className="flex h-full flex-col justify-between">
                <ReferralVolumeIcon />
                <StatBlock
                  label={<Trans>Referral Vol</Trans>}
                  value={withUsdPrefix(referralVolume)}
                />
              </div>
            </div>
          </div>
          <div className={cn(cardClassName, 'h-[114px] md:h-[136px]')}>
            <div className="flex h-full flex-col justify-between">
              <BoltIcon size={24} className="text-white" aria-hidden />
              <div className="flex items-center justify-between gap-4">
                <StatBlock label={<Trans>Win Rate</Trans>} value={winRate} />
                <WinRateBars value={winRate} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
