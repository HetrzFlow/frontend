'use client';

import { useTheme } from 'next-themes';
import { useLingui } from '@lingui/react/macro';
import { OnboardIcons } from '@repo/ui';
import { useGlobalStore } from '../../../stores/globalStore';

export const OnboardSwitch: React.FC = () => {
  const { t } = useLingui();
  const { theme } = useTheme();
  const showOnboardingDialog = useGlobalStore(
    (state) => state.showOnboardingDialog,
  );
  const onOnboardingDialogOpen = useGlobalStore(
    (state) => state.onOnboardingDialogOpen,
  );
  const onOnboardingDialogClose = useGlobalStore(
    (state) => state.onOnboardingDialogClose,
  );

  return (
    <div className="flex items-center justify-between gap-2 p-2 pt-0">
      <span className="text-t-350">{t`Onboard`}</span>
      <div className="flex gap-1">
        <div
          className={`hover:text-t-1100 hover:bg-bg-3 size-8 cursor-pointer rounded-lg hover:transition-[background] ${
            showOnboardingDialog
              ? 'bg-bg-3 text-t-1100'
              : 'text-t-350 bg-transparent'
          }`}
          onClick={() => {
            onOnboardingDialogOpen(true);
          }}
        >
          <OnboardIcons.visible className="mx-auto mt-2" size={16} />
        </div>{' '}
        <div
          className={`hover:text-t-1100 hover:bg-bg-3 size-8 cursor-pointer rounded-lg hover:transition-[background] ${
            !showOnboardingDialog
              ? 'bg-bg-3 text-t-1100'
              : 'text-t-350 bg-transparent'
          }`}
          onClick={() => {
            onOnboardingDialogClose(true);
          }}
        >
          <OnboardIcons.invisible className="mx-auto mt-2" size={16} />
        </div>{' '}
      </div>
    </div>
  );
};
