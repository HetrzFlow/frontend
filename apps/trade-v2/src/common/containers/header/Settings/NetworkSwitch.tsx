import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';

import { ChevronRightIcon } from '@repo/ui';
import { useWalletStore } from '../../../stores/walletStore';
import { useNetworks } from './hooks';

const NetworkSwitch: FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useLingui();
  const network = useWalletStore((state) => state.network);
  const networks = useNetworks();

  const currentNetworkLabel =
    networks.find((v) => v.key === network)?.label || '';

  return (
    <div
      className="hover:bg-bg-5 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-[background]"
      onClick={onClick}
    >
      <span className="text-t-350">{t`Network`}</span>
      <span className="text-t-1100 flex items-center">
        BSC {currentNetworkLabel}
        <ChevronRightIcon />
      </span>
    </div>
  );
};

export default NetworkSwitch;
