'use client';

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { CoinIcon } from '@repo/common/components';
import { percentFormat, thoFormat, unitFormat } from '@repo/lib/format';
import { useQueryClient } from '@repo/lib/queryClient';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  GradientBorder,
  MEDIA_SIZES,
  PointsCircleIcon,
  Skeleton,
  SwapCircleIcon,
  useMediaQuery,
  useResizeObserver,
} from '@repo/ui';
import { IMAGES_MAP } from '@/common';
import TradeTabs from '@/common/components/TradeTabs';
import VaultTradeActionButton from '@/common/components/VaultTradeActionButton';
import VaultTradeInput from '@/common/components/VaultTradeInput';
import { usePrices } from '@/common/services';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';
import { ENABLE_SWAP } from '@/constants/common';
import { ActivityTabType } from '@/containers/pools/PoolsDetail/components/ActivityPanel';
import { usePoolTradePriceSubscription } from '@/containers/pools/PoolTrader';
import PoolFeeContent from '@/containers/pools/PoolTrader/PoolFeeContent';
import {
  MarketOpenCountdownButton,
  usePoolTradeController,
} from '@/containers/pools/PoolTrader/PoolTradeContent';
import PoolTradeFormBtn from '@/containers/pools/PoolTrader/PoolTradeFormBtn';
import { useTokensData } from '@/domain/synthetics/liquidity/hzlp/useTokensData';
import {
  useGenesisLpEstimate,
  useGenesisMeritsUserSummary,
} from '@/queries/bsc/genesis';
import type {
  GenesisAsset,
  GenesisLpEstimate,
  GenesisMeritsSeason,
  GenesisUserAssetRow,
  GenesisUserPosition,
  GenesisVaultConfig,
} from '@/services/rest/genesis';
import { LiqTradeType } from '@/stores/pools/trade';
import { GenesisMetricLabel } from '../components/GenesisMetricLabel';
import {
  GENESIS_INTEGER_FORMAT_OPTIONS,
  GENESIS_USD_FORMAT_OPTIONS,
} from '../lib/constants';
import {
  getGenesisAssetVisual,
  getGenesisVaultDisplayName,
} from '../lib/genesisAssetVisuals';
import {
  calculateAffectedUnmaturedUsd,
  calculateGenesisMeritsLockedPreview,
  calculateProportionalWithdrawUsd,
  calculateUsdValue,
  hasGenesisWithdrawalLoss,
  isLpEstimateEpochCurrent,
  isLpEstimateWithoutActiveEpoch,
  sumGenesisDecimalValues,
} from '../lib/genesisMeritsProjection';
import {
  findGenesisAssetByVaultKey,
  findGenesisUserAsset,
  getGenesisVaultKey,
} from '../lib/genesisVaultIdentity';
import { useGenesisAccessStore } from '../stores/genesisAccessStore';
import { MeritsBoostLostWarningDialog } from './MeritsBoostLostWarningDialog';
import type { DepositTabValue } from '../lib/types';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: GenesisVaultConfig;
  position?: GenesisUserPosition;
  meritsSeason?: GenesisMeritsSeason;
  isPositionValuationReady: boolean;
  vaultKey: string;
  onVaultChange: (vaultKey: string) => void;
}

const LP_ESTIMATE_EXPIRY_CHECK_INTERVAL = 10_000;

const useIsLpEstimateCurrent = (epochEndSec?: number) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(
      () => setNowMs(Date.now()),
      LP_ESTIMATE_EXPIRY_CHECK_INTERVAL,
    );
    return () => window.clearInterval(interval);
  }, []);

  return isLpEstimateEpochCurrent(epochEndSec, nowMs);
};

interface TokenIconProps {
  symbol: string;
  icon?: string;
  size?: number;
}

