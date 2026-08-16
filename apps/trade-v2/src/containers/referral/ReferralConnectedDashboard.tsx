'use client';

import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Trans, useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';
import {
  Button,
  CopyOutlineIcon,
  Dialog,
  DialogContent,
  DialogTitle,
  EditIcon,
  InfoCircleIcon,
  LoaderCircleIcon,
  PlusIcon,
  SettingsIcon,
  ShareNetworkIcon,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  XIcon,
  cn,
  toast,
} from '@repo/ui';
import TradeTabs from '@/common/components/TradeTabs';
import { CONTRACT_USD_MULTIPLIER } from '@/common/constants';
import {
  useReferralCodes,
  useReferralProfile,
  useReferralTierRules,
  type ReferralCodeItem,
} from '@/common/hooks';
import { useClaimAffiliateRewards } from '@/hooks/useReferralMutations';
import type {
  ReferralTierRule,
  ReferralTierRules,
} from '@/services/rest/referralTierRules';
import {
  useOverviewYourDepositsUsd,
  useVaultsOverviewYourDepositsUsd,
} from '@/stores/synthetics/marketsData/selectors';
import ReferralBackground from './ReferralBackground';
import ReferralLearnMore from './ReferralLearnMore';
import { ReferralLoadingContent } from './ReferralLoadingShell';
import {
  getExclusiveTierCode,
  getVisibleExclusiveTierRows,
  type ExclusiveTierCode,
  type ExclusiveTierRow,
} from './referralTierVisibility';
import BindReferralCard from './TraderDiscountTab/BindReferralCard';

const EditCodeDialog = dynamic(
  () => import('./TraderDiscountTab/EditCodeDialog'),
  { ssr: false },
);

const CreateCodeDialog = dynamic(
  () => import('./AffiliatesTab/CreateCodeDialog'),
  { ssr: false },
);

const ReferralShareDialog = dynamic(
  () => import('./AffiliatesTab/ReferralShareDialog'),
  { ssr: false },
);

const SquadNetworkMap = dynamic<{ showTitle?: boolean }>(
  () => import('./SquadNetworkMap'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-2xl" />,
  },
);

const DISCORD_URL = 'https://discord.com/invite/sBQqf2H7ts';
const LIQUIDITY_REFRESH_INTERVAL = 60_000;
const MOBILE_CODE_TABLE_COLUMNS =
  'minmax(0,1.35fr) minmax(0,0.78fr) minmax(0,0.82fr) minmax(0,0.88fr)';
const MOBILE_TIER_LABEL_CLASS =
  'text-[13px]/[1.2] tracking-[-0.52px] text-white/70';
const MOBILE_TIER_VALUE_CLASS =
  'text-right text-[13px]/[1.2] tracking-[-0.52px] text-white';
const TIER_CONNECTOR_CLASS =
  'h-px min-w-0 flex-1 [-webkit-mask-image:repeating-linear-gradient(to_right,#000_0_2px,transparent_2px_4px)] [mask-image:repeating-linear-gradient(to_right,#000_0_2px,transparent_2px_4px)]';
const MY_TIER_ICON_CLASS =
  "size-3.5 shrink-0 bg-[url('/trade-static/referral/my-tier.svg')] bg-contain bg-center bg-no-repeat";

const getTierIconUrl = (tierId: number, active: boolean) => {
  if (tierId === 1) return '/trade-static/referral/t1-active.svg';
  if (tierId === 2) {
    return `/trade-static/referral/t2-${active ? 'active' : 'unactivite'}.svg`;
  }
  return `/trade-static/referral/t3-${active ? 'active' : 'unactive'}.svg`;
};

const getPublicTierLabel = (tier: ReferralTierRule, index: number) =>
  tier.tier_id > 0 && tier.tier_id < 1000
    ? `T${tier.tier_id}`
    : tier.tier_name || `T${index + 1}`;

const SPECIAL_TIER_CONFIG: Record<
  number,
  { asset: string; label: string; liquidityTargetUsd?: number }
> = {
  1001: {
    asset: '/trade-static/referral/alpha.svg',
    label: 'Alpha',
    liquidityTargetUsd: 30_000_000,
  },
  1002: {
    asset: '/trade-static/referral/og.svg',
    label: 'OG',
  },
  1003: {
    asset: '/trade-static/referral/sigma.svg',
    label: 'Sigma',
    liquidityTargetUsd: 50_000_000,
  },
};

interface ReferralConnectedDashboardProps {
  initialTierRules?: ReferralTierRules | null;
  initialBindCode?: string;
  autoChangeCode?: string;
  editInitialCode?: string;
  focusBindInputOnMount?: boolean;
  openCreateCodeDialogOnMount?: boolean;
  isBound?: boolean;
  isLoading?: boolean;
  onAutoChangeDialogClose?: (code: string) => void;
}

type BottomTab = 'tier' | 'code' | 'squad';

const formatUsd = (value: string | number | undefined) =>
  unitFormat(value ?? '0', 2, {
    style: 'currency',
    currency: 'USD',
    showMinDecimalValue: true,
    stripTrailingZeros: true,
  });

const formatRawUsd = (value: bigint | undefined) =>
  value === undefined
    ? undefined
    : calc(value.toString()).div(CONTRACT_USD_MULTIPLIER).toFixed();

const formatPercent = (bps: number | undefined) => {
  const value = (bps ?? 0) / 100;
  return `${Number.isInteger(value) ? value : value.toFixed(2)}%`;
};

const toNumber = (value: string | number | undefined) =>
  Number(value ?? 0) || 0;

const progressWidth = (
  value: string | number | undefined,
  target?: string | number,
) => {
  const targetNumber = toNumber(target);
  if (targetNumber <= 0) return 0;
  return Math.min(100, (toNumber(value) / targetNumber) * 100);
};

