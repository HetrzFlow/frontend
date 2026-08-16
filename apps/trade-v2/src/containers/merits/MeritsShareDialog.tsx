'use client';

import { useRef, type RefObject } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { HzIcon, HzTextIcon, toast } from '@repo/ui';
import { SharePosterDialogLayout } from '@/common/components/SharePosterDialogLayout';
import {
  buildMeritsShareUrl,
  type MeritsShareValues,
} from '@/lib/merits/meritsShare';
import {
  formatMerits,
  formatMeritsRank,
  type MeritsOverview,
  type MeritsShareData,
} from './model';

const ASSET_ROOT = '/trade-static/merits';

interface MeritsShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overview: MeritsOverview;
  estimate: string | null;
  active: boolean;
  shareData: MeritsShareData;
}

interface PosterProps
  extends Pick<
    MeritsShareDialogProps,
    'overview' | 'estimate' | 'active' | 'shareData'
  > {
  posterRef?: RefObject<HTMLDivElement | null>;
  compact?: boolean;
}

const ShareBackdrop = ({ poster = false }: { poster?: boolean }) => (
  <Image
    src={`${ASSET_ROOT}/share-dialog-bg.png`}
    alt=""
    width={460}
    height={475}
    unoptimized
    loading={poster ? 'eager' : undefined}
    className={
      poster
        ? 'pointer-events-none absolute -top-4 -left-4 h-auto w-[460px] max-w-none select-none'
        : 'pointer-events-none absolute inset-0 size-full object-cover select-none'
    }
  />
);

