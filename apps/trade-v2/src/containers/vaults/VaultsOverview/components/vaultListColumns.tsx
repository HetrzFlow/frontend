import { ReactNode, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { Trans } from '@lingui/react/macro';
import { ColumnDef } from '@tanstack/react-table';
import { formatUnits } from 'viem';
import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat, unitFormat } from '@repo/lib/format';
import {
  Button,
  HzIcon,
  Skeleton,
  SkeletonLayout,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { HZV_TOKEN_DECIMALS, IMAGES_MAP, useGlobalStore } from '@/common';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import { useInstStore } from '@/common/stores/instStore';
import StatusMarker from '@/components/StatusMarker';
import { marketIsOpen } from '@/hooks/useMarketsStats';
import { isEffectively24x7 } from '@/lib/market/dateConverter';
import type { VaultDepositCapMetric } from '@/queries/bsc/vaults';
import { VaultItem } from '@/services/rest/vaults';
import { USDT_NAME } from '@/stores/pools/trade';
import {
  useHzvValuesData,
  useVaultHoldingsUsd,
} from '@/stores/synthetics/marketsData/selectors';

export type VaultListRow = Partial<VaultItem> &
  Partial<VaultDepositCapMetric> & {
    __isSkeleton?: boolean;
  };

type HzvValueItem = {
  hlvValue?: bigint;
  hlvTokenPrice?: bigint;
  hlvTotalSupply?: bigint;
  remainingDepositCap?: bigint;
  totalDepositCap?: bigint;
};

function isVaultListSkeletonRow(data: VaultListRow): boolean {
  return data.__isSkeleton === true;
}

export const vaultListSkeletonRows: VaultListRow[] = Array.from(
  { length: 5 },
  () => ({
    __isSkeleton: true,
  }),
);

const MAX_EXPOSURE_ICONS = 3;

function parseBigintValue(
  value: string | bigint | undefined,
): bigint | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'bigint') return value;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function getHzvValueByVaultAddress(
  hzvValues: Record<string, HzvValueItem> | undefined,
  vaultAddress: string | undefined,
): HzvValueItem | undefined {
  if (!hzvValues || !vaultAddress) return undefined;
  const lowerAddress = vaultAddress.toLowerCase();
  for (const [key, value] of Object.entries(hzvValues)) {
    if (key.toLowerCase() === lowerAddress) {
      return value;
    }
  }
  return undefined;
}

