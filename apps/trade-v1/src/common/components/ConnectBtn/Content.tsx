import { FC, useEffect, useState } from 'react';
import { useConnectWallet, useWallets } from '@mysten/dapp-kit';

import { useWalletStore } from '../../stores/walletStore';
import WalletList from './WalletList';
import WalletOpenFailed from './WalletOpenFailed';
import WalletOpening from './WalletOpening';

interface ContentProps {
  status: string;
  onWalletConnected: () => void;
  onWalletSelect: (walletName: string) => void;
  onOpenWalletFailed: () => void;
}

const Content: FC<ContentProps> = ({
  status,
  onWalletConnected,
  onWalletSelect,
  onOpenWalletFailed,
}) => {
  const {
    mutateAsync: connectWallet,
    isSuccess,
    isError,
    error,
  } = useConnectWallet();

  const setRecentWalletName = useWalletStore(
    (state) => state.setRecentWalletName,
  );
  const [selectedWallet, setSelectedWallet] = useState<
    ReturnType<typeof useWallets>[0] | null
  >(null);

  // connect successfully
  useEffect(() => {
    if (isSuccess && selectedWallet) {
      setRecentWalletName(selectedWallet);
      onWalletConnected();
    }
  }, [isSuccess, onWalletConnected, setRecentWalletName, selectedWallet]);

  // connect failed
  useEffect(() => {
    if (isError) {
      onOpenWalletFailed();
    }
  }, [isError, onOpenWalletFailed]);

  return (
    <>
      {status === 'select' && (
        <WalletList
          onWalletSelect={(wallet) => {
            setSelectedWallet(wallet);
            onWalletSelect(wallet.name);
            connectWallet({ wallet }).then(() => {
              setRecentWalletName(wallet);
            });
          }}
        />
      )}
      {status === 'opening' && selectedWallet && (
        <WalletOpening wallet={selectedWallet} />
      )}
      {status === 'failed' && selectedWallet && (
        <WalletOpenFailed
          wallet={selectedWallet}
          error={error}
          onRetry={() => {
            onWalletSelect(selectedWallet.name);
            connectWallet({ wallet: selectedWallet }).then(() => {
              setRecentWalletName(selectedWallet);
            });
          }}
        />
      )}
    </>
  );
};

export default Content;
