'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  CircleXIcon,
  FilterIcon,
  GridFillIcon,
  Input,
  ListIcon,
  MEDIA_SIZES,
  SearchIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  useMediaQuery,
} from '@repo/ui';
import { useGlobalStore } from '@/common';
import { OverviewMetricItem } from '@/common/components';
import { useHydrated } from '@/common/hooks/useHydrated';
import { useRafReady } from '@/common/hooks/useRafReady';
import { convertBigintToHumanReadable } from '@/lib/shared/utils';
import {
  useVaultsDepositCapMetrics,
  type VaultDepositCapMetricsMap,
} from '@/queries/bsc/vaults';
import { VaultItem, type fetchVaultsList } from '@/services/rest/vaults';
import {
  useHzvValuesData,
  useVaultsOverviewFields,
  useVaultsListData,
} from '@/stores/synthetics/marketsData/selectors';
import VaultCard from './components/VaultCard';
import { vaultListSkeletonRows } from './components/vaultListColumns';
import VaultsListView from './components/VaultsListView';
import VaultsOverviewSkeleton, {
  VaultCardsSkeletonList,
  VaultsToolbarSkeletonContent,
} from './Skeleton';

type VaultSortOption = 'apy_desc' | 'tvl_desc';
type VaultViewMode = 'card' | 'list';
type HzvValuesItem = { hlvValue?: bigint };
const EMPTY_VAULTS: VaultItem[] = [];

type VaultsOverviewProps = {
  initialVaultsListData?: Awaited<ReturnType<typeof fetchVaultsList>>['data'];
};

const normalizeForSearch = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const parseBigintValue = (value: string | undefined): bigint | undefined => {
  if (!value) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
};

const parseNumberValue = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

function compareOptionalBigIntDesc(
  left: bigint | undefined,
  right: bigint | undefined,
) {
  if (left === undefined && right === undefined) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  if (left === right) return 0;
  return right > left ? 1 : -1;
}

function compareOptionalNumberDesc(
  left: number | undefined,
  right: number | undefined,
) {
  if (left === undefined && right === undefined) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  return right - left;
}

function buildHzvTvlMap(
  hzvValues: Record<string, HzvValuesItem> | undefined,
): Map<string, bigint> {
  const map = new Map<string, bigint>();
  if (!hzvValues) return map;

  Object.entries(hzvValues).forEach(([address, value]) => {
    if (value?.hlvValue === undefined) return;
    map.set(address.toLowerCase(), value.hlvValue);
  });
  return map;
}

function getVaultTvlForSort(
  vault: VaultItem,
  hzvTvlMap: Map<string, bigint>,
): bigint | undefined {
  const chainTvl = hzvTvlMap.get(vault.vault_address.toLowerCase());
  return chainTvl ?? parseBigintValue(vault.tvl);
}

function getVaultRestTvlForSort(vault: VaultItem): bigint | undefined {
  return parseBigintValue(vault.tvl);
}

function getProcessedVaults(
  list: VaultItem[] | undefined,
  searchText: string,
  sortBy: VaultSortOption,
  hzvTvlMap: Map<string, bigint>,
  useChainTvlForSort: boolean,
): VaultItem[] {
  if (!list) return [];
  const normalizedSearchText = normalizeForSearch(searchText.trim());
  const filtered = list.filter((vault) => {
    if (!normalizedSearchText) return true;
    const strategyName = normalizeForSearch(
      `${vault.curator ?? ''} ${vault.vault_name ?? ''}`,
    );
    const exposureSymbols = normalizeForSearch(
      (vault.market_exposure ?? []).map((item) => item.symbol ?? '').join(' '),
    );
    return (
      strategyName.includes(normalizedSearchText) ||
      exposureSymbols.includes(normalizedSearchText)
    );
  });

  return filtered.slice().sort((a, b) => {
    const nameCompare =
      `${a.curator ?? ''} ${a.vault_name ?? ''}`.localeCompare(
        `${b.curator ?? ''} ${b.vault_name ?? ''}`,
      );

    if (sortBy === 'tvl_desc') {
      const tvlA = useChainTvlForSort
        ? getVaultTvlForSort(a, hzvTvlMap)
        : getVaultRestTvlForSort(a);
      const tvlB = useChainTvlForSort
        ? getVaultTvlForSort(b, hzvTvlMap)
        : getVaultRestTvlForSort(b);
      const tvlCompare = compareOptionalBigIntDesc(tvlA, tvlB);
      if (tvlCompare !== 0) return tvlCompare;

      const apyCompare = compareOptionalNumberDesc(
        parseNumberValue(a.net_apy),
        parseNumberValue(b.net_apy),
      );
      if (apyCompare !== 0) return apyCompare;
      return nameCompare;
    }

    const apyCompare = compareOptionalNumberDesc(
      parseNumberValue(a.net_apy),
      parseNumberValue(b.net_apy),
    );
    if (apyCompare !== 0) return apyCompare;

    // Keep APY ranking stable while chain TVL is still hydrating.
    const tvlA = getVaultRestTvlForSort(a);
    const tvlB = getVaultRestTvlForSort(b);
    const tvlCompare = compareOptionalBigIntDesc(tvlA, tvlB);
    if (tvlCompare !== 0) return tvlCompare;

    return nameCompare;
  });
}

