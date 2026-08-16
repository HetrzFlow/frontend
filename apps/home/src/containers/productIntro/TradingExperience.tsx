import { useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { cn, MEDIA_SIZES, useMediaQuery } from '@repo/ui';
import PositionItem from './components/PositionItem';
import ProductIntroFeature from './components/ProductIntroFeature';

import styles from './index.module.css';

const TradingExperience = () => {
  const { t } = useLingui();
  const [hovered, setHovered] = useState(false);
  const data = useMemo(() => {
    let arr = [
      {
        id: 1,
        symbol: 'USDJPY',
        lever: '20',
        value: '20000',
        pnl: '1428.03',
        pnlPercent: '14.2786',
      },
      {
        id: 2,
        symbol: 'XAUUSD',
        lever: '300',
        value: '29460.03',
        pnl: '1011.1',
        pnlPercent: '10.2198',
      },
      {
        id: 3,
        symbol: 'MSFTUSD',
        lever: '25',
        value: '2813.43',
        pnl: '591.66',
        pnlPercent: '4.9305',
      },
      {
        id: 4,
        symbol: 'BTCUSD',
        lever: '73.4',
        value: '900.51',
        pnl: '540.78',
        pnlPercent: '1.5634',
      },
      {
        id: 5,
        symbol: 'BNBUSD',
        lever: '54.3',
        value: '8198.46',
        pnl: '423.02',
        pnlPercent: '0.0563',
      },
    ];
    arr = arr.concat(arr.map((v) => ({ ...v, id: v.id + 5 })));

    return arr;
  }, []);

  const containerRef = useRef(null);
  const isSm = useMediaQuery() === MEDIA_SIZES.SM;

  useEffect(() => {
    if (isSm) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setHovered(true);
          } else {
            setHovered(false);
          }
        },
        {
          threshold: 0.1,
        },
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    } else {
      return () => {};
    }
  }, [isSm]);

  return (
    <ProductIntroFeature
      title={
        <Trans>
          <span className="text-accent">Tailored</span> Trading Experience
        </Trans>
      }
      description={t`Advanced trading terminal, zero-fee trading pairs, positive slippage, and loss protection. Give every trader an institutional-grade experience.`}
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      <div className="flex w-full flex-col">
        <div className="text-t-270 mb-2 flex justify-between px-6 text-sm">
          <span>{t`Pair`}</span>
          <span>{t`Amount`}</span>
        </div>
        <div className="pointer-events-none relative flex w-full gap-2 overflow-hidden">
          <div
            className={cn(
              'bg-up/15 absolute top-0 left-3 h-15 w-[calc(100%-24px)] rounded-lg p-3',
            )}
          ></div>
          <div
            ref={containerRef}
            className={cn('h-45 w-full', hovered ? styles.yLoopAnimation : '')}
          >
            {data.map(({ id, symbol, lever, value, pnl, pnlPercent }) => (
              <div key={id} className="h-15 w-full basis-auto">
                <PositionItem
                  symbol={symbol}
                  lever={lever}
                  value={value}
                  pnl={pnl}
                  pnlPercent={pnlPercent}
                />
              </div>
            ))}
          </div>
          <div
            className={cn(
              'absolute bottom-0 left-3 h-15 w-[calc(100%-24px)] rounded-lg bg-gradient-to-b from-transparent to-black/70 p-3 group-hover/self:to-black/40',
            )}
          ></div>
        </div>
      </div>
    </ProductIntroFeature>
  );
};

export default TradingExperience;
