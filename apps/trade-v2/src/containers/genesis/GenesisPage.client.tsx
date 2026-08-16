'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import { useConnectWallet } from '@/common/chainClient/privyCompat';
import { useActivities } from '@/common/services/rest/activity';
import { normalizeReferralCode } from '@/containers/referral/referralCodeValidation';
import { useReferralStore } from '@/containers/referral/referralStore';
import {
  useGenesisSocialState,
  useGenesisOverview,
  useGenesisMeritsEpoch,
  useGenesisMeritsSeasons,
  useGenesisUserPosition,
  useGenesisVaultConfig,
} from '@/queries/bsc/genesis';
import { useVaultsList } from '@/queries/bsc/vaults';
import { useHzvConfigs } from '@/queries/bsc/vaults/configs';
import { GenesisHero } from './components/GenesisHero';
import GenesisNoiseBackground from './components/GenesisNoiseBackground';
import { GenesisVaultCard } from './components/GenesisVaultCard';
import { YourContribution } from './components/YourContribution';
import { useGenesisVaultData } from './hooks/useGenesisVaultData';
import { useGenesisAccessStore } from './stores/genesisAccessStore';
import type { GenesisViewState } from './lib/types';

const HEADER_SCROLLED_CLASSES = [
  'bg-transparent',
  'backdrop-blur-[20px]',
] as const;
const CONTRIBUTION_HEADER_GAP = 16;
const MAX_TIMEOUT_MS = 2_147_000_000;

const ReferralBar = dynamic(() =>
  import('./components/ReferralBar').then((module) => module.ReferralBar),
);
const DepositDialog = dynamic(() =>
  import('./dialogs/DepositDialog').then((module) => module.DepositDialog),
);
const RiskConfirmationDialog = dynamic(() =>
  import('./dialogs/RiskConfirmationDialog').then(
    (module) => module.RiskConfirmationDialog,
  ),
);

const useSeasonBoundaryNow = (startMs?: number, endMs?: number) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setNowMs(Date.now());
  }, [endMs, startMs]);

  useEffect(() => {
    const currentNowMs = Date.now();
    const nextBoundaryMs = [startMs, endMs]
      .filter(
        (boundaryMs): boundaryMs is number =>
          boundaryMs !== undefined && boundaryMs > currentNowMs,
      )
      .sort((a, b) => a - b)[0];
    if (nextBoundaryMs === undefined) return;

    const timer = window.setTimeout(
      () => setNowMs(Date.now()),
      Math.min(nextBoundaryMs - currentNowMs + 50, MAX_TIMEOUT_MS),
    );
    return () => window.clearTimeout(timer);
  }, [endMs, nowMs, startMs]);

  return nowMs;
};

