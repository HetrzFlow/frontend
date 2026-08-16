import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useWallets } from '@mysten/dapp-kit';
import { Loading } from '@repo/ui';

interface WalletOpeningProps {
  wallet: ReturnType<typeof useWallets>[0];
}

const WalletOpening: FC<WalletOpeningProps> = ({ wallet }) => {
  const { t } = useLingui();
  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={wallet.icon}
        height={48}
        width={48}
        alt={wallet.name}
        className={'rounded-lg'}
      />
      <p className="text-t-270 text-center text-base">
        {t`Please confirm connection in the extension`}
      </p>
      <Loading className="h-5 w-5" />
    </div>
  );
};

export default WalletOpening;
