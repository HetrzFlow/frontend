import { FC, useCallback, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { zeroAddress } from 'viem';
import { formatAddress } from '@repo/lib/format';
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CopyIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  MEDIA_SIZES,
  toast,
  cn,
  useMediaQuery,
} from '@repo/ui';
import {
  useActiveWallet,
  useCurrentAccountAddress,
  usePrivy,
} from '@/common/chainClient';
import Avatar from './Avatar';

interface AccountSelectProps {
  className?: string;
}

const AccountSelect: FC<AccountSelectProps> = ({ className }) => {
  const { t } = useLingui();
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const { ready, user, exportWallet } = usePrivy();
  const address = useCurrentAccountAddress();
  const [isExporting, setIsExporting] = useState(false);

  const { wallet: currentWallet } = useActiveWallet();
  const canExportSocialWallet =
    ready &&
    currentWallet?.walletClientType === 'privy' &&
    currentWallet.address;

  const handleExportSocialWallet = useCallback(async () => {
    if (!currentWallet?.address) return;

    try {
      setIsExporting(true);
      await exportWallet({ address: currentWallet.address });
    } catch {
      toast.error(t`Export cancelled or failed`);
    } finally {
      setIsExporting(false);
    }
  }, [currentWallet?.address, exportWallet, t]);

  const accountSelectContent = (
    <>
      <Avatar
        loading={!ready}
        icon={currentWallet?.meta.icon ?? user?.linkedAccounts?.[0]?.type}
        size={32}
        className="max-md:size-6"
        meta={currentWallet?.meta}
      />
      {formatAddress(address ?? zeroAddress)}
      <div
        title={t`Copy Address`}
        className="max-md:ml-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <CopyIcon
          className="cursor-pointer"
          size={16}
          onClick={(e) => {
            navigator.clipboard.writeText(address ?? zeroAddress);
            toast.success(t`Address copied`, { id: 'address-copy' });
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </div>
      {canExportSocialWallet ? (
        <ChevronDownIcon
          size={24}
          className="text-t-1100 hover:text-t-270 cursor-pointer"
        />
      ) : null}
    </>
  );

  if (!canExportSocialWallet) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {accountSelectContent}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild title={t`Export Social Wallet`}>
        <div className={cn('flex items-center gap-2', className)}>
          {accountSelectContent}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? 'center' : 'start'}
        side={isMobile ? 'top' : 'bottom'}
        sideOffset={8}
        className="bg-bg-5 text-t-1100 z-[60] h-8 w-[248px] rounded-xl border-0 p-0 shadow-none max-md:w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuItem
          disabled={isExporting}
          className="focus:bg-bg-5 flex h-8 w-full cursor-pointer items-center justify-center gap-[10px] rounded-xl px-3 py-0 text-xs font-medium"
          onSelect={() => {
            void handleExportSocialWallet();
          }}
        >
          <ArrowUpRightIcon size={16} />
          <span>{t`Export Social Wallet`}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountSelect;