const MeritsPoster = ({
  posterRef,
  overview,
  estimate,
  active,
  shareData,
  compact = false,
}: PosterProps) => {
  const { t } = useLingui();
  const meritsShareValues: MeritsShareValues = {
    inviteCode: shareData.referralCode,
    merits: formatMerits(overview.settledMerits),
    estimate: active && estimate !== null ? formatMerits(estimate, 2) : null,
    rank: formatMeritsRank(overview.rank.position),
  };
  const shareLink = buildMeritsShareUrl(shareData.shareLink, meritsShareValues);

  return (
    <div
      ref={posterRef}
      className={
        compact
          ? 'relative z-10 aspect-[303/203.382] w-full overflow-hidden rounded-[11.327px] border-[0.708px] border-white/10'
          : 'relative z-10 aspect-[428/298.365] w-full overflow-hidden rounded-2xl border border-white/10'
      }
    >
      {compact ? null : <ShareBackdrop poster />}
      <div
        className={
          compact
            ? 'relative z-10 flex h-full flex-col gap-[16.99px] p-3'
            : active
              ? 'relative z-10 flex h-full flex-col gap-6 p-5'
              : 'relative z-10 flex h-full flex-col justify-between p-5'
        }
      >
        <div
          className={
            compact
              ? 'flex h-[22.654px] items-center gap-[4.247px] text-white'
              : 'flex h-8 items-center gap-1.5 text-white'
          }
        >
          <HzIcon size={compact ? 16.991 : 24} className="text-accent" />
          <HzTextIcon size={compact ? 8.495 : 12} />
        </div>
        <div
          className={
            active
              ? compact
                ? 'flex flex-col gap-[8.495px]'
                : 'flex flex-col gap-3'
              : compact
                ? 'grid h-[87.785px] grid-cols-2 items-center gap-[5.664px]'
                : 'grid grid-cols-2 gap-3'
          }
        >
          <div
            className={
              compact
                ? 'flex h-[39.645px] flex-col justify-center'
                : 'flex h-14 flex-col justify-center'
            }
          >
            <p
              className={
                compact
                  ? 'text-t-270 text-[8px] leading-[9.6px]'
                  : 'text-t-270 text-[11px] leading-[13px]'
              }
            >
              {t`My Merits`}
            </p>
            <p
              className={
                compact
                  ? 'text-[26px] leading-[31.2px] font-medium'
                  : 'text-4xl leading-[43px] font-medium'
              }
            >
              {formatMerits(overview.settledMerits)}
            </p>
          </div>
          {!active ? (
            <div
              className={
                compact
                  ? 'flex h-[39.645px] flex-col justify-center'
                  : 'flex h-14 flex-col justify-center'
              }
            >
              <p
                className={
                  compact
                    ? 'text-t-270 text-[8px] leading-[9.6px]'
                    : 'text-t-270 text-[11px] leading-[13px]'
                }
              >
                {t`Rank`}
              </p>
              <p
                className={
                  compact
                    ? 'text-[26px] leading-[31.2px] font-medium'
                    : 'text-4xl leading-[43px] font-medium'
                }
              >
                {formatMeritsRank(overview.rank.position)}
              </p>
            </div>
          ) : null}
          {active ? (
            <div
              className={
                compact
                  ? 'grid h-[39.645px] grid-cols-2 gap-[5.664px]'
                  : 'grid h-14 grid-cols-2 gap-2'
              }
            >
              <div className="flex flex-col justify-center">
                <p
                  className={
                    compact
                      ? 'text-t-270 text-[8px] leading-[9.6px]'
                      : 'text-t-270 text-[11px] leading-[13px]'
                  }
                >
                  {t`Current Epoch estimate`}
                </p>
                <p
                  className={
                    compact
                      ? 'text-[26px] leading-[31.2px] font-medium'
                      : 'text-4xl leading-[43px] font-medium'
                  }
                >
                  {estimate === null ? '-' : formatMerits(estimate, 2)}
                </p>
              </div>
              <div className="flex flex-col justify-center">
                <p
                  className={
                    compact
                      ? 'text-t-270 text-[8px] leading-[9.6px]'
                      : 'text-t-270 text-[11px] leading-[13px]'
                  }
                >
                  {t`Rank`}
                </p>
                <p
                  className={
                    compact
                      ? 'text-[26px] leading-[31.2px] font-medium'
                      : 'text-4xl leading-[43px] font-medium'
                  }
                >
                  {formatMeritsRank(overview.rank.position)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className={
            compact
              ? 'flex h-[34.962px] items-center justify-between gap-[8px]'
              : 'flex h-[49.385px] items-center justify-between gap-3'
          }
        >
          <div className="min-w-0 flex-1">
            <p
              className={
                compact
                  ? 'text-[9px] leading-[10.8px] font-medium'
                  : 'text-[13px] leading-4 font-medium'
              }
            >
              {t`Join me on HertzFlow`}
            </p>
            <p
              className={
                compact
                  ? 'text-t-270 mt-[2.832px] max-w-[176.278px] text-[8px] leading-[10px] tracking-[-0.32px]'
                  : 'text-t-270 mt-1 max-w-[249px] text-[11px] leading-[13px] tracking-[-0.44px]'
              }
            >
              {t`Trade & Earn on any asset with leverage. 100% self-custodial.`}
            </p>
          </div>
          <div
            className={
              compact
                ? active
                  ? 'flex shrink-0 items-center gap-[2.832px]'
                  : 'flex shrink-0 items-center gap-1'
                : 'flex shrink-0 items-center gap-1'
            }
          >
            <div
              className={
                compact
                  ? 'flex flex-col gap-[3.496px] text-[8px] leading-[9.6px]'
                  : 'flex flex-col gap-[5px] text-[11px] leading-[13px]'
              }
            >
              <span className="text-t-270">{t`Invite Code`}</span>
              <span className="font-medium">{shareData.referralCode}</span>
            </div>
            <QRCodeSVG
              value={shareLink}
              size={compact ? 34.962 : 49.385}
              bgColor="transparent"
              fgColor="#FFFFFF"
              level="M"
              includeMargin={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const waitForPosterImages = async (root: HTMLElement) => {
  await Promise.all(
    Array.from(root.querySelectorAll('img')).map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      await image.decode();
    }),
  );
};

export const MeritsShareDialog = ({
  open,
  onOpenChange,
  overview,
  estimate,
  active,
  shareData,
}: MeritsShareDialogProps) => {
  const { t } = useLingui();
  const posterRef = useRef<HTMLDivElement | null>(null);
  const posterProps = { overview, estimate, active, shareData };
  const shareLink = buildMeritsShareUrl(shareData.shareLink, {
    inviteCode: shareData.referralCode,
    merits: formatMerits(overview.settledMerits),
    estimate: active && estimate !== null ? formatMerits(estimate, 2) : null,
    rank: formatMeritsRank(overview.rank.position),
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success(t`Invite link copied`);
    } catch {
      toast.error(t`Copy failed`);
    }
  };
  const shareToX = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };
  const shareToTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareLink)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };
  const shareToDiscord = async () => {
    window.open(
      'https://discord.com/channels/@me',
      '_blank',
      'noopener,noreferrer',
    );
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success(t`Invite link copied. Paste it into Discord.`);
    } catch {
      toast.error(t`Copy failed`);
    }
  };
  const download = async () => {
    const poster = posterRef.current;
    if (!poster) return;
    try {
      await waitForPosterImages(poster);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const dataUrl = await toPng(poster, { cacheBust: true, pixelRatio: 2 });
      const anchor = document.createElement('a');
      anchor.download = `hertzflow-merits-${shareData.referralCode}.png`;
      anchor.href = dataUrl;
      anchor.click();
    } catch {
      toast.error(t`Unable to download poster`);
    }
  };

  return (
    <>
      <SharePosterDialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title={t`Share Merits`}
        background={<ShareBackdrop />}
        contentClassName="max-md:!w-[calc(100%-40px)] max-md:!max-w-[335px]"
        poster={
          <>
            <div className="max-md:hidden">
              <MeritsPoster {...posterProps} />
            </div>
            <div className="hidden max-md:block">
              <MeritsPoster {...posterProps} compact />
            </div>
          </>
        }
        linkLabel={t`Invite Link`}
        link={shareLink}
        copyAriaLabel={t`Copy invite link`}
        onCopy={copyLink}
        canShare={Boolean(shareLink)}
        canDownload
        onShareToX={shareToX}
        onShareToDiscord={shareToDiscord}
        onShareToTelegram={shareToTelegram}
        onDownload={download}
      />
      {open ? (
        <div
          aria-hidden
          className="pointer-events-none fixed top-0 left-[-10000px] w-[428px]"
        >
          <MeritsPoster {...posterProps} posterRef={posterRef} />
        </div>
      ) : null}
    </>
  );
};