function getDisplayVaultsList(
  vaultsList: VaultItem[] | undefined,
): VaultItem[] | undefined {
  if (!vaultsList) return undefined;
  return vaultsList.filter((vault) => vault.is_view);
}

function isChainTvlReadyForAllVaults(
  list: VaultItem[] | undefined,
  hzvValues: Record<string, HzvValuesItem> | undefined,
): boolean {
  if (!list?.length) return false;
  if (!hzvValues) return false;

  const valueByAddress = new Map<string, HzvValuesItem>();
  Object.entries(hzvValues).forEach(([address, value]) => {
    valueByAddress.set(address.toLowerCase(), value);
  });

  return list.every((vault) => {
    const value = valueByAddress.get(vault.vault_address.toLowerCase());
    return value?.hlvValue !== undefined;
  });
}

function VaultCardGrid({
  vaults,
  depositCapMetrics,
  className,
}: {
  vaults: VaultItem[];
  depositCapMetrics: VaultDepositCapMetricsMap;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mt-2 space-y-3 md:grid md:grid-cols-4 md:gap-2',
        className,
      )}
    >
      {vaults.map((vault) => (
        <div key={vault.vault_address} className="md:max-w-[264px]">
          <VaultCard
            data={vault}
            depositCapMetric={
              depositCapMetrics[vault.vault_address.toLowerCase()]
            }
          />
        </div>
      ))}
    </div>
  );
}

function VaultCardSkeletonSection({ className }: { className?: string }) {
  return <VaultCardsSkeletonList className={className} />;
}

function VaultListSkeletonSection() {
  return (
    <div className="pb-8">
      <VaultsListView data={vaultListSkeletonRows} />
    </div>
  );
}

export const VaultsOverview = ({
  initialVaultsListData,
}: VaultsOverviewProps) => {
  const canMountOverview = useRafReady();

  if (!canMountOverview) {
    return <VaultsOverviewSkeleton />;
  }

  return (
    <VaultsOverviewContent initialVaultsListData={initialVaultsListData} />
  );
};

