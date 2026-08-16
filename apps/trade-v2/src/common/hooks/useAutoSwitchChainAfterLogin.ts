'use client';

import { useEffect, useRef } from 'react';
import { useHzSdk, useIsConnect } from '@/common/chainClient/hooks';
import { useActiveWallet, usePrivy } from '@/common/chainClient/privyCompat';

export const useAutoSwitchChainAfterLogin = () => {
  const { authenticated } = usePrivy();
  const isConnected = useIsConnect();
  const { wallet } = useActiveWallet();
  const hzSdk = useHzSdk();
  const shouldSwitchAfterLoginRef = useRef(false);

  useEffect(() => {
    if (!shouldSwitchAfterLoginRef.current) return;
    if (!authenticated || !isConnected || !wallet) return;

    shouldSwitchAfterLoginRef.current = false;

    if (hzSdk?.chainId && 'switchChain' in wallet) {
      wallet.switchChain(hzSdk.chainId).catch(() => undefined);
    }
  }, [authenticated, isConnected, wallet, hzSdk?.chainId]);

  return {
    armSwitchAfterLogin: () => {
      shouldSwitchAfterLoginRef.current = true;
    },
  };
};
