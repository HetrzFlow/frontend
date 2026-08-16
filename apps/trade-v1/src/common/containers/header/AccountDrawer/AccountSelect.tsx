import { useCallback, FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import {
  useCurrentAccount,
  useAccounts,
  useSwitchAccount,
} from '@mysten/dapp-kit';

import { formatAddress } from '@repo/lib/format';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  CopyIcon,
  toast,
  SelectGroup,
  cn,
} from '@repo/ui';
import Avatar from './Avatar';

interface AccountSelectProps {
  className?: string;
}

const AccountSelect: FC<AccountSelectProps> = ({ className }) => {
  const { t } = useLingui();
  const currentAccount = useCurrentAccount();
  const accounts = useAccounts();
  const { mutate: switchAccount } = useSwitchAccount();
  const handleSwitchAccount = useCallback(
    (value: string) => {
      const account = accounts.find((v) => v.address === value);
      if (account) {
        switchAccount({ account });
      }
    },
    [switchAccount, accounts],
  );
  return (
    <Select
      onValueChange={handleSwitchAccount}
      defaultValue={currentAccount?.address}
    >
      <div className={cn('flex items-center gap-2', className)}>
        <SelectTrigger className="p-0" hiddenIcon>
          <Avatar size={32} className="max-md:size-6" />
          {formatAddress(currentAccount?.address || '')}
        </SelectTrigger>
        <div title={t`Copy Address`} className="max-md:ml-auto">
          <CopyIcon
            className="cursor-pointer"
            size={16}
            onClick={(e) => {
              navigator.clipboard.writeText(currentAccount?.address || '');
              toast.success(t`Address copied`, { id: 'address-copy' });
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </div>
        <SelectTrigger className="p-0" />
      </div>
      <SelectContent
        className="w-[200px]"
        side="bottom"
        align="end"
        topNode={
          <div className="text-t-350 pb-3 text-sm">{t`Switch Wallet`}</div>
        }
      >
        <SelectGroup>
          {accounts.map((account) => (
            <SelectItem key={account.address} value={account.address}>
              {formatAddress(account.address)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default AccountSelect;