function HeaderWithTip({
  title,
  content,
}: {
  title: ReactNode;
  content: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="decoration-t-430 inline-flex items-center underline decoration-dotted underline-offset-3"
        >
          {title}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-90 rounded-2xl p-3 text-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

function VaultNameCell({ data }: { data: VaultListRow }) {
  const isNameLoading =
    data.curator === undefined && data.vault_name === undefined;
  const insts = useInstStore((state) => state.getInstsArr());
  const vaultDisplayName = useMemo(() => {
    const curator = data.curator?.trim();
    const vaultName = data.vault_name?.trim();
    if (!curator && !vaultName) return '';
    return [curator, vaultName].filter(Boolean).join(' ');
  }, [data.curator, data.vault_name]);

  const statusInst = useMemo(() => {
    const symbols = data.market_exposure?.flatMap((item) =>
      item.symbol ? [item.symbol] : [],
    );
    if (!symbols?.length) return undefined;
    const exposureInsts = insts.filter((inst) => symbols.includes(inst.symbol));
    const scheduledInsts = exposureInsts.filter(
      (inst) =>
        inst.schedule &&
        inst.schedule !== '24x7' &&
        !isEffectively24x7(inst.schedule),
    );
    if (!scheduledInsts.length) return undefined;
    const closedInst = scheduledInsts.find((inst) => !marketIsOpen(inst));
    return closedInst ?? scheduledInsts[0];
  }, [data.market_exposure, insts]);

  return (
    <SkeletonLayout isLoading={isNameLoading} className="h-6 w-32">
      <div className="flex min-w-0 items-center gap-2">
        <HzIcon className="text-accent shrink-0" size={18} />
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate font-medium">{vaultDisplayName}</span>
          <StatusMarker inst={statusInst} />
        </div>
      </div>
    </SkeletonLayout>
  );
}

function TvlSupplyCell({ data }: { data: VaultListRow }) {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const hzvValues = useHzvValuesData();
  const hzvValue = useMemo(
    () => getHzvValueByVaultAddress(hzvValues, data.vault_address),
    [data.vault_address, hzvValues],
  );
  const tvlUsd = hzvValue?.hlvValue ?? parseBigintValue(data.tvl);
  const supply = hzvValue?.hlvTotalSupply ?? parseBigintValue(data.supply);
  const tvlDisplay =
    tvlUsd === undefined
      ? ''
      : unitFormat(
          calc(tvlUsd.toString()).div(calc(10).pow(USD_DECIMALS)).toString(),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          },
        );
  const supplyDisplay =
    supply === undefined
      ? ''
      : unitFormat(
          calc(supply.toString())
            .div(calc(10).pow(HZV_TOKEN_DECIMALS))
            .toString(),
          2,
          {
            stripTrailingZeros: true,
          },
        );

  return (
    <div className="flex flex-col">
      <SkeletonLayout
        isLoading={tvlUsd === undefined}
        className="h-[14.4px] w-20"
      >
        <span className="font-medium">{tvlDisplay}</span>
      </SkeletonLayout>
      <SkeletonLayout
        isLoading={supply === undefined}
        className="mt-1 h-[14.4px] w-16"
      >
        <span className="text-t-350 text-xs">
          {supply !== undefined ? `${supplyDisplay} HzV` : ''}
        </span>
      </SkeletonLayout>
    </div>
  );
}

function ExposureCell({ data }: { data: VaultListRow }) {
  const exposureItems = data.market_exposure;
  if (exposureItems === undefined) {
    return <Skeleton className="h-5 w-14" />;
  }
  if (!exposureItems.length) {
    return <span className="text-t-350">--</span>;
  }
  const displayItems = exposureItems.slice(0, MAX_EXPOSURE_ICONS);
  const extraCount = exposureItems.length - displayItems.length;

  return (
    <div className="flex items-center">
      <div className="flex">
        {displayItems.map((item, index) => (
          <div
            key={item.market_address}
            className="relative rounded-full"
            style={{
              marginLeft: index === 0 ? 0 : -10,
              zIndex: displayItems.length - index,
            }}
          >
            <Image
              src={
                IMAGES_MAP.instIcons[
                  item.symbol as keyof typeof IMAGES_MAP.instIcons
                ] ?? IMAGES_MAP.instIcons['BTC/USD']
              }
              alt={item.symbol}
              width={20}
              height={20}
              className="rounded-full"
            />
          </div>
        ))}
      </div>
      {extraCount > 0 ? (
        <span className="text-t-350 ml-1 text-xs">+{extraCount}</span>
      ) : null}
    </div>
  );
}

function DepositCell({ data }: { data: VaultListRow }) {
  const { depositCapacityUsedUsd, effectiveTotalCapUsd: totalCapUsd } = data;

  if (depositCapacityUsedUsd === undefined || totalCapUsd === undefined) {
    return <Skeleton className="size-[33px] rounded-full" />;
  }

  if (totalCapUsd <= 0n) {
    return <span className="text-t-350">--</span>;
  }

  const rawPercent =
    Number((depositCapacityUsedUsd * 10000n) / totalCapUsd) / 100;
  const percent = Math.min(Math.max(rawPercent, 0), 100);
  const radius = 14;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex justify-start">
      <div className="relative inline-flex size-[33px] items-center justify-center">
        <svg width={33} height={33}>
          <circle
            cx={16.5}
            cy={16.5}
            r={radius}
            fill="none"
            stroke="var(--bg-3)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={16.5}
            cy={16.5}
            r={radius}
            fill="none"
            stroke="#00DFEB"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 16.5 16.5)"
          />
        </svg>
        <span className="text-t-270 pointer-events-none absolute text-[8px]">
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

function HoldingsCell({ data }: { data: VaultListRow }) {
  const connectionStatus = useConnectionStatus();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const userHoldingsUsdt = useVaultHoldingsUsd(data.vault_address, data);

  if (isVaultListSkeletonRow(data)) {
    return (
      <div className="flex justify-end">
        <Skeleton className="h-[14.4px] w-20" />
      </div>
    );
  }

  if (connectionStatus === 'unknown') {
    return (
      <div className="flex justify-end">
        <Skeleton className="h-[14.4px] w-20" />
      </div>
    );
  }
  if (connectionStatus === 'disconnected') {
    return <span className="font-medium">0 {USDT_NAME}</span>;
  }
  if (userHoldingsUsdt === undefined) {
    return (
      <div className="flex justify-end">
        <Skeleton className="h-[14.4px] w-20" />
      </div>
    );
  }

  const userHoldingsDisplay = truncateFormat(
    formatUnits(userHoldingsUsdt, USD_DECIMALS),
    usdAmountDisplayDecimal,
    {
      stripTrailingZeros: true,
      showMinDecimalValue: true,
    },
  );

  return (
    <span className="font-medium">
      {userHoldingsDisplay} {USDT_NAME}
    </span>
  );
}

function ActionCell({ data }: { data: VaultListRow }) {
  if (isVaultListSkeletonRow(data)) {
    return <Skeleton className="ml-auto h-[24.4px] w-[63px] rounded-xl" />;
  }

  const vaultDetailHref = data.vault_address
    ? `/vaults/${data.vault_address}`
    : undefined;

  if (!vaultDetailHref) {
    return (
      <Button
        type="button"
        variant="accent"
        size="sm"
        disabled
        className="h-auto cursor-not-allowed px-3 py-[5px] text-xs font-medium"
      >
        <Trans>Deposit</Trans>
      </Button>
    );
  }

  return (
    <Link href={vaultDetailHref} prefetch>
      <Button
        variant="accent"
        size="sm"
        className="h-auto px-3 py-[5px] text-xs font-medium"
      >
        <Trans>Deposit</Trans>
      </Button>
    </Link>
  );
}

export const vaultListColumns: ColumnDef<VaultListRow>[] = [
  {
    accessorKey: 'vault_name',
    header: () => <Trans>Vault</Trans>,
    meta: {
      headerClassName: 'w-[24%] min-w-[200px]',
      bodyClassName: 'w-[24%] min-w-[200px] truncate',
    },
    cell: ({ row }) => <VaultNameCell data={row.original} />,
  },
  {
    accessorKey: 'net_apy',
    header: () => (
      <HeaderWithTip
        title={<Trans>APY</Trans>}
        content={
          <Trans>
            Estimated annualized yield based on current market rates.
          </Trans>
        }
      />
    ),
    meta: {
      headerClassName: 'w-[10%] min-w-[80px]',
      bodyClassName: 'w-[10%] min-w-[80px]',
    },
    cell: ({ row }) => {
      const netApy = row.original.net_apy;
      return (
        <SkeletonLayout
          isLoading={netApy === undefined}
          className="h-[14.4px] w-16"
        >
          <span className="font-plex font-medium">
            {netApy !== undefined
              ? percentFormat(netApy, 2, {
                  showMinDecimalValue: true,
                  stripTrailingZeros: true,
                })
              : ''}
          </span>
        </SkeletonLayout>
      );
    },
  },
  {
    id: 'tvlSupply',
    header: () => (
      <HeaderWithTip
        title={<Trans>TVL/Supply</Trans>}
        content={
          <>
            <div>
              <Trans>TVL: Total value of assets locked in this strategy.</Trans>
            </div>
            <div>
              <Trans>Supply: Total number of vault tokens minted.</Trans>
            </div>
          </>
        }
      />
    ),
    meta: {
      headerClassName: 'w-[16%] min-w-[130px]',
      bodyClassName: 'w-[16%] min-w-[130px]',
    },
    cell: ({ row }) => <TvlSupplyCell data={row.original} />,
  },
  {
    id: 'exposure',
    header: () => (
      <HeaderWithTip
        title={<Trans>Exposure</Trans>}
        content={
          <Trans>
            The underlying assets and tokens held by this vault strategy.
          </Trans>
        }
      />
    ),
    meta: {
      headerClassName: 'w-[12%] min-w-[100px]',
      bodyClassName: 'w-[12%] min-w-[100px]',
    },
    cell: ({ row }) => <ExposureCell data={row.original} />,
  },
  {
    id: 'deposited',
    header: () => <Trans>Deposited</Trans>,
    meta: {
      headerClassName: 'w-[8%] min-w-[80px]',
      bodyClassName: 'w-[8%] min-w-[80px]',
    },
    cell: ({ row }) => <DepositCell data={row.original} />,
  },
  {
    id: 'holdings',
    header: () => <Trans>Holdings</Trans>,
    meta: {
      headerClassName: 'w-[14%] min-w-[110px] text-right',
      bodyClassName: 'w-[14%] min-w-[110px] text-right',
    },
    cell: ({ row }) => <HoldingsCell data={row.original} />,
  },
  {
    id: 'actions',
    header: () => <Trans>Actions</Trans>,
    meta: {
      headerClassName: 'w-[12%] min-w-[120px] text-right',
      bodyClassName: 'w-[12%] min-w-[120px] text-right',
    },
    cell: ({ row }) => <ActionCell data={row.original} />,
  },
];
