'use client';

import {
  type CSSProperties,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLingui } from '@lingui/react/macro';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import {
  CopyOutlineIcon,
  Dialog,
  DialogContent,
  DialogTitle,
  DiscordIcon,
  DownloadIcon,
  HzIcon,
  HzTextIcon,
  LockIcon,
  TelegramIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TwitterIcon,
  cn,
  toast,
} from '@repo/ui';
import { ZERO_STR } from '@/common/constants';
import {
  buildCreditAirdropShareMessage,
  buildCreditAirdropShareUrl,
  type CreditAirdropShareValues,
} from '@/lib/referral/referralShare';
import { CREDIT_ASSETS } from './constants';
import type { CreditAirdrop, CreditAirdropShareReferralStats } from './types';

interface CreditAirdropShareDialogProps {
  airdrop: CreditAirdrop;
  referralCode: string | null;
  referralStats: CreditAirdropShareReferralStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareInfoCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  onCopy: () => void;
  valueClassName?: string;
}

const REFERRAL_LINK_FALLBACK = 'https://hertzflow...';

const normalizeShareMetric = (value?: string | null) => {
  if (!value || value === '--') return ZERO_STR;
  return value;
};

const formatCompactShareMetric = (value?: string | null) => {
  const normalizedValue = normalizeShareMetric(value);
  const numericValue = Number(normalizedValue.replace(/,/g, ''));

  if (!Number.isFinite(numericValue)) return normalizedValue;

  const absValue = Math.abs(numericValue);
  if (absValue > 1_000_000) return `${(numericValue / 1_000_000).toFixed(1)}M`;
  if (absValue > 1_000) return `${(numericValue / 1_000).toFixed(1)}K`;

  return normalizedValue;
};

const formatReferralLinkPreview = (value: string, code: string) => {
  if (!value || !code) return REFERRAL_LINK_FALLBACK;
  try {
    const url = new URL(value);
    return `${url.origin.replace(/^https?:\/\//, '')}...${code}`;
  } catch {
    return `${value.slice(0, 18)}...${code}`;
  }
};

const ShareInfoCard: FC<ShareInfoCardProps> = ({
  label,
  value,
  icon,
  onCopy,
  valueClassName,
}) => (
  <div className="flex min-h-[72px] min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 p-3">
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
      {icon}
    </div>
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
      <span className="text-[13px] leading-[normal] tracking-[-0.52px] text-white/70">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'min-w-0 truncate text-xl leading-[normal] font-medium tracking-[-0.8px] text-white',
            valueClassName,
          )}
          title={value}
        >
          {value}
        </span>
        <CopyOutlineIcon
          size={16}
          aria-label={`Copy ${label}`}
          className="shrink-0 cursor-pointer text-white/50 hover:text-white"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onCopy();
          }}
        />
      </div>
    </div>
  </div>
);

const ReferralLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <g transform="translate(2.5 6)">
      <path
        d="M14.5385 9.077H12.302C12.0955 9.077 11.923 9.00508 11.7845 8.86125C11.6462 8.71758 11.577 8.5395 11.577 8.327C11.577 8.1205 11.6488 7.94392 11.7925 7.79725C11.9363 7.65042 12.1145 7.577 12.327 7.577H14.5385V5.3655C14.5385 5.153 14.6104 4.97483 14.7542 4.831C14.8981 4.68733 15.0763 4.6155 15.2887 4.6155C15.5014 4.6155 15.6795 4.68733 15.823 4.831C15.9667 4.97483 16.0385 5.153 16.0385 5.3655V7.577H18.25C18.4625 7.577 18.6406 7.64892 18.7843 7.79275C18.9281 7.93658 19 8.11475 19 8.32725C19 8.53992 18.9281 8.718 18.7843 8.8615C18.6406 9.00517 18.4625 9.077 18.25 9.077H16.0385V11.2885C16.0385 11.501 15.9666 11.6791 15.8227 11.8227C15.6789 11.9666 15.5007 12.0385 15.288 12.0385C15.0755 12.0385 14.8974 11.9666 14.7538 11.8227C14.6103 11.6791 14.5385 11.501 14.5385 11.2885V9.077ZM7.55775 9.077H4.5385C3.28283 9.077 2.2125 8.6345 1.3275 7.7495C0.4425 6.86467 0 5.7945 0 4.539C0 3.2835 0.4425 2.21317 1.3275 1.328C2.2125 0.442667 3.28283 0 4.5385 0H7.55775C7.76408 0 7.94067 0.0734166 8.0875 0.22025C8.23433 0.367083 8.30775 0.54525 8.30775 0.75475C8.30775 0.964417 8.23433 1.14108 8.0875 1.28475C7.94067 1.42825 7.76408 1.5 7.55775 1.5H4.53725C3.69825 1.5 2.98233 1.7965 2.3895 2.3895C1.7965 2.9825 1.5 3.69883 1.5 4.5385C1.5 5.37817 1.7965 6.0945 2.3895 6.6875C2.98233 7.2805 3.69825 7.577 4.53725 7.577H7.55775C7.76408 7.577 7.94067 7.65042 8.0875 7.79725C8.23433 7.94392 8.30775 8.12208 8.30775 8.33175C8.30775 8.54142 8.23433 8.718 8.0875 8.8615C7.94067 9.00517 7.76408 9.077 7.55775 9.077ZM6.5 5.2885C6.2875 5.2885 6.10942 5.21658 5.96575 5.07275C5.82192 4.92892 5.75 4.75075 5.75 4.53825C5.75 4.32558 5.82192 4.1475 5.96575 4.004C6.10942 3.86033 6.2875 3.7885 6.5 3.7885H12.5C12.7125 3.7885 12.8906 3.86042 13.0343 4.00425C13.1781 4.14808 13.25 4.32625 13.25 4.53875C13.25 4.75142 13.1781 4.9295 13.0343 5.073C12.8906 5.21667 12.7125 5.2885 12.5 5.2885H6.5ZM19 4.5385H17.5C17.5 3.69883 17.2035 2.9825 16.6105 2.3895C16.0177 1.7965 15.3018 1.5 14.4628 1.5H11.4173C11.2109 1.5 11.0385 1.42817 10.9 1.2845C10.7615 1.14067 10.6923 0.9625 10.6923 0.75C10.6923 0.543667 10.7642 0.367083 10.908 0.22025C11.0517 0.0734166 11.2298 0 11.4423 0H14.4615C15.7172 0 16.7875 0.442499 17.6725 1.3275C18.5575 2.2125 19 3.28283 19 4.5385Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

