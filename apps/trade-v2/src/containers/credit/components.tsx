'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CREDIT_TOKEN_DECIMALS } from '@hertzflow/sdk-v2';
import { useLingui } from '@lingui/react/macro';
import { formatUnits, parseUnits } from 'viem';
import { CoinIcon } from '@repo/common/components';
import { useNavItems } from '@repo/common/hooks';
import { truncateFormat, unitFormat } from '@repo/lib/format';
import {
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  MEDIA_SIZES,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useMediaQuery,
  InfoCircleIcon,
} from '@repo/ui';
import { useCurrentAccountAddress } from '@/common/chainClient';
import { SeasonSelector } from '@/common/components';
import ConnectBtn from '@/common/components/ConnectBtn';
import { ZERO_STR } from '@/common/constants';
import { useReferralCodes } from '@/common/hooks';
import { useHydrated } from '@/common/hooks/useHydrated';
import type { Inst } from '@/common/services/rest/inst';
import { useMarketMaxLeverages } from '@/hooks/useMarketsStats';
import { buildTradeRouteInstId } from '@/lib/credit/creditMarkets';
import { useTradeGlobalStore } from '@/stores/trade/global';
import {
  getCreditClaimState,
  type ClaimActionState,
  type ClaimButtonLabel,
} from './claimState';
import { CREDIT_ASSETS } from './constants';
import {
  CreditAirdropCardSkeleton,
  CreditAllocationSkeleton,
  CreditBalanceCardSkeleton,
  CreditFaqSkeleton,
  CreditSkeletonBlock,
  CreditMarketPreviewSkeleton,
} from './CreditLoadingShell';
import { useCreditFeeClaimPreview } from './hooks';
import type {
  CreditAirdrop,
  CreditAirdropShareReferralStats,
  CreditBalance,
  CreditSeason,
} from './types';

const CREDIT_CREATE_REFERRAL_CODE_SEARCH =
  'tab=affiliates&createReferralCode=1';

const CreditAirdropShareDialog = dynamic(
  () => import('./CreditAirdropShareDialog'),
  { ssr: false },
);

interface CreditHeroProps {
  seasons: CreditSeason[];
  selectedSeasonId: string;
  onSeasonChange: (seasonId: string) => void;
  isLoading?: boolean;
}

export const CreditHero = ({
  seasons,
  selectedSeasonId,
  onSeasonChange,
  isLoading,
}: CreditHeroProps) => {
  const { t } = useLingui();

  return (
    <section className="flex w-[397px] flex-col justify-center gap-[7px] max-md:w-full max-md:gap-3">
      <div className="flex w-full flex-col gap-[7px]">
        <div className="flex h-[38px] items-center gap-2">
          <h2 className="text-[32px] leading-normal font-medium tracking-[-1.28px] text-white">
            {t`Airdrop`}
          </h2>
          {isLoading ? (
            <CreditSkeletonBlock className="h-8 w-[141px] rounded-xl max-md:hidden" />
          ) : (
            <SeasonSelector
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
              onSeasonChange={onSeasonChange}
              triggerClassName="max-md:hidden"
              contentAlign="start"
              ariaLabel={t`Select airdrop season`}
            />
          )}
        </div>
        <p className="text-sm leading-normal tracking-[-0.56px] text-white/70">
          {t`Claim your Credit allocation and use it for trading margin or fee rebates.`}
        </p>
        <a
          href="https://hertzflow.gitbook.io/hertzflow-docs/rewards/credit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent/80 w-fit text-left text-sm leading-normal font-medium tracking-[-0.56px] transition-colors"
        >
          {t`View airdrop rules`}
        </a>
      </div>
      {isLoading ? (
        <CreditSkeletonBlock className="hidden h-8 w-[141px] rounded-xl max-md:block" />
      ) : (
        <SeasonSelector
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          onSeasonChange={onSeasonChange}
          triggerClassName="hidden max-md:flex"
          contentAlign="start"
          ariaLabel={t`Select airdrop season`}
        />
      )}
    </section>
  );
};

interface CreditAllocationCardProps {
  stats?: {
    totalCreditAllocated: string;
    totalHzflAllocated: string;
  };
  hasNoData?: boolean;
  isLoading?: boolean;
}

export const CreditAllocationCard = ({
  stats,
  hasNoData,
  isLoading,
}: CreditAllocationCardProps) => {
  const { t } = useLingui();

  if (isLoading || !stats) return <CreditAllocationSkeleton />;
  const creditValue = hasNoData ? '-' : stats.totalCreditAllocated;
  const hzflValue = hasNoData ? '-' : stats.totalHzflAllocated;

  return (
    <section className="relative h-[214px] rounded-xl border border-[rgba(191,207,255,0.1)] bg-white/[0.01] p-6 backdrop-blur-[40px] max-md:flex max-md:h-auto max-md:min-h-[267px] max-md:flex-col max-md:items-center max-md:gap-3 max-md:px-3 max-md:py-6">
      <h3 className="text-center text-2xl leading-normal font-medium text-white max-md:text-base max-md:leading-[normal] max-md:tracking-[-0.64px]">
        {t`Total Airdrop Allocation`}
      </h3>
      <div className="mt-6 flex h-[72px] items-center max-md:mt-0 max-md:h-auto max-md:w-full max-md:flex-col max-md:gap-4">
        <AllocationMetric
          label={t`Credit`}
          value={creditValue}
          muted={hasNoData}
        />
        <div className="h-[72px] w-px bg-white/10 max-md:h-px max-md:w-full" />
        <AllocationMetric label="$HZFL" value={hzflValue} muted={hasNoData} />
      </div>
      <p className="mt-6 text-center text-sm leading-normal tracking-[-0.56px] text-white/70 max-md:mt-0 max-md:leading-[normal]">
        {hasNoData
          ? t`No airdrop allocation found for this wallet`
          : t`Use Credit as margin in the Credit Market, and offset trading fees across all markets.`}
      </p>
    </section>
  );
};