const TokenIcon = ({ symbol, icon, size = 24 }: TokenIconProps) => {
  const genesisSymbol = ['USD1', 'USDT', 'U'].includes(symbol)
    ? (symbol as GenesisAsset['symbol'])
    : undefined;
  const source =
    icon ??
    (symbol === 'HzV'
      ? IMAGES_MAP.coinIcons.HzV
      : genesisSymbol
        ? getGenesisAssetVisual(genesisSymbol)?.icon
        : undefined);

  if (symbol === 'HzV') {
    return (
      <CoinIcon
        src={source ?? IMAGES_MAP.coinIcons.HzV}
        alt={symbol}
        size={size}
      />
    );
  }

  return <CoinIcon src={source ?? ''} alt={symbol} size={size} />;
};

const TokenSuffix = ({ symbol, icon }: { symbol: string; icon?: string }) => (
  <div className="border-border text-t-1100 flex h-9 items-center gap-2 rounded-xl border bg-transparent px-4 text-sm font-medium">
    <TokenIcon symbol={symbol} icon={icon} />
    {symbol}
  </div>
);

const SwapPanel = dynamic(
  () =>
    import('@/components/Swap/SwapPanel').then((module) => module.SwapPanel),
  { ssr: false },
);

interface FeatureMarqueeItem {
  icon: ReactNode;
  label: string;
}

const FeatureMarqueeGroup = ({ items }: { items: FeatureMarqueeItem[] }) => (
  <div className="flex shrink-0 gap-3 pr-3">
    {[0, 1, 2].flatMap((repeatIndex) =>
      items.map((item) => (
        <span
          key={`${repeatIndex}-${item.label}`}
          className="text-t-1100 flex shrink-0 items-center gap-1 font-medium whitespace-nowrap"
        >
          <span className="grid size-3 place-items-center">{item.icon}</span>
          {item.label}
        </span>
      )),
    )}
  </div>
);

const FeatureMarquee = ({ config }: { config?: GenesisVaultConfig }) => {
  const { t } = useLingui();
  const boostLabel =
    config?.boostMultiplier === undefined
      ? '--'
      : `${thoFormat(config.boostMultiplier, GENESIS_INTEGER_FORMAT_OPTIONS)}x`;
  const aprLabel =
    config?.apr === undefined
      ? '--'
      : percentFormat(config.apr / 100, 2, { stripTrailingZeros: true });
  const items = [
    {
      icon: <PointsCircleIcon size={12} className="text-t-1100" />,
      label: t`${boostLabel} Merits Boost`,
    },
    {
      icon: <SwapCircleIcon size={12} className="text-t-1100" />,
      label: t`Deposit · Hold · Earn`,
    },
    {
      icon: (
        <p className="text-bg-3 grid size-3 place-items-center rounded-full bg-white text-[8px] font-bold">
          %
        </p>
      ),
      label: t`~${aprLabel} APY`,
    },
  ];

  return (
    <div
      aria-label={items.map((item) => item.label).join(' · ')}
      className="text-t-1100 absolute top-12 left-0 flex h-[30px] w-full items-center overflow-hidden text-xs"
    >
      <div
        aria-hidden="true"
        className="animate-marquee flex w-max items-center motion-reduce:animate-none"
        style={{ ['--marquee-duration' as string]: '20s' }}
      >
        <FeatureMarqueeGroup items={items} />
        <FeatureMarqueeGroup items={items} />
      </div>
      <div className="from-bg-3 max-md:from-bg-2 pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r to-transparent" />
      <div className="from-bg-3 max-md:from-bg-2 pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l to-transparent" />
    </div>
  );
};