const GenesisPageInner = () => {
  const connectionStatus = useConnectionStatus();
  const { connectWallet } = useConnectWallet();
  const hasAccessStoreHydrated = useGenesisAccessStore(
    (state) => state.hasHydrated,
  );
  const hasAcceptedAgreement = useGenesisAccessStore(
    (state) => state.hasAcceptedAgreement,
  );
  const { data: genesisConfig } = useGenesisVaultConfig();
  const { data: genesisOverview } = useGenesisOverview();
  const { data: meritsSeasons } = useGenesisMeritsSeasons();
  const activeMeritsSeason = useMemo(
    () =>
      meritsSeasons
        ? [...meritsSeasons].sort((a, b) => a.startMs - b.startMs)[0]
        : undefined,
    [meritsSeasons],
  );
  const seasonNowMs = useSeasonBoundaryNow(
    activeMeritsSeason?.startMs,
    activeMeritsSeason?.endMs,
  );
  const { data: meritsEpoch } = useGenesisMeritsEpoch(
    activeMeritsSeason?.seasonId,
  );
  const { data: genesisPosition } = useGenesisUserPosition();
  const { data: socialState } = useGenesisSocialState();
  const { data: vaultsData } = useVaultsList();
  const { data: hzvConfigs } = useHzvConfigs();
  const { data: activityData } = useActivities({ isPredeposit: true });
  const setPendingRefCode = useReferralStore(
    (state) => state.setPendingRefCode,
  );
  const activities = useMemo(
    () => activityData?.pages.flatMap((page) => page.activities),
    [activityData?.pages],
  );
  const positionWithAccess = useMemo(
    () =>
      genesisPosition
        ? { ...genesisPosition, hasAcceptedAgreement }
        : undefined,
    [genesisPosition, hasAcceptedAgreement],
  );
  const { config, position, isProgressReady, isPositionValuationReady } =
    useGenesisVaultData({
      config: genesisConfig,
      overview: genesisOverview,
      position: positionWithAccess,
      vaults: vaultsData?.items,
      activities,
      hzvConfigs,
      meritsSeason: activeMeritsSeason,
      seasonNowMs,
    });

  const [agreementOpen, setAgreementOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [selectedVaultKey, setSelectedVaultKey] = useState('');
  const [shouldScrollToContribution, setShouldScrollToContribution] =
    useState(false);
  const contributionRef = useRef<HTMLDivElement>(null);

  const isConnected = connectionStatus === 'connected';
  const isConnectionPending = connectionStatus === 'unknown';
  const accessFlowEnabled =
    config !== undefined &&
    config.phase !== 'not_started' &&
    config.phase !== 'ended';

  const viewState: GenesisViewState = useMemo(() => {
    if (!isConnected) return 'disconnected';
    if (!position?.hasAcceptedAgreement) return 'needs_agreement';
    if (!position?.hasDeposited) return 'no_deposit';
    return 'deposited';
  }, [isConnected, position?.hasAcceptedAgreement, position?.hasDeposited]);
  const isAdmitted = viewState === 'no_deposit' || viewState === 'deposited';
  const hasValidDeposit = viewState === 'deposited';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = normalizeReferralCode(
      params.get('ref') ?? params.get('code') ?? '',
    );
    if (refCode) setPendingRefCode(refCode);
  }, [setPendingRefCode]);

  // Wait for persisted access state before deciding whether to show the
  // agreement, otherwise the dialog can flash before rehydration completes.
  useEffect(() => {
    if (
      !accessFlowEnabled ||
      !hasAccessStoreHydrated ||
      position === undefined ||
      viewState !== 'needs_agreement'
    ) {
      setAgreementOpen(false);
      return;
    }
    setAgreementOpen(true);
  }, [accessFlowEnabled, hasAccessStoreHydrated, position, viewState]);

  useEffect(() => {
    if (!shouldScrollToContribution || !isAdmitted || agreementOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const contribution = contributionRef.current;
      const scrollRoot = contribution?.closest<HTMLElement>(
        'main[data-app-scroll]',
      );
      const header = document.querySelector<HTMLElement>('[data-site-header]');
      if (!contribution || !scrollRoot || !header) return;

      const targetTop =
        scrollRoot.scrollTop +
        contribution.getBoundingClientRect().top -
        scrollRoot.getBoundingClientRect().top -
        header.offsetHeight -
        CONTRIBUTION_HEADER_GAP;

      scrollRoot.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
      setShouldScrollToContribution(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [agreementOpen, isAdmitted, shouldScrollToContribution]);

  useEffect(() => {
    const scrollRoot = document.querySelector('main');
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    if (!(scrollRoot instanceof HTMLElement) || !header) return;

    const syncHeaderState = () => {
      const isScrolled = scrollRoot.scrollTop > 0;
      for (const className of HEADER_SCROLLED_CLASSES) {
        header.classList.toggle(className, isScrolled);
      }
    };

    syncHeaderState();
    scrollRoot.addEventListener('scroll', syncHeaderState, { passive: true });

    return () => {
      scrollRoot.removeEventListener('scroll', syncHeaderState);
      for (const className of HEADER_SCROLLED_CLASSES) {
        header.classList.remove(className);
      }
    };
  }, []);

  const handleStartEarning = () => {
    if (isConnectionPending || !hasAccessStoreHydrated || !config) return;
    if (connectionStatus === 'disconnected') {
      void connectWallet();
      return;
    }
    if (!accessFlowEnabled) return;
    if (viewState === 'needs_agreement') {
      setAgreementOpen(true);
      return;
    }
    setShouldScrollToContribution(true);
  };

  const handleOpenVault = (vaultKey: string) => {
    setSelectedVaultKey(vaultKey);
    setDepositOpen(true);
  };

  const showSeasonContent =
    config !== undefined && config.phase !== 'not_started';
  const isNotStarted = !config || config.phase === 'not_started';
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center">
      <GenesisNoiseBackground centered={isNotStarted} />
      <GenesisHero
        config={config}
        isConnected={isConnected}
        onStartEarning={handleStartEarning}
        startEarningPending={isConnectionPending}
      />

      {showSeasonContent ? (
        <div className="mx-auto w-[calc(100%-32px)] max-w-[1080px] max-md:relative max-md:z-10 max-md:-mt-[41px]">
          <div className="flex flex-col pb-20 max-md:gap-3 max-md:pb-24">
            <GenesisVaultCard
              config={config}
              isProgressReady={isProgressReady}
              overview={genesisOverview}
              meritsSeason={activeMeritsSeason}
              meritsEpoch={meritsEpoch}
            />

            {isAdmitted ? (
              <div ref={contributionRef} className="mt-5 max-md:my-1">
                <YourContribution
                  config={config}
                  position={position}
                  onOpenVault={handleOpenVault}
                />
              </div>
            ) : null}

            {isAdmitted ? (
              <div className="mt-3 max-md:mt-0">
                <ReferralBar
                  config={config}
                  hasDeposit={hasValidDeposit}
                  socialState={socialState}
                  position={position}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {agreementOpen ? (
        <RiskConfirmationDialog
          open
          onOpenChange={setAgreementOpen}
          onAccepted={() => setShouldScrollToContribution(true)}
          config={config}
        />
      ) : null}
      {depositOpen ? (
        <DepositDialog
          open
          onOpenChange={setDepositOpen}
          config={config}
          position={position}
          meritsSeason={activeMeritsSeason}
          isPositionValuationReady={isPositionValuationReady}
          vaultKey={selectedVaultKey}
          onVaultChange={setSelectedVaultKey}
        />
      ) : null}
    </div>
  );
};

export const GenesisPageClient = () => {
  return <GenesisPageInner />;
};