const ShareMetricValue = ({
  value,
  fullValue,
}: {
  value: string;
  fullValue: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="cursor-pointer text-4xl leading-[1.2] font-medium text-white">
        {value}
      </span>
    </TooltipTrigger>
    <TooltipContent
      side="top"
      sideOffset={0}
      className="flex max-w-90 flex-col gap-2 rounded-2xl p-3 text-xs"
    >
      <span className="text-t-1100">{fullValue}</span>
    </TooltipContent>
  </Tooltip>
);

const PosterMetric = ({
  label,
  value,
  fullValue,
}: {
  label: string;
  value: string;
  fullValue: string;
}) => (
  <div className="flex min-w-0 flex-1 flex-col items-start">
    <span className="text-[11px] leading-[1.2] text-white/70">{label}</span>
    <ShareMetricValue value={value} fullValue={fullValue} />
  </div>
);

const CreditEarnedMetric = ({
  value,
  fullValue,
  isWindowOpen,
}: {
  value: string;
  fullValue: string;
  isWindowOpen: boolean;
}) => {
  const { t } = useLingui();
  if (isWindowOpen) {
    return (
      <PosterMetric
        label={t`Credit Earned`}
        value={value}
        fullValue={fullValue}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col items-start">
      <span className="text-[11px] leading-[1.2] text-white/70">
        {t`Credit Earned`}
      </span>
      <span className="flex h-[43px] items-center gap-2">
        <span className="h-[3px] w-[12.6px] rounded-full bg-white/35" />
        <span className="text-accent bg-accent/15 flex h-6 items-center justify-center gap-1 rounded px-2 text-[11px] leading-[1.2] font-medium">
          <LockIcon size={14} />
          {t`Unlocks Soon`}
        </span>
      </span>
    </div>
  );
};

const bgImageStyle = (src: string): CSSProperties => ({
  backgroundImage: `url("${src}")`,
});

const maskedGlowStyle = (
  maskPosition: string,
  maskSize = '86.129px 86.129px',
): CSSProperties => ({
  maskImage: `url("${CREDIT_ASSETS.shareBgEllipseMask}")`,
  maskPosition,
  maskRepeat: 'no-repeat',
  maskSize,
  WebkitMaskImage: `url("${CREDIT_ASSETS.shareBgEllipseMask}")`,
  WebkitMaskPosition: maskPosition,
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskSize: maskSize,
});

const CreditShareBackground: FC<{
  className?: string;
  frame?: {
    height: number;
    left: number;
    top: number;
    width: number;
  };
  fluid?: boolean;
  style?: CSSProperties;
}> = ({ className, frame, fluid = false, style }) => {
  const isFramed = Boolean(frame);
  const y = (fixed: string, fluidValue: string) => (fluid ? fluidValue : fixed);

  return (
    <div
      aria-hidden
      className={cn(
        isFramed
          ? 'pointer-events-none absolute flex items-center justify-center'
          : fluid
            ? 'pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center'
            : 'pointer-events-none absolute top-[-1px] left-1/2 flex h-[529px] w-[460px] -translate-x-1/2 items-center justify-center',
        className,
      )}
      style={{
        ...style,
        ...(frame
          ? {
              height: `${frame.height}px`,
              left: `${frame.left}px`,
              top: `${frame.top}px`,
              width: `${frame.width}px`,
            }
          : null),
      }}
    >
      <div
        className={cn('flex-none -scale-y-100', (fluid || frame) && 'h-full')}
      >
        <div
          className={cn(
            'relative w-[460px] overflow-hidden bg-[#17181D]',
            fluid || frame ? 'h-full min-h-[529px]' : 'h-[529px]',
          )}
        >
          <div
            className="absolute left-[108.46px] size-[907.754px]"
            style={{ top: y('264.51px', '50%') }}
          >
            <div
              className="absolute inset-[-67.11%] bg-[length:100%_100%] bg-no-repeat"
              style={bgImageStyle(CREDIT_ASSETS.shareBgEllipse2)}
            />
          </div>
          <div
            className="absolute left-[231.07px] size-[662.538px]"
            style={{
              mixBlendMode: 'plus-lighter',
              top: y('509.72px', '96.35%'),
            }}
          >
            <div
              className="absolute inset-[-45.98%] bg-[length:100%_100%] bg-no-repeat"
              style={bgImageStyle(CREDIT_ASSETS.shareBgEllipse3)}
            />
          </div>
          <div
            className="absolute left-[231.07px] size-[662.538px]"
            style={{
              mixBlendMode: 'plus-lighter',
              top: y('509.72px', '96.35%'),
            }}
          >
            <div
              className="absolute inset-[-45.98%] bg-[length:100%_100%] bg-no-repeat"
              style={bgImageStyle(CREDIT_ASSETS.shareBgEllipse4)}
            />
          </div>
          <div
            className="absolute right-[-98.06px] flex size-[257.036px] items-center justify-center"
            style={{ top: y('255.15px', '48.23%') }}
          >
            <div className="flex-none -scale-y-100 rotate-[-9.66deg]">
              <div className="relative size-[187.871px]">
                <div
                  className="absolute top-1/2 left-1/2 size-[333.95px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat"
                  style={bgImageStyle(CREDIT_ASSETS.shareCredit)}
                />
              </div>
            </div>
          </div>
          <div
            className="absolute left-[265.37px] flex size-[86.129px] items-center justify-center"
            style={{ top: y('404.53px', '76.47%') }}
          >
            <div className="flex-none -scale-y-100 rotate-[-68.57deg]">
              <div className="relative size-[63.495px]">
                <div
                  className="absolute top-1/2 left-1/2 h-[115.648px] w-[108.849px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat"
                  style={bgImageStyle(CREDIT_ASSETS.sharePoints)}
                />
              </div>
            </div>
          </div>
          <div
            className="absolute left-[340.21px] flex h-[250.711px] w-[249.006px] items-center justify-center"
            style={{
              mixBlendMode: 'plus-lighter',
              top: y('169.02px', '31.95%'),
            }}
          >
            <div className="flex-none -scale-y-100 rotate-[-28.57deg]">
              <div
                className="relative h-[186.329px] w-[182.065px] opacity-40"
                style={maskedGlowStyle('-54.838px -64.93px')}
              >
                <div
                  className="absolute inset-[-386.41%_-395.46%] bg-[length:100%_100%] bg-no-repeat"
                  style={bgImageStyle(CREDIT_ASSETS.shareBgEllipse6)}
                />
              </div>
            </div>
          </div>
          <div
            className="absolute left-[392.04px] flex h-[130.216px] w-[129.326px] items-center justify-center"
            style={{
              mixBlendMode: 'plus-lighter',
              top: y('257.59px', '48.69%'),
            }}
          >
            <div className="flex-none -scale-y-100 rotate-[-28.57deg]">
              <div
                className="relative h-[96.78px] w-[94.555px] opacity-40"
                style={maskedGlowStyle('-106.668px -96.856px')}
              >
                <div
                  className="absolute inset-[-743.96%_-761.46%] bg-[length:100%_100%] bg-no-repeat"
                  style={bgImageStyle(CREDIT_ASSETS.shareBgEllipse7)}
                />
              </div>
            </div>
          </div>
          <div
            className="absolute left-[83.76px] flex h-[250.711px] w-[249.006px] items-center justify-center"
            style={{
              mixBlendMode: 'plus-lighter',
              top: y('308.67px', '58.35%'),
            }}
          >
            <div className="flex-none -scale-y-100 rotate-[-28.57deg]">
              <div
                className="relative h-[186.329px] w-[182.065px] opacity-40"
                style={maskedGlowStyle('201.611px 74.723px')}
              >
                <div
                  className="absolute inset-[-386.41%_-395.46%] bg-[length:100%_100%] bg-no-repeat"
                  style={bgImageStyle(CREDIT_ASSETS.shareBgEllipse6)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreditShareDialogBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 overflow-hidden bg-[#17181D]"
  >
    <CreditShareBackground fluid />
  </div>
);

const CreditAirdropShareDialog: FC<CreditAirdropShareDialogProps> = ({
  airdrop,
  referralCode,
  referralStats,
  open,
  onOpenChange,
}) => {
  const { t } = useLingui();
  const dialogBodyRef = useRef<HTMLDivElement | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [origin, setOrigin] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [posterBackgroundFrame, setPosterBackgroundFrame] = useState({
    height: 529,
    left: -16,
    top: -72,
    width: 460,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosterBackgroundFrame = () => {
      const dialogBody = dialogBodyRef.current;
      const poster = posterRef.current;
      if (!dialogBody || !poster) return;

      const dialogRect = dialogBody.getBoundingClientRect();
      const posterRect = poster.getBoundingClientRect();
      const nextFrame = {
        height: Math.max(Math.round(dialogRect.height), 529),
        left: Math.round(dialogRect.left - posterRect.left),
        top: Math.round(dialogRect.top - posterRect.top),
        width: Math.round(dialogRect.width),
      };

      setPosterBackgroundFrame((currentFrame) => {
        if (
          currentFrame.height === nextFrame.height &&
          currentFrame.left === nextFrame.left &&
          currentFrame.top === nextFrame.top &&
          currentFrame.width === nextFrame.width
        ) {
          return currentFrame;
        }

        return nextFrame;
      });
    };

    updatePosterBackgroundFrame();

    const resizeObserver = new ResizeObserver(updatePosterBackgroundFrame);
    if (dialogBodyRef.current) resizeObserver.observe(dialogBodyRef.current);
    if (posterRef.current) resizeObserver.observe(posterRef.current);
    window.addEventListener('resize', updatePosterBackgroundFrame);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosterBackgroundFrame);
    };
  }, [open]);

  const code = referralCode ?? '';
  const isWindowOpen = airdrop.windowStatus === 'open';
  const creditEarned = normalizeShareMetric(
    airdrop.creditEarnedAmount ?? airdrop.creditAmount,
  );
  const creditEarnedDisplay = formatCompactShareMetric(creditEarned);
  const hzflEarned = normalizeShareMetric(airdrop.hzflAmount);
  const hzflEarnedDisplay = formatCompactShareMetric(hzflEarned);
  const pointsEarned = normalizeShareMetric(airdrop.pointsAmount);
  const pointsEarnedDisplay = formatCompactShareMetric(pointsEarned);
  const referredUsers = normalizeShareMetric(referralStats.referredUsers);
  const referredUsersDisplay = formatCompactShareMetric(referredUsers);
  const referredVolume = normalizeShareMetric(referralStats.referredVolume);
  const referredVolumeDisplay = formatCompactShareMetric(referredVolume);
  const shareValues = useMemo(
    () =>
      ({
        creditAmount: creditEarnedDisplay,
        hzflAmount: hzflEarnedDisplay,
        pointsAmount: pointsEarnedDisplay,
        seasonName: airdrop.seasonName,
        referredUsers: referredUsersDisplay,
        referredVolume: referredVolumeDisplay,
        isWindowOpen,
      }) satisfies CreditAirdropShareValues,
    [
      airdrop.seasonName,
      creditEarnedDisplay,
      hzflEarnedDisplay,
      isWindowOpen,
      pointsEarnedDisplay,
      referredUsersDisplay,
      referredVolumeDisplay,
    ],
  );
  const referralLink = useMemo(
    () =>
      origin && code
        ? buildCreditAirdropShareUrl(origin, code, shareValues)
        : '',
    [origin, code, shareValues],
  );
  const referralLinkPreview = useMemo(
    () => formatReferralLinkPreview(referralLink, code),
    [code, referralLink],
  );
  const copyText = useCallback(
    async (value: string, field: 'code' | 'link') => {
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        toast.success(
          field === 'code' ? t`Referral code copied` : t`Referral link copied`,
          { id: `credit-referral-${field}-copied-${value}` },
        );
      } catch {
        toast.error(t`Copy failed`);
      }
    },
    [t],
  );

  const handleDownload = useCallback(async () => {
    if (!posterRef.current || !code) return;

    try {
      setIsExporting(true);
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });

      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `HertzFlow-credit-airdrop-${code}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t`Image downloaded`);
    } catch {
      toast.error(t`Failed to download image`);
    } finally {
      setIsExporting(false);
    }
  }, [code, t]);

  const handleShareToX = useCallback(() => {
    if (!code || !origin) return;

    const text = buildCreditAirdropShareMessage(origin, code, shareValues);
    const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [code, origin, shareValues]);

  const handleShareToTelegram = useCallback(() => {
    if (!code || !origin) return;

    const shareUrl = buildCreditAirdropShareUrl(origin, code, shareValues);
    const text = buildCreditAirdropShareMessage(origin, code, shareValues);
    const href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [code, origin, shareValues]);

  const handleShareToDiscord = useCallback(async () => {
    if (!code || !origin) return;

    window.open(
      'https://discord.com/channels/@me',
      '_blank',
      'noopener,noreferrer',
    );

    try {
      await navigator.clipboard.writeText(
        buildCreditAirdropShareMessage(origin, code, shareValues),
      );
      toast.success(t`Share message copied - paste it in Discord`, {
        id: `credit-referral-discord-share-${code}`,
      });
    } catch {
      toast.error(t`Copy failed`);
    }
  }, [code, origin, shareValues, t]);

  const socialDisabled = !code || !origin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        position="center"
        closeClassName="hidden"
        overlayClassName="bg-black/10 backdrop-blur-[8px]"
        className="w-[calc(100%-32px)] max-w-[460px] gap-0 border-none bg-transparent p-0 shadow-none md:w-[460px] md:max-w-[460px]"
        aria-describedby={undefined}
      >
        <div
          ref={dialogBodyRef}
          className="relative flex max-h-[calc(100dvh-32px)] w-full flex-col gap-4 overflow-y-auto rounded-xl border border-[rgba(191,207,255,0.1)] bg-[#17181D] p-4"
        >
          <DialogTitle className="sr-only">{t`Share your referral`}</DialogTitle>
          <CreditShareDialogBackground />

          <div className="relative z-10 flex flex-col gap-1">
            <h3 className="text-base leading-[normal] font-medium tracking-[-0.64px] text-white">
              {t`Share your referral`}
            </h3>
            <p className="text-[13px] leading-[normal] tracking-[-0.52px] text-white/70">
              {t`Share your referral link to earn rebates when friends trade.`}
            </p>
          </div>

          <div
            ref={posterRef}
            className={cn(
              'relative z-10 min-h-[298.365px] shrink-0 overflow-hidden rounded-2xl border border-[rgba(191,207,255,0.1)] bg-[#21353D]/35 md:h-[298.365px]',
              isExporting && 'shadow-none',
            )}
          >
            <CreditShareBackground fluid frame={posterBackgroundFrame} />

            <div className="relative z-10 flex min-h-[298.365px] flex-col gap-6 p-[19px] md:h-[298.365px]">
              <div className="flex h-8 items-center justify-between">
                <div className="flex items-center gap-[4.325px] text-white">
                  <HzIcon size={24} className="text-accent" />
                  <HzTextIcon size={12} className="text-white" />
                </div>
                {airdrop.seasonName ? (
                  <div className="flex h-8 items-center justify-center rounded-xl bg-white/10 px-3 text-[11px] leading-[1.2] font-medium text-white">
                    {airdrop.seasonName}
                  </div>
                ) : null}
              </div>

              <div className="flex w-full flex-col gap-3">
                <div className="flex h-14 items-center gap-2">
                  <CreditEarnedMetric
                    value={creditEarnedDisplay}
                    fullValue={creditEarned}
                    isWindowOpen={isWindowOpen}
                  />
                  <PosterMetric
                    label={t`Points Earned`}
                    value={pointsEarnedDisplay}
                    fullValue={pointsEarned}
                  />
                </div>
                <div className="flex h-14 items-center gap-2">
                  <PosterMetric
                    label={t`Referred Users`}
                    value={referredUsersDisplay}
                    fullValue={referredUsers}
                  />
                  <PosterMetric
                    label={t`Referred Volume`}
                    value={referredVolumeDisplay}
                    fullValue={referredVolume}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[13px] leading-[1.2] font-medium text-white">
                    {t`Join me on HertzFlow`}
                  </span>
                  <span className="max-w-[249px] text-[11px] leading-[normal] tracking-[-0.44px] text-white/70">
                    {t`Trade & Earn on any asset with leverage - 100% self-custodial.`}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex flex-col gap-[5px] text-[11px] leading-[1.2]">
                    <span className="text-white/70">{t`Referral Code`}</span>
                    <span className="font-medium text-white">{code}</span>
                  </div>
                  <div className="flex size-[49.385px] items-center justify-center rounded-lg">
                    {referralLink ? (
                      <QRCodeSVG
                        value={referralLink}
                        size={43}
                        bgColor="transparent"
                        fgColor="#FFFFFF"
                        level="M"
                        includeMargin={false}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex min-w-0">
            <ShareInfoCard
              label={t`Referral Link`}
              value={referralLinkPreview}
              icon={<ReferralLinkIcon />}
              onCopy={() => copyText(referralLink, 'link')}
              valueClassName="flex-1"
            />
          </div>

          <div className="relative z-10 flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label={t`Share on X`}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={socialDisabled}
              onClick={handleShareToX}
            >
              <TwitterIcon size={20} />
            </button>
            <button
              type="button"
              aria-label={t`Share on Discord`}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={socialDisabled}
              onClick={handleShareToDiscord}
            >
              <DiscordIcon size={20} />
            </button>
            <button
              type="button"
              aria-label={t`Share on Telegram`}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={socialDisabled}
              onClick={handleShareToTelegram}
            >
              <TelegramIcon size={20} />
            </button>
            <button
              type="button"
              aria-label={t`Download referral image`}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!code}
              onClick={handleDownload}
            >
              <DownloadIcon />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditAirdropShareDialog;