const AnimatedHeight = ({ children }: { children: ReactNode }) => {
  const [height, setHeight] = useState<number>();
  const contentRef = useResizeObserver<HTMLDivElement>((entry) => {
    const nextHeight = Math.ceil(entry.contentRect.height);
    setHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  });

  return (
    <div
      className="overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none"
      style={height === undefined ? undefined : { height }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

interface VaultOverviewProps {
  assetConfig?: GenesisAsset;
  userAsset?: GenesisUserAssetRow;
  config?: GenesisVaultConfig;
  onCycleAsset: () => void;
}

const VaultOverview = ({
  assetConfig,
  userAsset,
  config,
  onCycleAsset,
}: VaultOverviewProps) => {
  const { t } = useLingui();
  const asset = assetConfig?.symbol;
  const vaultDisplayName = assetConfig
    ? getGenesisVaultDisplayName(assetConfig)
    : '--';
  const cap = Number(assetConfig?.capToken ?? 0);
  const filled =
    cap > 0
      ? Math.min((Number(assetConfig?.depositedToken ?? 0) / cap) * 100, 100)
      : 0;
  const formattedMaturityDays = thoFormat(
    config?.maturityDays ?? 0,
    GENESIS_INTEGER_FORMAT_OPTIONS,
  );
  const formattedBoostMultiplier = thoFormat(
    config?.boostMultiplier ?? 0,
    GENESIS_INTEGER_FORMAT_OPTIONS,
  );
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const [dialogBoundary, setDialogBoundary] = useState<Element | null>(null);
  const setDialogBoundaryRef = useCallback(
    (element: HTMLButtonElement | null) => {
      setDialogBoundary(
        element?.closest('[data-slot="dialog-content"]') ?? null,
      );
    },
    [],
  );
  const tooltipContentProps = {
    sideOffset: isMobile ? 0 : 5,
    collisionBoundary: isMobile
      ? undefined
      : dialogBoundary
        ? [dialogBoundary]
        : undefined,
    collisionPadding: isMobile ? 16 : 12,
  };

  return (
    <div className="relative h-[300px] w-[260px] max-md:h-auto max-md:w-full">
      <div className="flex h-6 items-center justify-between">
        <Button
          variant="ghost"
          onClick={onCycleAsset}
          className="h-auto gap-2 p-0 hover:bg-transparent"
          aria-label={t`Select asset`}
        >
          {asset ? <TokenIcon symbol={asset} /> : <div className="size-6" />}
          <span className="text-t-1100 text-base font-medium">
            {vaultDisplayName}
          </span>
        </Button>
      </div>

      <div className="mt-3 h-[58px] max-md:hidden">
        <p className="text-t-350 text-xs">{t`Filled`}</p>
        <p className="text-t-1100 text-4xl font-medium">
          {percentFormat(filled / 100, 2, {
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          })}
        </p>
      </div>

      <div className="mt-3 h-8 overflow-hidden rounded-full bg-white/15 max-md:hidden">
        <div
          className="to-accent h-full bg-gradient-to-r from-white"
          style={{ width: `${filled}%` }}
        />
      </div>

      <div className="mt-3 space-y-3 max-md:grid max-md:grid-cols-2 max-md:space-y-0 max-md:gap-x-3 max-md:gap-y-3">
        <div className="h-[42px]">
          <GenesisMetricLabel
            label={t`Matured / Total Deposits`}
            tooltip={t`Matured / Total deposits. A deposit matures at ${formattedMaturityDays} continuous days — only then is its ${formattedBoostMultiplier}× boost locked in.`}
            inDialog
            triggerRef={setDialogBoundaryRef}
            tooltipContentProps={tooltipContentProps}
          />
          <p className="text-t-1100 mt-1 text-xl font-semibold">
            <span className="text-t-430 ml-1 text-xs font-normal">
              {unitFormat(
                userAsset?.maturedDeposits ?? '0',
                2,
                GENESIS_USD_FORMAT_OPTIONS,
              )}
            </span>
            <span className="text-t-430 text-xs font-normal"> / </span>
            {unitFormat(
              userAsset?.deposited ?? '0',
              2,
              GENESIS_USD_FORMAT_OPTIONS,
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const LockedValues = ({
  showNextValue,
  meritsBefore,
  meritsAfter,
  isMeritsLoading,
}: {
  showNextValue: boolean;
  meritsBefore: string;
  meritsAfter: string;
  isMeritsLoading: boolean;
}) => {
  const { t } = useLingui();
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const [dialogBoundary, setDialogBoundary] = useState<Element | null>(null);
  const setDialogBoundaryRef = useCallback(
    (element: HTMLButtonElement | null) => {
      setDialogBoundary(
        element?.closest('[data-slot="dialog-content"]') ?? null,
      );
    },
    [],
  );
  return (
    <div className="mt-0.5">
      <GradientBorder
        outerClassName="isolate h-[51px] rounded-xl before:rounded-xl before:bg-[linear-gradient(90deg,var(--t-1100)_0%,var(--accent)_100%)]"
        innerClassName="bg-bg-3 grid grid-cols-1 rounded-[11px] p-2"
      >
        <div>
          <GenesisMetricLabel
            label={t`Merits Locked In`}
            tooltip={t`Estimated LP Merits through the end of the Season, including settled Merits, current Epoch estimates, and future Merits projected from the current reward pool and shares. Actual Merits may vary.`}
            inDialog
            triggerRef={setDialogBoundaryRef}
            tooltipContentProps={{
              sideOffset: isMobile ? 0 : 5,
              collisionBoundary: isMobile
                ? undefined
                : dialogBoundary
                  ? [dialogBoundary]
                  : undefined,
              collisionPadding: isMobile ? 16 : 12,
            }}
          />
          {isMeritsLoading ? (
            <Skeleton className="bg-bg-4 mt-1 h-[17px] w-28" />
          ) : (
            <p className="text-t-270 mt-1 text-sm">
              {unitFormat(meritsBefore, 2)}
              {showNextValue && (
                <>
                  {' → '}
                  <span className="text-t-1100">
                    {unitFormat(meritsAfter, 2)}
                  </span>
                </>
              )}
            </p>
          )}
        </div>
      </GradientBorder>
    </div>
  );
};

interface GenesisVaultTradeFormProps {
  direction: LiqTradeType;
  vaultAddress: string;
  config?: GenesisVaultConfig;
  userAsset?: GenesisUserPosition['perAsset'][number];
  userRewardEligibleUsd: string;
  userBoostEligibleUsd: string;
  settledMerits: string;
  poolEligibleUsd: string;
  targetPoolEligibleUsd: string;
  firstDepositWeight: string;
  meritsSeason?: GenesisMeritsSeason;
  lpEstimate?: GenesisLpEstimate;
  isMeritsSourceDataReady: boolean;
}

const GenesisVaultTradeForm = ({
  direction,
  vaultAddress,
  config,
  userAsset,
  userRewardEligibleUsd,
  userBoostEligibleUsd,
  settledMerits,
  poolEligibleUsd,
  targetPoolEligibleUsd,
  firstDepositWeight,
  meritsSeason,
  lpEstimate,
  isMeritsSourceDataReady,
}: GenesisVaultTradeFormProps) => {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const [warnOpen, setWarnOpen] = useState(false);
  const [withdrawWarningCheckPending, setWithdrawWarningCheckPending] =
    useState(false);
  const withdrawWarningDismissed = useGenesisAccessStore(
    (state) => state.withdrawWarningDismissed,
  );
  const setWithdrawWarningDismissed = useGenesisAccessStore(
    (state) => state.setWithdrawWarningDismissed,
  );
  const isDeposit = direction === LiqTradeType.Deposit;
  const refreshGenesisData = useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['genesisUserPosition'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['genesisOverview'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['genesisLpEstimate'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['genesisMeritsUserSummary'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['bsc-data-query', 'vaults'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['rest', 'activities'],
      }),
    ]);
  }, [queryClient]);
  usePrices();
  usePoolTradePriceSubscription(ActivityTabType.VAULT, vaultAddress);
  useTokensData();
  useGasLimits();
  useGasPrice();
  const {
    form,
    rateDisplay,
    showCountdown,
    now,
    nextMarketOpenTime,
    effectiveValidation,
    quoteFeeFactor,
    handleApproveWithLoading,
    handleFormSubmitWithGuard,
    fields,
    labels,
  } = usePoolTradeController({
    direction,
    type: ActivityTabType.VAULT,
    marketAddress: vaultAddress,
    enforcePredepositMinimum: true,
    onExecutionResolved: refreshGenesisData,
  });

  useEffect(() => {
    form.reset(
      isDeposit
        ? {
            paySz: { coin: fields.payBalanceUnit, value: '' },
            receiveSz: { coin: fields.receiveBalanceUnit, value: '' },
          }
        : {
            paySz: { coin: fields.payBalanceUnit, value: '' },
            receiveSz: { coin: fields.receiveBalanceUnit, value: '' },
          },
    );
  }, [
    fields.payBalanceUnit,
    fields.receiveBalanceUnit,
    form,
    isDeposit,
    vaultAddress,
  ]);

  const payValue = form.watch('paySz');
  const receiveValue = form.watch('receiveSz');
  const numericPayAmount = Number(payValue?.value ?? 0) || 0;
  const payUsdPrice = fields.getUsdPxFor(payValue?.coin);
  const depositUsdAmount = calculateUsdValue({
    amount: payValue?.value,
    usdPrice: payUsdPrice,
  });
  const unmaturedShares = Number(userAsset?.unmaturedShares ?? 0);
  const affectedUnmaturedShares = isDeposit
    ? 0
    : Math.min(numericPayAmount, unmaturedShares);
  const affectedUnmaturedUsd = isDeposit
    ? depositUsdAmount
    : calculateAffectedUnmaturedUsd({
        withdrawShares: payValue?.value,
        unmaturedShares: userAsset?.unmaturedShares,
        unmaturedUsd: userAsset?.unmaturedDeposits,
      });
  const withdrawnPoolUsd = isDeposit
    ? depositUsdAmount
    : calculateProportionalWithdrawUsd({
        withdrawShares: payValue?.value,
        totalShares: userAsset?.totalDepositsShares,
        totalUsd: userAsset?.deposited,
      });
  const isDepositUsdPriceReady =
    !isDeposit || numericPayAmount <= 0 || payUsdPrice !== undefined;
  const hasNoActiveMeritsEpoch = isLpEstimateWithoutActiveEpoch(
    lpEstimate?.epochStartSec,
    lpEstimate?.epochEndSec,
  );
  const isMeritsPreviewReady =
    isMeritsSourceDataReady &&
    lpEstimate !== undefined &&
    meritsSeason !== undefined &&
    (hasNoActiveMeritsEpoch || isDepositUsdPriceReady);
  const meritsPreview =
    isMeritsPreviewReady &&
    !hasNoActiveMeritsEpoch &&
    lpEstimate &&
    meritsSeason
      ? calculateGenesisMeritsLockedPreview({
          action: isDeposit ? 'deposit' : 'withdraw',
          currentRewardRate: lpEstimate.rewardShare,
          currentBoostRate: lpEstimate.boostRewardShare,
          userRewardEligibleUsd,
          userBoostEligibleUsd,
          poolEligibleUsd,
          boostDeltaUsd: isDeposit ? depositUsdAmount : affectedUnmaturedUsd,
          poolDeltaUsd: withdrawnPoolUsd,
          firstDepositPoolEligibleUsd: targetPoolEligibleUsd,
          firstDepositWeight,
          estimatedMerits: lpEstimate.estimatedMerits,
          estimatedBoostMerits: lpEstimate.estimatedBoostMerits,
          settledMerits,
          lpPoolTotal: lpEstimate.lpPoolTotal,
          boostMultiplier: lpEstimate.boostMultiplier,
          epochStartSec: lpEstimate.epochStartSec,
          epochEndSec: lpEstimate.epochEndSec,
          seasonEndSec: meritsSeason.endMs / 1000,
          asOfSec: lpEstimate.asOfSec,
          nowSec: Math.floor(Date.now() / 1000),
        })
      : undefined;
  const meritsBefore = hasNoActiveMeritsEpoch
    ? settledMerits
    : (meritsPreview?.currentMeritsLocked ?? '0');
  const meritsAfter = hasNoActiveMeritsEpoch
    ? settledMerits
    : (meritsPreview?.nextMeritsLocked ?? meritsBefore);
  const phaseDisabled =
    isDeposit && (config?.phase === 'not_started' || config?.phase === 'ended');
  const phaseLabel =
    config?.phase === 'not_started'
      ? t`Coming Soon`
      : config?.phase === 'ended'
        ? t`Season 1 Has Ended`
        : t`Above Deposit Limit $0`;
  const meritsLost = hasNoActiveMeritsEpoch
    ? '0'
    : (meritsPreview?.meritsLost ?? '0');
  const hasWithdrawalLoss = hasGenesisWithdrawalLoss({ meritsLost });

  const handleSubmit = () => {
    if (isDeposit) {
      handleFormSubmitWithGuard();
      return;
    }
    if (withdrawWarningDismissed) {
      handleFormSubmitWithGuard();
      return;
    }
    if (affectedUnmaturedShares <= 0) {
      handleFormSubmitWithGuard();
      return;
    }
    if (!isMeritsPreviewReady) {
      setWithdrawWarningCheckPending(true);
      setWarnOpen(true);
      return;
    }
    if (!hasWithdrawalLoss) {
      handleFormSubmitWithGuard();
      return;
    }
    setWarnOpen(true);
  };

  useEffect(() => {
    if (!withdrawWarningCheckPending || !isMeritsPreviewReady) return;
    setWithdrawWarningCheckPending(false);
    if (hasWithdrawalLoss) return;
    setWarnOpen(false);
    handleFormSubmitWithGuard();
  }, [
    handleFormSubmitWithGuard,
    hasWithdrawalLoss,
    isMeritsPreviewReady,
    withdrawWarningCheckPending,
  ]);

  const handleWarningOpenChange = (nextOpen: boolean) => {
    setWarnOpen(nextOpen);
    if (!nextOpen) setWithdrawWarningCheckPending(false);
  };

  const handleNativeSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!isDeposit) {
      event.preventDefault();
      handleSubmit();
      return;
    }
    handleFormSubmitWithGuard(event);
  };

  return (
    <>
      <form onSubmit={handleNativeSubmit}>
        <VaultTradeInput
          label={fields.payingLabel}
          value={payValue}
          onChange={fields.onPaySzChange}
          isDeposit={isDeposit}
          variant="genesis"
          emphasized
          showBalance
          balance={fields.walletBalanceFormatted ?? '0'}
          balanceUnit={fields.payBalanceUnit}
          isLoading={fields.isBalanceLoading}
          keepInputOnLoading
          calcDecimal={fields.paySzCalcDecimals}
          displayDecimal={6}
          usdPx={fields.getUsdPxFor(payValue?.coin)}
          errorMessage={fields.limitErrorMessage}
          onErrorMessageClick={fields.onLimitErrorClick}
          inputSuffix={
            <TokenSuffix
              symbol={fields.payBalanceUnit}
              icon={fields.payTokenIcon}
            />
          }
        />

        <div className="mt-2">
          <VaultTradeInput
            label={fields.receiveLabel}
            value={receiveValue}
            onChange={() => undefined}
            isDeposit={isDeposit}
            showBalance={false}
            balanceUnit={fields.receiveBalanceUnit}
            disabled
            isLoading={fields.isQuoteLoading}
            keepInputOnLoading
            displayDecimal={6}
            usdPx={fields.getUsdPxFor(receiveValue?.coin)}
            inputSuffix={
              <TokenSuffix
                symbol={fields.receiveBalanceUnit}
                icon={fields.receiveTokenIcon}
              />
            }
          />
        </div>

        <div className="mt-2">
          <PoolFeeContent
            direction={direction}
            type={ActivityTabType.VAULT}
            marketAddress={vaultAddress}
            baseTokenName={fields.underlyingTokenSymbol}
            displayDirectRate={rateDisplay.displayDirectRate}
            displayReverseRate={rateDisplay.displayReverseRate}
            isRateLoading={rateDisplay.isLoading}
            isRateUnavailable={rateDisplay.isUnavailable}
            onRateRefresh={rateDisplay.refreshRate}
            rateRefreshTick={rateDisplay.refreshTick}
            quoteFeeFactor={quoteFeeFactor}
            inDialog={true}
          />
        </div>

        <div className="mt-2">
          <LockedValues
            showNextValue={numericPayAmount > 0}
            meritsBefore={meritsBefore}
            meritsAfter={meritsAfter}
            isMeritsLoading={!isMeritsPreviewReady}
          />
        </div>

        {phaseDisabled ? (
          <VaultTradeActionButton
            action="deposit"
            variant="genesis"
            disabled
            className="mt-3 h-8 rounded-xl font-medium"
          >
            {phaseLabel}
          </VaultTradeActionButton>
        ) : showCountdown ? (
          <MarketOpenCountdownButton
            direction={direction}
            now={now}
            nextMarketOpenTime={nextMarketOpenTime}
            label={labels.marketOpensIn}
            className="mt-3 h-8 rounded-xl font-medium"
          />
        ) : (
          <PoolTradeFormBtn
            direction={direction}
            variant="genesis"
            buttonState={effectiveValidation.buttonState}
            buttonText={effectiveValidation.buttonText}
            isDisabled={effectiveValidation.isDisabled}
            isLoading={effectiveValidation.isLoading}
            onApprove={handleApproveWithLoading}
            onSubmit={handleSubmit}
            submitViaForm={false}
            className="mt-3 h-8 rounded-xl font-medium"
          />
        )}
      </form>

      <MeritsBoostLostWarningDialog
        open={warnOpen}
        onOpenChange={handleWarningOpenChange}
        meritsLost={unitFormat(meritsLost, 2)}
        isMeritsLoading={!isMeritsPreviewReady}
        boostLostMultiplier={thoFormat(
          lpEstimate?.boostExtraMultiplier ?? 0,
          GENESIS_INTEGER_FORMAT_OPTIONS,
        )}
        onConfirm={(dontShowAgain) => {
          if (dontShowAgain) setWithdrawWarningDismissed(true);
          setWithdrawWarningCheckPending(false);
          setWarnOpen(false);
          handleFormSubmitWithGuard();
        }}
      />
    </>
  );
};

export const DepositDialog = ({
  open,
  onOpenChange,
  config,
  position,
  meritsSeason,
  isPositionValuationReady,
  vaultKey,
  onVaultChange,
}: DepositDialogProps) => {
  const { t } = useLingui();
  const [tab, setTab] = useState<DepositTabValue>('deposit');
  const { data: lpEstimate } = useGenesisLpEstimate();
  const { data: meritsUserSummary } = useGenesisMeritsUserSummary(
    meritsSeason?.seasonId,
  );
  const isLpEstimateCurrent = useIsLpEstimateCurrent(lpEstimate?.epochEndSec);
  const isLpEstimateInactive = isLpEstimateWithoutActiveEpoch(
    lpEstimate?.epochStartSec,
    lpEstimate?.epochEndSec,
  );

  useEffect(() => {
    if (open) setTab('deposit');
  }, [open]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setTab('deposit');
    onOpenChange(nextOpen);
  };

  const isDeposit = tab === 'deposit';
  const isSwap = ENABLE_SWAP && tab === 'swap';
  const assetConfig =
    findGenesisAssetByVaultKey(config?.assets, vaultKey) ?? config?.assets[0];
  const asset = assetConfig?.symbol ?? 'USDT';
  const userAsset = findGenesisUserAsset(position, assetConfig);
  const userRewardEligibleUsd = useMemo(
    () =>
      sumGenesisDecimalValues(
        position?.perAsset.map((item) => item.deposited) ?? [],
      ).toFixed(),
    [position?.perAsset],
  );
  const userBoostEligibleUsd = useMemo(
    () =>
      sumGenesisDecimalValues(
        position?.perAsset.map((item) => item.unmaturedDeposits) ?? [],
      ).toFixed(),
    [position?.perAsset],
  );
  const poolEligibleUsd = config?.meritsPoolUsd ?? '0';
  const targetPoolEligibleUsd = assetConfig?.meritsPoolUsd ?? '0';
  const firstDepositWeight = String(
    1 / Math.max(config?.assets.length ?? 0, 1),
  );
  const vaultAddress = assetConfig?.vaultAddress;
  const cycleAsset = () => {
    const assets = config?.assets ?? [];
    if (!assets.length) return;
    const index = Math.max(
      0,
      assets.findIndex((item) => getGenesisVaultKey(item) === vaultKey),
    );
    const nextAsset = assets[(index + 1) % assets.length] ?? assets[0];
    if (nextAsset) onVaultChange(getGenesisVaultKey(nextAsset));
  };
  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="block max-h-[calc(100dvh-32px)] w-[690px] max-w-[690px] gap-0 overflow-x-hidden overflow-y-auto rounded-xl p-0 shadow-[-40px_10px_80px_0_rgba(0,0,0,0.1)] max-md:max-h-[calc(100dvh-70px)] max-md:rounded-t-2xl max-md:rounded-b-none max-md:p-4 md:min-h-[532px] md:!w-[690px]"
          closeClassName="top-3 right-3 max-md:top-4 max-md:right-4"
        >
          <Image
            src={getGenesisAssetVisual(asset).background}
            alt=""
            aria-hidden="true"
            width={289}
            height={289}
            quality={100}
            className="pointer-events-none absolute -top-30 right-0 size-[289px] max-w-none select-none"
          />

          <DialogTitle className="text-t-1100 absolute top-3 left-3 z-10 text-base font-medium max-md:top-4 max-md:left-4">
            {t`Genesis Vault`}
          </DialogTitle>
          <FeatureMarquee config={config} />

          <div className="mt-[90px] grid w-full grid-cols-[260px_394px] items-start gap-3 px-3 pb-3 max-md:mt-[84px] max-md:grid-cols-1 max-md:px-0 max-md:pb-0">
            <VaultOverview
              assetConfig={assetConfig}
              userAsset={userAsset}
              config={config}
              onCycleAsset={cycleAsset}
            />

            <div className="w-[394px] max-md:w-full">
              <TradeTabs
                value={tab}
                onValueChange={(value) => {
                  if (value === 'swap' && !ENABLE_SWAP) return;
                  setTab(value as DepositTabValue);
                }}
                disableAnimation
                labelClassName="data-[state=active]:text-t-1100 text-xs"
                activeBarClassName="bg-bg-4"
                listClassName={ENABLE_SWAP ? 'gap-0' : 'gap-0 !grid-cols-2'}
                contentWrapClassName="hidden"
                options={[
                  {
                    value: 'deposit',
                    label: t`Deposit`,
                  },
                  {
                    value: 'withdraw',
                    label: t`Withdraw`,
                  },
                  ...(ENABLE_SWAP
                    ? [
                        {
                          value: 'swap' as const,
                          label: t`Swap`,
                        },
                      ]
                    : []),
                ]}
              />

              <div className="mt-3 overscroll-contain">
                <AnimatedHeight>
                  {!isSwap ? (
                    vaultAddress ? (
                      <GenesisVaultTradeForm
                        key={`${vaultAddress}-${tab}`}
                        direction={
                          isDeposit
                            ? LiqTradeType.Deposit
                            : LiqTradeType.Withdraw
                        }
                        vaultAddress={vaultAddress}
                        config={config}
                        userAsset={userAsset}
                        userRewardEligibleUsd={userRewardEligibleUsd}
                        userBoostEligibleUsd={userBoostEligibleUsd}
                        settledMerits={
                          meritsUserSummary?.settledLpMerits ?? '0'
                        }
                        poolEligibleUsd={poolEligibleUsd}
                        targetPoolEligibleUsd={targetPoolEligibleUsd}
                        firstDepositWeight={firstDepositWeight}
                        meritsSeason={meritsSeason}
                        lpEstimate={lpEstimate}
                        isMeritsSourceDataReady={
                          config?.meritsPoolUsd !== undefined &&
                          assetConfig?.meritsPoolUsd !== undefined &&
                          position !== undefined &&
                          isPositionValuationReady &&
                          meritsUserSummary !== undefined &&
                          (isLpEstimateCurrent || isLpEstimateInactive)
                        }
                      />
                    ) : (
                      <div className="bg-bg-4 h-[420px] animate-pulse rounded-xl" />
                    )
                  ) : (
                    <SwapPanel
                      variant="trade"
                      genesisAssetSymbol={asset}
                      genesisPresentation
                      actionButtonClassName="bg-accent hover:bg-accent/90 disabled:bg-bg-5 disabled:text-t-430 disabled:hover:bg-bg-5 text-black disabled:opacity-100"
                    />
                  )}
                </AnimatedHeight>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
