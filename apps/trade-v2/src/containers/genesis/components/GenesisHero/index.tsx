'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { percentFormat, thoFormat } from '@repo/lib/format';
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import ConnectBtn from '@/common/components/ConnectBtn';
import type { GenesisVaultConfig } from '@/services/rest/genesis';
import {
  GENESIS_INTEGER_FORMAT_OPTIONS,
  GENESIS_RULES_URL,
} from '../../lib/constants';

interface GenesisHeroProps {
  config?: GenesisVaultConfig;
  onStartEarning: () => void;
  isConnected?: boolean;
  startEarningPending?: boolean;
}

const getCountdownParts = (totalSeconds: number) => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    { value: String(days), label: 'D' },
    { value: String(hours).padStart(2, '0'), label: 'H' },
    { value: String(minutes).padStart(2, '0'), label: 'M' },
    { value: String(seconds).padStart(2, '0'), label: 'S' },
  ];
};

const formatRulesAvailableDate = (startMs?: number, locale = 'en-US') => {
  if (!startMs || !Number.isFinite(startMs)) return undefined;
  const date = new Date(startMs);
  if (Number.isNaN(date.getTime())) return undefined;

  const formattedDate = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
  }).format(date);

  return locale.startsWith('zh')
    ? formattedDate.replace(/(\d+)月(\d+)日/, '$1 月 $2 日')
    : formattedDate;
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

