'use client';

import { FC, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Button, cn, Skeleton } from '@repo/ui';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import { useConnectWallet, usePrivy } from '@/common/chainClient/privyCompat';
import { useAutoSwitchChainAfterLogin } from '@/common/hooks/useAutoSwitchChainAfterLogin';

type ConnectBtnProps = React.ComponentProps<typeof Button> & {
  loadingClassName?: string;
};

const ConnectBtn: FC<ConnectBtnProps> = ({
  children,
  disabled,
  size,
  className,
  loadingClassName,
  variant,
}) => {
  const { t } = useLingui();
  const { connectOrCreateWallet, logout, authenticated } = usePrivy();
  const { connectWallet } = useConnectWallet();
  const connectionStatus = useConnectionStatus();
  const { armSwitchAfterLogin } = useAutoSwitchChainAfterLogin();

  const handleDisconnect = useCallback(async () => {
    await logout();
  }, [logout]);

  const isLoading = connectionStatus === 'unknown';

  if (isLoading) {
    return (
      <Skeleton
        className={cn(
          'bg-bg-3 flex h-[32px] items-center justify-center gap-0.5 rounded-xl px-4',
          loadingClassName,
        )}
      >
        <Skeleton className={cn('bg-bg-4 h-[16px] w-35 max-md:w-18')} />
      </Skeleton>
    );
  }

  if (authenticated && connectionStatus === 'connected') {
    return (
      <Button
        size={size}
        disabled={disabled}
        className={cn(
          'bg-accent hover:bg-accent/90 text-accent-foreground hover:text-accent-foreground/90',
          className,
        )}
        onClick={handleDisconnect}
      >
        {children || t`Disconnect`}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      disabled={disabled}
      className={cn(
        'bg-accent hover:bg-accent/90 text-accent-foreground hover:text-accent-foreground/90',
        className,
      )}
      onClick={() => {
        if (authenticated) {
          armSwitchAfterLogin();
          connectWallet();
        } else {
          connectOrCreateWallet();
        }
      }}
    >
      {children || t`Connect Wallet`}
    </Button>
  );
};

export default ConnectBtn;
