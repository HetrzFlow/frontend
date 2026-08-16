'use client';

import {
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

import { HzIcon, HzTextIcon, toast } from '@repo/ui';
import { SharePosterDialogLayout } from '@/common/components/SharePosterDialogLayout';
import {
  buildDiscordShareMessage,
  buildReferralShareText,
  buildShortShareUrl,
} from '@/lib/referral/referralShare';

const REFERRAL_CARD_BACKGROUND = '/trade-static/referral/card-share-og-bg.png';
const REFERRAL_DIALOG_BACKGROUND = '/trade-static/referral/card-share-bg.png';

interface ReferralShareDialogProps {
  code: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharePathname?: string;
}

interface ReferralPosterProps {
  posterRef: RefObject<HTMLDivElement | null>;
  referralCode: string;
  referralLink: string;
  onBackgroundLoad: () => void;
}

const ReferralPoster: FC<ReferralPosterProps> = ({
  posterRef,
  referralCode,
  referralLink,
  onBackgroundLoad,
}) => {
  return (
    <div
      ref={posterRef}
      className="relative aspect-[428/298] w-full overflow-hidden rounded-[16px] bg-[#373B41]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={REFERRAL_CARD_BACKGROUND}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover select-none"
        onLoad={onBackgroundLoad}
        onError={onBackgroundLoad}
      />
      <div className="absolute inset-0 z-[1] rounded-[16px] border border-white/10" />

      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        <div className="flex max-w-[360px] flex-col gap-1 pt-5">
          <div className="text-[28px]/[1.2] font-medium tracking-[-1.12px] text-white">
            <span className="block">
              <Trans>Let&apos;s trade on</Trans>
            </span>
            <span className="block">
              <Trans>HertzFlow together</Trans>
            </span>
          </div>
          <p className="text-[13px]/[1.2] tracking-[-0.52px] text-white/70">
            <Trans>
              Trade &amp; Earn on any asset with leverage - 100% self-custodial.
            </Trans>
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <HzIcon size={24} className="text-accent" />
            <HzTextIcon size={12} className="text-white" />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div className="flex flex-col gap-1 text-[11px]/[1.2] tracking-[-0.22px]">
              <span className="text-white/70">
                <Trans>Referral Code</Trans>
              </span>
              <span className="font-medium text-white">{referralCode}</span>
            </div>
            <QRCodeSVG
              value={referralLink || referralCode || ' '}
              size={50}
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

const ReferralShareDialog: FC<ReferralShareDialogProps> = ({
  code,
  open,
  onOpenChange,
  sharePathname = '/referral',
}) => {
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [isPosterReady, setIsPosterReady] = useState(false);
  const [origin, setOrigin] = useState('');
  const { t } = useLingui();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralCode = code ?? '';
  const referralLink =
    origin && referralCode
      ? buildShortShareUrl(origin, referralCode, undefined, sharePathname)
      : '';

  useEffect(() => {
    if (open) setIsPosterReady(false);
  }, [open, referralCode]);

  const copyText = useCallback(
    async (value: string) => {
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        toast.success(t`Referral link copied`, {
          id: `referral-link-copied-${value}`,
        });
      } catch {
        toast.error(t`Copy failed`);
      }
    },
    [t],
  );

  const handleDownload = useCallback(async () => {
    if (!posterRef.current || !isPosterReady || !referralCode || !referralLink)
      return;

    try {
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
      link.download = `HertzFlow-referral-${referralCode}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t`Image downloaded`);
    } catch {
      toast.error(t`Failed to download image`);
    }
  }, [isPosterReady, referralCode, referralLink, t]);

  const handleShareToX = useCallback(() => {
    if (!referralCode || !origin) return;

    const shareUrl = buildShortShareUrl(
      origin,
      referralCode,
      undefined,
      sharePathname,
    );
    const text = buildReferralShareText(referralCode);
    const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;

    window.open(href, '_blank', 'noopener,noreferrer');
  }, [origin, referralCode, sharePathname]);

  const handleShareToTelegram = useCallback(() => {
    if (!referralCode || !origin) return;

    const shareUrl = buildShortShareUrl(
      origin,
      referralCode,
      undefined,
      sharePathname,
    );
    const text = buildReferralShareText(referralCode);
    const href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;

    window.open(href, '_blank', 'noopener,noreferrer');
  }, [origin, referralCode, sharePathname]);

  const handleShareToDiscord = useCallback(async () => {
    if (!referralCode || !origin) return;

    window.open(
      'https://discord.com/channels/@me',
      '_blank',
      'noopener,noreferrer',
    );

    try {
      await navigator.clipboard.writeText(
        buildDiscordShareMessage(origin, referralCode, sharePathname),
      );
      toast.success(t`Share message copied - paste it in Discord`, {
        id: `referral-discord-share-${referralCode}`,
      });
    } catch {
      toast.error(t`Copy failed`);
    }
  }, [origin, referralCode, sharePathname, t]);

  return (
    <SharePosterDialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title={t`Share your referral`}
      header={
        <div className="relative z-10 flex flex-col gap-1">
          <h3 className="text-base font-medium tracking-[-0.64px] text-white">
            <Trans>Share your referral</Trans>
          </h3>
          <p className="text-t-350 text-[13px] tracking-[-0.52px]">
            <Trans>
              Share your referral link to earn rebates when friends trade.
            </Trans>
          </p>
        </div>
      }
      poster={
        <ReferralPoster
          posterRef={posterRef}
          referralCode={referralCode}
          referralLink={referralLink}
          onBackgroundLoad={() => setIsPosterReady(true)}
        />
      }
      backgroundSrc={REFERRAL_DIALOG_BACKGROUND}
      linkLabel={<Trans>Referral Link</Trans>}
      link={referralLink}
      copyAriaLabel={t`Copy referral link`}
      onCopy={() => copyText(referralLink)}
      canShare={!!referralCode && !!origin}
      canDownload={isPosterReady && !!referralLink}
      onShareToX={handleShareToX}
      onShareToDiscord={handleShareToDiscord}
      onShareToTelegram={handleShareToTelegram}
      onDownload={handleDownload}
    />
  );
};

export default ReferralShareDialog;
