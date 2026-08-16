'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

import { calc, ROUND_MODE } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import {
  Button,
  cn,
  DiscordIcon,
  DownloadIcon,
  HyperLevIcon,
  HzIcon,
  HzTextIcon,
  Separator,
  TelegramIcon,
  toast,
  TwitterIcon,
} from '@repo/ui';
import { useGlobalStore } from '@/common';
import { useReferralCodes } from '@/common/hooks';
import { buildShortShareUrl } from '@/lib/referral/referralShare';
import type { Options } from 'html-to-image/es/types';

interface ContentProps {
  isLong: boolean;
  instName: string;
  instNameInImage: string;
  leverage?: string;
  pxDispDecimal?: number;
  entryPrice: string;
  markPrice?: string;
  exitPrice?: string;
  overridePnlPercent?: string | number;
  isZFP?: boolean;
}

const SHARE_IMAGE_WIDTH = 428;
const SHARE_IMAGE_HEIGHT = 300;
const SHARE_IMAGE_PIXEL_RATIO = 2;

const SHARE_IMAGE_OPTIONS: Options = {
  cacheBust: true,
  height: SHARE_IMAGE_HEIGHT,
  pixelRatio: SHARE_IMAGE_PIXEL_RATIO,
  style: {
    height: `${SHARE_IMAGE_HEIGHT}px`,
    width: `${SHARE_IMAGE_WIDTH}px`,
  },
  width: SHARE_IMAGE_WIDTH,
};

type TradeShareCopy = {
  title: string;
  description: string;
  discount: string;
  codePrefix: string;
};

const buildTradeShareText = (code: string, copy: TradeShareCopy) => {
  if (!code) {
    return `${copy.title}\n${copy.description}`;
  }

  return `${copy.title}\n${copy.description}\n\n${copy.discount}\n\n${copy.codePrefix}: ${code}`;
};

const buildTradeShareMessage = (
  code: string,
  url: string,
  copy: TradeShareCopy,
) => {
  const text = buildTradeShareText(code, copy);

  if (!url) return text;

  return code ? `${text} ${url}` : `${text}\n\n${url}`;
};

