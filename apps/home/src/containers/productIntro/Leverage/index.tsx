'use client';

import { useEffect, useRef, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { createTimer, Timer } from 'animejs';
import { IMAGES_MAP } from '@repo/common';
import { CoinIcon } from '@repo/common/components';
import { percentFormat, thoFormat, truncateFormat } from '@repo/lib/format';
import {
  ActivityIcon,
  cn,
  MEDIA_SIZES,
  Separator,
  useMediaQuery,
} from '@repo/ui';

import ProductIntroFeature from '../components/ProductIntroFeature';
import styles from './index.module.css';
import LossProtection from './LossProtect';
import ZeroFee from './ZeroFee';

const Leverage = () => {
  const { t } = useLingui();
  const containerRef = useRef<HTMLDivElement>(null);
  const positionSizeDivRef = useRef<HTMLDivElement>(null);
  const leverageDivRef = useRef<HTMLDivElement>(null);
  const pnlDivRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timer = useRef<Timer | null>(null);
  const [animation, setAnimation] = useState(false);
  const isSm = useMediaQuery() === MEDIA_SIZES.SM;

  const animationRestart = () => {
    setAnimation(true);
    timer.current?.restart();
  };

  const animationStop = () => {
    setAnimation(false);
    timer.current?.pause();
    if (positionSizeDivRef.current) {
      positionSizeDivRef.current.innerText = truncateFormat(200, 0);
    }
    if (leverageDivRef.current) {
      leverageDivRef.current.innerText = `${truncateFormat(1, 0)}x`;
    }
    if (pnlDivRef.current) {
      pnlDivRef.current.innerText = percentFormat(0.025, 2, {
        signDisplay: 'always',
      });
    }
  };

  useEffect(() => {
    timer.current = createTimer({
      duration: 2000,
      loop: false,
      onUpdate: (self) => {
        if (positionSizeDivRef.current) {
          positionSizeDivRef.current.innerText = truncateFormat(
            ((self.currentTime * 999) / 2000 + 1) * 200,
            0,
          );
        }
        if (leverageDivRef.current) {
          leverageDivRef.current.innerText = `${truncateFormat(
            ((self.currentTime * 999) / 2000 + 1) * 0.2,
            0,
          )}x`;
        }
        if (pnlDivRef.current) {
          pnlDivRef.current.innerText = percentFormat(
            ((self.currentTime * 999) / 2000 + 1) * 0.025,
            2,
            {
              signDisplay: 'always',
            },
          );
        }
      },
      onPause: () => {},
    });
    timer.current.pause();
  }, []);

  useEffect(() => {
    if (isSm) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            animationRestart();
          } else {
            animationStop();
          }
        },
        { threshold: 0.2 },
      );

      if (containerRef.current) observer.observe(containerRef.current);

      const container = containerRef.current;
      return () => {
        if (container) observer.unobserve(container);
      };
    } else {
      return () => {};
    }
  }, [isSm]);

  return (
    <ProductIntroFeature
      title={
        <Trans>
          Up To <span className="text-accent">200x</span> Leverage
        </Trans>
      }
      description={t`Unlock powerful leverage to maximize capital efficiency — every ripple on Earth could become your next great success.`}
      cardClassName="relative flex-col"
      onMouseEnter={() => {
        animationRestart();
      }}
      onMouseLeave={() => {
        animationStop();
      }}
      ref={containerRef}
    >
      <div className="mt-9 flex w-60 items-center rounded-lg border p-3 group-hover/self:border-[#2E2E2E]">
        <CoinIcon src={IMAGES_MAP.instIcons['USD/JPY']} size={16} />
        <span className="ml-1.5 text-[10px]">JPY/USD</span>
        <span className="text-accent bg-accent/20 rounded-full px-1.5 py-0.5 text-[10px]">{t`Open Long`}</span>
        <ZeroFee animation={animation} />
      </div>
      <div className="mt-1.5 h-full w-60 rounded-lg rounded-b-none border border-b-0 p-3 group-hover/self:border-[#2E2E2E]">
        <div className="text-xs">{t`PnL`}</div>
        <div ref={pnlDivRef} className="text-accent mt-0.5 text-2xl">
          {percentFormat(0.025, 2, {
            signDisplay: 'always',
          })}
        </div>
        <div className="relative mt-3 h-3 w-full overflow-hidden rounded-sm">
          <div className="bg-border absolute top-1.5 left-0 flex h-px w-full items-center justify-between">
            <Separator orientation="vertical" className="h-1.5!" />
            <Separator orientation="vertical" className="h-1.5!" />
            <Separator orientation="vertical" className="h-1.5!" />
            <Separator orientation="vertical" className="h-1.5!" />
            <Separator orientation="vertical" className="h-1.5!" />
          </div>
          <div
            ref={progressBarRef}
            className={cn(
              'bg-accent absolute top-0 left-0 flex h-3 w-full items-center rounded-sm bg-gradient-to-r from-[#00DFEB] via-[#F5E96A] to-[#BBF574]',
              animation ? styles.progress : 'w-3',
            )}
          >
            <div className="right-0 mr-0.5 ml-auto size-2 rounded-xs bg-black"></div>
          </div>
        </div>
      </div>

      <div className="absolute top-18 left-1/2 flex w-30 translate-x-4 flex-col gap-1.5 rounded-lg bg-[#23242A] p-3">
        <span className="text-t-270 text-[10px] whitespace-nowrap">{t`Position Size(USDT)`}</span>
        <span
          ref={positionSizeDivRef}
          className="font-plex text-base font-medium"
        >
          {truncateFormat(200, 0)}
        </span>
      </div>

      <div className="bg-accent text-accent-foreground absolute right-1/2 bottom-15 flex min-w-42 translate-x-8 items-center justify-center gap-2 rounded-lg p-2.5 text-sm font-medium">
        {t`Leverage`}{' '}
        <span ref={leverageDivRef} className="font-plex font-medium">
          {thoFormat(1)}x
        </span>
        <ActivityIcon size={14} />
      </div>

      <div className="absolute bottom-3 left-1/2 translate-x-4">
        <LossProtection animation={animation} />
      </div>
    </ProductIntroFeature>
  );
};

export default Leverage;