export const GenesisHero = ({
  config,
  onStartEarning,
  isConnected = false,
  startEarningPending = false,
}: GenesisHeroProps) => {
  const { i18n, t } = useLingui();
  const notStarted = !config || config.phase === 'not_started';
  const ended = config?.phase === 'ended';
  const aprLabel =
    config?.apr === undefined
      ? '--'
      : percentFormat(config.apr / 100, 2, { stripTrailingZeros: true });
  const boostLabel =
    config?.boostMultiplier === undefined
      ? '--'
      : `${thoFormat(config.boostMultiplier, GENESIS_INTEGER_FORMAT_OPTIONS)}x`;
  const seasonLabel = config?.seasonName
    ? `${config.seasonName} · ${t`Genesis Vault`}`
    : t`Genesis Vault`;
  const actionLabel = notStarted
    ? t`Coming Soon`
    : ended
      ? t`Season 1 Has Ended`
      : t`Start Earning`;
  const countdownTargetMs = notStarted
    ? config?.startMs
    : ended
      ? undefined
      : config?.endMs;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateVideoPreference = () => {
      const saveData = (navigator as NavigatorWithConnection).connection
        ?.saveData;
      setShouldPlayVideo(!reducedMotion.matches && !saveData);
    };

    updateVideoPreference();
    reducedMotion.addEventListener('change', updateVideoPreference);
    return () =>
      reducedMotion.removeEventListener('change', updateVideoPreference);
  }, []);

  useEffect(() => {
    const updateNow = () => {
      const nextNowMs = Date.now();
      setNowMs(nextNowMs);
      return nextNowMs;
    };
    if (!countdownTargetMs || updateNow() >= countdownTargetMs) return;

    const timer = window.setInterval(() => {
      if (updateNow() >= countdownTargetMs) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdownTargetMs]);

  const countdownSeconds = countdownTargetMs
    ? Math.max(0, Math.ceil((countdownTargetMs - nowMs) / 1000))
    : 0;
  const countdown = getCountdownParts(countdownSeconds);
  const rulesAvailableDate = formatRulesAvailableDate(
    config?.startMs,
    i18n.locale,
  );
  const countdownLabels = [
    t({ message: 'D', context: 'Genesis countdown days' }),
    t({ message: 'H', context: 'Genesis countdown hours' }),
    t({ message: 'M', context: 'Genesis countdown minutes' }),
    t({ message: 'S', context: 'Genesis countdown seconds' }),
  ];

  return (
    <section
      className={cn(
        'relative h-[519px] w-full overflow-hidden',
        notStarted && 'h-[100dvh]',
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {shouldPlayVideo ? (
          <video
            autoPlay
            preload="metadata"
            muted
            loop
            playsInline
            controls={false}
            poster="/trade-static/genesis/hero-poster.webp"
            className="size-full scale-[1.08] object-cover object-center opacity-40 mix-blend-screen"
          >
            <source
              src="/trade-static/genesis/hero-mobile.mp4"
              type="video/mp4"
              media="(max-width: 767px)"
            />
            <source src="/trade-static/genesis/hero.mp4" type="video/mp4" />
          </video>
        ) : (
          <Image
            src="/trade-static/genesis/hero-poster.webp"
            alt=""
            aria-hidden="true"
            fill
            preload
            sizes="100vw"
            className="scale-[1.08] object-cover object-center opacity-40 mix-blend-screen"
          />
        )}
        <div className="to-bg-1 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-b from-transparent" />
      </div>

      <div
        className={cn(
          'relative z-30 mx-auto flex h-full w-full max-w-[1080px] flex-col items-center pt-[88px] text-center max-md:px-5 max-md:pt-[126px]',
          notStarted && 'justify-center pt-0 max-md:pt-0',
        )}
      >
        <div className="border-accent flex h-[33px] items-center rounded-full border bg-[#001b1e]/65 px-4 max-md:h-7">
          <span className="text-accent text-xs leading-none font-medium max-md:text-[9px]">
            {seasonLabel}
          </span>
        </div>

        <h1 className="text-t-1100 mt-3 max-w-[325px] text-[28px] leading-[38px] font-medium uppercase md:max-w-[748px] md:text-[64px] md:leading-[1.15]">
          <span className="whitespace-nowrap">
            {t`Deposit · Earn Merits ·`}
          </span>
          <br />
          {t`Earn Yield`}
        </h1>

        <p className="text-t-350 mt-6 max-w-[748px] text-sm">
          {t`Genesis event for HertzFlow Mainnet liquidity. Deposit to earn ~${aprLabel} APY and a ${boostLabel} Merits boost.`}
          {notStarted ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="link"
                  aria-disabled="true"
                  tabIndex={0}
                  className="text-accent mx-auto block w-fit cursor-not-allowed underline underline-offset-2"
                >
                  {t`View Rules`}
                </span>
              </TooltipTrigger>
              {rulesAvailableDate ? (
                <TooltipContent side="top" sideOffset={5} className="w-auto">
                  {t`Rules will be available on ${rulesAvailableDate}.`}
                </TooltipContent>
              ) : null}
            </Tooltip>
          ) : (
            <a
              href={GENESIS_RULES_URL}
              target="_blank"
              rel="noreferrer"
              className="text-accent mx-auto block w-fit underline underline-offset-2"
            >
              {t`View Rules`}
            </a>
          )}
        </p>

        {isConnected || notStarted || ended ? (
          <Button
            onClick={onStartEarning}
            disabled={!config || startEarningPending || notStarted || ended}
            className="bg-accent mt-6 h-[42px] min-w-[158px] rounded-xl px-8 text-sm font-medium text-black hover:bg-[#25f3ff] max-md:h-9"
          >
            {actionLabel}
          </Button>
        ) : (
          <ConnectBtn
            disabled={!config || startEarningPending}
            className="mt-6 h-[42px] min-w-[158px] rounded-xl px-8 text-sm font-medium max-md:h-9"
            loadingClassName="mt-6 h-[42px] min-w-[158px] rounded-xl px-8 max-md:h-9"
          >
            {actionLabel}
          </ConnectBtn>
        )}

        {!ended && (countdownSeconds > 0 || notStarted) ? (
          <div
            className="mt-6 flex h-[52px] w-full max-w-[748px] items-center justify-center gap-2"
            aria-label={countdownSeconds > 0 ? t`Countdown` : undefined}
            aria-hidden={countdownSeconds > 0 ? undefined : true}
          >
            {countdownSeconds > 0
              ? countdown.map((part, index) => (
                  <div
                    key={`${part.label}-${index}`}
                    className="flex items-center gap-2"
                  >
                    {index > 0 ? (
                      <span className="bg-t-430 h-2 w-0.5 rounded-[2px]" />
                    ) : null}
                    <div className="flex h-[52px] w-[35px] flex-col items-center justify-center gap-0.5 rounded-lg bg-white/10 p-2">
                      <span className="text-t-1100 text-base font-semibold uppercase">
                        {part.value}
                      </span>
                      <span className="text-t-350 text-xs">
                        {countdownLabels[index] ?? part.label}
                      </span>
                    </div>
                  </div>
                ))
              : null}
          </div>
        ) : null}
      </div>
    </section>
  );
};
