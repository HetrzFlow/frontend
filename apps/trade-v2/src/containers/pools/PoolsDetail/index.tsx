'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IMAGES_MAP } from '@repo/common';
import { NotFound as CommonNotFound } from '@repo/common/containers';
import {
  ArrowLeftShortIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  MEDIA_SIZES,
  SkeletonLayout,
  useMediaQuery,
} from '@repo/ui';
import { HorizontalScrollBox, useInstStore } from '@/common';
import { useHydrated } from '@/common/hooks/useHydrated';
import PoolTrader from '@/containers/pools/PoolTrader';
import RemainingCapacityCard from '@/containers/pools/PoolTrader/RemainingCapacityCard';
import { toValidChecksumAddress } from '@/lib/address';
import type { PoolDetailQueryData } from '@/queries/bsc/pools';
import type { fetchPoolChartData } from '@/services/rest/pools';
import {
  getTradeKey,
  LiqTradeType,
  usePoolsTradeStore,
} from '@/stores/pools/trade';
import { usePoolDetailData } from '@/stores/synthetics/marketTokens/selectors';
import ActivityPanel, { ActivityTabType } from './components/ActivityPanel';
import { DetailPageShell } from './components/detailShared';
import { PoolDetailBanner } from './components/PoolDetailBanner';
import { PoolDetailInfoTabs } from './components/PoolDetailInfoTabs';
import {
  PoolCategoryChip,
  PoolHealthAndAbout,
} from './components/PoolHealthAndAbout';
import PoolDetailLoadingShell from './Skeleton';

type PoolDetailProps = {
  market_address: string;
  initialPoolDetailData?: PoolDetailQueryData;
  initialTvlChartData?: Awaited<ReturnType<typeof fetchPoolChartData>>;
};

