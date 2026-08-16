import { FC, useMemo } from 'react';
import Link from 'next/link';

import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { CoinIcon } from '@repo/common/components';
import { percentFormat, thoFormat, unitFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';

import { useInstStore } from '@/common/stores';
import { convertBigintToHumanReadable } from '@/lib/shared/utils';
import { HZLP_NAME } from '@/stores/pools/trade';
import { usePoolsList } from '../../../../../queries/bsc/pools';
import { CATEGORY } from '../../../../../services/rest/pools';
import { useGlobalStore } from '../../../../stores/globalStore';
import { useStore } from '../../store';
import ListLayout from '../components/ListLayout';

type PoolWithDeposit = {
  market_address: string;
  displayName: string;
  symbol: string;
  fee_apy: string;
  depositUsd: bigint;
  earnedFeesUsd: bigint;
};

const PoolItem: FC<{ pool: PoolWithDeposit }> = ({ pool }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[pool.market_address];

  const depositUsdNum = convertBigintToHumanReadable(
    pool.depositUsd,
    USD_DECIMALS,
  );
  const earnedFeesNum = convertBigintToHumanReadable(
    pool.earnedFeesUsd,
    USD_DECIMALS,
  );

  return (
    <Link
      href={`/pools/${pool.market_address}`}
      className="group/self relative block cursor-pointer border-t py-3 text-xs text-current no-underline"
    >
      <div className="group-hover/self:bg-bg-4 absolute inset-1 -right-2 -left-2 -z-1 rounded-lg transition-[background] duration-400" />
      <div className="flex items-center gap-2">
        <CoinIcon size={24} src={inst?.icon} alt={pool.displayName} />
        <span className="font-medium">
          {HZLP_NAME}: {pool.displayName}
        </span>
        <span className="bg-accent/10 text-accent ml-1 rounded-sm px-2 py-0.5">
          {t`Fee APY`}{' '}
          {percentFormat(pool.fee_apy, 2, {
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
              earnedFeesNum >= 0 ? 'text-accent' : 'text-down',
            )}
          >
            {unitFormat(earnedFeesNum, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
              showMinDecimalValue: true,
              signDisplay: 'always',
            })}
          </span>
        </div>
      </div>
    </Link>
  );
};

const Pools: FC = () => {
  const { t } = useLingui();

  const { data: poolsListData } = usePoolsList({
    category: CATEGORY.all,
    inWallet: true,
    pageSize: 100,
    enabled: true,
  });

  const [poolsOpen, setPoolsOpen] = useStore(
    useShallow((state) => [state.poolsOpen, state.setPoolsOpen]),
  );

  const poolsWithDeposit = useMemo((): PoolWithDeposit[] => {
    if (!poolsListData?.pools?.length) return [];
    return poolsListData.pools.reduce<PoolWithDeposit[]>((acc, pool) => {
      try {
        const balance = BigInt(pool.tokens_balance ?? '0');
        if (balance <= 0n) return acc;
        const supply = BigInt(pool.lp_supply ?? '0');
        const tvlUsd = BigInt(pool.tvl_usd ?? '0');
        if (supply <= 0n) return acc;
        const depositUsd = (balance * tvlUsd) / supply;
        if (depositUsd <= 0n) return acc;
        const earnedFeesUsd = BigInt(pool.unrealized_pnl);
        acc.push({
          market_address: pool.market_address,
          displayName: pool.display_name,
          symbol: pool.symbol,
          fee_apy: pool.fee_apy,
          depositUsd,
          earnedFeesUsd,
        });
      } catch {
        // skip malformed data
      }
      return acc;
    }, []);
  }, [poolsListData?.pools]);

  const count = poolsWithDeposit.length;
  if (!count) return null;

  return (
    <ListLayout
      open={poolsOpen}
      onOpenChange={setPoolsOpen}
      title={
        <div className="text-t-1100 flex items-center gap-1 font-medium">
          {t`Pools`}
          <span className="bg-t-1100/10 inline-block min-w-5 rounded-sm p-0.5 align-middle text-xs">
            {thoFormat(count)}
          </span>
        </div>
      }
      listContent={
        <div className="flex flex-col">
          {poolsWithDeposit.map((pool) => (
            <PoolItem pool={pool} key={pool.market_address} />
          ))}
        </div>
      }
    />
  );
};

export default Pools;
