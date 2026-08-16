'use client';

import {
  useCurrentAccountAddress,
  useConnectionStatus,
  useHzSdk,
} from '@/common/chainClient/hooks';
import { useSessionSeasonId } from '@/common/components';
import { useSeasonList, useSeasonPoint } from '@/queries/bsc/points';
import {
  CreditAirdropCard,
  CreditAirdropDisconnectedCard,
  CreditAllocationCard,
  CreditAllocationDisconnectedCard,
  CreditBalanceCard,
  CreditBalanceDisconnectedCard,
  CreditFaq,
  CreditHero,
  CreditMarketPreview,
  CreditRewardsWork,
} from './components';
import { CREDIT_ASSETS } from './constants';
import {
  useCreditAirdrop,
  useCreditAllowanceForFeeClaimVault,
  useCreditBackendBalance,
  useCreditFeeClaimLimits,
  useClaimCreditAirdrop,
  useClaimCreditTokenAirdrop,
  useClaimCreditFeeRebate,
  useCreditMarketConfig,
  useCreditTokenBalance,
} from './hooks';

const getLatestSeasonId = (
  seasons: Array<{
    seasonId: string;
    startAt?: string;
    status?: 'active' | 'upcoming' | 'ended';
  }>,
): string => {
  const [latestSeason] = [...seasons]
    .filter((season) => season.status !== 'upcoming')
    .sort((a, b) => {
      const left = a.startAt ? new Date(a.startAt).getTime() : NaN;
      const right = b.startAt ? new Date(b.startAt).getTime() : NaN;

      if (!Number.isFinite(left) || !Number.isFinite(right)) return 0;
      return right - left;
    });

  return latestSeason?.seasonId ?? '';
};

const isZeroDisplayAmount = (value?: string) =>
  !value || Number(value.replace(/,/g, '')) === 0;