const VaultsOverviewContent = ({
  initialVaultsListData,
}: VaultsOverviewProps) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [boundaryEl, setBoundaryEl] = useState<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<VaultSortOption>('apy_desc');
  const [viewMode, setViewMode] = useState<VaultViewMode>('card');
  const mediaSz = useMediaQuery();
  const isHydrated = useHydrated();
  const isMobile = isHydrated && mediaSz === MEDIA_SIZES.SM;
  const pathname = usePathname();

  useEffect(() => {
    const prevPath = sessionStorage.getItem('prevPath') ?? '';
    const isFromDetail = /\/vaults\/[^/]+$/.test(prevPath);
    const isOverview = /\/vaults$/.test(pathname);
    setShouldAnimate(isFromDetail && isOverview);
  }, [pathname]);

  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const vaultsList = useVaultsListData(initialVaultsListData);
  const list = useMemo(() => getDisplayVaultsList(vaultsList), [vaultsList]);
  const hzvValues = useHzvValuesData();
  const hzvTvlMap = useMemo(() => buildHzvTvlMap(hzvValues), [hzvValues]);
  const useChainTvlForSort = useMemo(
    () => isChainTvlReadyForAllVaults(list, hzvValues),
    [hzvValues, list],
  );
  const processedList = useMemo(
    () =>
      getProcessedVaults(
        list,
        searchText,
        sortBy,
        hzvTvlMap,
        useChainTvlForSort,
      ),
    [hzvTvlMap, list, searchText, sortBy, useChainTvlForSort],
  );
  const depositCapMetrics = useVaultsDepositCapMetrics(list ?? EMPTY_VAULTS);
  const listRows = useMemo(
    () =>
      processedList.map((vault) => ({
        ...vault,
        ...depositCapMetrics[vault.vault_address.toLowerCase()],
      })),
    [depositCapMetrics, processedList],
  );

  const hasVaultsList = list !== undefined;
  const hasNoMatch = hasVaultsList && processedList.length === 0;
  const { totalTvl, totalEarnedFees, yourDeposits, yourUnrealizedPnl } =
    useVaultsOverviewFields(initialVaultsListData);

  const metrics = useMemo(
    () => [
      {
        title: t`TVL`,
        value: totalTvl,
        tips: (
          <>
            <div className="text-t-1100">
              {t`Vault Collateral Balance + Net Unrealized PnL + Total Earned Fees Across the Underlying Pools`}
            </div>
            <div>
              {t`Total assets under management in all vaults. Reflects real-time vault value including active trader exposure across the underlying pools in all vaults.`}
            </div>
          </>
        ),
      },
      {
        title: t`Total Earned Fees`,
        value: totalEarnedFees,
        tips: (
          <>
            <div className="text-t-1100">{t`Native APY + Strategy Earnings - Fees`}</div>
            <div>
              {t`Cumulative fees generated by the underlying pools through all trading activity, together with returns from the vault's strategy, net of protocol and strategy fees in all vaults.`}
            </div>
          </>
        ),
      },
      {
        title: t`Your Holdings`,
        value: yourDeposits,
        tips: (
          <div>
            {t`Total value of your vault tokens across all vaults. Value fluctuates based on vault performance, vault composition, and trader PnL.`}
          </div>
        ),
      },
      {
        title: t`Your Unrealised PnL`,
        value: yourUnrealizedPnl,
        tips: (
          <div>
            {t`Your share of the fees and uPnL generated by the underlying pools through all trading activity, together with returns from the vault's strategy, net of protocol and strategy fees in all vaults. Accrues proportionally to your deposit size and duration.`}
          </div>
        ),
      },
    ],
    [t, totalEarnedFees, totalTvl, yourDeposits, yourUnrealizedPnl],
  );

  return (
    <div
      className={cn(
        'w-full px-4 pt-4 pb-18 md:px-1 md:pb-8',
        shouldAnimate &&
          'animate-in slide-in-from-right-10 fade-in md:duration-300',
      )}
    >
      <h2 className="text-center text-[26px] font-semibold max-md:text-xl">
        <Trans>Build on BNB. Earn on HertzFlow.</Trans>
      </h2>
      <div
        ref={setBoundaryEl}
        className="grid grid-cols-2 gap-4 py-4 md:grid-cols-4 md:gap-[8px] md:py-8"
      >
        {metrics.map((metric) => {
          return (
            <OverviewMetricItem
              key={metric.title}
              title={metric.title}
              rawValue={
                metric.value === undefined
                  ? undefined
                  : convertBigintToHumanReadable(metric.value, USD_DECIMALS)
              }
              formatDecimal={usdAmountDisplayDecimal}
              formatOptions={{
                style: 'currency',
                currency: 'USD',
                showMinDecimalValue: true,
                stripTrailingZeros: true,
              }}
              isLoading={!isHydrated || metric.value === undefined}
              skeletonClassName="h-[19.2px] w-16 md:h-[16.8px] md:w-24"
              wrapClassName="h-[19.2px] md:h-[16.8px]"
              triggerClassName="cursor-pointer rounded-xl p-2 md:flex md:flex-col-reverse md:items-center md:justify-center md:gap-[8px] md:text-center"
              tooltipContentProps={{
                sideOffset: 0,
                className: 'md:max-w-100',
                collisionBoundary: boundaryEl ? [boundaryEl] : undefined,
                collisionPadding: { top: -500, bottom: -500 },
              }}
              valueClassName="text-base md:text-sm"
              tips={metric.tips}
            />
          );
        })}
      </div>
      <div
        id="vault-list-search"
        className="mb-3 flex items-center justify-between gap-1 md:mb-0"
      >
        {isHydrated ? (
          <>
            <Input
              prefix={<SearchIcon className="max-h-4 max-w-4" />}
              suffix={
                searchText ? (
                  <button
                    type="button"
                    className="text-t-350 hover:text-t-1100"
                    onClick={() => setSearchText('')}
                    aria-label={t`Clear search`}
                  >
                    <CircleXIcon size={16} />
                  </button>
                ) : null
              }
              className="bg-bg-3-h5 md:bg-bg-3 h-8 min-w-4 flex-1 px-2 py-0 md:max-w-100"
              inputWrapClassName="h-full items-center"
              inputClassName="h-full leading-none text-xs font-normal"
              prefixClassname="flex items-center pr-1"
              suffixClassName="flex items-center pl-1"
              placeholder={t`Search Vault`}
              variant="ghost"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value.slice(0, 42));
              }}
            />
            <div className="flex items-center gap-1">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as VaultSortOption)}
              >
                <SelectTrigger
                  hiddenIcon
                  aria-label={t`Sort vaults`}
                  className="bg-bg-3-h5 md:bg-bg-3 text-t-350 data-[state=open]:text-t-1100 hover:text-t-1100 rounded-xl p-4 text-xs font-medium transition-colors"
                >
                  <div className="flex items-center gap-[10px]">
                    <FilterIcon size={16} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="min-w-[210px] p-2">
                  <SelectItem value="apy_desc" className="h-9 text-xs">
                    {t`APY`}
                  </SelectItem>
                  <SelectItem value="tvl_desc" className="h-9 text-xs">
                    {t`TVL`}
                  </SelectItem>
                </SelectContent>
              </Select>
              {!isMobile ? (
                <div
                  className="bg-bg-3 hidden items-center gap-1 rounded-xl p-1 md:flex"
                  data-mode={viewMode}
                >
                  <button
                    type="button"
                    aria-label={t`Card view`}
                    onClick={() => setViewMode('card')}
                    data-active={viewMode === 'card'}
                    className={cn(
                      'flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors',
                      'hover:text-t-1100',
                      viewMode === 'card'
                        ? 'bg-bg-4 text-t-1100'
                        : 'text-t-350',
                    )}
                  >
                    <GridFillIcon size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={t`List view`}
                    onClick={() => setViewMode('list')}
                    data-active={viewMode === 'list'}
                    className={cn(
                      'flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors',
                      'hover:text-t-1100',
                      viewMode === 'list'
                        ? 'bg-bg-4 text-t-1100'
                        : 'text-t-350',
                    )}
                  >
                    <ListIcon size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <VaultsToolbarSkeletonContent />
        )}
      </div>
      {!hasVaultsList ? (
        viewMode === 'list' && !isMobile ? (
          <VaultListSkeletonSection />
        ) : (
          <VaultCardSkeletonSection className={isMobile ? 'pb-18' : 'pb-8'} />
        )
      ) : hasNoMatch ? (
        <div className="text-t-350 mt-6 flex h-20 items-center justify-center text-center text-sm">
          {t`No matching results found.`}
        </div>
      ) : viewMode === 'list' ? (
        isMobile ? (
          <VaultCardGrid
            vaults={processedList}
            depositCapMetrics={depositCapMetrics}
            className="pb-18"
          />
        ) : (
          <div className="pb-8">
            <VaultsListView data={listRows} />
          </div>
        )
      ) : (
        <VaultCardGrid
          vaults={processedList}
          depositCapMetrics={depositCapMetrics}
          className={isMobile ? 'pb-18' : 'pb-8'}
        />
      )}
    </div>
  );
};
