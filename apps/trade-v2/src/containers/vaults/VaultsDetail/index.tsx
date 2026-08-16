'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLingui } from '@lingui/react/macro';
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
import { HorizontalScrollBox } from '@/common';
import { useHydrated } from '@/common/hooks/useHydrated';
import ActivityPanel, {
  ActivityTabType,
} from '@/containers/pools/PoolsDetail/components/ActivityPanel';
import { DetailPageShell } from '@/containers/pools/PoolsDetail/components/detailShared';
import PoolTrader from '@/containers/pools/PoolTrader';
import RemainingCapacityCard from '@/containers/pools/PoolTrader/RemainingCapacityCard';
import { toValidChecksumAddress } from '@/lib/address';
import {
  useVaultDetail,
  type VaultDetailQueryData,
} from '@/queries/bsc/vaults';
import type { fetchVaultTvlChartData } from '@/services/rest/vaults';
import {
  getTradeKey,
  LiqTradeType,
  usePoolsTradeStore,
} from '@/stores/pools/trade';
import { VaultDetailInfoTab } from './components/DetailInfoTab';
import { StrategyBanner } from './components/StrategyBanner';
import { VaultAboutPerformance } from './components/VaultAboutPerformance';
import { VaultDetailBanner } from './components/VaultDetailBanner';
import VaultStatus from './components/VaultStatus';
import VaultDetailLoadingShell from './Skeleton';

type VaultDetailProps = {
  market_address: string;
  initialVaultDetailData?: VaultDetailQueryData;
  initialTvlChartData?: Awaited<
    ReturnType<typeof fetchVaultTvlChartData>
  >['data'];
};

export const VaultDetail = ({
  market_address,
  initialVaultDetailData,
  initialTvlChartData,
}: VaultDetailProps) => {
  const { t } = useLingui();
  const mediaSz = useMediaQuery();
  const isHydrated = useHydrated();
  const isMobile = isHydrated && mediaSz === MEDIA_SIZES.SM;
  const normalizedVaultAddress = useMemo(
    () => toValidChecksumAddress(market_address),
    [market_address],
  );
  const vaultDetailQuery = useVaultDetail(normalizedVaultAddress ?? '', {
    initialData: initialVaultDetailData,
    showErrorToast: true,
  });
  const vaultDetail = vaultDetailQuery.data?.data;
  const isVaultDetailError = vaultDetailQuery.isError && !vaultDetail;
  const isVaultDetailLoading = vaultDetail === undefined && !isVaultDetailError;
  const [tradeOpen, setTradeOpen] = useState(false);
  const setTradeType = usePoolsTradeStore((state) => state.setTradeType);
  const tradeKey = useMemo(
    () => getTradeKey(normalizedVaultAddress ?? '', 'vault'),
    [normalizedVaultAddress],
  );

  if (!normalizedVaultAddress) {
    return <CommonNotFound />;
  }

  if (!initialVaultDetailData && isVaultDetailLoading) {
    return <VaultDetailLoadingShell />;
  }

  const header = (
    <HorizontalScrollBox scrollWidth="150px" shadowOpacity={0.5}>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/vaults"
          prefetch
          aria-label={t`Back to vaults`}
          className="bg-bg-2 flex size-8 items-center justify-center rounded-full"
        >
          <ArrowLeftShortIcon size={24} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <SkeletonLayout
              isLoading={isVaultDetailLoading || isVaultDetailError}
              className="h-[16.8px] w-15"
            >
              <h2 className="text-sm/tight font-medium">
                {vaultDetail?.vault_name}
              </h2>
            </SkeletonLayout>
          </div>
        </div>
      </div>
    </HorizontalScrollBox>
  );

  const mobileActions = isMobile ? (
    <Dialog open={tradeOpen} onOpenChange={setTradeOpen}>
      <div className="pointer-events-none fixed inset-x-0 -bottom-[20px] z-1 h-[148px] bg-gradient-to-b from-transparent to-black md:hidden" />
      <div className="fixed inset-x-0 bottom-[calc(86px+env(safe-area-inset-bottom))] z-40 mx-auto flex w-full max-w-[480px] gap-2 px-4 md:hidden">
        <DialogTrigger
          className="bg-up text-accent-foreground flex h-[42px] w-1/2 items-center justify-center gap-1 rounded-xl text-sm/tight font-medium"
          onClick={() => setTradeType(LiqTradeType.Deposit, tradeKey)}
        >
          {LiqTradeType.Deposit}
        </DialogTrigger>
        <DialogTrigger
          className="bg-down text-accent-foreground flex h-[42px] w-1/2 items-center justify-center gap-1 rounded-xl text-sm/tight font-medium"
          onClick={() => setTradeType(LiqTradeType.Withdraw, tradeKey)}
        >
          {LiqTradeType.Withdraw}
        </DialogTrigger>
      </div>
      <DialogContent
        closeClassName="hidden"
        className="scrollbar-none max-h-[90dvh] overflow-y-auto"
      >
        <DialogTitle className="hidden">Vault Trader</DialogTitle>
        <DialogDescription className="sr-only">
          Vault trader actions
        </DialogDescription>
        <PoolTrader
          type={ActivityTabType.VAULT}
          variant="dialog"
          showHoldings={false}
          interactionLoading={isVaultDetailLoading || isVaultDetailError}
        />
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <>
      <VaultStatus
        isDisabled={vaultDetail?.is_disabled}
        className="mx-auto mt-[2px] mb-2 w-full max-w-[1080px] px-2 max-md:px-0"
      />
      <DetailPageShell
        header={header}
        mobileHeaderClassName="max-md:pb-4 max-md:pt-0"
        mobileGridClassName="max-md:gap-4"
        mobileLeftClassName="max-md:gap-4"
        left={
          <>
            <VaultDetailBanner
              vaultAddress={normalizedVaultAddress}
              isLoading={isVaultDetailLoading || isVaultDetailError}
            />
            <VaultDetailInfoTab
              vaultAddress={normalizedVaultAddress}
              initialVaultDetailData={initialVaultDetailData}
              initialTvlChartData={initialTvlChartData}
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[260px_minmax(0,1fr)]">
              <StrategyBanner vaultAddress={normalizedVaultAddress} />
              <VaultAboutPerformance vaultAddress={normalizedVaultAddress} />
            </div>
            {isMobile ? (
              <RemainingCapacityCard
                type={ActivityTabType.VAULT}
                directions={[LiqTradeType.Deposit, LiqTradeType.Withdraw]}
              />
            ) : null}
            <div className="flex min-h-0 flex-col">
              <ActivityPanel
                marketAddress={normalizedVaultAddress}
                type={ActivityTabType.VAULT}
                fitContentHeight
                disableMaxHeight
                layout={isMobile ? 'card' : undefined}
                disableAnimation={isMobile}
                disableMobileCard={isMobile}
              />
            </div>
          </>
        }
        right={
          <PoolTrader
            type={ActivityTabType.VAULT}
            interactionLoading={isVaultDetailLoading || isVaultDetailError}
          />
        }
        mobileActions={mobileActions}
      />
    </>
  );
};