const getPublicTierRules = (rules?: ReferralTierRules | null) => {
  const tiers = rules?.tiers?.filter((tier) => tier.tier_id < 1000) ?? [];
  return tiers.length > 0
    ? tiers
    : [
        {
          tier_id: 1,
          tier_name: 'T1',
          min_active_referred_traders: 0,
          min_rolling_30d_referred_volume_usd: '0',
          l1_rebate_bps: 1000,
          l2_rebate_bps: 500,
          trader_discount_bps: 500,
          is_default: true,
        },
        {
          tier_id: 2,
          tier_name: 'T2',
          min_active_referred_traders: 15,
          min_rolling_30d_referred_volume_usd: '10000000',
          l1_rebate_bps: 2000,
          l2_rebate_bps: 1000,
          trader_discount_bps: 500,
          is_default: false,
        },
        {
          tier_id: 3,
          tier_name: 'T3',
          min_active_referred_traders: 40,
          min_rolling_30d_referred_volume_usd: '80000000',
          l1_rebate_bps: 3000,
          l2_rebate_bps: 1500,
          trader_discount_bps: 500,
          is_default: false,
        },
      ];
};

const getTierDisplayLabel = (currentTierId?: number) => {
  if (!currentTierId) return undefined;

  return SPECIAL_TIER_CONFIG[currentTierId]?.label ?? `Tier ${currentTierId}`;
};

const PageIntro = () => (
  <div className="relative z-10 mb-5 w-full max-w-[397px] max-md:max-w-none">
    <h3 className="text-[32px] font-medium tracking-[-1.28px] max-md:text-2xl max-md:tracking-[-0.96px]">
      <Trans>Referral</Trans>
    </h3>
    <p className="mt-[7px] text-sm/normal tracking-[-0.56px] text-white/70">
      <Trans>
        Refer frens and save on fees. A slice of commission for each.
      </Trans>
    </p>
    <div className="mt-[7px]">
      <ReferralLearnMore />
    </div>
  </div>
);

const Card: FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-[20px]',
      className,
    )}
  >
    {children}
  </div>
);

