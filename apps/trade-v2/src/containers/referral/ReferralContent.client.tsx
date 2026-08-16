'use client';

import { FC, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ReferralTierRules } from '@/services/rest/referralTierRules';
import { normalizeReferralCode } from './referralCodeValidation';
import ReferralDisconnectedLanding from './ReferralDisconnectedLanding';
import { loadReferralConnectedContent } from './referralLazy';
import { ReferralClientLoadingShell } from './ReferralLoadingShell';
import { useReferralStore } from './referralStore';
import { useReferralBindStatus } from './useReferralBindStatus';

const ReferralConnectedContent = dynamic(
  loadReferralConnectedContent,
  {
    ssr: false,
    loading: () => <ReferralClientLoadingShell />,
  },
);

interface ReferralContentProps {
  initialTierRules?: ReferralTierRules | null;
  searchParams?: {
    createReferralCode?: string;
    focusBindReferral?: string;
    ref?: string;
  };
}

const ReferralContentInner: FC<ReferralContentProps> = ({
  initialTierRules,
  searchParams,
}) => {
  const shouldFocusBindReferral = searchParams?.focusBindReferral === '1';
  const shouldOpenCreateReferralCodeDialog =
    searchParams?.createReferralCode === '1';
  const {
    view,
    address,
    hasSkipped = false,
  } = useReferralBindStatus();
  const pendingRefCode = useReferralStore((state) => state.pendingRefCode);
  const setPendingRefCode = useReferralStore(
    (state) => state.setPendingRefCode,
  );
  const clearPendingRefCode = useReferralStore(
    (state) => state.clearPendingRefCode,
  );
  const setOverlayActive = useReferralStore((state) => state.setOverlayActive);

  const queryRefCode = normalizeReferralCode(searchParams?.ref ?? '') || undefined;
  const referralCodeFromLink = queryRefCode ?? pendingRefCode ?? undefined;
  const isDisconnected = view === 'disconnected';
  const isLoadingView = view === 'loading';

  useEffect(() => {
    if (!isLoadingView) return;

    setOverlayActive(true);
    return () => {
      setOverlayActive(false);
    };
  }, [isLoadingView, setOverlayActive]);

  useEffect(() => {
    if (queryRefCode) {
      setPendingRefCode(queryRefCode);
      return;
    }

    clearPendingRefCode();
  }, [clearPendingRefCode, queryRefCode, setPendingRefCode]);

  if (isDisconnected) {
    return <ReferralDisconnectedLanding />;
  }

  if (isLoadingView) {
    return <ReferralClientLoadingShell />;
  }

  return (
    <ReferralConnectedContent
      key={address}
      initialTierRules={initialTierRules}
      address={address}
      hasSkipped={hasSkipped}
      queryRefCode={queryRefCode}
      referralCodeFromLink={referralCodeFromLink}
      shouldFocusBindReferral={shouldFocusBindReferral}
      shouldOpenCreateReferralCodeDialog={shouldOpenCreateReferralCodeDialog}
    />
  );
};

const ReferralContent: FC<ReferralContentProps> = (props) => {
  return (
    <Suspense fallback={<ReferralClientLoadingShell />}>
      <ReferralContentInner {...props} />
    </Suspense>
  );
};

export default ReferralContent;
