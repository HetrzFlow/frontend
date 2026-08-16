'use client';
import { FC, useMemo } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useLingui } from '@lingui/react/macro';
import { ArrowUpRightIcon, Separator } from '@repo/ui';
import { hzlpDoc } from '@/common';
import { IMAGES_MAP } from '@/constants/hzlp/assets';

const InfoOverview: FC = () => {
  const { t } = useLingui();
  const { theme } = useTheme();
  const isDark = useMemo(() => theme === 'dark', [theme]);

  return (
    <>
      <div className="w-full grid-cols-2 gap-21 px-4 md:grid">
        <div className="mx-auto inline-flex flex-col gap-3">
          <div className="mt-4 flex items-center justify-between text-2xl/tight md:mt-0 md:text-4xl/[0.9]">
            <div className="text-t-1100 font-semibold">{t`HzLP`}</div>
            <div className="text-accent hover:text-accent/70 flex items-center gap-1 text-sm leading-normal md:hidden">
              <span>{t`Learn more`}</span>
              <ArrowUpRightIcon size={16} />
            </div>
          </div>
          <div className="text-t-270 max-w-107 text-sm leading-normal">
            {t`The HertzFlow Liquidity Pool (HzLP) acts as a counterparty for traders, lending them assets. The HzLP token's value reflects:`}
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-accent bg-accent/10 w-fit rounded-full px-4 py-2 text-sm">
              {t`A basket of SUI, BTC, ETH, USDC`}
            </div>
            <div className="text-accent bg-accent/10 w-fit rounded-full px-4 py-2 text-sm">
              {t`Traders' net profits/losses`}
            </div>
            <div className="text-accent bg-accent/10 w-fit rounded-full px-4 py-2 text-sm">
              {t`Fees from trading, borrowing, and position adjustments`}
            </div>
          </div>
          <a
            className="text-accent hover:text-accent/70 mt-1 flex items-center gap-1.5 text-sm leading-normal"
            href={hzlpDoc ?? 'https://'}
          >
            <div className="hidden items-center gap-1 md:flex">
              <span>{t`Learn more`}</span>
              <ArrowUpRightIcon size={16} />
            </div>
          </a>
          <Separator className="md:hidden" />
        </div>
        <div className="hidden items-center justify-center md:flex">
          <Image
            height={240}
            width={346}
            src={isDark ? IMAGES_MAP.supplyIcon : IMAGES_MAP.supplyIconLight}
            alt="supply"
            quality={90}
            className="h-auto max-h-60 w-auto"
            priority
          />
        </div>
      </div>
    </>
  );
};

InfoOverview.displayName = 'InfoOverview';

export default InfoOverview;