const Badge: FC<{
  children: ReactNode;
  tooltip?: ReactNode;
  tooltipTitle?: string;
}> = ({ children, tooltip, tooltipTitle }) => {
  const { t } = useLingui();
  const title = tooltipTitle ?? t`Details`;
  const badgeClassName =
    'inline-flex h-5 items-center rounded bg-[#00DFEB]/15 px-2.5 text-xs font-medium tracking-[-0.48px] text-[#00DFEB] transition-colors';

  if (!tooltip) {
    return <span className={badgeClassName}>{children}</span>;
  }

  const trigger = (
    <button
      type="button"
      className={cn(badgeClassName, 'cursor-pointer hover:bg-[#00DFEB]/25')}
    >
      {children}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={0}
        className="flex max-w-90 flex-col gap-2 rounded-2xl p-3 text-xs"
      >
        <span className="sr-only">{title}</span>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

const Metric: FC<{
  label: string;
  value: ReactNode;
  align?: 'left' | 'center';
}> = ({ label, value, align = 'left' }) => (
  <div
    className={cn(
      'min-w-0 flex-1 space-y-1',
      align === 'center' && 'text-center',
    )}
  >
    <p className="text-[13px]/[15px] tracking-[-0.52px] text-white/70">
      {label}
    </p>
    <div className="min-w-0 text-2xl/[29px] font-medium tracking-[-0.96px] text-white">
      {value}
    </div>
  </div>
);

const Divider = () => (
  <div className="h-px w-full shrink-0 bg-white/10 md:h-12 md:w-px" />
);

const BindReferralDialog: FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string;
  focusOnMount?: boolean;
}> = ({ open, onOpenChange, initialCode, focusOnMount }) => {
  const { t } = useLingui();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        position="center"
        closeClassName="hidden"
        overlayClassName="z-[60] bg-black/60 backdrop-blur-[8px]"
        className="bg-bg-3 z-[60] w-[calc(100%-32px)] max-w-[440px] gap-0 rounded-2xl border-0 p-3 md:w-[440px] md:max-w-[440px]"
        aria-describedby={undefined}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-medium tracking-[-0.64px]">
              <Trans>Enter Referral Code</Trans>
            </DialogTitle>
            <p className="mt-1 text-xs text-white/70">
              <Trans>
                Enter a valid referral code to activate your fee discount. Your
                referrer earns commission on every trade you make.
              </Trans>
            </p>
          </div>
          <button
            type="button"
            className="flex size-6 shrink-0 items-center justify-center text-white/50 hover:text-white"
            aria-label={t`Close`}
            onClick={() => onOpenChange(false)}
          >
            <XIcon size={16} />
          </button>
        </div>
        <BindReferralCard
          initialCode={initialCode}
          focusOnMount={focusOnMount}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

const AsRefereeCard: FC<{
  discountLabel: string;
  feesSaved: string;
  codeApplied: string;
  hasBoundReferrer: boolean;
  onEdit: () => void;
}> = ({ discountLabel, feesSaved, codeApplied, hasBoundReferrer, onEdit }) => {
  const { t } = useLingui();

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <h4 className="text-xl/normal font-medium tracking-[-0.8px]">
          <Trans>As Referee</Trans>
        </h4>
        {hasBoundReferrer ? (
          <Badge
            tooltip={t`Your ${discountLabel} fee discount is active — it applies to every open and close fee.`}
            tooltipTitle={t`Fee Discount`}
          >
            {discountLabel}
          </Badge>
        ) : null}
      </div>
      <div className="mt-4 flex items-center max-md:flex-col max-md:items-stretch max-md:gap-4">
        <Metric
          label={t`Fees Saved on Discount`}
          value={feesSaved}
          align="center"
        />
        <Divider />
        <Metric
          label={t`Code Applied`}
          align="center"
          value={
            <span className="inline-flex min-w-0 items-center justify-center gap-1">
              <span className="truncate">
                {hasBoundReferrer ? codeApplied : '-'}
              </span>
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/50 transition-colors hover:text-white"
                aria-label={
                  hasBoundReferrer
                    ? t`Edit referral code`
                    : t`Enter referral code`
                }
                onClick={onEdit}
              >
                <EditIcon size={16} />
              </button>
            </span>
          }
        />
      </div>
    </Card>
  );
};

const AsReferrerCard: FC<{
  tierLabel?: string;
  tierTooltip?: string;
  earned: string;
  claimable: string;
  canClaim: boolean;
  isClaiming: boolean;
  mainCode?: ReferralCodeItem;
  onClaim: () => void;
  onCopy: () => void;
  onManage: () => void;
  onShare: () => void;
  onCreate: () => void;
}> = ({
  tierLabel,
  tierTooltip,
  earned,
  claimable,
  canClaim,
  isClaiming,
  mainCode,
  onClaim,
  onCopy,
  onManage,
  onShare,
  onCreate,
}) => {
  const { t } = useLingui();
  const claimLabel = t`Claim`;

  return (
    <Card className="min-h-[291px] p-4 max-md:min-h-[312px]">
      <div className="absolute -right-32 -bottom-18 h-[289px] w-[484px] bg-[url('/trade-static/referral/referralCardBg.png')] bg-cover bg-top bg-no-repeat mix-blend-plus-lighter" />
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <h4 className="text-xl/normal font-medium tracking-[-0.8px]">
            <Trans>As Referrer</Trans>
          </h4>
          {tierLabel ? (
            <Badge tooltip={tierTooltip} tooltipTitle={tierLabel}>
              {tierLabel}
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-4 max-md:flex-col max-md:items-stretch">
          <Metric label={t`Total Rebates`} value={earned} />
          <Divider />
          <Metric
            label={t`Claimable Rebates`}
            value={
              <span className="flex min-w-0 items-center gap-1 max-md:flex-col max-md:items-start max-md:gap-1">
                <span className="min-w-0 flex-1 truncate">{claimable}</span>
                <Button
                  disabled={!canClaim || isClaiming}
                  onClick={onClaim}
                  className="h-6 shrink-0 rounded-lg bg-[#00DFEB]/15 px-6 text-[13px] font-medium tracking-[-0.52px] text-[#00DFEB] hover:bg-[#00DFEB]/20 disabled:bg-white/10 disabled:text-white/30 max-md:w-[81px] max-md:px-0"
                >
                  {isClaiming ? (
                    <span className="relative flex items-center justify-center">
                      <span className="invisible">{claimLabel}</span>
                      <LoaderCircleIcon
                        size={14}
                        className="absolute animate-spin"
                      />
                    </span>
                  ) : (
                    claimLabel
                  )}
                </Button>
              </span>
            }
          />
        </div>

        <div className="my-4 h-px bg-white/10" />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px]/normal tracking-[-0.52px] text-white/70">
              <Trans>Your Referral Code</Trans>
            </p>
            <div className="mt-2 flex min-w-0 items-center gap-2">
              {mainCode ? (
                <>
                  <p className="truncate text-2xl/[1.2] font-medium tracking-[-0.96px]">
                    {mainCode.referral_code}
                  </p>
                  <button
                    type="button"
                    className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:text-[#00DFEB]"
                    aria-label={t`Copy referral link`}
                    onClick={onCopy}
                  >
                    <CopyOutlineIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:text-[#00DFEB]"
                    aria-label={t`Manage referral codes`}
                    onClick={onManage}
                  >
                    <SettingsIcon size={16} />
                  </button>
                </>
              ) : (
                <p className="truncate text-2xl/[1.2] font-medium tracking-[-0.96px]">
                  -
                </p>
              )}
            </div>
          </div>
          {mainCode ? (
            <Button
              onClick={onShare}
              className="h-6 shrink-0 gap-1 rounded-lg bg-[#00DFEB]/15 px-6 text-[13px] font-medium tracking-[-0.52px] text-[#00DFEB] hover:bg-[#00DFEB]/20"
            >
              <ShareNetworkIcon size={16} />
              <Trans>Share</Trans>
            </Button>
          ) : (
            <Button
              onClick={onCreate}
              className="h-6 shrink-0 gap-1 rounded-lg bg-[#00DFEB]/15 px-3 py-2 text-[13px]/normal font-medium tracking-[-0.52px] text-[#00DFEB] hover:bg-[#00DFEB]/20"
            >
              <PlusIcon size={14} />
              <Trans>Create Code</Trans>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const TierIcon: FC<{ tierId: number; active: boolean }> = ({
  tierId,
  active,
}) => (
  <Image
    aria-hidden
    alt=""
    src={getTierIconUrl(tierId, active)}
    width={48}
    height={48}
    className="size-12 shrink-0"
  />
);

const TierStepper: FC<{
  tiers: ReferralTierRule[];
  currentTierId?: number;
}> = ({ tiers, currentTierId }) => {
  const currentIndex = currentTierId
    ? tiers.findIndex((tier) => tier.tier_id === currentTierId)
    : -1;

  return (
    <div className="flex h-[74px] w-full items-center justify-between px-6 py-1">
      {tiers.map((tier, index) => {
        const fromActive = index <= currentIndex;
        const toActive = index + 1 <= currentIndex;

        return (
          <div key={tier.tier_id} className="contents">
            <TierIcon tierId={tier.tier_id} active={fromActive} />
            {index < tiers.length - 1 ? (
              <div
                className={cn(
                  TIER_CONNECTOR_CLASS,
                  fromActive && toActive
                    ? 'bg-[#00DFEB]'
                    : fromActive || toActive
                      ? 'bg-[linear-gradient(90deg,rgba(0,223,235,0.6)_0%,rgba(191,207,255,0.1)_100%)]'
                      : 'bg-[rgba(191,207,255,0.1)]',
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const ProgressRow: FC<{
  label: ReactNode;
  value: string | number;
  target?: string | number;
  formatter?: (value: string | number | undefined) => string;
}> = ({ label, value, target, formatter = String }) => {
  const hasTarget = target !== undefined && toNumber(target) > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-base/[1.2] font-medium">{label}</span>
        <span className="shrink-0 text-xs text-white/70">
          <span className="text-white">{formatter(value)}</span>
          {hasTarget ? ` / ${formatter(target)}` : null}
        </span>
      </div>
      {hasTarget ? (
        <div className="h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-[#00DFEB]"
            style={{ width: `${progressWidth(value, target)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
};

const SpecialTierLiquidity: FC<{
  targetUsd: string | number;
  positionUsd?: string;
}> = ({ targetUsd, positionUsd }) => {
  const poolLiquidityUsd = useOverviewYourDepositsUsd({
    refetchInterval: LIQUIDITY_REFRESH_INTERVAL,
  });
  const vaultLiquidityUsd = useVaultsOverviewYourDepositsUsd(undefined, {
    refetchInterval: LIQUIDITY_REFRESH_INTERVAL,
  });
  const liquidityUsd =
    poolLiquidityUsd === undefined && vaultLiquidityUsd === undefined
      ? undefined
      : (poolLiquidityUsd ?? 0n) + (vaultLiquidityUsd ?? 0n);
  const liquidityUsdDisplay =
    positionUsd !== undefined && positionUsd !== ''
      ? positionUsd
      : formatRawUsd(liquidityUsd);
  const liquidityProgress = liquidityUsdDisplay
    ? progressWidth(liquidityUsdDisplay, targetUsd)
    : 0;

  return (
    <div className="flex w-full max-w-[348px] flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base/[1.2] font-medium tracking-[-0.64px] text-white">
          <Trans>Liquidity</Trans>
        </p>
        <p className="text-xs/[1.2] tracking-[-0.48px]">
          <span className="text-white">
            {liquidityUsdDisplay ? formatUsd(liquidityUsdDisplay) : '-'}
          </span>
          <span className="text-white/70">/{formatUsd(targetUsd)}</span>
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[999px] bg-white/10">
        <div
          className="h-full rounded-[999px] bg-[#00DFEB]"
          style={{ width: `${liquidityProgress}%` }}
        />
      </div>
    </div>
  );
};

const SpecialTierCard: FC<{
  config: (typeof SPECIAL_TIER_CONFIG)[number];
  lpPositionUsd?: string;
  lpThresholdUsd?: string;
}> = ({ config, lpPositionUsd, lpThresholdUsd }) => {
  const targetUsd = lpThresholdUsd || config.liquidityTargetUsd;
  const hasLiquidity = targetUsd !== undefined && toNumber(targetUsd) > 0;

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center gap-1 pt-5">
          <span
            aria-hidden
            className="size-[120px] bg-contain bg-bottom bg-no-repeat"
            style={{ backgroundImage: `url(${config.asset})` }}
          />
          <p className="text-xl/normal font-medium tracking-[-0.8px] text-white">
            {config.label}
          </p>
          {hasLiquidity ? (
            <p className="text-xs/[1.2] tracking-[-0.48px] text-white/70">
              <Trans>Keep your LP active to stay in.</Trans>
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-3">
          {hasLiquidity ? (
            <SpecialTierLiquidity
              targetUsd={targetUsd}
              positionUsd={lpPositionUsd}
            />
          ) : null}

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="relative flex h-[79px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#00DFEB]/15 bg-[url('/trade-static/referral/unlock-bg.png')] bg-cover bg-center bg-no-repeat p-3"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="block text-base/[1.2] font-medium text-[#00F2FF]">
                <Trans>VIP Access</Trans>
              </span>
              <span className="block text-[13px]/normal tracking-[-0.52px] text-white/70">
                <Trans>
                  Further questions? Reach out to the team — we&apos;re happy to
                  help.
                </Trans>
              </span>
            </span>
            <span
              aria-hidden
              className="size-6 shrink-0 bg-[url('/trade-static/referral/unlock-icon.svg')] bg-contain bg-center bg-no-repeat"
            />
          </a>
        </div>
      </div>
    </Card>
  );
};

const LevelUpCard: FC<{
  tiers: ReferralTierRule[];
  currentTierId?: number;
  activeReferees: number;
  volume30d: string;
  hiddenTierLpPositionUsd?: string;
  hiddenTierLpThreshold?: string;
  nextTier?: {
    min_active_referred_traders: number;
    min_rolling_30d_referred_volume_usd: string;
  } | null;
}> = ({
  tiers,
  currentTierId,
  activeReferees,
  volume30d,
  hiddenTierLpPositionUsd,
  hiddenTierLpThreshold,
  nextTier,
}) => {
  const { t } = useLingui();
  const specialTierConfig = currentTierId
    ? SPECIAL_TIER_CONFIG[currentTierId]
    : undefined;

  if (specialTierConfig) {
    return (
      <SpecialTierCard
        config={specialTierConfig}
        lpPositionUsd={hiddenTierLpPositionUsd}
        lpThresholdUsd={hiddenTierLpThreshold}
      />
    );
  }

  return (
    <Card className="min-h-[291px] p-4">
      <TierStepper tiers={tiers} currentTierId={currentTierId} />
      <div className="mt-4 space-y-3">
        <ProgressRow
          label={
            <span className="flex items-center gap-1">
              <Trans>Active Referees</Trans>
              <Tooltip>
                <TooltipTrigger>
                  <InfoCircleIcon
                    size={14}
                    className="text-t-350 hover:text-t-1100"
                  />
                </TooltipTrigger>
                <TooltipContent className="w-[320px] whitespace-pre-line">
                  {t`Referees — active referees counted toward your tier.
› Your Tier 1 + Tier 2 referees
› Placed ≥1 trade of ≥$10 size in the last 30 days
› 30D rolling window — inactive referees drop off automatically`}
                </TooltipContent>
              </Tooltip>
            </span>
          }
          value={activeReferees}
          target={nextTier?.min_active_referred_traders}
        />
        <ProgressRow
          label={
            <span className="flex items-center gap-1">
              <Trans>30D Volume</Trans>
              <Tooltip>
                <TooltipTrigger>
                  <InfoCircleIcon
                    size={14}
                    className="text-t-350 hover:text-t-1100"
                  />
                </TooltipTrigger>
                <TooltipContent className="w-[320px] whitespace-pre-line">
                  {t`30D Volume 30D Volume — combined volume counted toward your tier.
› You + your Tier 1 + Tier 2 referees‘ trading volume
› Notional trading volume ≥$10 size in the last 30 days
› 30D rolling window — inactive volume drop off automatically`}
                </TooltipContent>
              </Tooltip>
            </span>
          }
          value={volume30d}
          target={nextTier?.min_rolling_30d_referred_volume_usd}
          formatter={formatUsd}
        />
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="relative flex h-[79px] items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[url('/trade-static/referral/unlock-bg.png')] bg-cover bg-center bg-no-repeat p-3"
        >
          <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-2">
            <span className="block text-base/[1.2] font-medium text-[#00DFEB]">
              <Trans>Unlock VIP</Trans>
            </span>
            <span className="block text-[13px]/normal tracking-[-0.52px] text-white/70">
              <Trans>For degens who move real size.</Trans>
            </span>
          </span>
          <span
            aria-hidden
            className="relative z-10 size-6 shrink-0 bg-[url('/trade-static/referral/unlock-icon.svg')] bg-contain bg-center bg-no-repeat"
          />
        </a>
      </div>
    </Card>
  );
};

const TierTable: FC<{
  tiers: ReferralTierRule[];
  currentTierId?: number;
  exclusiveTierRows?: readonly ExclusiveTierRow[];
  activeExclusiveTierCode?: ExclusiveTierCode;
}> = ({
  tiers,
  currentTierId,
  exclusiveTierRows = [],
  activeExclusiveTierCode,
}) => {
  return (
    <>
      <div className="md:hidden">
        {tiers.map((tier, index) => {
          const active = tier.tier_id === currentTierId;
          const volumeTarget = toNumber(
            tier.min_rolling_30d_referred_volume_usd,
          );
          const refereesTarget = tier.min_active_referred_traders;
          const tierName = getPublicTierLabel(tier, index);

          return (
            <div key={tier.tier_id}>
              {index > 0 ? <div className="my-4 h-px bg-white/10" /> : null}
              <div
                className={cn(
                  'min-h-[137px] rounded-lg p-2',
                  active && 'bg-white/10',
                )}
              >
                <div className="flex h-[29px] items-start justify-between gap-2">
                  <div className="truncate text-2xl/[29px] font-medium tracking-[-0.96px] text-white">
                    {tierName}
                  </div>
                  {active ? (
                    <span aria-hidden className={MY_TIER_ICON_CLASS} />
                  ) : null}
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex h-[15px] items-center justify-between">
                    <span className={MOBILE_TIER_LABEL_CLASS}>
                      <Trans>Active Referees</Trans>
                    </span>
                    <span className={MOBILE_TIER_VALUE_CLASS}>
                      {refereesTarget > 0 ? `≥${refereesTarget}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex h-[15px] items-center justify-between">
                    <span className={MOBILE_TIER_LABEL_CLASS}>
                      <Trans>30D Volume</Trans>
                    </span>
                    <span className={MOBILE_TIER_VALUE_CLASS}>
                      {volumeTarget > 0 ? `≥${formatUsd(volumeTarget)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex h-[15px] items-center justify-between">
                    <span className={MOBILE_TIER_LABEL_CLASS}>
                      <Trans>Rebate (L1 | L2)</Trans>
                    </span>
                    <span className={MOBILE_TIER_VALUE_CLASS}>
                      {formatPercent(tier.l1_rebate_bps)} |{' '}
                      {formatPercent(tier.l2_rebate_bps)}
                    </span>
                  </div>
                  <div className="flex h-[15px] items-center justify-between">
                    <span className={MOBILE_TIER_LABEL_CLASS}>
                      <Trans>Referee Discount</Trans>
                    </span>
                    <span className={MOBILE_TIER_VALUE_CLASS}>
                      {formatPercent(tier.trader_discount_bps)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {exclusiveTierRows.map((row, index) => {
          const active = row.id === activeExclusiveTierCode;

          return (
            <div key={row.id}>
              {tiers.length > 0 || index > 0 ? (
                <div className="my-4 h-px bg-white/10" />
              ) : null}
              <div
                className={cn(
                  'min-h-[137px] rounded-lg p-2',
                  active && 'bg-white/10',
                )}
              >
                <div className="flex h-[29px] items-start justify-between gap-2">
                  <div className="truncate text-2xl/[29px] font-medium tracking-[-0.96px] text-white">
                    {row.label}
                  </div>
                  {active ? (
                    <span aria-hidden className={MY_TIER_ICON_CLASS} />
                  ) : null}
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex h-[15px] items-center justify-between">
                    <span className={MOBILE_TIER_LABEL_CLASS}>
                      <Trans>Active Referees</Trans>
                    </span>
                    <span className={MOBILE_TIER_VALUE_CLASS}>N/A</span>
                  </div>
                  <div className="flex h-[15px] items-center justify-between">
                    <span className={MOBILE_TIER_LABEL_CLASS}>
                      <Trans>30D Volume</Trans>
                    </span>
                    <span className={MOBILE_TIER_VALUE_CLASS}>N/A</span>
                  </div>
                  <div className="flex h-[15px] items-center justify-between">
                    <span className={MOBILE_TIER_LABEL_CLASS}>
                      <Trans>Rebate (L1 | L2)</Trans>
                    </span>
                    <span className={MOBILE_TIER_VALUE_CLASS}>
                      {formatPercent(row.l1RebateBps)} |{' '}
                      {formatPercent(row.l2RebateBps)}
                    </span>
                  </div>
                  <div className="flex h-[15px] items-center justify-between">
                    <span className={MOBILE_TIER_LABEL_CLASS}>
                      <Trans>Referee Discount</Trans>
                    </span>
                    <span className={MOBILE_TIER_VALUE_CLASS}>
                      {formatPercent(row.discountBps)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block md:overflow-x-auto">
        <div className="space-y-2 md:min-w-[620px]">
          <div className="flex items-start justify-between px-2 text-[13px]/[1.2] tracking-[-0.52px] text-white/70">
            <span className="w-[100px]">
              <Trans>Tier</Trans>
            </span>
            <span className="w-[80px] shrink-0 whitespace-nowrap">
              <Trans>Active Referees</Trans>
            </span>
            <span className="w-[160px]">
              <Trans>30D Volume</Trans>
            </span>
            <span className="w-[140px]">
              <Trans>Rebate (L1 | L2)</Trans>
            </span>
            <span className="w-[100px] text-right">
              <Trans>Referee Discount</Trans>
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex flex-col gap-1">
            {tiers.map((tier, index) => {
              const active = tier.tier_id === currentTierId;
              const volumeTarget = toNumber(
                tier.min_rolling_30d_referred_volume_usd,
              );
              const refereesTarget = tier.min_active_referred_traders;

              return (
                <div
                  key={tier.tier_id}
                  className={cn(
                    'flex h-[33px] items-center justify-between rounded-lg px-2 text-sm/normal tracking-[-0.56px] text-white',
                    active && 'bg-white/10',
                  )}
                >
                  <span className="flex w-[100px] min-w-0 items-center gap-2">
                    <span>{getPublicTierLabel(tier, index)}</span>
                    {active ? (
                      <span aria-hidden className={MY_TIER_ICON_CLASS} />
                    ) : null}
                  </span>
                  <span className="w-[80px]">
                    {refereesTarget > 0 ? `≥${refereesTarget}` : 'N/A'}
                  </span>
                  <span className="w-[160px] truncate">
                    {volumeTarget > 0 ? `≥${formatUsd(volumeTarget)}` : 'N/A'}
                  </span>
                  <span className="w-[140px]">
                    {formatPercent(tier.l1_rebate_bps)} |{' '}
                    {formatPercent(tier.l2_rebate_bps)}
                  </span>
                  <span className="w-[100px] text-right">
                    {formatPercent(tier.trader_discount_bps)}
                  </span>
                </div>
              );
            })}
            {exclusiveTierRows.map((row) => {
              const active = row.id === activeExclusiveTierCode;

              return (
                <div
                  key={row.id}
                  className={cn(
                    'flex h-[33px] items-center justify-between rounded-lg px-2 text-sm/normal tracking-[-0.56px] text-white',
                    active && 'bg-white/10',
                  )}
                >
                  <span className="flex w-[100px] min-w-0 items-center gap-2">
                    <span>{row.label}</span>
                    {active ? (
                      <span aria-hidden className={MY_TIER_ICON_CLASS} />
                    ) : null}
                  </span>
                  <span className="w-[80px]">N/A</span>
                  <span className="w-[160px] truncate">N/A</span>
                  <span className="w-[140px]">
                    {formatPercent(row.l1RebateBps)} |{' '}
                    {formatPercent(row.l2RebateBps)}
                  </span>
                  <span className="w-[100px] text-right">
                    {formatPercent(row.discountBps)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

const ReferralCodesTable: FC<{
  codes: ReferralCodeItem[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isCodesLoading?: boolean;
  onLoadMore?: () => void;
  onCopyCode: (code: string) => void | Promise<void>;
  onShareCode: (code: string) => void;
}> = ({
  codes,
  hasNextPage = false,
  isFetchingNextPage = false,
  isCodesLoading = false,
  onLoadMore,
  onCopyCode,
  onShareCode,
}) => {
  const { t } = useLingui();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || !onLoadMore || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { root, rootMargin: '48px 0px', threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [codes.length, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isCodesLoading) {
    return <Skeleton className="h-[139px] w-full rounded-2xl bg-white/6" />;
  }

  return (
    <div className="min-w-0 md:overflow-x-auto">
      <div className="min-w-0 space-y-2 md:min-w-[720px]">
        <div
          className="grid min-w-0 items-start px-2 text-[13px]/[1.2] tracking-[-0.52px] text-white/70 md:flex md:justify-between"
          style={{ gridTemplateColumns: MOBILE_CODE_TABLE_COLUMNS }}
        >
          <span className="truncate md:w-[180px]">
            <Trans>Referral Code</Trans>
          </span>
          <span className="min-w-0 whitespace-normal md:w-[180px] md:whitespace-nowrap">
            <Trans>Referee Volume</Trans>
          </span>
          <span className="truncate md:w-[120px]">
            <Trans>Referees</Trans>
          </span>
          <span className="truncate text-right md:w-[140px]">
            <Trans>Rebates</Trans>
          </span>
        </div>
        <div className="h-px bg-white/10" />
        <div
          ref={scrollRef}
          className="flex max-h-[107px] flex-col gap-1 overflow-y-auto"
          style={{ scrollbarGutter: 'stable' }}
        >
          {codes.length > 0 ? (
            codes.map((item, index) => {
              const referralCode = item.referral_code;

              return (
                <div
                  key={item.raw_referral_code}
                  className={cn(
                    'grid h-[33px] min-w-0 items-center rounded-lg px-2 text-sm/normal tracking-[-0.56px] text-white md:flex md:justify-between',
                    index === 0 && 'bg-white/10',
                  )}
                  style={{ gridTemplateColumns: MOBILE_CODE_TABLE_COLUMNS }}
                >
                  <span className="flex min-w-0 items-center gap-1 md:w-[180px]">
                    <span className="truncate">{referralCode}</span>
                    <button
                      type="button"
                      className="shrink-0 text-[#00DFEB] hover:text-white"
                      aria-label={t`Copy referral code ${referralCode}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void onCopyCode(referralCode);
                      }}
                    >
                      <CopyOutlineIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className="shrink-0 text-[#00DFEB] transition-colors hover:text-white"
                      aria-label={t`Share referral code ${referralCode}`}
                      onClick={() => onShareCode(referralCode)}
                    >
                      <ShareNetworkIcon size={16} />
                    </button>
                  </span>
                  <span className="truncate md:w-[180px]">
                    {formatUsd(item.volume_usd)}
                  </span>
                  <span className="truncate md:w-[120px]">
                    {item.referred_count ?? 0}
                  </span>
                  <span className="truncate text-right md:w-[140px]">
                    {formatUsd(item.rewards_usd)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex h-[107px] items-center justify-center text-[13px] tracking-[-0.52px] text-white/50">
              <Trans>No referral codes yet</Trans>
            </div>
          )}
          {hasNextPage ? (
            <div
              ref={sentinelRef}
              className="flex h-6 items-center justify-center text-white/50"
            >
              {isFetchingNextPage ? (
                <LoaderCircleIcon size={14} className="animate-spin" />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const BottomTabs: FC<{
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  tiers: ReferralTierRule[];
  currentTierId?: number;
  exclusiveTierRows?: readonly ExclusiveTierRow[];
  activeExclusiveTierCode?: ExclusiveTierCode;
  codes: ReferralCodeItem[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isCodesLoading?: boolean;
  onLoadMore?: () => void;
  onCreateCode: () => void;
  onCopyCode: (code: string) => void | Promise<void>;
  onShareCode: (code: string) => void;
}> = ({
  activeTab,
  onTabChange,
  tiers,
  currentTierId,
  exclusiveTierRows,
  activeExclusiveTierCode,
  codes,
  hasNextPage,
  isFetchingNextPage,
  isCodesLoading,
  onLoadMore,
  onCreateCode,
  onCopyCode,
  onShareCode,
}) => (
  <Card
    className={cn(
      'p-4 max-md:overflow-hidden',
      activeTab === 'squad'
        ? ''
        : activeTab === 'code'
          ? 'min-h-[259px] md:min-h-[219px]'
          : 'min-h-[557px] md:min-h-[219px]',
    )}
  >
    {activeTab === 'code' ? (
      <Button
        onClick={onCreateCode}
        className="absolute top-4 right-4 z-10 hidden h-6 shrink-0 gap-1 rounded-lg bg-[#00DFEB]/15 px-3 py-2 text-[13px]/normal font-medium tracking-[-0.52px] text-[#00DFEB] hover:bg-[#00DFEB]/20 md:flex"
      >
        <PlusIcon size={14} />
        <Trans>Create New Code</Trans>
      </Button>
    ) : null}
    <TradeTabs
      className="gap-0"
      value={activeTab}
      onValueChange={(value) => onTabChange(value as BottomTab)}
      options={[
        {
          value: 'tier',
          label: <Trans>Your Tier</Trans>,
          content:
            activeTab === 'tier' ? (
              <TierTable
                tiers={tiers}
                currentTierId={currentTierId}
                exclusiveTierRows={exclusiveTierRows}
                activeExclusiveTierCode={activeExclusiveTierCode}
              />
            ) : null,
        },
        {
          value: 'code',
          label: <Trans>Your Code</Trans>,
          content:
            activeTab === 'code' ? (
              <>
                <Button
                  onClick={onCreateCode}
                  className="mb-4 flex h-6 w-[145px] gap-1 rounded-lg bg-[#00DFEB]/15 px-3 py-2 text-[13px]/normal font-medium tracking-[-0.52px] text-[#00DFEB] hover:bg-[#00DFEB]/20 md:hidden"
                >
                  <PlusIcon size={14} />
                  <Trans>Create New Code</Trans>
                </Button>
                <ReferralCodesTable
                  codes={codes}
                  hasNextPage={!!hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  isCodesLoading={isCodesLoading}
                  onLoadMore={onLoadMore}
                  onCopyCode={onCopyCode}
                  onShareCode={onShareCode}
                />
              </>
            ) : null,
        },
        {
          value: 'squad',
          label: <Trans>Your Squad</Trans>,
          content:
            activeTab === 'squad' ? (
              <SquadNetworkMap showTitle={false} />
            ) : null,
        },
      ]}
      listLayoutClassName="grid"
      listClassName="w-[291px] grid-cols-[85px_96px_102px] gap-1 !overflow-visible !rounded-[12px] bg-transparent p-0 md:w-fit md:grid-cols-none md:flex"
      labelClassName="w-full !rounded-[12px] px-0 text-[13px]/[1.2] text-white data-[state=active]:!rounded-[12px] data-[state=active]:bg-white/10 data-[state=active]:text-white md:w-auto md:px-4"
      activeBarClassName="hidden"
      contentWrapClassName="mt-4"
      disableAnimation
    />
  </Card>
);

const useReferralDashboardData = (
  initialTierRules?: ReferralTierRules | null,
) => {
  const { data: profile, isLoading: isProfileLoading } = useReferralProfile();
  const { data: tierRules } = useReferralTierRules(initialTierRules);
  const codesQuery = useReferralCodes();

  const codes = codesQuery.items;
  const publicTiers = useMemo(() => getPublicTierRules(tierRules), [tierRules]);
  const tiersForTooltips =
    tierRules?.tiers && tierRules.tiers.length > 0
      ? tierRules.tiers
      : publicTiers;
  const mainCode = useMemo(
    () => [...codes].sort((a, b) => a.created_at_ms - b.created_at_ms)[0],
    [codes],
  );

  return {
    profile,
    publicTiers,
    tiersForTooltips,
    mainCode,
    codes,
    codesQuery,
    isProfileLoading,
  };
};

const ReferralConnectedDashboard: FC<ReferralConnectedDashboardProps> = ({
  initialTierRules,
  initialBindCode,
  autoChangeCode,
  editInitialCode,
  focusBindInputOnMount = false,
  openCreateCodeDialogOnMount = false,
  isBound = false,
  isLoading = false,
  onAutoChangeDialogClose,
}) => {
  const { t } = useLingui();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const bottomTabsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<BottomTab>('tier');
  const [isBindDialogOpen, setIsBindDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const handledCreateRequestRef = useRef(false);
  const handledAutoChangeRef = useRef('');
  const {
    profile,
    publicTiers,
    tiersForTooltips,
    mainCode,
    codes,
    codesQuery,
    isProfileLoading,
  } = useReferralDashboardData(initialTierRules);
  const { mutate: claimRewards, isPending: isClaiming } =
    useClaimAffiliateRewards();

  const isStatsLoading = isLoading || isProfileLoading;
  const hasBoundReferrer =
    profile?.has_bound_referrer ??
    Boolean(isBound && profile?.bound_referral_code);
  const currentTierId = profile?.current_onchain_tier || undefined;
  const exclusiveTierCode = getExclusiveTierCode(
    currentTierId,
    profile?.hidden_tier_code,
  );
  const visibleExclusiveTierRows =
    getVisibleExclusiveTierRows(exclusiveTierCode);
  const tierLabel = getTierDisplayLabel(currentTierId);
  const currentTierRule = currentTierId
    ? tiersForTooltips.find((tier) => tier.tier_id === currentTierId)
    : undefined;
  const tooltipTierName = tierLabel;
  const tooltipL1Rebate = formatPercent(currentTierRule?.l1_rebate_bps);
  const tooltipL2Rebate = formatPercent(currentTierRule?.l2_rebate_bps);
  const tierTooltip =
    currentTierRule && tierLabel
      ? t`${tooltipTierName} earns you a ${tooltipL1Rebate} (L1) and ${tooltipL2Rebate} (L2) rebate on your referees' trades, applied to every open and close fee.`
      : undefined;
  const canClaim =
    !isStatsLoading && toNumber(profile?.claimable_reward_usd) > 0;

  useEffect(() => {
    if (!openCreateCodeDialogOnMount) {
      handledCreateRequestRef.current = false;
      return;
    }
    if (handledCreateRequestRef.current || codesQuery.isLoading) return;
    handledCreateRequestRef.current = true;
    if (codes.length === 0) setIsCreateDialogOpen(true);
  }, [codes.length, codesQuery.isLoading, openCreateCodeDialogOnMount]);

  useEffect(() => {
    if (focusBindInputOnMount && !hasBoundReferrer) {
      setIsBindDialogOpen(true);
    }
  }, [focusBindInputOnMount, hasBoundReferrer]);

  useEffect(() => {
    if (!autoChangeCode || !profile?.bound_referral_code) return;
    if (autoChangeCode === profile.bound_referral_code) return;
    const key = `${profile.bound_referral_code}:${autoChangeCode}`;
    if (handledAutoChangeRef.current === key) return;
    handledAutoChangeRef.current = key;
    setIsEditDialogOpen(true);
  }, [autoChangeCode, profile?.bound_referral_code]);

  const handleManageCodes = useCallback(() => {
    setActiveTab('code');
    bottomTabsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const handleCopyMainCode = useCallback(async () => {
    if (!mainCode) return;
    await navigator.clipboard.writeText(
      mainCode.share_link || mainCode.referral_code,
    );
    toast.success(t`referral url copied`, {
      id: `main-referral-url-copied-${mainCode.raw_referral_code}`,
    });
  }, [mainCode, t]);

  const handleCopyCode = useCallback(
    async (code: string) => {
      await navigator.clipboard.writeText(code);
      toast.success(t`Referral code copied`, {
        id: `referral-code-copied-${code}`,
      });
    },
    [t],
  );

  if (isStatsLoading && !profile) {
    return <ReferralLoadingContent />;
  }

  return (
    <section className="relative min-h-[900px] pb-[90px] max-md:min-h-[1627px] md:-mt-5">
      <ReferralBackground />
      <div ref={dashboardRef} className="relative z-10 pt-5">
        <PageIntro />
        <div className="space-y-3">
          <AsRefereeCard
            discountLabel={formatPercent(profile?.current_discount_bps)}
            feesSaved={formatUsd(profile?.discount_saved_usd)}
            codeApplied={profile?.bound_referral_code ?? '-'}
            hasBoundReferrer={hasBoundReferrer}
            onEdit={() =>
              hasBoundReferrer
                ? setIsEditDialogOpen(true)
                : setIsBindDialogOpen(true)
            }
          />

          <div className="grid gap-2 lg:grid-cols-[1fr_380px]">
            <AsReferrerCard
              tierLabel={tierLabel}
              tierTooltip={tierTooltip}
              earned={formatUsd(profile?.cumulative_affiliate_reward_usd)}
              claimable={formatUsd(profile?.claimable_reward_usd)}
              canClaim={canClaim}
              isClaiming={isClaiming}
              mainCode={mainCode}
              onClaim={() => claimRewards()}
              onCopy={handleCopyMainCode}
              onManage={handleManageCodes}
              onShare={() => setShareCode(mainCode?.referral_code ?? null)}
              onCreate={() => setIsCreateDialogOpen(true)}
            />
            <LevelUpCard
              tiers={publicTiers}
              currentTierId={currentTierId}
              activeReferees={profile?.active_referred_trader_count ?? 0}
              volume30d={profile?.rolling_30d_referred_volume_usd ?? '0'}
              hiddenTierLpPositionUsd={profile?.hidden_tier_lp_position_usd}
              hiddenTierLpThreshold={profile?.hidden_tier_lp_threshold}
              nextTier={profile?.next_tier}
            />
          </div>

          <div ref={bottomTabsRef}>
            <BottomTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tiers={publicTiers}
              currentTierId={currentTierId}
              exclusiveTierRows={visibleExclusiveTierRows}
              activeExclusiveTierCode={exclusiveTierCode}
              codes={codes}
              hasNextPage={!!codesQuery.hasNextPage}
              isFetchingNextPage={codesQuery.isFetchingNextPage}
              isCodesLoading={codesQuery.isLoading}
              onLoadMore={codesQuery.fetchNextPage}
              onCreateCode={() => setIsCreateDialogOpen(true)}
              onCopyCode={handleCopyCode}
              onShareCode={setShareCode}
            />
          </div>
        </div>
      </div>

      <BindReferralDialog
        open={isBindDialogOpen}
        onOpenChange={setIsBindDialogOpen}
        initialCode={initialBindCode}
        focusOnMount={focusBindInputOnMount}
      />
      {isEditDialogOpen ? (
        <EditCodeDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open && autoChangeCode)
              onAutoChangeDialogClose?.(autoChangeCode);
            setIsEditDialogOpen(open);
          }}
          initialCode={editInitialCode || autoChangeCode}
        />
      ) : null}
      {isCreateDialogOpen ? (
        <CreateCodeDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onConfirm={() => {}}
        />
      ) : null}
      {shareCode ? (
        <ReferralShareDialog
          code={shareCode}
          open={!!shareCode}
          onOpenChange={(open) => {
            if (!open) setShareCode(null);
          }}
        />
      ) : null}
    </section>
  );
};

export default ReferralConnectedDashboard;
