import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';

import { Button, CheckIcon, cn } from '@repo/ui';
import { useWalletStore } from '../../../stores/walletStore';
import { useNetworks } from './hooks';

const NetworkPanel: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useLingui();
  const network = useWalletStore((state) => state.network);

  const networks = useNetworks();

  return (
    <div className="flex flex-col gap-2">
      {networks.map(({ key: _network, label, href }) => {
        const isCurrent = _network === network;
        const isAvailable = Boolean(href) || isCurrent;
        const className = cn(
          'hover:bg-bg-5 flex h-8 w-full has-[>svg]:px-2 hover:text-t-1100 items-center justify-between rounded-lg p-2 text-xs transition-[background]',
          isAvailable ? 'cursor-pointer' : 'cursor-default text-t-430',
          isCurrent ? 'bg-bg-5' : '',
        );

        if (isAvailable && !isCurrent) {
          return (
            <Button
              asChild
              variant="ghost"
              key={_network}
              className={className}
            >
              <a href={href} onClick={onBack}>
                {label}
              </a>
            </Button>
          );
        }

        if (!isAvailable) {
          return (
            <div
              key={_network}
              className={cn(
                'flex h-8 w-full items-center gap-2 rounded-lg p-2 text-xs',
                'text-t-350',
              )}
              aria-disabled="true"
            >
              <span>{label}</span>
              <span className="bg-accent/10 text-accent rounded-sm px-2 py-0.5">
                {t`Coming Soon`}
              </span>
            </div>
          );
        }

        return (
          <Button
            variant="ghost"
            key={_network}
            className={className}
            onClick={onBack}
          >
            {label}
            <CheckIcon />
          </Button>
        );
      })}
    </div>
  );
};

export default NetworkPanel;