const Content: FC<ContentProps> = ({
  isLong,
  instName,
  instNameInImage,
  leverage,
  pxDispDecimal,
  entryPrice,
  markPrice,
  exitPrice,
  overridePnlPercent,
  isZFP = false,
}) => {
  const { t } = useLingui();
  const exportDivRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [origin, setOrigin] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const { items: referralCodes } = useReferralCodes();

  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const dispLeverage = leverage
    ? `${truncateFormat(leverage, leverDecimal, {
        stripTrailingZeros: true,
        round: ROUND_MODE.ROUND,
      })}x`
    : '';
  const [
    isUp,
    dispPnLPercent,
    dispEntryPrice,
    dispSecondPrice,
    secondPriceLabel,
  ] = useMemo(() => {
    const secondPrice = exitPrice ?? markPrice ?? '';
    const pnlPercent =
      overridePnlPercent !== undefined
        ? percentFormat(overridePnlPercent, 2, { signDisplay: 'always' })
        : percentFormat(
            calc(secondPrice)
              .minus(entryPrice)
              .div(entryPrice)
              .times(leverage || 1)
              .times(isLong ? 1 : -1),
            2,
            { signDisplay: 'always' },
          );
    return [
      overridePnlPercent !== undefined
        ? calc(overridePnlPercent).gte(0)
        : isLong
          ? calc(secondPrice).gt(entryPrice)
          : calc(secondPrice).lt(entryPrice),
      pnlPercent,
      truncateFormat(entryPrice, pxDispDecimal),
      truncateFormat(secondPrice, pxDispDecimal),
      exitPrice !== undefined ? t`Exit Price` : t`Mark Price`,
    ];
  }, [
    entryPrice,
    markPrice,
    exitPrice,
    isLong,
    leverage,
    pxDispDecimal,
    overridePnlPercent,
    t,
  ]);
  const primaryReferralCode = referralCodes[0]?.referral_code ?? '';
  const primaryReferralLink =
    primaryReferralCode && origin
      ? buildShortShareUrl(origin, primaryReferralCode)
      : '';
  const shareUrl = primaryReferralLink || currentUrl || origin;
  const tradeShareCopy: TradeShareCopy = useMemo(
    () => ({
      title: t`Join me on HertzFlow`,
      description: t`Trade & Earn on any asset with leverage - 100% self-custodial.`,
      discount: t`Enjoy up to 5% lifetime trading fee discounts on HertzFlow.`,
      codePrefix: t`Trade & Earn on any asset with my code`,
    }),
    [t],
  );
  const shareText = buildTradeShareText(primaryReferralCode, tradeShareCopy);
  const shareMessage = buildTradeShareMessage(
    primaryReferralCode,
    shareUrl,
    tradeShareCopy,
  );
  const xShareHref = shareMessage
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`
    : '';
  const telegramShareHref =
    shareText && shareUrl
      ? `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
      : '';
  const shareBackgroundSrc = isZFP
    ? isUp
      ? '/trade-static/share-bg-up-hyper.webp'
      : '/trade-static/share-bg-down-hyper.webp'
    : isUp
      ? '/trade-static/share-bg-up.webp'
      : '/trade-static/share-bg-down.webp';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      setCurrentUrl(window.location.href);
    }
  }, []);

  // download image
  const onDownloadImage = useCallback(() => {
    if (exportDivRef.current === null) {
      return;
    }

    toPng(exportDivRef.current, SHARE_IMAGE_OPTIONS).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `HertzFlow-${instNameInImage}-${isLong ? t`Long` : t`Short`}${dispLeverage ? `-${dispLeverage}` : ''}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t`Image downloaded`);
    });
  }, [t, dispLeverage, instNameInImage, isLong]);

  const handleShareToDiscord = useCallback(async () => {
    if (!shareMessage) return;

    window.open(
      'https://discord.com/channels/@me',
      '_blank',
      'noopener,noreferrer',
    );

    try {
      await navigator.clipboard.writeText(shareMessage);
      toast.success(t`Share message copied - paste it in Discord`, {
        id: `trade-discord-share-${primaryReferralCode || 'no-code'}`,
      });
    } catch {
      toast.error(t`Copy failed`);
    }
  }, [primaryReferralCode, shareMessage, t]);

  const renderShareImage = (onBackgroundLoad?: () => void) => (
    <>
      {/* next/image can not be rendered by html-to-image in safari */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shareBackgroundSrc}
        alt="share background image"
        width={460}
        height={379}
        className="absolute -top-4.5 -left-4.5 -z-1 w-[calc(100%+var(--spacing)*9)] max-w-max"
        onLoad={onBackgroundLoad}
      />
      <div className="flex items-center gap-1.5 text-lg font-medium">
        <span>{instName}</span>
        <Separator orientation="vertical" className="!h-2.5" />
        <span className={isLong ? 'text-accent' : 'text-down'}>
          {isLong ? t`LONG` : t`SHORT`}
        </span>
        {dispLeverage && (
          <>
            <Separator orientation="vertical" className="!h-2.5" />
            <span>{dispLeverage}</span>
          </>
        )}
        {isZFP && (
          <span className="bg-hyper-lev/8 text-hyper-lev ml-auto flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-xs font-medium">
            <HyperLevIcon size={14} />
            <span>{t`Hyper`}</span>
          </span>
        )}
      </div>
      <div>
        <div
          className={cn(
            'font-plex text-[calc(var(--spacing)*12)]/tight font-semibold',
            isUp ? 'text-accent' : 'text-down',
          )}
        >
          {dispPnLPercent}
        </div>
        <div className="flex w-40 items-center justify-between text-xs">
          <span className="text-foreground/70">{t`Entry Price`}</span>
          <span className="font-plex font-medium">{dispEntryPrice}</span>
        </div>
        <div className="mt-1.5 flex w-40 items-center justify-between text-xs">
          <span className="text-white/70">{secondPriceLabel}</span>
          <span className="font-plex font-medium">{dispSecondPrice}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <HzIcon className="text-accent" size={20} />
          <HzTextIcon size={10} />
        </div>
        {primaryReferralCode && primaryReferralLink ? (
          <div className="flex items-center gap-2">
            <div className="pb-1 text-right">
              <div className="text-t-270 text-xs">{t`Referral Code`}</div>
              <div className="text-t-1100 mt-1 text-xs font-medium">
                {primaryReferralCode}
              </div>
            </div>
            <div className="flex size-13 shrink-0 items-center justify-center rounded-lg bg-[#0B1113] p-1">
              <QRCodeSVG
                value={primaryReferralLink}
                size={48}
                bgColor="transparent"
                fgColor="#fff"
                level="M"
                marginSize={0}
              />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      <div className="rounded-2xl border">
        <div className="relative flex aspect-[428/300] flex-col justify-between gap-4 overflow-visible p-5 text-white">
          {renderShareImage()}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 h-0 w-0 overflow-hidden"
        >
          <div
            ref={exportDivRef}
            className="relative flex h-[300px] w-[428px] flex-col justify-between gap-4 overflow-visible p-5 text-white"
          >
            {renderShareImage(() => {
              setImageLoaded(true);
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <a
          aria-label={t`Share on X`}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/14 aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
          href={xShareHref || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!xShareHref}
          onClick={(event) => {
            if (!xShareHref) event.preventDefault();
          }}
        >
          <TwitterIcon size={20} />
        </a>
        <button
          type="button"
          aria-label={t`Share on Discord`}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!shareUrl}
          onClick={handleShareToDiscord}
        >
          <DiscordIcon size={20} />
        </button>
        <a
          aria-label={t`Share on Telegram`}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/14 aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
          href={telegramShareHref || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!telegramShareHref}
          onClick={(event) => {
            if (!telegramShareHref) event.preventDefault();
          }}
        >
          <TelegramIcon size={20} />
        </a>
        <Button
          aria-label={t`Download trade image`}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!imageLoaded}
          onClick={onDownloadImage}
        >
          <DownloadIcon />
        </Button>
      </div>
    </>
  );
};

export default Content;
