import { FC, useCallback, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';

import { NetworkConfig, useSuiClientContext } from '@mysten/dapp-kit';
import { useShallow } from 'zustand/react/shallow';
import { truncateFormat } from '@repo/lib/format';
import { CheckIcon, cn, LoaderCircleIcon, toast } from '@repo/ui';
import {
  measureSuiRpcLatency,
  useSuiRPCLatency,
} from '../../../services/rest/rpc';
import { RpcKeyType, useWalletStore } from '../../../stores/walletStore';
import CustomRPCInput from './CustomRPCInput';
import { useRPCTextMap } from './hooks';

const SuiRPCPanelItem: FC<{
  className?: string;
  onClick: () => void;
  isSelected: boolean;
  rpcKey: RpcKeyType;
}> = ({ className, onClick, isSelected, rpcKey }) => {
  const { t } = useLingui();
  const [network, customRpc, setRpcKey, setCustomRpc] = useWalletStore(
    useShallow((state) => [
      state.network,
      state.customRpc,
      state.setRpcKey,
      state.setCustomRpc,
    ]),
  );
  const { networks } = useSuiClientContext();

  const url = (networks[network] as NetworkConfig<Record<RpcKeyType, string>>)
    .variables?.[rpcKey];

  const [innerUrl, setInnerUrl] = useState(url);
  const {
    data: latency,
    failureCount,
    isFetching,
  } = useSuiRPCLatency(innerUrl, 5000);
  const [customExpand, setCustomExpand] = useState(false);

  const textMap = useRPCTextMap();

  const [lantencyText, latencyClassName] = useMemo(() => {
    if (failureCount >= 2) {
      return [t`Unavailable`, 'text-t-430'];
    }
    if (!latency) {
      return ['', ''];
    }

    if (latency > 3000) {
      return [t`Unavailable`, 'text-t-430'];
    }
    if (latency > 200) {
      return [`${truncateFormat(latency, 0)}ms`, 'text-destructive'];
    }
    if (latency > 100) {
      return [`${truncateFormat(latency, 0)}ms`, 'text-[#FFA600]'];
    }

    return [`${truncateFormat(latency, 0)}ms`, 'text-success'];
  }, [latency, t, failureCount]);

  const handleOnSave = useCallback(
    (url: string) => {
      setCustomRpc(network, url);
      setRpcKey('Custom');
      onClick();
    },
    [network, onClick, setRpcKey, setCustomRpc],
  );

  const handleOnValueChange = useCallback((url: string) => {
    setInnerUrl(url);
  }, []);

  return (
    <div
      className={cn(
        'hover:bg-bg-3 cursor-pointer rounded-lg p-2 text-sm',
        isSelected || customExpand ? 'bg-bg-3' : '',
        className,
      )}
      onClick={async () => {
        if (rpcKey === 'Custom') {
          setCustomExpand(true);
        }
        if (latency) {
          onClick();
        } else if (url) {
          measureSuiRpcLatency(url)
            .then(() => {
              onClick();
            })
            .catch(() => {
              toast.error(
                t`RPC switch failed. Please check the URL or your network connection.`,
              );
            });
        }
      }}
    >
      <div className="flex h-6 w-full items-center justify-between">
        {textMap[rpcKey] ?? rpcKey}
        {isFetching && !latency ? (
          <LoaderCircleIcon
            size={16}
            className="text-t-350 ml-auto animate-spin"
          />
        ) : (
          <span className={cn('ml-auto', latencyClassName)}>
            {lantencyText}
          </span>
        )}
        <CheckIcon className={isSelected ? 'visible' : 'invisible'} />
      </div>

      {(isSelected || customExpand) && rpcKey === 'Custom' && (
        <CustomRPCInput
          value={customRpc[network]}
          onSave={handleOnSave}
          onValueChange={handleOnValueChange}
        />
      )}
    </div>
  );
};

export default SuiRPCPanelItem;
