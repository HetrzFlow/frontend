import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';

import { useSuiClientContext } from '@mysten/dapp-kit';
import { ChevronRightIcon } from '@repo/ui';

const SuiNetworkSwitch: FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useLingui();
  const { network } = useSuiClientContext();
  const formatNetwork = (v: string) => `${v[0]?.toUpperCase()}${v.slice(1)}`;

  return (
    <div
      className="hover:bg-bg-3 flex cursor-pointer items-center justify-between rounded-lg p-2"
      onClick={onClick}
    >
      <span className="text-t-350">{t`Network`}</span>
      <span className="text-t-1100 flex items-center">
        SUI {formatNetwork(network)}
        <ChevronRightIcon />
      </span>
    </div>
  );
};

export default SuiNetworkSwitch;