export const CreditAllocationDisconnectedCard = () => {
  const { t } = useLingui();

  return (
    <section className="relative flex h-[214px] flex-col items-center gap-6 rounded-xl border border-[rgba(191,207,255,0.1)] bg-white/[0.01] p-6 backdrop-blur-[40px] max-md:h-auto max-md:min-h-[267px] max-md:gap-3 max-md:px-3 max-md:py-6">
      <h3 className="w-full text-center text-2xl leading-normal font-medium tracking-[-0.96px] text-white max-md:text-base max-md:leading-[normal] max-md:tracking-[-0.64px]">
        {t`Total Airdrop Allocation`}
      </h3>
      <div className="flex h-[72px] w-full items-center max-md:h-auto max-md:flex-col max-md:gap-4">
        <AllocationMetric label={t`Credit`} value="-" muted />
        <div className="h-[72px] w-px bg-white/10 max-md:h-px max-md:w-full" />
        <AllocationMetric label="$HZFL" value="-" muted />
      </div>
      <p className="w-full text-center text-sm leading-normal tracking-[-0.56px] text-white/70 max-md:leading-[normal]">
        {t`Connect your wallet to view your airdrop allocation`}
      </p>
    </section>
  );
};

const AllocationMetric = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex flex-1 justify-center max-md:w-full max-md:flex-none">
    <div className="flex w-[184px] flex-col gap-0.5 text-center">
      <span className="text-t-270 text-xs leading-normal max-md:leading-[normal]">
        {label}
      </span>
      <span
        className={cn(
          'text-[46px] leading-normal font-medium tracking-[-1.84px] max-md:text-[32px] max-md:leading-[normal] max-md:tracking-[-1.28px]',
          muted ? 'text-t-430' : 'text-t-1100',
        )}
      >
        {value}
      </span>
    </div>
  </div>
);

interface CreditAirdropCardProps {
  airdrop?: CreditAirdrop;
  season?: CreditSeason;
  pointsAmount?: string;
  creditClaimAction?: CreditClaimAction;
  tokenClaimAction?: CreditClaimAction;
  hasNoData?: boolean;
  isLoading?: boolean;
}

interface CreditClaimAction extends ClaimActionState {
  onClaim?: () => void;
}

const normalizeCreditShareMetric = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return ZERO_STR;
  return value === '--' ? ZERO_STR : value;
};

const formatCreditShareMetric = (value: string | number) =>
  unitFormat(value, 2, {
    stripTrailingZeros: true,
    showMinDecimalValue: true,
  });

const formatCreditShareMetricOneDecimal = (value: string | number) =>
  unitFormat(value, 1, {
    stripTrailingZeros: true,
    showMinDecimalValue: true,
  });

