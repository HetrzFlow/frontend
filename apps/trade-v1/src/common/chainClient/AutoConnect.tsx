import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  useConnectWallet,
  useCurrentAccount,
  useWallets,
} from '@mysten/dapp-kit';
import { useShallow } from 'zustand/react/shallow';
import { useWalletStore } from '../stores/walletStore';

const AutoConnect: FC = () => {
  const { mutateAsync: connectWallet } = useConnectWallet();
  const [
    recentWalletName,
    recentAccountAddress,
    setRecentAccountAddress,
    setAutoConnectStatus,
  ] = useWalletStore(
    useShallow((state) => [
      state.recentWalletName,
      state.recentAccountAddress,
      state.setRecentAccountAddress,
      state.setAutoConnectStatus,
    ]),
  );
  const wallets = useWallets();
  const currentAccount = useCurrentAccount();
  // record recentAccountAddress
  const recentAccountAddressRef = useRef(recentAccountAddress);
  recentAccountAddressRef.current = recentAccountAddress;

  const [clientOnly, setClientOnly] = useState(false);
  useLayoutEffect(() => {
    setClientOnly(true);
  }, []);

  const isCurrentAccountUpdated = useRef(false);

  useEffect(() => {
    if (!isCurrentAccountUpdated.current) {
      isCurrentAccountUpdated.current = true;
    } else {
      // update store
      setRecentAccountAddress(currentAccount?.address || '');
      recentAccountAddressRef.current = currentAccount?.address || '';
    }
  }, [currentAccount, setRecentAccountAddress]);

  // handle reconnect
  useEffect(() => {
    if (!clientOnly) {
      return () => {};
    }
    const wallet = wallets.find(
      (wallet) => (wallet.id || wallet.name) === recentWalletName,
    );
    let timer: ReturnType<typeof setTimeout>;
    // reconnect

    if (
      !currentAccount &&
      recentAccountAddressRef.current &&
      recentWalletName
    ) {
      if (wallet) {
        connectWallet({
          wallet,
          accountAddress: recentAccountAddressRef.current,
          silent: true,
        }).finally(() => {
          setAutoConnectStatus('attempted');
        });
      } else {
        // delay 1s to update autoconnectstatus
        timer = setTimeout(() => {
          setAutoConnectStatus('attempted');
        }, 1000);
      }
    } else {
      setAutoConnectStatus('attempted');
    }

    return () => {
      clearTimeout(timer);
    };
  }, [
    clientOnly,
    currentAccount,
    recentWalletName,
    wallets,
    connectWallet,
    setAutoConnectStatus,
  ]);

  return null;
};

export default AutoConnect;
