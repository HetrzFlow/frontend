'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@repo/i18n/const';
import { useGlobalStore } from '@/common/stores';
import { getFirstVisitDialogState } from './dialogState';

const DisclaimerDialog = dynamic(() => import('./DisclaimerDialog'), {
  ssr: false,
});

interface FirstVisitProps {
  disabled?: boolean;
}

const FirstVisit = ({ disabled = false }: FirstVisitProps) => {
  const pathname = usePathname();
  const hasAcceptedInviteCodeDialog = useGlobalStore(
    (state) => state.hasAcceptedInviteCodeDialog,
  );
  const pathSegments = pathname.split('/').filter(Boolean);
  const routeIndex = SUPPORTED_LOCALES.includes(pathSegments[0] ?? '') ? 1 : 0;
  const isGenesisPage = pathSegments[routeIndex] === 'genesis';
  const { shouldShowFirstVisitDialog } = getFirstVisitDialogState({
    hasAcceptedInviteCodeDialog,
    disabled: disabled || isGenesisPage,
  });

  return shouldShowFirstVisitDialog ? <DisclaimerDialog show /> : null;
};

export default FirstVisit;
