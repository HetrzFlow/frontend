'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Loading,
  Skeleton,
} from '@repo/ui';
import { useWalletStore } from '../../stores/walletStore';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[152px] w-full items-center justify-center">
      <Loading />
    </div>
  ),
});

const ConnectBtn: FC<React.ComponentProps<typeof Button>> = ({
  children,
  size,
  className,
  variant,
}) => {
  const { t } = useLingui();
  const currentAccount = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const autoConnectStatus = useWalletStore((state) => state.autoConnectStatus);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('select');
  const [selectWalletName, setSelectWalletName] = useState('');

  const title = useMemo(() => {
    switch (status) {
      case 'select':
        return t`Connect a Wallet`;
      case 'opening': {
        const walletName = selectWalletName;
        return t`Opening ${walletName}...`;
      }
      case 'failed':
        return t`Comfirmation Failed`;

      default:
        break;
    }
  }, [status, selectWalletName, t]);

  // handle dialog open
  const onOpenChange = useCallback((open: boolean) => {
    setOpen(open);
    // restore state
    if (!open) {
      setTimeout(() => {
        setStatus('select');
        setSelectWalletName('');
      }, 100);
    }
  }, []);

  // handle wallet selected
  const onWalletSelect = useCallback((walletName: string) => {
    setSelectWalletName(walletName);
    setStatus('opening');
  }, []);

  // handle wallet connect failed
  const onOpenWalletFailed = useCallback(() => {
    setStatus('failed');
  }, []);

  // handle wallet connect successfully
  const onWalletConnected = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (autoConnectStatus === 'idle') {
    return (
      <Skeleton
        className={cn(
          className,
          'flex h-[46px] items-center justify-center px-4',
        )}
      >
        <Skeleton className="h-[50%] w-full rounded-lg" />
      </Skeleton>
    );
  }

  return !currentAccount ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size={size}
          variant={variant}
          className={cn(
            'bg-accent hover:bg-accent/90 text-accent-foreground hover:text-accent-foreground/90',
            className,
          )}
        >
          {children || t`Connect Wallet`}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[320px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Content
          status={status}
          onWalletSelect={onWalletSelect}
          onOpenWalletFailed={onOpenWalletFailed}
          onWalletConnected={onWalletConnected}
        />
      </DialogContent>
    </Dialog>
  ) : (
    <Button
      size={size}
      className={cn(
        'bg-accent hover:bg-accent/90 text-accent-foreground hover:text-accent-foreground/90',
        className,
      )}
      onClick={() => {
        disconnectWallet();
      }}
    >
      {children || t`Disconnect`}
    </Button>
  );
};

export default ConnectBtn;
