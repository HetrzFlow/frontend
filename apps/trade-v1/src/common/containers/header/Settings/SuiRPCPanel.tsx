import { FC, useEffect, useState } from 'react';
import { useLingui } from '@lingui/react/macro';

import { NetworkConfig, useSuiClientContext } from '@mysten/dapp-kit';
import { useShallow } from 'zustand/react/shallow';
import { toast } from '@repo/ui';
import {
  RpcKeyType,
  SUPPORTED_RPC_KEYS,
  useWalletStore,
} from '../../../stores/walletStore';
import SuiRPCPanelItem from './SuiRPCPanelItem';

const SuiRPCPanel: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useLingui();
  const [network, rpcKey, setRpcKey] = useWalletStore(
    useShallow((state) => [state.network, state.rpcKey, state.setRpcKey]),
  );
  const { networks } = useSuiClientContext();

  const [selectedRpcKey, setSelectedRpcKey] = useState(rpcKey);

  useEffect(() => {
    toast.dismiss('rpcError');
  }, [network]);

  return (
    <div className="flex flex-col gap-2">
      {SUPPORTED_RPC_KEYS.map((_rpcKey) => (
        <SuiRPCPanelItem
          key={_rpcKey}
          rpcKey={_rpcKey}
          isSelected={_rpcKey === selectedRpcKey}
          onClick={() => {
            if (_rpcKey === selectedRpcKey) {
              return;
            }

            const url = (
              networks[network] as NetworkConfig<Record<RpcKeyType, string>>
            ).variables?.[_rpcKey];
            if (_rpcKey !== 'Custom' || (_rpcKey === 'Custom' && url)) {
              setRpcKey(_rpcKey);
              setSelectedRpcKey(_rpcKey);
              onBack();
              toast.success(t`RPC has been set to ${url}.`);
            } else {
              setSelectedRpcKey(_rpcKey);
            }
          }}
        />
      ))}
    </div>
  );
};

export default SuiRPCPanel;
