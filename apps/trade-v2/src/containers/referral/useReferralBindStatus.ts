import { useMemo } from 'react';
import {
  useConnectionStatus,
  useCurrentAccountAddress,
  usePrivy,
} from '@/common/chainClient';
import { useReferralStore } from './referralStore';

type ReferralBindView =
  | 'loading'
  | 'disconnected'
  | 'show-tabs';

export const useReferralBindStatus = () => {
  const connectionStatus = useConnectionStatus();
  const { ready, runtimeReady } = usePrivy();
  const currentAddress = useCurrentAccountAddress();
  const hasHydrated = useReferralStore((state) => state.hasHydrated);
  const skippedAddresses = useReferralStore((state) => state.skippedAddresses);

  return useMemo(() => {
    const address = currentAddress.toLowerCase();

    if (connectionStatus === 'disconnected') {
      return { view: 'disconnected' as ReferralBindView, address: '' };
    }

    if (!ready || !runtimeReady || connectionStatus === 'unknown') {
      return { view: 'loading' as ReferralBindView, address };
    }

    if (!address) {
      return { view: 'disconnected' as ReferralBindView, address: '' };
    }

    if (!hasHydrated) {
      return { view: 'loading' as ReferralBindView, address };
    }

    const hasSkipped = !!skippedAddresses[address];

    return {
      view: 'show-tabs' as ReferralBindView,
      address,
      hasSkipped,
    };
  }, [
    connectionStatus,
    currentAddress,
    hasHydrated,
    ready,
    runtimeReady,
    skippedAddresses,
  ]);
};
