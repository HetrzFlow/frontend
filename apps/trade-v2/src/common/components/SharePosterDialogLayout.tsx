'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import {
  Button,
  cn,
  CopyOutlineIcon,
  Dialog,
  DialogContent,
  DialogTitle,
  DiscordIcon,
  DownloadIcon,
  TelegramIcon,
  TwitterIcon,
} from '@repo/ui';

interface SharePosterDialogLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  header?: ReactNode;
  poster: ReactNode;
  background?: ReactNode;
  backgroundSrc?: string;
  backgroundClassName?: string;
  contentClassName?: string;
  linkLabel: ReactNode;
  link: string;
  copyAriaLabel: string;
  onCopy: () => void;
  canShare: boolean;
  canDownload: boolean;
  onShareToX: () => void;
  onShareToDiscord: () => void;
  onShareToTelegram: () => void;
  onDownload: () => void;
}

export const SharePosterDialogLayout = ({
  open,
  onOpenChange,
  title,
  header,
  poster,
  background,
  backgroundSrc,
  backgroundClassName,
  contentClassName,
  linkLabel,
  link,
  copyAriaLabel,
  onCopy,
  canShare,
  canDownload,
  onShareToX,
  onShareToDiscord,
  onShareToTelegram,
  onDownload,
}: SharePosterDialogLayoutProps) => {
  const { t } = useLingui();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        position="center"
        closeClassName="hidden"
        overlayClassName="bg-black/10 backdrop-blur-[8px]"
        className={cn(
          'w-[460px] !max-w-[460px] gap-0 border-none bg-transparent p-0 shadow-none max-md:!w-[calc(100%-32px)] max-md:!max-w-[calc(100%-32px)]',
          contentClassName,
        )}
        aria-describedby={undefined}
      >
        <div className="bg-bg-3 relative isolate flex flex-col gap-4 overflow-hidden rounded-xl p-4 shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
          {background ??
            (backgroundSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={backgroundSrc}
                alt=""
                className={cn(
                  'pointer-events-none absolute inset-0 h-full w-full object-cover select-none',
                  backgroundClassName,
                )}
              />
            ) : null)}

          <DialogTitle className="sr-only">{title}</DialogTitle>
          {header}
          {poster}

          <div className="relative z-10 flex h-[72px] min-w-0 items-center gap-2 rounded-2xl border p-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <Image
                src="/trade-static/referral/invite-link.svg"
                alt=""
                width={24}
                height={24}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <span className="text-t-350 text-xs">{linkLabel}</span>
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="min-w-0 flex-1 truncate text-xl font-medium tracking-[-0.8px] text-white"
                  title={link}
                >
                  {link || '-'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={copyAriaLabel}
                  disabled={!link}
                  onClick={onCopy}
                  className="text-t-350 size-6 shrink-0 hover:bg-transparent hover:text-white"
                >
                  <CopyOutlineIcon size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex h-10 items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t`Share on X`}
              disabled={!canShare}
              onClick={onShareToX}
              className="size-10 rounded-full bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <TwitterIcon size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t`Share on Discord`}
              disabled={!canShare}
              onClick={onShareToDiscord}
              className="size-10 rounded-full bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <DiscordIcon size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t`Share on Telegram`}
              disabled={!canShare}
              onClick={onShareToTelegram}
              className="size-10 rounded-full bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <TelegramIcon size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t`Download`}
              disabled={!canDownload}
              onClick={onDownload}
              className="size-10 rounded-full bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <DownloadIcon size={24} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
