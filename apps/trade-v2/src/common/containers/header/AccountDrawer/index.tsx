'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { formatAddress } from '@repo/lib/format';
import {
  Button,
  Sheet,
  SheetTrigger,
  ChevronDownIcon,
  useMediaQuery,
  MEDIA_SIZES,
  WalletIcon,
} from '@repo/ui';
import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import { useActiveWallet, usePrivy } from '@/common/chainClient/privyCompat';
import { scheduleIdleTask } from '@/lib/runtime/scheduleIdleTask';
import ConnectBtn from '../../../components/ConnectBtn';
import Avatar from './Avatar';

const Content = dynamic(() => import('./Content'), { ssr: false });
const GenesisPortfolioDrawer = dynamic(
  () =>
    import('@/containers/genesis/components/PortfolioDrawer').then(
      (module) => module.PortfolioDrawer,
    ),
  { ssr: false },
);

interface GenesisConnectedDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ready: boolean;
  account: string;
  icon?: string;
  walletMeta?: Parameters<typeof Avatar>[0]['meta'];
}

const GenesisConnectedDrawer = ({
  open,
  onOpenChange,
  ready,
  account,
  icon,
  walletMeta,
}: GenesisConnectedDrawerProps) => {
  return (
    <>
      <Button
        size="lg"
        variant="secondary"
        onClick={() => onOpenChange(true)}
        className="hover:text-t-1100 hover:bg-bg-4 flex gap-0.5 rounded-xl !px-4 text-xs max-md:size-[32px]"
      >
        <WalletIcon size={20} className="md:hidden" />
        <Avatar
          loading={!ready}
          icon={icon}
          size={24}
          className="mr-1 max-md:hidden"
          meta={walletMeta}
        />
        <span className="max-md:hidden">{formatAddress(account)}</span>
        <ChevronDownIcon size={16} className="max-md:hidden" />
      </Button>
      <GenesisPortfolioDrawer
        open={open}
        onOpenChange={onOpenChange}
      />
    </>
  );
};

interface AccountDrawerProps {
  genesis?: boolean;
}

const AccountDrawer = ({ genesis = false }: AccountDrawerProps) => {
  const { t } = useLingui();
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  const { ready, user } = usePrivy();
  const account = useCurrentAccountAddress();
  const { wallet: currentWallet } = useActiveWallet();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    return scheduleIdleTask(() => {
      void import('./Content');
    });
  }, []);

  useEffect(() => {
    if (!account) setOpen(false);
  }, [account]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      // Ensure focus does not remain inside hidden sheet content.
      (document.activeElement as HTMLElement | null)?.blur();
    }
    setOpen(nextOpen);
  }, []);

  return (
    <div className="shrink-0">
      {account ? (
        genesis ? (
          <GenesisConnectedDrawer
            open={open}
            onOpenChange={handleOpenChange}
            ready={ready}
            account={account}
            icon={currentWallet?.meta.icon ?? user?.linkedAccounts?.[0]?.type}
            walletMeta={currentWallet?.meta}
          />
        ) : (
          <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                variant="secondary"
                className="hover:text-t-1100 hover:bg-bg-4 flex gap-0.5 rounded-xl !px-4 text-xs max-md:size-[32px]"
              >
                <WalletIcon size={20} className="md:hidden" />
                <Avatar
                  loading={!ready}
                  icon={
                    currentWallet?.meta.icon ?? user?.linkedAccounts?.[0]?.type
                  }
                  size={24}
                  className="mr-1 max-md:hidden"
                  meta={currentWallet?.meta}
                />
                <span className="max-md:hidden">
                  {formatAddress(account ?? 'Unknown')}
                </span>
                <ChevronDownIcon size={16} className="max-md:hidden" />
              </Button>
            </SheetTrigger>
            <Content />
          </Sheet>
        )
      ) : (
        <ConnectBtn size="lg" className="rounded-xl px-4 text-xs">
          {isMobile ? t`Connect` : undefined}
        </ConnectBtn>
      )}
    </div>
  );
};

export default AccountDrawer;
