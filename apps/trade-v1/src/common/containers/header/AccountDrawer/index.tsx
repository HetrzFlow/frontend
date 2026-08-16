'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { formatAddress } from '@repo/lib/format';
import {
  Button,
  Sheet,
  SheetTrigger,
  ChevronDownIcon,
  Skeleton,
  toast,
  useMediaQuery,
  MEDIA_SIZES,
  WalletIcon,
} from '@repo/ui';

import ConnectBtn from '../../../components/ConnectBtn';
import { useWalletStore } from '../../../stores/walletStore';
import Avatar from './Avatar';

const Content = dynamic(() => import('./Content'), { ssr: false });

const AccountDrawer: React.FC = () => {
  const { t } = useLingui();
  const autoConnectStatus = useWalletStore((state) => state.autoConnectStatus);
  const network = useWalletStore((state) => state.network);
  const recentWalletName = useWalletStore((state) => state.recentWalletName);

  const currentAccount = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const isSlushWallet = currentWallet?.name === 'Slush';

  const walletNetwork = currentAccount?.chains[0];
  useEffect(() => {
    // slush can auto switch network, no toast
    if (
      !isSlushWallet &&
      walletNetwork &&
      network &&
      walletNetwork !== `sui:${network}`
    ) {
      toast.error(
        t`Please switch your wallet to Testnet in your wallet settings.`,
        {
          id: 'network-warning-toast',
        },
      );
    } else {
      toast.dismiss('network-warning-toast');
    }
  }, [walletNetwork, network, t, recentWalletName, isSlushWallet]);

  useEffect(() => {
    const unsubscribeFromEvents = currentWallet?.features['standard:events'].on(
      'change',
      // suiet: switch network, chains change
      ({ chains }) => {
        if (!isSlushWallet && chains && chains[0] !== `sui:${network}`) {
          toast.error(
            t`Please switch your wallet to Testnet in your wallet settings.`,
            {
              id: 'network-warning-toast',
            },
          );
        }
      },
    );
    return unsubscribeFromEvents;
  }, [currentWallet?.features, network, t, isSlushWallet]);
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  // idle, display loader
  if (autoConnectStatus === 'idle')
    return (
      <Skeleton className="bg-bg-2/40 max-md:bg-bg-3-h5/60 flex h-[32px] items-center gap-0.5 rounded-full px-2">
        <Skeleton
          className={'bg-bg-2 max-md:bg-bg-3-h5/80 h-[16px] w-35 max-md:w-18'}
        />
      </Skeleton>
    );

  return (
    <div className="shrink-0">
      {currentAccount ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              variant="secondary"
              className="max-md:!bg-bg-3-h5 flex gap-0.5 rounded-full px-2 max-md:size-[32px]"
            >
              {isMobile ? (
                <WalletIcon size={20} />
              ) : (
                <>
                  <Avatar size={24} className="mr-1" />
                  {formatAddress(currentAccount?.address || '')}
                  <ChevronDownIcon size={16} />
                </>
              )}
            </Button>
          </SheetTrigger>
          <Content />
        </Sheet>
      ) : (
        <ConnectBtn size="lg" className="rounded-full px-4">
          {isMobile ? t`Connect` : undefined}
        </ConnectBtn>
      )}
    </div>
  );
};

export default AccountDrawer;
