'use client';

import { useEffect, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useSuiClientContext } from '@mysten/dapp-kit';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  SettingsIcon,
  toast,
} from '@repo/ui';
import useMediaQuery, { MEDIA_SIZES } from '../../../hooks/useMediaQuery';
import { useSuiRPCLatency } from '../../../services/rest/rpc';
import Content from './Content';

const Settings: React.FC = () => {
  const { t } = useLingui();
  const mediaSz = useMediaQuery();
  const [open, setOpen] = useState(false);
  const [panelId, setPanelId] = useState('');

  // rpc detection
  const { config } = useSuiClientContext();

  const { failureCount, isSuccess } = useSuiRPCLatency(config?.url);

  useEffect(() => {
    if (panelId !== 'suiRPC' && failureCount >= 2) {
      const id = toast.error(
        <span>
          <Trans>
            Your Selected RPC is not responding. Try{' '}
            <span
              className="cursor-pointer underline"
              onClick={() => {
                setPanelId('suiRPC');
                setOpen(true);
                toast.dismiss(id);
              }}
            >
              changing your RPC in settings.
            </span>
          </Trans>
        </span>,
        {
          duration: Infinity,
          id: 'rpcError',
          toasterId: 'permanent-toast',
        },
      );
    }
    if (isSuccess) {
      toast.dismiss('rpcError');
    }
  }, [failureCount, panelId, isSuccess, t]);

  //remove toast
  useEffect(() => {
    return () => {
      toast.dismiss('rpcError');
    };
  }, []);

  return (
    <Popover
      open={open}
      onOpenChange={(_open) => {
        if (!_open) {
          setPanelId('');
        }
        setOpen(_open);
      }}
    >
      <PopoverTrigger
        aria-label="settings"
        className="md:hover:bg-bg-3 max-md:bg-bg-3-h5 flex size-[32px] cursor-pointer items-center justify-center rounded-full duration-300 hover:transition-[background]"
      >
        <SettingsIcon className="cursor-pointer" size={20} />
      </PopoverTrigger>

      <PopoverContent
        sideOffset={mediaSz === MEDIA_SIZES.SM ? 12 : 4}
        align="end"
        className="w-70 max-md:w-[calc(100vw-calc(var(--spacing)*8))]"
      >
        <Content panelId={panelId} />
      </PopoverContent>
    </Popover>
  );
};

export default Settings;
