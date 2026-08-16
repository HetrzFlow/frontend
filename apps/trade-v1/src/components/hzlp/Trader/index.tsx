import { FC, memo } from 'react';
import { MEDIA_SIZES, useMediaQuery } from '@repo/ui';
import TraderDesktop from './TraderDesktop';
import TraderMobile from './TraderMobile';

interface TraderProps {
  isConnect: boolean;
  holdingValue: string;
  holdingValueUSD: string;
  isLoading: boolean;
  onBuyClick: () => void;
  onSellClick: () => void;
  children: React.ReactNode;
}

const Trader: FC<TraderProps> = ({
  isConnect,
  holdingValue,
  holdingValueUSD,
  isLoading,
  onBuyClick,
  onSellClick,
  children,
}) => {
  const mediaSz = useMediaQuery();
  const isDesktop = mediaSz === MEDIA_SIZES.LG || mediaSz === MEDIA_SIZES.MD;

  if (isDesktop) {
    return (
      <TraderDesktop
        isConnect={isConnect}
        holdingValue={holdingValue}
        holdingValueUSD={holdingValueUSD}
        isLoading={isLoading}
      >
        {children}
      </TraderDesktop>
    );
  }

  return (
    <TraderMobile onBuyClick={onBuyClick} onSellClick={onSellClick}>
      {children}
    </TraderMobile>
  );
};

export default memo(Trader);
