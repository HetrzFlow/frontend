import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ChevronRightIcon } from '@repo/ui';
import { useWalletStore } from '../../../stores/walletStore';
import { useRPCTextMap } from './hooks';

const SuiRPCSwitch: FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useLingui();
  const rpcKey = useWalletStore((state) => state.rpcKey);

  const textMap = useRPCTextMap();

  return (
    <div
      className="hover:bg-bg-3 flex cursor-pointer items-center justify-between rounded-lg p-2"
      onClick={onClick}
    >
      <span className="text-t-350">{t`RPC`}</span>
      <span className="text-t-1100 flex items-center">
        {textMap[rpcKey] ?? rpcKey}
        <ChevronRightIcon />
      </span>
    </div>
  );
};

export default SuiRPCSwitch;
