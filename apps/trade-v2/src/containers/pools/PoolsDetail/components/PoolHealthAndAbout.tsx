'use client';

import { useMemo } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { Trans, useLingui } from '@lingui/react/macro';
import { getAddress } from 'viem';
import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, formatAddress, unitFormat } from '@repo/lib/format';
import {
  CONTRACT_USD_MULTIPLIER,
  useGlobalStore,
  useMarketValues,
} from '@/common';
import { useHzSdk } from '@/common/chainClient/hooks';
import OpenInterestRatio from '@/components/OpenInterestRatio';
import { getCategoryLabelMessage } from '@/lib/market/categoryLabels';
import { usePoolDetail } from '@/queries/bsc/pools';
import { CATEGORY } from '@/services/rest/pools';
import {
  AboutPerformanceTabsSkeleton,
  AboutPerformanceTabs,
  DottedTooltip,
} from './detailShared';
import YourPerformanceTabsContent from './YourPerformanceTabsContent';

function Row({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: React.ReactNode;
  tooltip?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="text-t-270 text-xs">
        {tooltip ? (
          <DottedTooltip content={tooltip}>{label}</DottedTooltip>
        ) : (
          label
        )}
      </div>
      <div className="text-t-1100 min-w-0 truncate text-base">{value}</div>
    </div>
  );
}

export function PoolCategoryChip({ category }: { category?: CATEGORY }) {
  const { i18n } = useLingui();
  const labelMessage = getCategoryLabelMessage(category);
  if (!labelMessage) return null;

  const label = i18n._(labelMessage);

  return (
    <span className="bg-accent/15 text-accent rounded-md px-2 py-1 text-xs">
      {label}
    </span>
  );
}

export function PoolHealthAndAbout({
  marketAddress,
}: {
  marketAddress: string;
}) {
  const { t } = useLingui();
  const usdDecimals = useGlobalStore((state) => state.usdAmountDisplayDecimal);
  const { data } = usePoolDetail(marketAddress);
  const hzSdk = useHzSdk();
  const pool = data?.pool;

  const checksumAddress = useMemo(() => {
    try {
      return getAddress(marketAddress);
    } catch {
      return marketAddress;
    }
  }, [marketAddress]);
  const { data: marketValues } = useMarketValues({
    marketTokenAddress: checksumAddress,
  });
  const longOi = calc(marketValues?.longInterestUsd.toString() || '').div(
    CONTRACT_USD_MULTIPLIER,
  );
  const shortOi = calc(marketValues?.shortInterestUsd.toString() || '').div(
    CONTRACT_USD_MULTIPLIER,
  );
  const totalOi = longOi.plus(shortOi);
  const traderOpenPnl =
    marketValues?.netPnl === undefined
      ? undefined
      : calc(marketValues.netPnl.toString()).div(CONTRACT_USD_MULTIPLIER);
  const explorerHost = hzSdk
    ? (getViemChain(hzSdk.config.chainId).blockExplorers?.default.url ?? '')
    : '';
  const poolContractLabel = formatAddress(checksumAddress);

  const about = (
    <div className="divide-border divide-y">
      <div className="pb-3">
        <Row
          label={t`Market`}
          value={pool?.display_name ?? pool?.symbol ?? '--'}
        />
      </div>
      <div className="py-3">
        <Row
          label={t`Pool Contract`}
          value={
            explorerHost ? (
              <a
                href={`${explorerHost}/address/${checksumAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {poolContractLabel}
              </a>
            ) : (
              poolContractLabel
            )
          }
        />
      </div>
      <div className="pt-3">
        <Row
          label={t`Yield source`}
          value={t`Fees + net trader losses`}
          tooltip={t`LP yield comes from trading fees and trader net losses in this single market.`}
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_minmax(0,1fr)] md:gap-2">
      <div className="bg-bg-2 rounded-2xl p-3">
        <div className="bg-bg-3 inline-flex rounded-lg px-3 py-1.5 text-xs">
          <Trans>Pool Health</Trans>
        </div>
        <div className="divide-border mt-2 divide-y">
          <div className="pb-3">
            <div className="py-1">
              <div className="space-y-2">
                <div className="text-t-270 text-xs">
                  <DottedTooltip
                    content={t`Total USDT value of all open long/short positions in this market.`}
                  >
                    <Trans>Open Interest</Trans>
                  </DottedTooltip>
                </div>
                <div className="text-t-1100 text-base">
                  {marketValues
                    ? unitFormat(totalOi, usdDecimals, {
                        style: 'currency',
                        currency: 'USD',
                        showMinDecimalValue: true,
                        stripTrailingZeros: true,
                      })
                    : '--'}
                </div>
              </div>
              {marketValues ? (
                <OpenInterestRatio
                  longOiUsd={longOi.toString()}
                  shortOiUsd={shortOi.toString()}
                  usdAmountDisplayDecimal={usdDecimals}
                  className="mt-4"
                  showAmounts
                />
              ) : null}
            </div>
          </div>
          <div className="pt-3">
            <div className="space-y-2 py-1">
              <div className="text-t-270 text-xs">
                <DottedTooltip
                  content={t`Real-time unrealized PnL of open trader positions in this pool. Positive means traders are currently in profit; negative means the pool is currently in profit.`}
                >
                  <Trans>Traders&apos; Open PnL</Trans>
                </DottedTooltip>
              </div>
              <div className="text-t-1100 text-base">
                {traderOpenPnl !== undefined
                  ? unitFormat(traderOpenPnl, usdDecimals, {
                      style: 'currency',
                      currency: 'USD',
                      showMinDecimalValue: true,
                      stripTrailingZeros: true,
                      signDisplay: 'always',
                    })
                  : EMPTY_DISPLAY}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-md:bg-bg-2 max-md:rounded-2xl max-md:p-3">
        <AboutPerformanceTabs
          about={about}
          performance={
            <YourPerformanceTabsContent marketAddress={marketAddress} />
          }
          contentWrapClassName="mt-2"
        />
      </div>
    </div>
  );
}

export function PoolHealthAndAboutSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_minmax(0,1fr)] md:gap-2">
      <div className="bg-bg-2 rounded-2xl p-3">
        <div className="bg-bg-3 h-[26.4px] w-[89px] rounded-lg" />
        <div className="divide-border mt-2 divide-y">
          <div className="space-y-4 py-1 pb-4">
            <div className="space-y-2">
              <div className="bg-bg-3 h-[14.4px] w-24 rounded-xl" />
              <div className="bg-bg-3 h-[19.2px] w-16 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="bg-bg-3 h-1.5 rounded-full" />
              <div className="flex items-center justify-between">
                <div className="bg-bg-3 h-[14.4px] w-24 rounded-xl" />
                <div className="bg-bg-3 h-[14.4px] w-24 rounded-xl" />
              </div>
            </div>
          </div>
          <div className="pt-3">
            <div className="space-y-2 py-1">
              <div className="bg-bg-3 h-[14.4px] w-24 rounded-xl" />
              <div className="bg-bg-3 h-[19.2px] w-20 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-md:bg-bg-2 max-md:rounded-2xl max-md:p-3">
        <AboutPerformanceTabsSkeleton
          aboutContent={
            <div className="divide-border divide-y">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className={
                    index === 0 ? 'pb-3' : index === 1 ? 'py-3' : 'pt-3'
                  }
                >
                  <div className="space-y-2">
                    <div className="bg-bg-3 h-[14.4px] w-20 rounded-xl" />
                    <div className="bg-bg-3 h-[19.2px] w-32 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
}