export const PoolDetail = ({
  market_address,
  initialPoolDetailData,
  initialTvlChartData,
}: PoolDetailProps) => {
  const [tradeOpen, setTradeOpen] = useState(false);
  const mediaSz = useMediaQuery();
  const isHydrated = useHydrated();
  const isMobile = isHydrated && mediaSz === MEDIA_SIZES.SM;
  const normalizedMarketAddress = useMemo(
    () => toValidChecksumAddress(market_address),
    [market_address],
  );

  const setTradeType = usePoolsTradeStore((state) => state.setTradeType);
  const tradeKey = useMemo(
    () => getTradeKey(normalizedMarketAddress ?? '', 'pool'),
    [normalizedMarketAddress],
  );
  const { data: poolDetailData, isError: isPoolDetailError } =
    usePoolDetailData(normalizedMarketAddress, initialPoolDetailData, {
      showErrorToast: true,
    });
  const insts = useInstStore((state) => state.getInsts());
  const market = normalizedMarketAddress
    ? insts[normalizedMarketAddress]
    : undefined;
  const symbol =
    market?.symbol ??
    poolDetailData?.symbol ??
    initialPoolDetailData?.pool?.symbol;
  const name =
    poolDetailData?.displayName ?? initialPoolDetailData?.pool?.display_name;
  const iconSrc = useMemo(() => {
    if (!symbol) return undefined;
    return IMAGES_MAP.instIcons[symbol as keyof typeof IMAGES_MAP.instIcons];
  }, [symbol]);

  const isHeaderLoading = !isHydrated || !name;
  const isPoolDetailLoading = !poolDetailData && !isPoolDetailError;

  if (!normalizedMarketAddress) {
    return <CommonNotFound />;
  }

  if (!initialPoolDetailData && isHeaderLoading && isPoolDetailLoading) {
    return <PoolDetailLoadingShell />;
  }

  const header = (
    <HorizontalScrollBox scrollWidth="150px" shadowOpacity={0.5}>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/pools"
          prefetch
          className="bg-bg-2 flex size-8 items-center justify-center rounded-full"
        >
          <ArrowLeftShortIcon size={24} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <SkeletonLayout
              isLoading={isHeaderLoading}
              className="h-8 w-8 md:h-6 md:w-6"
            >
              {iconSrc ? (
                <Image
                  src={iconSrc}
                  alt={name ?? ''}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full md:h-6 md:w-6"
                />
              ) : (
                <div className="bg-bg-5 flex size-8 items-center justify-center rounded-full text-sm/tight md:size-6">
                  {name?.slice(0, 2)}
                </div>
              )}
            </SkeletonLayout>
            <SkeletonLayout
              isLoading={isHeaderLoading}
              className="h-[16.8px] w-16"
            >
              <h2 className="text-sm/tight font-medium">{name}</h2>
            </SkeletonLayout>
            <PoolCategoryChip category={poolDetailData?.category} />
          </div>
        </div>
      </div>
    </HorizontalScrollBox>
  );

  const mobileActions = isMobile ? (
    <Dialog open={tradeOpen} onOpenChange={setTradeOpen}>
      <div className="pointer-events-none fixed inset-x-0 -bottom-[20px] z-1 h-[148px] bg-gradient-to-b from-transparent to-black md:hidden" />
      <div className="fixed inset-x-0 bottom-[86px] z-40 flex gap-2 px-4 md:hidden">
        <DialogTrigger
          className="bg-up text-accent-foreground flex h-[42px] w-1/2 items-center justify-center gap-1 rounded-xl text-sm font-medium"
          onClick={() => setTradeType(LiqTradeType.Deposit, tradeKey)}
        >
          {LiqTradeType.Deposit}
        </DialogTrigger>
        <DialogTrigger
          className="bg-down text-accent-foreground flex h-[42px] w-1/2 items-center justify-center gap-1 rounded-xl text-sm font-medium"
          onClick={() => setTradeType(LiqTradeType.Withdraw, tradeKey)}
        >
          {LiqTradeType.Withdraw}
        </DialogTrigger>
      </div>
      <DialogContent
        closeClassName="hidden"
        className="scrollbar-none max-h-[90dvh] overflow-y-auto"
      >
        <DialogTitle className="hidden">Pool Trader</DialogTitle>
        <DialogDescription className="sr-only">
          Pool trader actions
        </DialogDescription>
        <PoolTrader
          type={ActivityTabType.POOL}
          variant="dialog"
          showHoldings={false}
          interactionLoading={isPoolDetailLoading || isPoolDetailError}
        />
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <DetailPageShell
      header={header}
      mobileHeaderClassName="max-md:pb-4 max-md:pt-0"
      mobileGridClassName="max-md:gap-4"
      mobileLeftClassName="max-md:gap-4"
      left={
        <>
          <PoolDetailBanner
            data={poolDetailData}
            marketAddress={normalizedMarketAddress}
            initialData={initialPoolDetailData}
          />
          <PoolDetailInfoTabs
            marketAddress={normalizedMarketAddress}
            constrained={false}
            initialPoolDetailData={initialPoolDetailData}
            initialTvlChartData={initialTvlChartData}
          />
          <PoolHealthAndAbout marketAddress={normalizedMarketAddress} />
          {isMobile ? (
            <RemainingCapacityCard
              type={ActivityTabType.POOL}
              directions={[LiqTradeType.Deposit, LiqTradeType.Withdraw]}
            />
          ) : null}
          <div className="flex min-h-0 flex-col">
            <ActivityPanel
              marketAddress={normalizedMarketAddress}
              type={ActivityTabType.POOL}
              disableMaxHeight
              fitContentHeight
              layout={isMobile ? 'card' : undefined}
              disableAnimation={isMobile}
              disableMobileCard={isMobile}
            />
          </div>
        </>
      }
      right={
        <PoolTrader
          type={ActivityTabType.POOL}
          interactionLoading={isPoolDetailLoading || isPoolDetailError}
        />
      }
      mobileActions={mobileActions}
    />
  );
};