const formatCreditClaimDate = (value: string) => {
  const date = new Date(value);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = date.getUTCMinutes();

  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${hours}:${String(minutes).padStart(2, '0')}`;
};

export const CreditAirdropCard = ({
  airdrop,
  season,
  pointsAmount,
  creditClaimAction,
  tokenClaimAction,
  hasNoData,
  isLoading,
}: CreditAirdropCardProps) => {
  const { t } = useLingui();
  const account = useCurrentAccountAddress();
  const router = useRouter();
  const { referral } = useNavItems();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { items: referralCodes, isLoading: isReferralCodesLoading } =
    useReferralCodes();

  if (isLoading) return <CreditAirdropCardSkeleton />;
  if (hasNoData && !airdrop) return <CreditAirdropEmptyCard season={season} />;
  if (!airdrop) return <CreditAirdropCardSkeleton />;

  const hzflAmount = airdrop.hzflClaimed ? ZERO_STR : airdrop.hzflAmount;
  const claimState = getCreditClaimState({
    windowStatus: airdrop.windowStatus,
    creditClaimed: airdrop.creditClaimed,
    hzflClaimed: airdrop.hzflClaimed,
    hzflEnabled: airdrop.hzflEnabled,
    hasCreditAmount: airdrop.hasCreditAmount,
    hasHzflAmount: airdrop.hasHzflAmount,
    creditAction: creditClaimAction,
    tokenAction: tokenClaimAction,
  });
  const claimEndedLabel = t`Claim period has ended`;
  const claimedLabel = t`All claimed`;
  const claimingLabel = t`Claiming...`;
  const getClaimButtonLabel = (
    label: ClaimButtonLabel,
    defaultLabel: string,
  ) =>
    label === 'claiming'
      ? claimingLabel
      : label === 'claimed'
        ? claimedLabel
        : defaultLabel;
  const creditClaimLabel = getClaimButtonLabel(
    claimState.credit.label,
    t`Claim Credit`,
  );
  const hzflClaimLabel = getClaimButtonLabel(
    claimState.token.label,
    t`Claim Token`,
  );
  const claimPeriodStart = formatCreditClaimDate(airdrop.windowOpenAt);
  const claimPeriodEnd = formatCreditClaimDate(airdrop.windowCloseAt);
  const claimPeriodText = claimState.periodEnded
    ? t`Claim period (UTC): Expired`
    : t`Claim Period (UTC): ${claimPeriodStart} - ${claimPeriodEnd}`;
  const referralCodeItem = referralCodes[0] ?? null;
  const referralCode = referralCodeItem?.referral_code ?? null;
  const formattedCreditEarnedAmount = formatCreditShareMetricOneDecimal(
    normalizeCreditShareMetric(
      airdrop.creditEarnedAmount ?? airdrop.creditAmount,
    ),
  );
  const formattedPointsAmount = formatCreditShareMetricOneDecimal(
    normalizeCreditShareMetric(pointsAmount),
  );
  const shareAirdrop: CreditAirdrop = {
    ...airdrop,
    creditEarnedAmount: formattedCreditEarnedAmount,
    pointsAmount: formattedPointsAmount,
  };
  const referralStats: CreditAirdropShareReferralStats = {
    referredUsers: referralCodeItem
      ? formatCreditShareMetric(
          normalizeCreditShareMetric(referralCodeItem.referred_count),
        )
      : ZERO_STR,
    referredVolume: referralCodeItem
      ? formatCreditShareMetric(
          normalizeCreditShareMetric(referralCodeItem.volume_usd),
        )
      : ZERO_STR,
  };
  const handleOpenShareDialog = () => {
    if (!account || isReferralCodesLoading) return;
    if (!referralCode) {
      router.push(`${referral.link}?${CREDIT_CREATE_REFERRAL_CODE_SEARCH}`);
      return;
    }

    setShareDialogOpen(true);
  };

  return (
    <>
      <section className="bg-bg-1 flex h-[323px] flex-col justify-between rounded-2xl border border-white/10 p-3 max-md:hidden">
        <div className="flex w-full flex-col gap-3">
          <div className="flex h-[17px] items-center justify-between">
            <h3 className="text-sm leading-normal font-medium text-white">
              {t`Airdrop`}
            </h3>
            {account ? (
              <button
                type="button"
                aria-label={t`Share airdrop`}
                onClick={handleOpenShareDialog}
                className="text-accent hover:text-accent/80 flex size-4 items-center justify-center transition-colors"
              >
                <AirdropShareIcon />
              </button>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-3">
            <ClaimAmountMetric label={t`Credit`} value={airdrop.creditAmount} />
            <div className="h-px w-full bg-white/10" />
            <ClaimAmountMetric label="$HZFL" value={hzflAmount} />
            <div className="h-px w-full bg-white/10" />
          </div>
        </div>
        <div className="flex flex-col gap-4 pb-2">
          {claimState.periodEnded ? (
            <CreditButton disabled>{claimEndedLabel}</CreditButton>
          ) : (
            <div className="grid h-8 grid-cols-2 gap-2">
              <CreditButton
                disabled={claimState.credit.disabled}
                onClick={creditClaimAction?.onClaim}
              >
                {creditClaimLabel}
              </CreditButton>
              <CreditButton
                disabled={claimState.token.disabled}
                onClick={tokenClaimAction?.onClaim}
              >
                {hzflClaimLabel}
              </CreditButton>
            </div>
          )}
          <p
            className={cn(
              'text-center text-xs leading-normal',
              claimState.periodEnded ? 'text-destructive' : 'text-accent',
            )}
          >
            {claimPeriodText}
          </p>
        </div>
      </section>
      <section className="bg-bg-1 hidden flex-col gap-3 rounded-2xl border border-white/10 p-3 max-md:flex">
        <div className="flex w-full flex-col gap-3">
          <div className="flex h-[17px] items-center justify-between">
            <h3 className="text-sm leading-[normal] font-medium tracking-[-0.56px] text-white">
              {t`Airdrop`}
            </h3>
            {account ? (
              <button
                type="button"
                aria-label={t`Share airdrop`}
                onClick={handleOpenShareDialog}
                className="text-accent hover:text-accent/80 flex size-4 items-center justify-center transition-colors"
              >
                <AirdropShareIcon />
              </button>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-3">
            <MobileClaimAmount
              label={t`Credit`}
              value={airdrop.creditAmount}
              buttonLabel={
                claimState.periodEnded ? undefined : creditClaimLabel
              }
              disabled={claimState.credit.disabled}
              onClick={creditClaimAction?.onClaim}
            />
            <MobileClaimAmount
              label="$HZFL"
              value={hzflAmount}
              buttonLabel={claimState.periodEnded ? undefined : hzflClaimLabel}
              disabled={claimState.token.disabled}
              onClick={tokenClaimAction?.onClaim}
            />
            {claimState.periodEnded ? (
              <CreditButton disabled>{claimEndedLabel}</CreditButton>
            ) : null}
          </div>
        </div>
        <p
          className={cn(
            'text-center text-xs leading-[normal]',
            claimState.periodEnded ? 'text-destructive' : 'text-accent',
          )}
        >
          {claimPeriodText}
        </p>
      </section>
      {shareDialogOpen ? (
        <CreditAirdropShareDialog
          airdrop={shareAirdrop}
          referralCode={referralCode}
          referralStats={referralStats}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      ) : null}
    </>
  );
};

export const CreditAirdropDisconnectedCard = ({
  season,
}: {
  season?: CreditSeason;
}) => {
  const { t } = useLingui();
  const claimPeriodStart = season?.startAt
    ? formatCreditClaimDate(season.startAt)
    : '';
  const claimPeriodEnd = season?.endAt
    ? formatCreditClaimDate(season.endAt)
    : '';
  const claimPeriodText =
    claimPeriodStart && claimPeriodEnd
      ? t`Claim Period (UTC): ${claimPeriodStart} - ${claimPeriodEnd}`
      : `${t`Claim Period (UTC)`}: -`;

  return (
    <>
      <section className="bg-bg-1 flex h-[243px] flex-col justify-between rounded-2xl border border-white/10 p-3 max-md:hidden">
        <div className="flex w-full flex-col gap-3">
          <div className="flex h-[17px] items-center justify-between">
            <h3 className="text-sm leading-normal font-medium tracking-[-0.56px] text-white">
              {t`Airdrop`}
            </h3>
          </div>
          <div className="flex w-full flex-col gap-3">
            <ClaimAmountMetric label={t`Credit`} value="-" muted />
            <div className="h-px w-full bg-white/10" />
            <ClaimAmountMetric label="$HZFL" value="-" muted />
          </div>
        </div>
        <div className="flex flex-col gap-4 pb-2">
          <ConnectBtn className="h-8 w-full rounded-xl px-2.5 py-0 text-xs leading-none font-medium" />
          <p className="text-accent text-center text-xs leading-normal tracking-[-0.52px]">
            {claimPeriodText}
          </p>
        </div>
      </section>
      <section className="bg-bg-1 hidden flex-col gap-3 rounded-2xl border border-white/10 p-3 max-md:flex">
        <div className="flex w-full flex-col gap-3">
          <div className="flex h-[17px] items-center justify-between">
            <h3 className="text-sm leading-[normal] font-medium tracking-[-0.56px] text-white">
              {t`Airdrop`}
            </h3>
          </div>
          <div className="flex w-full flex-col gap-3">
            <MobileClaimAmount label={t`Credit`} value="-" muted />
            <MobileClaimAmount label="$HZFL" value="-" muted />
          </div>
        </div>
        <ConnectBtn className="h-8 w-full rounded-xl px-2.5 py-0 text-xs leading-none font-medium" />
        <p className="text-accent text-center text-xs leading-[normal]">
          {claimPeriodText}
        </p>
      </section>
    </>
  );
};

const MobileClaimAmount = ({
  label,
  value,
  buttonLabel,
  disabled,
  muted,
  buttonVariant,
  onClick,
}: {
  label: string;
  value: string;
  buttonLabel?: string;
  disabled?: boolean;
  muted?: boolean;
  buttonVariant?: 'default' | 'no-rewards';
  onClick?: () => void;
}) => (
  <div className="flex w-full flex-col gap-3">
    <div className="flex w-full flex-col gap-1">
      <span className="text-t-270 text-xs leading-[normal]">{label}</span>
      <span
        className={cn(
          'text-2xl leading-[normal] font-medium',
          muted ? 'text-t-430' : 'text-t-1100',
        )}
      >
        {value}
      </span>
    </div>
    {buttonLabel ? (
      buttonVariant === 'no-rewards' ? (
        <CreditNoRewardsButton>{buttonLabel}</CreditNoRewardsButton>
      ) : (
        <CreditButton disabled={disabled} onClick={onClick}>
          {buttonLabel}
        </CreditButton>
      )
    ) : null}
  </div>
);

const ClaimAmountMetric = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex h-[38px] w-full items-start justify-between">
    <span className="text-t-270 text-xs leading-normal">{label}</span>
    <span
      className={cn(
        'text-[32px] leading-normal font-medium',
        muted ? 'text-t-430' : 'text-t-1100',
      )}
    >
      {value}
    </span>
  </div>
);

const CreditAirdropEmptyCard = ({ season }: { season?: CreditSeason }) => {
  const { t } = useLingui();
  const account = useCurrentAccountAddress();
  const router = useRouter();
  const { referral } = useNavItems();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { items: referralCodes, isLoading: isReferralCodesLoading } =
    useReferralCodes();
  const referralCode = referralCodes[0]?.referral_code;
  const shareAirdrop: CreditAirdrop = {
    seasonId: '',
    seasonName: '',
    creditAmount: ZERO_STR,
    pointsAmount: ZERO_STR,
    hzflAmount: ZERO_STR,
    hasCreditAmount: false,
    hasHzflAmount: false,
    windowOpenAt: '',
    windowCloseAt: '',
    windowStatus: 'closed',
    creditClaimed: true,
    hzflClaimed: true,
    hzflEnabled: false,
  };
  const referralStats: CreditAirdropShareReferralStats = {
    referredUsers: referralCodes[0]
      ? formatCreditShareMetric(
          normalizeCreditShareMetric(referralCodes[0].referred_count),
        )
      : ZERO_STR,
    referredVolume: referralCodes[0]
      ? formatCreditShareMetric(
          normalizeCreditShareMetric(referralCodes[0].volume_usd),
        )
      : ZERO_STR,
  };
  const claimPeriodStart = season?.startAt
    ? formatCreditClaimDate(season.startAt)
    : '';
  const claimPeriodEnd = season?.endAt
    ? formatCreditClaimDate(season.endAt)
    : '';
  const claimPeriodText =
    claimPeriodStart && claimPeriodEnd
      ? t`Claim Period (UTC): ${claimPeriodStart} - ${claimPeriodEnd}`
      : `${t`Claim Period (UTC)`}: -`;

  const handleOpenShareDialog = () => {
    if (!account || isReferralCodesLoading) return;
    if (!referralCode) {
      router.push(`${referral.link}?${CREDIT_CREATE_REFERRAL_CODE_SEARCH}`);
      return;
    }

    setShareDialogOpen(true);
  };

  const shareButton = account ? (
    <button
      type="button"
      aria-label={t`Share airdrop`}
      onClick={handleOpenShareDialog}
      className="text-accent hover:text-accent/80 flex size-4 items-center justify-center transition-colors"
    >
      <AirdropShareIcon />
    </button>
  ) : (
    <span
      className="flex size-4 items-center justify-center text-white/30"
      aria-hidden
    >
      <AirdropShareIcon />
    </span>
  );

  return (
    <>
      <section className="bg-bg-1 flex h-[243px] flex-col justify-between rounded-2xl border border-white/10 p-3 max-md:hidden">
        <div className="flex w-full flex-col gap-3">
          <div className="flex h-[17px] items-center justify-between">
            <h3 className="text-sm leading-normal font-medium tracking-[-0.56px] text-white">
              {t`Airdrop`}
            </h3>
            {shareButton}
          </div>
          <div className="flex w-full flex-col gap-3">
            <ClaimAmountMetric label={t`Credit`} value="-" muted />
            <div className="h-px w-full bg-white/10" />
            <ClaimAmountMetric label="$HZFL" value="-" muted />
          </div>
        </div>
        <div className="flex flex-col gap-4 pb-2">
          <CreditNoRewardsButton className="w-full">
            {t`No Rewards`}
          </CreditNoRewardsButton>
          <p className="text-accent text-center text-xs leading-normal">
            {claimPeriodText}
          </p>
        </div>
      </section>
      <section className="bg-bg-1 hidden flex-col gap-3 rounded-2xl border border-white/10 p-3 max-md:flex">
        <div className="flex w-full flex-col gap-3">
          <div className="flex h-[17px] items-center justify-between">
            <h3 className="text-t-1100 text-sm leading-[normal] font-medium">
              {t`Airdrop`}
            </h3>
            {shareButton}
          </div>
          <div className="flex w-full flex-col gap-3">
            <MobileClaimAmount label="Credit" value="-" muted />
            <MobileClaimAmount label="$HZFL" value="-" muted />
          </div>
        </div>
        <CreditNoRewardsButton>{t`No Rewards`}</CreditNoRewardsButton>
        <p className="text-accent text-center text-xs leading-[normal]">
          {claimPeriodText}
        </p>
      </section>
      {shareDialogOpen ? (
        <CreditAirdropShareDialog
          airdrop={shareAirdrop}
          referralCode={referralCode ?? null}
          referralStats={referralStats}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      ) : null}
    </>
  );
};

interface CreditBalanceCardProps {
  balance?: CreditBalance;
  defaultCreditMarket?: Inst;
  creditTokenBalance?: bigint;
  feeClaimAllowance?: bigint;
  totalClaimableCredit?: bigint;
  maxClaimableCredit?: bigint;
  isClaimingFeeRebate?: boolean;
  onClaimFeeRebate?: (amount: string) => void;
  hasNoData?: boolean;
  isLoading?: boolean;
}

export const CreditBalanceCard = ({
  balance,
  defaultCreditMarket,
  creditTokenBalance,
  feeClaimAllowance,
  totalClaimableCredit,
  maxClaimableCredit,
  isClaimingFeeRebate,
  onClaimFeeRebate,
  hasNoData,
  isLoading,
}: CreditBalanceCardProps) => {
  const { t } = useLingui();
  const { trade } = useNavItems();
  const setInst = useTradeGlobalStore((state) => state.setInst);
  const [feeRebateAmount, setFeeRebateAmount] = useState('');
  const maxFeeRebateAmount =
    maxClaimableCredit === undefined
      ? '0'
      : formatUnits(maxClaimableCredit, CREDIT_TOKEN_DECIMALS);
  const totalClaimableAmount =
    totalClaimableCredit === undefined
      ? '0'
      : formatUnits(totalClaimableCredit, CREDIT_TOKEN_DECIMALS);
  const feeRebateAmountUnits = toCreditAmountUnits(feeRebateAmount);
  const maxFeeRebateAmountUnits = toCreditAmountUnits(maxFeeRebateAmount);
  const feeClaimPreviewQuery = useCreditFeeClaimPreview(feeRebateAmountUnits);
  const defaultCreditTradeHref = defaultCreditMarket
    ? `${trade.link}/${buildTradeRouteInstId(defaultCreditMarket.name, true)}`
    : '';

  useEffect(() => {
    if (maxClaimableCredit === undefined) return;

    setFeeRebateAmount(maxFeeRebateAmount);
  }, [maxClaimableCredit, maxFeeRebateAmount]);

  if (isLoading || !balance) return <CreditBalanceCardSkeleton />;
  if (hasNoData) return <CreditBalanceNoDataCard />;

  const handleFeeRebateAmountChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    if (value === '') {
      setFeeRebateAmount('');
      return;
    }

    const nextValue = normalizeCreditAmountInput(value);
    if (
      nextValue !== null &&
      !isCreditAmountGreaterThan(nextValue, maxFeeRebateAmount)
    ) {
      setFeeRebateAmount(nextValue);
    }
  };
  const previewText = feeClaimPreviewQuery.data
    ?.map(
      (item) =>
        `${formatUnits(item.tokenAmount, item.decimals)} ${item.payoutSymbol}`,
    )
    .join(' + ');
  const claimFeeRebateLabel = isClaimingFeeRebate
    ? t`Claiming...`
    : feeRebateAmountUnits > 0n
      ? t`Claim ${feeRebateAmount} USDT`
      : t`Claim`;
  const canClaimFeeRebate =
    feeRebateAmountUnits > 0n &&
    feeRebateAmountUnits <= maxFeeRebateAmountUnits &&
    creditTokenBalance !== undefined &&
    creditTokenBalance >= feeRebateAmountUnits &&
    feeClaimAllowance !== undefined &&
    maxClaimableCredit !== undefined &&
    feeClaimPreviewQuery.isSuccess &&
    !isClaimingFeeRebate;

  return (
    <section className="bg-bg-1 flex min-h-[323px] flex-col gap-3 rounded-2xl border border-white/10 p-3">
      <div className="flex h-[17px] items-center gap-1">
        <h3 className="text-sm leading-normal font-medium text-white max-md:leading-[normal] max-md:tracking-[-0.56px]">
          {t`Credit Balance`}
        </h3>
        <CreditBalanceInfo />
      </div>
      <div className="flex h-[38px] items-start justify-between">
        <span className="text-t-270 text-xs leading-normal max-md:leading-[normal]">
          {t`Current Balance`}
        </span>
        <span className="text-t-1100 text-[32px] leading-normal font-medium max-md:leading-[normal] max-md:tracking-[-1.28px]">
          {balance.currentBalance}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <CreditBalanceLine label={t`Consumed`} value={balance.consumedCredit} />
        <CreditBalanceLine
          label={t`Realized Profits`}
          value={balance.realizedProfits}
        />
        <CreditBalanceLine
          label={t`Realized Fee Rebate`}
          value={balance.realizedFeeRebate}
        />
      </div>
      <div className="h-px w-full bg-white/10" />
      <div className="flex flex-col gap-2">
        <div className="flex min-h-[15px] flex-wrap items-start justify-between gap-1 text-xs leading-normal max-md:leading-[normal] max-md:tracking-[-0.52px]">
          <CreditAccumulatedFeeRebateInfo />
          <span className="text-white/70">{t`Claimable: ${totalClaimableAmount} USDT`}</span>
          <span className="text-accent">{t`Max: ${maxFeeRebateAmount} USDT`}</span>
        </div>
        <div className="bg-bg-2 focus-within:border-input text-t-1100 flex h-8 items-center justify-between rounded-xl border border-transparent px-2.5 py-0 text-xs font-medium transition-colors max-md:leading-[normal] max-md:tracking-[-0.52px]">
          <input
            aria-label={t`Fee rebate claim amount`}
            inputMode="decimal"
            value={feeRebateAmount}
            placeholder="0"
            onChange={handleFeeRebateAmountChange}
            className="text-t-1100 min-w-0 flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-white/30"
          />
          <span className="flex items-center gap-2">
            <span>USDT</span>
            <button
              type="button"
              className="text-accent hover:text-accent/80 transition-colors"
              onClick={() => setFeeRebateAmount(maxFeeRebateAmount)}
            >
              {t`MAX`}
            </button>
          </span>
        </div>
        {feeRebateAmountUnits > 0n ? (
          <div className="min-h-4 truncate text-xs text-white/70">
            {feeClaimPreviewQuery.isLoading
              ? t`Calculating payout...`
              : previewText
                ? t`Receive: ${previewText}`
                : t`Payout is currently unavailable`}
          </div>
        ) : null}
        <CreditButton
          disabled={!canClaimFeeRebate}
          onClick={() => onClaimFeeRebate?.(feeRebateAmount)}
        >
          {claimFeeRebateLabel}
        </CreditButton>
        {defaultCreditTradeHref ? (
          <Link
            href={defaultCreditTradeHref}
            onClick={() => {
              if (defaultCreditMarket) setInst(defaultCreditMarket);
            }}
            className="bg-bg-2 hover:bg-bg-3 flex h-8 w-full items-center justify-center rounded-xl px-2.5 py-0 text-xs leading-none font-medium text-white transition-colors"
          >
            {t`Trade with Credit`}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="bg-bg-2 flex h-8 w-full cursor-not-allowed items-center justify-center rounded-xl px-2.5 py-0 text-xs leading-none font-medium text-white/30"
          >
            {t`Trade with Credit`}
          </button>
        )}
      </div>
    </section>
  );
};

const CreditBalanceNoDataCard = () => {
  const { t } = useLingui();

  return (
    <section className="bg-bg-1 flex h-[243px] flex-col gap-3 rounded-2xl border border-white/10 p-3 max-md:h-auto max-md:min-h-[203px]">
      <div className="flex h-[17px] items-center gap-1">
        <h3 className="text-sm leading-normal font-medium tracking-[-0.56px] text-white max-md:leading-[normal]">
          {t`Credit Balance`}
        </h3>
        <CreditBalanceInfo />
      </div>
      <div className="flex h-[38px] items-start justify-between">
        <span className="text-t-270 text-xs leading-normal">
          {t`Current Balance`}
        </span>
        <span className="text-t-430 text-[32px] leading-normal font-medium">
          -
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <CreditBalanceLine label={t`Consumed`} value="- Credit" />
        <CreditBalanceLine label={t`Realized Profits`} value="- USDT" />
        <CreditBalanceLine label={t`Realized Fee Rebate`} value="- USDT" />
        <CreditNoRewardsButton>{t`No Balance`}</CreditNoRewardsButton>
      </div>
    </section>
  );
};

export const CreditBalanceDisconnectedCard = () => {
  const { t } = useLingui();

  return (
    <section className="bg-bg-1 flex h-[243px] flex-col gap-3 rounded-2xl border border-white/10 p-3 max-md:h-auto max-md:min-h-[203px]">
      <div className="flex h-[17px] items-center gap-1">
        <h3 className="text-sm leading-normal font-medium tracking-[-0.56px] text-white max-md:leading-[normal]">
          {t`Credit Balance`}
        </h3>
        <CreditBalanceInfo />
      </div>
      <div className="flex h-[38px] items-start justify-between">
        <span className="text-t-270 text-xs leading-normal">
          {t`Current Balance`}
        </span>
        <span className="text-t-430 text-[32px] leading-normal font-medium">
          -
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <CreditBalanceLine label={t`Consumed`} value={t`- Credit`} />
        <CreditBalanceLine label={t`Realized Profits`} value="- USDT" />
        <CreditBalanceLine label={t`Realized Fee Rebate`} value="- USDT" />
        <ConnectBtn className="mt-1 h-8 w-full rounded-xl px-2.5 py-0 text-xs leading-none font-medium" />
      </div>
    </section>
  );
};

const normalizeCreditAmount = (value: string) =>
  value.replace(/,/g, '').match(/\d+(?:\.\d+)?/)?.[0] ?? '0';

const normalizeCreditAmountInput = (value: string) => {
  if (!/^\d*(?:\.\d{0,18})?$/.test(value)) return null;

  const [integerPart = '', fractionPart] = value.split('.');
  const hasDecimalPoint = value.includes('.');
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';

  return hasDecimalPoint
    ? `${normalizedInteger}.${(fractionPart ?? '').slice(0, 2)}`
    : normalizedInteger;
};

const toCreditAmountUnits = (value: string) =>
  parseUnits(normalizeCreditAmount(value), CREDIT_TOKEN_DECIMALS);

const isCreditAmountGreaterThan = (left: string, right: string) =>
  toCreditAmountUnits(left) > toCreditAmountUnits(right);

const CreditBalanceTips = ({ showTitle = true }: { showTitle?: boolean }) => {
  const { t } = useLingui();
  const notes = [
    t`Credit cannot be withdrawn or transferred.`,
    t`Profits from Credit Market positions are automatically swapped to USDT.`,
    t`The Credit Market has a limited availability window.`,
  ];

  return (
    <div className="flex flex-col items-start justify-center gap-2">
      {showTitle ? (
        <p className="text-t-1100 text-xs leading-normal font-medium">
          {t`Important Notes`}
        </p>
      ) : null}
      <ul className="text-t-270 list-disc pl-[18px] text-xs">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
};

const CreditBalanceInfo = () => {
  const { t } = useLingui();
  const mediaSize = useMediaQuery();
  const isHydrated = useHydrated();
  const isMobile = isHydrated && mediaSize === MEDIA_SIZES.SM;
  const trigger = (
    <InfoCircleIcon
      size={14}
      className="text-t-350 hover:text-t-1100 cursor-pointer"
    />
  );

  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger>{trigger}</DialogTrigger>
        <DialogContent position="bottom" className="max-w-90 p-3">
          <DialogTitle>{t`Important Notes`}</DialogTitle>
          <DialogDescription className="sr-only">
            {t`Important Notes`}
          </DialogDescription>
          <div className="pb-4">
            <CreditBalanceTips showTitle={false} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>{trigger}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        arrowClassName="bg-bg-3 fill-bg-3"
        className="bg-bg-3 flex w-[320px] max-w-90 flex-col gap-2 rounded-2xl p-3 text-xs shadow-none"
      >
        <CreditBalanceTips />
      </TooltipContent>
    </Tooltip>
  );
};

const CreditAccumulatedFeeRebateInfo = () => {
  const { t } = useLingui();
  const mediaSize = useMediaQuery();
  const isHydrated = useHydrated();
  const isMobile = isHydrated && mediaSize === MEDIA_SIZES.SM;
  const accumulatedFeeRebateTip = t`Credit available to claim from your trading activity, displayed in USDT at 1:1 rate.`;
  const trigger = (
    <button
      type="button"
      className="cursor-pointer text-left text-white/70 underline decoration-dotted underline-offset-2"
    >
      {t`Accumulated Fee Rebate`}
    </button>
  );

  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent position="bottom" className="max-w-90 p-3">
          <DialogTitle>{t`Accumulated Fee Rebate`}</DialogTitle>
          <DialogDescription className="sr-only">
            {accumulatedFeeRebateTip}
          </DialogDescription>
          <p className="text-t-270 pb-4 text-xs">{accumulatedFeeRebateTip}</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={0}
        arrowClassName="bg-[color:var(--bg-3)] fill-[color:var(--bg-3)]"
        className="bg-bg-3 w-[260px] max-w-90 rounded-2xl p-3 text-xs text-white/70 shadow-none"
      >
        {accumulatedFeeRebateTip}
      </TooltipContent>
    </Tooltip>
  );
};

const CreditBalanceLine = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex h-[15px] items-start justify-between text-xs leading-normal max-md:leading-[normal]">
    <span className="text-t-270">{label}</span>
    <span className="text-t-1100">{value}</span>
  </div>
);

const CreditButton = ({
  children,
  className,
  disabled,
  onClick,
}: {
  children: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'bg-accent text-accent-foreground hover:bg-accent/90 flex h-8 items-center justify-center rounded-xl px-2.5 py-0 text-xs leading-none font-medium transition-colors',
      disabled && 'bg-bg-2 text-t-430 hover:bg-bg-2 cursor-not-allowed',
      className,
    )}
  >
    {children}
  </button>
);

const CreditNoRewardsButton = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => (
  <button
    type="button"
    disabled
    className={cn(
      'bg-bg-2 flex h-8 cursor-not-allowed items-center justify-center rounded-xl p-2.5 text-xs leading-normal font-medium tracking-[-0.52px] text-white/30',
      className,
    )}
  >
    {children}
  </button>
);

interface CreditMarketPreviewProps {
  markets?: Inst[];
  isLoading?: boolean;
}

export const CreditMarketPreview = ({
  markets: sourceMarkets,
  isLoading,
}: CreditMarketPreviewProps) => {
  const { t } = useLingui();
  const { trade } = useNavItems();
  const markets = useMemo(
    () => sourceMarkets?.slice(0, 9) ?? [],
    [sourceMarkets],
  );
  const maxLeverages = useMarketMaxLeverages(markets);

  if (isLoading || !sourceMarkets) return <CreditMarketPreviewSkeleton />;
  if (
    markets.some(
      (market) => maxLeverages[market.marketTokenAddress] === undefined,
    )
  )
    return <CreditMarketPreviewSkeleton />;

  const isSingleMarket = markets.length === 1;

  return (
    <section className="flex min-h-[173px] w-full flex-col items-center justify-center gap-6 overflow-visible max-md:min-h-[122px] max-md:gap-4">
      <h3 className="w-full text-center text-2xl leading-normal font-medium text-white max-md:tracking-[-0.96px]">
        {t`Trade with Credit. Earn in USDT`}
      </h3>
      <div className="flex max-h-[190px] w-full flex-wrap items-center justify-center gap-2 overflow-hidden max-md:hidden">
        {markets.map((market) => (
          <CreditMarketPill
            key={market.marketTokenAddress}
            market={market}
            maxLeverage={maxLeverages[market.marketTokenAddress]!}
            tradeBaseHref={trade.link}
          />
        ))}
      </div>
      <div className="relative left-1/2 hidden w-screen -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] max-md:block">
        {isSingleMarket ? (
          <div
            className="animate-credit-market-single-scroll flex w-max hover:[animation-play-state:paused]"
            style={{
              ['--credit-market-single-duration' as string]: '18s',
            }}
          >
            <CreditMarketPill
              market={markets[0]!}
              maxLeverage={maxLeverages[markets[0]!.marketTokenAddress]!}
              tradeBaseHref={trade.link}
            />
          </div>
        ) : (
          <div
            className="animate-marquee flex w-max hover:[animation-play-state:paused]"
            style={{
              ['--marquee-duration' as string]: '30s',
            }}
          >
            <div className="flex shrink-0 items-center gap-2 pr-2">
              {markets.map((market) => (
                <CreditMarketPill
                  key={`first-${market.marketTokenAddress}`}
                  market={market}
                  maxLeverage={maxLeverages[market.marketTokenAddress]!}
                  tradeBaseHref={trade.link}
                />
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2 pr-2" aria-hidden>
              {markets.map((market) => (
                <CreditMarketPill
                  key={`second-${market.marketTokenAddress}`}
                  market={market}
                  maxLeverage={maxLeverages[market.marketTokenAddress]!}
                  tradeBaseHref={trade.link}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const CreditMarketPill = ({
  market,
  maxLeverage,
  tradeBaseHref,
}: {
  market: Inst;
  maxLeverage: number;
  tradeBaseHref: string;
}) => {
  const setInst = useTradeGlobalStore((state) => state.setInst);

  return (
    <Link
      href={`${tradeBaseHref}/${buildTradeRouteInstId(market.name, true)}`}
      onClick={() => setInst(market)}
      className="hover:bg-bg-2 flex h-[58px] shrink-0 items-center gap-3 rounded-full border border-[rgba(191,207,255,0.1)] py-2 pr-10 pl-3 transition-colors"
    >
      <CoinIcon
        aria-hidden
        src={market.icon}
        className="shrink-0 rounded-full"
        size={40}
      />
      <div className="flex shrink-0 flex-col items-start gap-1 leading-normal">
        <span className="text-t-1100 text-sm font-medium whitespace-nowrap">
          {market.name}
        </span>
        <span className="text-accent text-xs whitespace-nowrap">
          {`${truncateFormat(maxLeverage, 2, { stripTrailingZeros: true })}X`}
        </span>
      </div>
    </Link>
  );
};

export const CreditRewardsWork = () => {
  const { t } = useLingui();
  const rewardSteps = [
    {
      title: t`Earn Rewards Through Activity`,
      description: t`Accumulate Points through trading, providing liquidity, and referrals. Each season, rewards are distributed as both $HZFL (platform token) and Credit (platform margin token).`,
    },
    {
      title: t`Get Credit from Trading Fees`,
      description: t`Trading fees generate Credit, which can be used as margin in the Credit Market to trade and earn profit in USDT.`,
    },
    {
      title: t`Use Credit for Fee Rebates`,
      description: t`Offset trading fees across all markets using your Credit balance.`,
    },
  ];

  return (
    <section className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full flex-col items-start gap-1">
        <h3 className="w-full text-2xl leading-normal font-medium tracking-[-0.96px] text-white">
          {t`How Rewards Work`}
        </h3>
        <p className="w-full text-sm leading-normal tracking-[-0.56px] text-white/70">
          {t`Earn two types of rewards: Points convert to $HZFL tokens, while trading fees generate Credit for margin trading and fee rebates.`}
        </p>
      </div>
      <div className="relative flex w-full flex-col items-start gap-4">
        <div
          aria-hidden
          className="absolute top-5 bottom-5 left-5 w-px bg-[rgba(255,255,255,0.2)]"
        />
        {rewardSteps.map((step, index) => (
          <div
            key={step.title}
            className="relative flex w-full items-center gap-3"
          >
            <span className="bg-accent relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full p-2.5 text-center text-xs leading-normal font-medium text-black">
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1 leading-normal">
              <span className="text-t-1100 w-full text-sm font-medium">
                {step.title}
              </span>
              <span className="text-t-270 w-full text-xs">
                {step.description}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const CreditFaq = ({ isLoading }: { isLoading?: boolean }) => {
  const { t } = useLingui();
  const faqItems = [
    {
      question: t`When is the deadline for claiming?`,
      answer: t`Each season has a fixed claim window. Unclaimed Credit and $HZFL after the deadline are permanently destroyed. Your existing Credit balance is not affected.`,
    },
    {
      question: t`What can I do with Credit?`,
      answer: t`Two uses: offset trading fees across all markets (1 Credit = $1 USDT, rebated after position close); or use as margin in the Credit Market to open positions and earn profits in USDT.`,
    },
    {
      question: t`What exactly is Credit?`,
      answer: t`Credit is trading capital issued by HertzFlow based on your seasonal trading fee contribution. It cannot be withdrawn or transferred.`,
    },
  ];
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  if (isLoading) return <CreditFaqSkeleton />;

  return (
    <section
      id="credit-faq"
      className="flex w-full flex-col items-center gap-6 max-md:gap-3"
    >
      <h3 className="w-full text-center text-2xl font-medium text-white">
        {t`FAQ`}
      </h3>
      <div className="flex w-full flex-col gap-2">
        {faqItems.map((item, index) => {
          const expanded = item.question === openQuestion;
          const itemId = `credit-faq-${index}`;

          return (
            <article
              key={item.question}
              className={cn(
                'rounded-xl p-4 transition-colors duration-300',
                expanded ? 'bg-bg-3' : 'bg-bg-2',
              )}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={itemId}
                onClick={() =>
                  setOpenQuestion((current) =>
                    current === item.question ? null : item.question,
                  )
                }
                className="flex h-5 w-full items-center gap-6 text-left"
              >
                <h4 className="min-w-0 flex-1 text-sm font-medium text-white">
                  {item.question}
                </h4>
                <FaqIcon expanded={expanded} />
              </button>
              <div
                id={itemId}
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  expanded
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <p className="text-t-350 mt-1 text-xs">{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

const FaqIcon = ({ expanded }: { expanded?: boolean }) => (
  <span className="relative size-5 shrink-0" aria-hidden>
    <span
      aria-hidden
      className={cn(
        'absolute top-1/2 left-1/2 h-2.5 w-[1.6667px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        expanded ? 'scale-y-0' : 'scale-y-100',
      )}
      style={{ backgroundImage: `url("${CREDIT_ASSETS.faqLine}")` }}
    />
    <span
      aria-hidden
      className="absolute top-1/2 left-1/2 h-2.5 w-[1.6667px] -translate-x-1/2 -translate-y-1/2 rotate-90 bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${CREDIT_ASSETS.faqLine}")` }}
    />
  </span>
);

const AirdropShareIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M11.3333 6.66666C12.4378 6.66666 13.3333 5.77123 13.3333 4.66666C13.3333 3.56209 12.4378 2.66666 11.3333 2.66666C10.2287 2.66666 9.33325 3.56209 9.33325 4.66666C9.33325 5.77123 10.2287 6.66666 11.3333 6.66666Z"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeMiterlimit="10"
    />
    <path
      d="M11.3333 13.3333C12.4378 13.3333 13.3333 12.4379 13.3333 11.3333C13.3333 10.2288 12.4378 9.33334 11.3333 9.33334C10.2287 9.33334 9.33325 10.2288 9.33325 11.3333C9.33325 12.4379 10.2287 13.3333 11.3333 13.3333Z"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeMiterlimit="10"
    />
    <path
      d="M4.66675 10C5.77132 10 6.66675 9.10457 6.66675 8C6.66675 6.89543 5.77132 6 4.66675 6C3.56218 6 2.66675 6.89543 2.66675 8C2.66675 9.10457 3.56218 10 4.66675 10Z"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeMiterlimit="10"
    />
    <path
      d="M6.66675 7.33333L9.33341 6"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeMiterlimit="10"
    />
    <path
      d="M9.33341 10.6667L6.66675 8.66666"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeMiterlimit="10"
    />
  </svg>
);
