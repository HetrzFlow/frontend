import { FC, useMemo } from 'react';
import Link from 'next/link';

import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { percentFormat, thoFormat, unitFormat } from '@repo/lib/format';
import { cn, HzIcon } from '@repo/ui';
import { convertBigintToHumanReadable } from '@/lib/shared/utils';
import {
  useVaultsMarketTokenAddresses,
  useVaultsOverviewList,
  useViewedVaultAddresses,
} from '../../../../../stores/synthetics/marketsData/selectors';
import { useMarketAndHlvTokensData } from '../../../../../stores/synthetics/marketTokens/selectors';
import { useGlobalStore } from '../../../../stores/globalStore';
import { useStore } from '../../store';
import ListLayout from '../components/ListLayout';

type VaultWithDeposit = {
  vault_address: string;
  vault_name: string;
  net_apy: string;
  depositUsd: bigint;
  earningsUsd: bigint;
  curator: string;
};

const VaultItem: FC<{
  vault: VaultWithDeposit;
  enableNavigation: boolean;
}> = ({ vault, enableNavigation }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const depositUsdNum = convertBigintToHumanReadable(
    vault.depositUsd,
    USD_DECIMALS,
  );
  const earningsNum = convertBigintToHumanReadable(
    vault.earningsUsd,
    USD_DECIMALS,
  );

  const content = (
    <>
      <div
        className={cn(
          'absolute inset-1 -right-2 -left-2 -z-1 rounded-lg transition-[background] duration-400',
          enableNavigation && 'group-hover/self:bg-bg-4',
        )}
      />
      <div className="flex min-w-0 items-center gap-2">
        <HzIcon className="text-accent shrink-0" size={14} />
        <span className="min-w-0 flex-1 truncate font-medium">
          {vault.curator} {vault.vault_name}
        </span>
        <span className="bg-accent/10 text-accent ml-1 shrink-0 rounded-sm px-2 py-0.5 whitespace-nowrap">
          {t`APY`}{' '}
          {percentFormat(vault.net_apy, 2, {
            showMinDecimalValue: true,
          })}
        </span>
      </div>
      <div className="mt-3 grid w-full grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Your Holdings`}</span>
          <span className="font-plex text-sm">
            {unitFormat(depositUsdNum, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
              showMinDecimalValue: true,
              stripTrailingZeros: true,
            })}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-secondary-foreground text-xs">{t`Your Unrealised PnL`}</span>
          <span
            className={cn(
              'font-plex text-sm',
              earningsNum >= 0 ? 'text-accent' : 'text-down',
            )}
          >
            {unitFormat(earningsNum, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
              showMinDecimalValue: true,
              signDisplay: 'always',
            })}
          </span>
        </div>
      </div>
    </>
  );

  const className =
    'group/self relative block border-t py-3 text-xs text-current no-underline';

  if (!enableNavigation) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={`/vaults/${vault.vault_address}`} className={className}>
      {content}
    </Link>
  );
};

interface VaultsProps {
  allowedVaultAddresses?: readonly string[];
  enableNavigation?: boolean;
}

const Vaults: FC<VaultsProps> = ({
  allowedVaultAddresses,
  enableNavigation = true,
}) => {
  const { t } = useLingui();

  const viewedVaultsList = useVaultsOverviewList(
    undefined,
    {},
    allowedVaultAddresses,
  );
  const marketAddresses =
    useVaultsMarketTokenAddresses(allowedVaultAddresses);
  const vaultAddresses = useViewedVaultAddresses(allowedVaultAddresses);
  const tokensView = useMarketAndHlvTokensData({
    withHlv: true,
    marketAddresses,
    vaultAddresses,
  });

  const [vaultsOpen, setVaultsOpen] = useStore(
    useShallow((state) => [state.vaultsOpen, state.setVaultsOpen]),
  );
  const allowedVaultAddressSet = useMemo(
    () =>
      allowedVaultAddresses
        ? new Set(allowedVaultAddresses.map((address) => address.toLowerCase()))
        : undefined,
    [allowedVaultAddresses],
  );

  const vaultsWithDeposit = useMemo((): VaultWithDeposit[] => {
    if (!viewedVaultsList?.length) return [];
    return viewedVaultsList.reduce<VaultWithDeposit[]>((acc, vault) => {
      if (
        allowedVaultAddressSet &&
        !allowedVaultAddressSet.has(vault.vault_address.toLowerCase())
      ) {
        return acc;
      }

      try {
        // Calculate deposit USD via tokensView (balance * minPrice / 10^decimals)
        const tokenView = tokensView?.[vault.vault_address as `0x${string}`];
        let depositUsd = 0n;
        if (tokenView?.balance !== undefined && tokenView.prices?.minPrice) {
          depositUsd =
            (tokenView.balance * tokenView.prices.minPrice) /
            10n ** BigInt(tokenView.decimals);
        } else {
          // Fallback: tokens_balance / supply * tvl
          const balance = BigInt(vault.tokens_balance ?? '0');
          if (balance <= 0n) return acc;
          const supply = BigInt(vault.supply ?? '0');
          const tvl = BigInt(vault.tvl ?? '0');
          if (supply <= 0n) return acc;
          depositUsd = (balance * tvl) / supply;
        }
        if (depositUsd <= 0n) return acc;
        const earningsUsd = BigInt(vault.unrealized_pnl);
        acc.push({
          vault_address: vault.vault_address,
          vault_name: vault.vault_name,
          curator: vault.curator,
          net_apy: vault.net_apy,
          depositUsd,
          earningsUsd,
        });
      } catch {
        // skip malformed data
      }
      return acc;
    }, []);
  }, [allowedVaultAddressSet, viewedVaultsList, tokensView]);

  const count = vaultsWithDeposit.length;
  if (!count) return null;

  return (
    <ListLayout
      open={vaultsOpen}
      onOpenChange={setVaultsOpen}
      title={
        <div className="text-t-1100 flex items-center gap-1 font-medium">
          {t`Vaults`}
          <span className="bg-t-1100/10 inline-block min-w-5 rounded-sm p-0.5 align-middle text-xs">
            {thoFormat(count)}
          </span>
        </div>
      }
      listContent={
        <div className="flex flex-col">
          {vaultsWithDeposit.map((vault) => (
            <VaultItem
              vault={vault}
              enableNavigation={enableNavigation}
              key={vault.vault_address}
            />
          ))}
        </div>
      }
    />
  );
};

export default Vaults;
