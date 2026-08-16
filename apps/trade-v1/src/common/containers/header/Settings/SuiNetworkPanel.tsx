import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { NetworkConfig, useSuiClientContext } from '@mysten/dapp-kit';
import { useShallow } from 'zustand/react/shallow';
import { CheckIcon, cn } from '@repo/ui';
import {
  RpcKeyType,
  SUPPORTED_NETWORKS,
  useWalletStore,
} from '../../../stores/walletStore';

const SuiNetworkPanel: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useLingui();
  const [network, rpcKey, setNetwork, setRpcKey] = useWalletStore(
    useShallow((state) => [
      state.network,
      state.rpcKey,
      state.setNetwork,
      state.setRpcKey,
    ]),
  );

  const { networks } = useSuiClientContext();
  const formatNetwork = (v: string) => `${v[0]?.toUpperCase()}${v.slice(1)}`;

  return (
    <div className="flex flex-col gap-2">
      {SUPPORTED_NETWORKS.map((_network) => (
        <div
          key={_network}
          className={cn(
            'hover:bg-bg-3 flex h-10 cursor-pointer items-center justify-between rounded-lg p-2 text-sm',
            _network === network ? 'bg-bg-3' : '',
            // TODO: disabled mainnet
            _network === 'mainnet'
              ? 'text-t-430 bg-tranparent hover:bg-tranparent cursor-not-allowed'
              : '',
          )}
          onClick={() => {
            if (_network === 'mainnet') return;
            if (
              (networks[network] as NetworkConfig<Record<RpcKeyType, string>>)
                .variables?.[rpcKey]
            ) {
              setNetwork(_network);
            } else {
              setNetwork(_network);
              setRpcKey('default');
            }
            onBack();
          }}
        >
          {formatNetwork(_network)}
          {_network === 'mainnet' && (
            <span className="bg-accent/10 text-accent mr-auto ml-2 rounded-sm p-1 text-xs font-medium">{t`Coming soon`}</span>
          )}
          {_network === network && <CheckIcon />}
        </div>
      ))}
    </div>
  );
};

export default SuiNetworkPanel;
