'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import { useIsConnect } from '../../chainClient';
import { useGlobalStore } from '../../stores/globalStore';
import OnboardingDialog, { ImagePreloader } from './OnboardingDialog';
import RiskNoticeDialog from './RiskNoticeDialog';

export const FirstVisit = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const showRiskNoticeDialog = useGlobalStore(
    (state) => state.showRiskNoticeDialog,
  );
  const showOnboardingDialog = useGlobalStore(
    (state) => state.showOnboardingDialog,
  );
  const isConnect = useIsConnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && <ImagePreloader theme={theme} />}
      {isConnect && showRiskNoticeDialog && <RiskNoticeDialog />}
      {showOnboardingDialog && !showRiskNoticeDialog && <OnboardingDialog />}
    </>
  );
};
