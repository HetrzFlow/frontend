import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useWallets } from '@mysten/dapp-kit';
import { Button } from '@repo/ui';
import { isDebugMode } from '../../constants/common';

interface WalletOpenFailedProps {
  error?: Error | null;
  wallet: ReturnType<typeof useWallets>[0];
  onRetry: () => void;
}

const WalletOpenFailed: FC<WalletOpenFailedProps> = ({
  wallet,
  onRetry,
  error,
}) => {
  const { t } = useLingui();

  const isNoAccountError =
    error?.message.includes('Preferences not found') ||
    error?.message.includes('cannot find account');

  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={wallet.icon}
        height={48}
        width={48}
        alt={wallet.name}
        className={'rounded-lg'}
      />
      {isNoAccountError && (
        <div className="text-t-350 text-center text-sm">{t`No account found in the connected wallet. Create or import one to proceed.`}</div>
      )}
      {!isNoAccountError && isDebugMode() && error?.message && (
        <div className="text-destructive text-center text-sm">
          {error?.message}
        </div>
      )}
      <Button
        className="bg-accent hover:bg-accent/90 text-accent-foreground hover:text-accent-foreground/90 w-full"
        onClick={onRetry}
      >
        {t`Retry`}
      </Button>
    </div>
  );
};

export default WalletOpenFailed;
