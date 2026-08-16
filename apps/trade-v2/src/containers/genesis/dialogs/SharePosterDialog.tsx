'use client';

import { useRef, type RefObject } from 'react';
import { useLingui } from '@lingui/react/macro';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { percentFormat, unitFormat } from '@repo/lib/format';
import { HzIcon, HzTextIcon, toast } from '@repo/ui';
import { SharePosterDialogLayout } from '@/common/components/SharePosterDialogLayout';
import type {
  GenesisUserPosition,
  GenesisVaultConfig,
} from '@/services/rest/genesis';
import { GenesisRankLabel } from '../components/GenesisRankLabel';
import { GENESIS_USD_FORMAT_OPTIONS } from '../lib/constants';

const GENESIS_SHARE_BACKGROUND = '/trade-static/genesis/share-bg.webp';

export interface SharePosterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: string;
  shareLink: string;
  position?: GenesisUserPosition;
  config?: GenesisVaultConfig;
}

interface GenesisPosterProps {
  posterRef?: RefObject<HTMLDivElement | null>;
  referralCode: string;
  shareLink: string;
  position?: GenesisUserPosition;
  apy?: number;
  includeBackground?: boolean;
}

const waitForPosterImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      await image.decode();
    }),
  );
};

const GenesisPoster = ({
  posterRef,
  referralCode,
  shareLink,
  position,
  apy,
  includeBackground = false,
}: GenesisPosterProps) => {
  const { t } = useLingui();

  return (
    <div
      ref={posterRef}
      className="relative z-10 aspect-[428/298] w-full overflow-hidden rounded-2xl border"
    >
      {includeBackground ? (
        <>
          <div className="bg-bg-3 pointer-events-none absolute inset-0" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GENESIS_SHARE_BACKGROUND}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        </>
      ) : null}
      <div className="relative z-10 flex h-full flex-col p-5">
        <div className="flex h-8 items-center gap-1.5 text-white">
          <HzIcon size={24} className="text-accent" />
          <HzTextIcon size={12} />
        </div>
        <div className="mt-6">
          <p className="text-t-350 text-xs">{t`Matured / Total Deposits`}</p>
          <p className="text-t-1100 mt-0.5 text-4xl font-semibold">
            <span className="text-t-350 text-xl font-normal">
              {position
                ? unitFormat(
                    position.maturedDeposits,
                    2,
                    GENESIS_USD_FORMAT_OPTIONS,
                  )
                : '--'}
            </span>
            <span className="text-t-350 text-xl font-normal"> / </span>
            {position
              ? unitFormat(
                  position.totalDeposits,
                  2,
                  GENESIS_USD_FORMAT_OPTIONS,
                )
              : '--'}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <p className="text-t-350 text-xs">{t`APY`}</p>
            <p className="text-t-1100 mt-0.5 text-4xl font-medium">
              {apy === undefined
                ? ''
                : `~${percentFormat(apy / 100, 2, {
                    stripTrailingZeros: true,
                  })}`}
            </p>
          </div>
          <div>
            <p className="text-t-350 text-xs">{t`Rank`}</p>
            <p className="text-t-1100 mt-0.5 text-4xl font-medium">
              <GenesisRankLabel rank={position?.rank} />
            </p>
          </div>
        </div>
        <div className="mt-auto flex h-[50px] items-end justify-between gap-3">
          <div className="min-w-0 pb-0.5">
            <p className="text-t-1100 text-[13px] font-medium">{t`Join me on HertzFlow`}</p>
            <p className="text-t-350 mt-1 max-w-[249px] text-xs">
              {t`Trade & Earn on any asset with leverage - 100% self-custodial.`}
            </p>
          </div>
          {referralCode ? (
            <div className="flex shrink-0 items-center gap-1">
              <div className="flex flex-col gap-[5px] text-xs">
                <span className="text-t-350">{t`Referral Code`}</span>
                <span className="text-t-1100 font-medium">{referralCode}</span>
              </div>
              <QRCodeSVG
                value={shareLink || referralCode}
                size={50}
                bgColor="transparent"
                fgColor="#FFFFFF"
                level="M"
                includeMargin={false}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const SharePosterDialog = ({
  open,
  onOpenChange,
  referralCode,
  shareLink,
  position,
  config,
}: SharePosterDialogProps) => {
  const { t } = useLingui();
  const posterRef = useRef<HTMLDivElement | null>(null);

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success(t`Referral link copied`);
    } catch {
      toast.error(t`Copy failed`);
    }
  };
  const shareToX = () => {
    if (shareLink) {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
  };
  const shareToTelegram = () => {
    if (shareLink) {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareLink)}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
  };
  const shareToDiscord = async () => {
    if (!shareLink) return;
    window.open(
      'https://discord.com/channels/@me',
      '_blank',
      'noopener,noreferrer',
    );
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success(t`Referral link copied. Paste it into Discord.`);
    } catch {
      toast.error(t`Copy failed`);
    }
  };
  const download = async () => {
    const posterNode = posterRef.current;
    if (!posterNode) return;
    try {
      await waitForPosterImages(posterNode);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      const dataUrl = await toPng(posterNode, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const anchor = document.createElement('a');
      anchor.download = `hertzflow-genesis-${referralCode || 'poster'}.png`;
      anchor.href = dataUrl;
      anchor.click();
    } catch {
      toast.error(t`Unable to download poster`);
    }
  };

  const posterProps = {
    referralCode,
    shareLink,
    position,
    apy: config?.apr,
  };

  return (
    <>
      <SharePosterDialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title={t`Share your referral`}
        background={
          <>
            <div className="bg-bg-3 pointer-events-none absolute inset-0" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GENESIS_SHARE_BACKGROUND}
              alt=""
              className="pointer-events-none absolute top-0 right-0 h-[399px] w-[414px] max-w-none select-none"
            />
          </>
        }
        poster={<GenesisPoster {...posterProps} />}
        linkLabel={t`Referral Link`}
        link={shareLink}
        copyAriaLabel={t`Copy referral link`}
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
          <GenesisPoster
            {...posterProps}
            posterRef={posterRef}
            includeBackground
          />
        </div>
      ) : null}
    </>
  );
};
