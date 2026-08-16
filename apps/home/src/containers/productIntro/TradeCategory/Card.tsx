import { FC, useEffect, useRef, useState } from 'react';
import { IMAGES_MAP } from '@repo/common';
import { cn, MEDIA_SIZES, useMediaQuery } from '@repo/ui';

import styles from './index.module.css';
import Item from './Item';

interface CardProps {
  hovered: boolean;
}

const Card: FC<CardProps> = ({ hovered }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isSm = useMediaQuery() === MEDIA_SIZES.SM;
  const [animation, setAnimation] = useState(false);

  useEffect(() => {
    if (isSm) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setAnimation(true);
          } else {
            setAnimation(false);
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
    <div
      ref={containerRef}
      className={cn(
        'pointer-events-none relative flex w-full gap-3',
        animation || hovered ? styles.xLoopAnimation : 'translate-x-3',
      )}
    >
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.coinIcons.BTC} alt="BTC" />
        <Item
          src={IMAGES_MAP.coinIcons.ETH}
          alt="ETH"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.coinIcons.BNB} alt="BNB" />
        <Item
          src={IMAGES_MAP.instIcons['TSLA/USD']}
          alt="TSLA"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.instIcons['AAPL/USD']} alt="AAPL" />
        <Item
          src={'/home-static/images/usa.svg'}
          alt="USD"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={'/home-static/images/vietnam.svg'} alt="VND" />
        <Item
          src={'/home-static/images/turkey.svg'}
          alt="TRY"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={'/home-static/images/xau.png'} alt="XAU" />
        <Item
          src={'/home-static/images/oil.svg'}
          alt="OIL"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.coinIcons.BTC} alt="BTC" />
        <Item
          src={IMAGES_MAP.coinIcons.ETH}
          alt="ETH"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.coinIcons.BNB} alt="BNB" />
        <Item
          src={IMAGES_MAP.instIcons['TSLA/USD']}
          alt="TSLA"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.instIcons['AAPL/USD']} alt="AAPL" />
        <Item
          src={'/home-static/images/usa.svg'}
          alt="USD"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={'/home-static/images/vietnam.svg'} alt="VND" />
        <Item
          src={'/home-static/images/turkey.svg'}
          alt="TRY"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={'/home-static/images/xau.png'} alt="XAU" />
        <Item
          src={'/home-static/images/oil.svg'}
          alt="OIL"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.coinIcons.BTC} alt="BTC" />
        <Item
          src={IMAGES_MAP.coinIcons.ETH}
          alt="ETH"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.coinIcons.BNB} alt="BNB" />
        <Item
          src={IMAGES_MAP.instIcons['TSLA/USD']}
          alt="TSLA"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={IMAGES_MAP.instIcons['AAPL/USD']} alt="AAPL" />
        <Item
          src={'/home-static/images/usa.svg'}
          alt="USD"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={'/home-static/images/vietnam.svg'} alt="VND" />
        <Item
          src={'/home-static/images/turkey.svg'}
          alt="TRY"
          className="-translate-x-1/2"
        />
      </div>
      <div className="flex w-20 shrink-0 grow-0 basis-auto flex-col gap-3">
        <Item src={'/home-static/images/xau.png'} alt="XAU" />
        <Item
          src={'/home-static/images/oil.svg'}
          alt="OIL"
          className="-translate-x-1/2"
        />
      </div>
    </div>
  );
};

export default Card;