export const CreditPageClient = () => {
  const account = useCurrentAccountAddress();
  const connectionStatus = useConnectionStatus();
  const hzSdk = useHzSdk();
  const seasonListQuery = useSeasonList();
  const seasonOptions =
    seasonListQuery.data?.map((season) => ({
      seasonId: season.seasonId,
      seasonName: season.seasonName,
      status: season.status,
      startAt: season.startAt,
      endAt: season.endAt,
    })) ?? [];
  const defaultSeasonId =
    seasonOptions.find((season) => season.status === 'active')?.seasonId ??
    getLatestSeasonId(seasonOptions);
  const [activeSeasonId, setActiveSeasonId] = useSessionSeasonId(
    defaultSeasonId,
    seasonOptions,
  );
  const airdropQuery = useCreditAirdrop(activeSeasonId);
  const pointQuery = useSeasonPoint(activeSeasonId);
  const activeSeason = seasonOptions.find(
    (season) => season.seasonId === activeSeasonId,
  );
  const balanceQuery = useCreditBackendBalance();
  const allocationStats = balanceQuery.data
    ? {
        totalCreditAllocated: balanceQuery.data.totalCreditAllocated,
        totalHzflAllocated: balanceQuery.data.totalHzflAllocated,
      }
    : undefined;
  const marketConfigQuery = useCreditMarketConfig();
  const creditTokenBalanceQuery = useCreditTokenBalance();
  const creditFeeClaimAllowanceQuery = useCreditAllowanceForFeeClaimVault();
  const creditFeeClaimLimitsQuery = useCreditFeeClaimLimits();
  const claimCreditMutation = useClaimCreditAirdrop();
  const claimTokenMutation = useClaimCreditTokenAirdrop();
  const claimFeeRebateMutation = useClaimCreditFeeRebate();
  const canReadAddressScopedData = !!account && !!hzSdk;
  const isConnectionLoading = connectionStatus === 'unknown';
  const isDisconnected = connectionStatus === 'disconnected';
  const hasNoAirdropData =
    !!account &&
    !!allocationStats &&
    isZeroDisplayAmount(allocationStats.totalCreditAllocated) &&
    isZeroDisplayAmount(allocationStats.totalHzflAllocated);
  const defaultCreditMarket =
    marketConfigQuery.data?.find((market) => market.is_default) ??
    marketConfigQuery.data?.[0];

  return (
    <div className="credit-page relative isolate min-h-[1130px] w-full overflow-visible pt-[10px] pb-[calc(104px+env(safe-area-inset-bottom))] max-md:min-h-0 max-md:px-4 max-md:pt-4">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 z-0 h-[430px] w-screen -translate-x-1/2 overflow-hidden max-md:h-[260px]"
      >
        <div
          className="absolute top-[-5px] right-[calc((100vw_-_1080px)/2_-_59px)] h-[392px] w-[416px] rotate-[7deg] bg-cover bg-center bg-no-repeat opacity-90 blur-[2px] max-md:hidden"
          style={{ backgroundImage: `url("${CREDIT_ASSETS.coinLarge}")` }}
        />
        <div
          className="absolute top-[81px] left-[calc((100vw_-_1080px)/2_+_497px)] size-[142px] rotate-[-18.24deg] bg-cover bg-center bg-no-repeat opacity-90 blur-[1.25px] max-md:hidden"
          style={{ backgroundImage: `url("${CREDIT_ASSETS.coinSmall}")` }}
        />
        <div className="absolute top-[-80px] left-[calc(50%+55.45px)] hidden size-[173.893px] -translate-x-1/2 items-center justify-center max-md:flex">
          <div
            className="size-[159.551px] rotate-[-5.41deg] bg-cover bg-center bg-no-repeat opacity-90 blur-[1.75px]"
            style={{ backgroundImage: `url("${CREDIT_ASSETS.coinLarge}")` }}
          />
        </div>
        <div className="absolute top-[99.76px] right-[4.06px] hidden size-[74.798px] items-center justify-center max-md:flex">
          <div
            className="size-[52.964px] rotate-[-41.97deg] bg-cover bg-center bg-no-repeat blur-[0.944px]"
            style={{ backgroundImage: `url("${CREDIT_ASSETS.coinSmall}")` }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <CreditHero
          seasons={seasonOptions}
          selectedSeasonId={activeSeasonId}
          onSeasonChange={setActiveSeasonId}
          isLoading={seasonListQuery.isLoading}
        />
        <div className="mt-6 max-md:mt-4">
          {isDisconnected ? (
            <CreditAllocationDisconnectedCard />
          ) : (
            <CreditAllocationCard
              stats={allocationStats}
              hasNoData={hasNoAirdropData}
              isLoading={isConnectionLoading || balanceQuery.isLoading}
            />
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 max-md:mt-3 max-md:grid-cols-1">
          {isDisconnected ? (
            <>
              <CreditAirdropDisconnectedCard season={activeSeason} />
              <CreditBalanceDisconnectedCard />
            </>
          ) : (
            <>
              <CreditAirdropCard
                airdrop={airdropQuery.data}
                season={activeSeason}
                pointsAmount={pointQuery.data?.total}
                hasNoData={hasNoAirdropData}
                creditClaimAction={{
                  isClaiming: claimCreditMutation.isPending,
                  onClaim: () => claimCreditMutation.mutate(),
                }}
                tokenClaimAction={{
                  isClaiming: claimTokenMutation.isPending,
                  onClaim: () => claimTokenMutation.mutate(),
                }}
                isLoading={
                  isConnectionLoading ||
                  !account ||
                  seasonListQuery.isLoading ||
                  (!!activeSeasonId && airdropQuery.isLoading)
                }
              />
              <CreditBalanceCard
                balance={balanceQuery.data}
                defaultCreditMarket={defaultCreditMarket}
                creditTokenBalance={creditTokenBalanceQuery.data}
                feeClaimAllowance={creditFeeClaimAllowanceQuery.data}
                totalClaimableCredit={
                  creditFeeClaimLimitsQuery.data?.totalClaimableCredit
                }
                maxClaimableCredit={
                  creditFeeClaimLimitsQuery.data?.maxClaimableCredit
                }
                isClaimingFeeRebate={claimFeeRebateMutation.isPending}
                onClaimFeeRebate={(amount) => {
                  const creditBalance = creditTokenBalanceQuery.data;
                  const allowance = creditFeeClaimAllowanceQuery.data;
                  if (creditBalance === undefined || allowance === undefined) {
                    return;
                  }

                  claimFeeRebateMutation.mutate({
                    amount,
                    creditBalance,
                    allowance,
                  });
                }}
                hasNoData={hasNoAirdropData}
                isLoading={
                  isConnectionLoading ||
                  !canReadAddressScopedData ||
                  balanceQuery.isLoading ||
                  creditFeeClaimLimitsQuery.isLoading
                }
              />
            </>
          )}
        </div>
        <div className="mt-10">
          <CreditMarketPreview
            markets={marketConfigQuery.data}
            isLoading={marketConfigQuery.isLoading}
          />
        </div>
        <div className="mt-10">
          <CreditRewardsWork />
        </div>
        <div className="mt-10">
          <CreditFaq />
        </div>
      </div>
    </div>
  );
};
