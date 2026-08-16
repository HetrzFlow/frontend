'use client';

import { FC, useCallback, useMemo, useRef } from 'react';

import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { toBlob, toPng } from 'html-to-image';

import { calc, ROUND_MODE } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import {
  Button,
  cn,
  DialogFooter,
  HzIcon,
  HzTextIcon,
  Separator,
  toast,
} from '@repo/ui';
import { useGlobalStore } from '@/common';

interface ContentProps {
  isLong: boolean;
  instName: string;
  instNameInImage: string;
  leverage: string;
  pxDispDecimal?: number;
  entryPrice: string;
  markPrice: string;
}

const Content: FC<ContentProps> = ({
  isLong,
  instName,
  instNameInImage,
  leverage,
  pxDispDecimal,
  entryPrice,
  markPrice,
}) => {
  const { t } = useLingui();
  const divRef = useRef(null);

  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const dispLeverage = `${truncateFormat(leverage, leverDecimal, {
    stripTrailingZeros: true,
    round: ROUND_MODE.ROUND,
  })}x`;
  const [isUp, dispPnLPercent, dispEntryPrice, dispMarkPrice] = useMemo(() => {
    return [
      isLong ? calc(markPrice).gt(entryPrice) : calc(markPrice).lt(entryPrice),
      percentFormat(
        calc(markPrice)
          .minus(entryPrice)
          .div(entryPrice)
          .times(leverage)
          .times(isLong ? 1 : -1),
        2,
        {
          signDisplay: 'always',
        },
      ),
      truncateFormat(entryPrice, pxDispDecimal),
      truncateFormat(markPrice, pxDispDecimal),
    ];
  }, [entryPrice, markPrice, isLong, leverage, pxDispDecimal]);

  // download image
  const onDownloadImage = useCallback(() => {
    if (divRef.current === null) {
      return;
    }

    toPng(divRef.current, { cacheBust: true }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `HertzFlow-${instNameInImage}-${isLong ? t`Long` : t`Short`}-${dispLeverage}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t`Image downloaded`);
    });
  }, [t, dispLeverage, instNameInImage, isLong]);

  // save image
  const onCopyImage = useCallback(() => {
    if (divRef.current === null) {
      return;
    }

    toBlob(divRef.current, { cacheBust: true }).then((blob) => {
      if (!blob) return;

      navigator.clipboard
        .write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ])
        .then(() => {
          toast.success(t`Image copied`);
        });
    });
  }, [t]);

  return (
    <>
      <div
        ref={divRef}
        className="relative aspect-[428/300] overflow-hidden rounded-xl p-6 text-white"
      >
        <Image
          src={
            isUp
              ? '/trade-static/share-bg-up.png'
              : '/trade-static/share-bg-down.png'
          }
          alt=""
          width={428}
          height={300}
          className="absolute top-0 left-0 -z-1 w-full"
        />
        <div className="flex items-center gap-1.5 text-lg font-medium">
          <span> {instName}</span>
          <Separator orientation="vertical" className="!h-2.5" />
          <span className={isLong ? 'text-accent' : 'text-down'}>
            {isLong ? t`LONG` : t`SHORT`}
          </span>
          <Separator orientation="vertical" className="!h-2.5" />
          <span>{dispLeverage}</span>
        </div>
        <div
          className={cn(
            'font-plex mt-16 text-[calc(var(--spacing)*12)]/tight font-semibold',
            isUp ? 'text-accent' : 'text-down',
          )}
        >
          {dispPnLPercent}
        </div>
        <div className="flex w-40 items-center justify-between text-xs">
          <span className="text-white/70">{t`Entry Price`}</span>
          <span className="font-plex font-medium">{dispEntryPrice}</span>
        </div>
        <div className="mt-1.5 flex w-40 items-center justify-between text-xs">
          <span className="text-white/70">{t`Mark Price`}</span>
          <span className="font-plex font-medium">{dispMarkPrice}</span>
        </div>
        <div className="mt-10 flex items-center gap-2">
          <HzIcon className="text-accent" size={30} />
          <HzTextIcon size={15} />
        </div>
      </div>
      <DialogFooter className="gap-4">
        <Button
          className="h-[54px] w-1/2 shrink"
          onClick={onCopyImage}
        >{t`Copy Image`}</Button>
        <Button
          className="bg-accent hover:bg-accent/90 text-accent-foreground h-[54px] w-1/2 shrink"
          onClick={onDownloadImage}
        >{t`Download`}</Button>
      </DialogFooter>
    </>
  );
};

export default Content;
