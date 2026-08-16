'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useReferralProfile } from '@/common/hooks/useReferralProfile';
import { useReferralTierRules } from '@/common/hooks/useReferralTierRules';
import type { ReferralTierRules } from '@/services/rest/referralTierRules';
import { loadReferralConnectedDashboard } from './referralLazy';
import { ReferralClientLoadingShell } from './ReferralLoadingShell';
import { useReferralStore } from './referralStore';

const ReferralConnectedDashboard = dynamic(
  loadReferralConnectedDashboard,
  {
    ssr: false,
    loading: () => <ReferralClientLoadingShell />,
  },
);

const ReferralCodeOverlay = dynamic(() => import('./ReferralCodeOverlay'), {
  ssr: false,
  loading: () => <ReferralCodeOverlayFallback />,
});

const ReferralCodeOverlayFallback = () => (
  <div className="fixed inset-0 z-[60] bg-black" />
);

type OverlayAction = 'bind' | 'skip' | null;
type OverlayStage = 'hidden' | 'idle' | 'success' | 'exiting';

interface ReferralConnectedContentProps {
  address: string;
  hasSkipped: boolean;
  initialTierRules?: ReferralTierRules | null;
  queryRefCode?: string;
  referralCodeFromLink?: string;
  shouldFocusBindReferral: boolean;
  shouldOpenCreateReferralCodeDialog: boolean;
}

const ReferralConnectedContent: FC<ReferralConnectedContentProps> = ({
  initialTierRules,
  address,
  hasSkipped,
  queryRefCode,
  referralCodeFromLink,
  shouldFocusBindReferral,
  shouldOpenCreateReferralCodeDialog,
}) => {
  const clearPendingRefCode = useReferralStore(
    (state) => state.clearPendingRefCode,
  );
  const skipForAddress = useReferralStore((state) => state.skipForAddress);
  const setOverlayActive = useReferralStore((state) => state.setOverlayActive);
  const [overlayStage, setOverlayStage] = useState<OverlayStage>('hidden');
  const [overlayAction, setOverlayAction] = useState<OverlayAction>(null);
  const [dismissedAutoChangeCodes, setDismissedAutoChangeCodes] = useState<
    Set<string>
  >(() => new Set());
  const bindExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: profile } = useReferralProfile();
  const { data: tierRules } = useReferralTierRules(initialTierRules);
  const isBound = profile?.has_bound_referrer === true;
  const shouldShowOverlay =
    profile?.has_bound_referrer === false && !hasSkipped;

  const autoChangeCode =
    isBound && queryRefCode && !dismissedAutoChangeCodes.has(queryRefCode)
      ? queryRefCode
      : undefined;
  const shouldMountOverlay = overlayStage !== 'hidden';
  const shouldRenderOverlay = shouldShowOverlay || shouldMountOverlay;
  const successDiscountBps = useMemo(() => {
    if (profile?.current_discount_bps && profile.current_discount_bps > 0) {
      return profile.current_discount_bps;
    }

    const fallbackTier =
      tierRules?.tiers?.find((tier) => tier.is_default) ??
      tierRules?.tiers?.[0];
    return fallbackTier?.trader_discount_bps ?? 0;
  }, [profile?.current_discount_bps, tierRules?.tiers]);

  useEffect(() => {
    setOverlayActive(shouldShowOverlay || shouldMountOverlay);
  }, [setOverlayActive, shouldMountOverlay, shouldShowOverlay]);

  useEffect(() => {
    return () => {
      setOverlayActive(false);
    };
  }, [setOverlayActive]);

  useEffect(() => {
    if (isBound) {
      clearPendingRefCode();
    }
  }, [clearPendingRefCode, isBound]);

  useEffect(() => {
    if (shouldShowOverlay) {
      if (overlayStage === 'hidden' && overlayAction === null) {
        setOverlayStage('idle');
      }
      return;
    }

    if (overlayStage === 'idle') {
      setOverlayStage('hidden');
      return;
    }

    if (overlayStage === 'hidden' && overlayAction !== null) {
      setOverlayAction(null);
    }
  }, [overlayAction, overlayStage, shouldShowOverlay]);

  useEffect(() => {
    return () => {
      if (bindExitTimerRef.current) {
        clearTimeout(bindExitTimerRef.current);
        bindExitTimerRef.current = null;
      }
    };
  }, []);

  const handleAutoChangeDialogClose = useCallback((code: string) => {
    setDismissedAutoChangeCodes((prev) => {
      if (prev.has(code)) return prev;
      const next = new Set(prev);
      next.add(code);
      return next;
    });
  }, []);

  const handleOverlayAction = useCallback(
    (action: Exclude<OverlayAction, null>) => {
      if (overlayStage === 'exiting') return;

      setOverlayAction(action);
      setOverlayStage('exiting');
    },
    [overlayStage],
  );

  const handleOverlayBindSuccess = () => {
    clearPendingRefCode();
    setOverlayAction('bind');
    setOverlayStage('success');
    bindExitTimerRef.current = setTimeout(() => {
      bindExitTimerRef.current = null;
      handleOverlayAction('bind');
    }, 1500);
  };

  const handleOverlayExited = () => {
    if (overlayAction === 'skip' && address) {
      skipForAddress(address);
    }

    setOverlayStage('hidden');
  };

  return (
    <>
      {shouldRenderOverlay ? (
        <ReferralCodeOverlay
          initialCode={referralCodeFromLink}
          isExiting={overlayStage === 'exiting'}
          bindSucceeded={overlayStage === 'success'}
          discountBps={successDiscountBps}
          onBindSuccess={handleOverlayBindSuccess}
          onSkip={() => handleOverlayAction('skip')}
          onExited={handleOverlayExited}
        />
      ) : null}

      {!shouldMountOverlay ? (
        <ReferralConnectedDashboard
          initialTierRules={initialTierRules}
          initialBindCode={hasSkipped ? referralCodeFromLink : undefined}
          autoChangeCode={autoChangeCode}
          editInitialCode={queryRefCode}
          onAutoChangeDialogClose={handleAutoChangeDialogClose}
          focusBindInputOnMount={shouldFocusBindReferral}
          isBound={isBound}
          isLoading={false}
          openCreateCodeDialogOnMount={shouldOpenCreateReferralCodeDialog}
        />
      ) : null}
    </>
  );
};

export default ReferralConnectedContent;
