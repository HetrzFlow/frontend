'use client';

import { FC, useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

import { useLingui } from '@lingui/react/macro';
import { EVENT_NAMES } from '@repo/lib/ws';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';

import TradingRouteShell from '@/common/components/TradingRouteShell';
import { useHydrated } from '@/common/hooks/useHydrated';
import { usePrices } from '@/common/services';
import NewListingAnnouncementHost from '@/containers/trade/newListingAnnouncement/NewListingAnnouncementHost';
import { TradeLayoutLoading } from '@/layouts/trade/LoadingShell';
import { addWsListener } from '@/services/ws';

const LayoutLg = dynamic(
  () => import('@/layouts/trade/lg').then((mod) => mod.default),
  {
    loading: () => <TradeLayoutLoading />,
  },
);
const LayoutSm = dynamic(
  () => import('@/layouts/trade/sm').then((mod) => mod.default),
  {
    loading: () => <TradeLayoutLoading />,
  },
);

const Main: FC = () => {
  const { t } = useLingui();
  const mediaSz = useMediaQuery();
  const isHydrated = useHydrated();
  const [canMountTradeUi, setCanMountTradeUi] = useState(false);

  // fetch prices
  const { refetch } = usePrices();

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setCanMountTradeUi(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!canMountTradeUi) return undefined;

    return addWsListener(EVENT_NAMES.ERROR, () => {
      refetch();
    });
  }, [canMountTradeUi, refetch]);

  return (
    <TradingRouteShell
      className="hiddenIn404 mt-0 h-[calc(100dvh-96px)] rounded-[20px] text-xs max-md:h-[calc(100dvh-56px)] md:mx-1 md:mb-2"
      scrollMode="none"
    >
      <h1 className="sr-only">{t`Trade Perpetuals on HertzFlow`}</h1>
      {canMountTradeUi ? <NewListingAnnouncementHost /> : null}
      {!canMountTradeUi ? (
        <TradeLayoutLoading />
      ) : (
        <>
          {([
            MEDIA_SIZES.MD,
            MEDIA_SIZES.LG,
            MEDIA_SIZES.XL,
            MEDIA_SIZES['2XL'],
            MEDIA_SIZES['3XL'],
          ].includes(mediaSz) ||
            !isHydrated) && <LayoutLg />}
          {mediaSz === MEDIA_SIZES.SM && isHydrated && <LayoutSm />}
        </>
      )}
    </TradingRouteShell>
  );
};

export default Main;
