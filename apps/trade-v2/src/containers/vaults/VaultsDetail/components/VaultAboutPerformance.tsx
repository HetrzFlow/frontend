'use client';

import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { formatAmount } from '@hertzflow/sdk-v2/utils/numbers';
import { useLingui } from '@lingui/react/macro';
import { getAddress } from 'viem';
import { calc } from '@repo/lib/calc';
import { percentFormat, unitFormat } from '@repo/lib/format';
import { useGlobalStore } from '@/common';
import { useHzSdk } from '@/common/chainClient/hooks';
import {
  AboutPerformanceTabs,
  DottedTooltip,
} from '@/containers/pools/PoolsDetail/components/detailShared';
import { useVaultDetail, useVaultFeesChart } from '@/queries/bsc/vaults';
import { APY_PERIOD } from '@/services/rest/pools';
import type { VaultLocalizedText } from '@/services/rest/vaults';
import { HZV_NAME } from '@/stores/pools/trade';
import { parseRawValue } from '@/stores/synthetics/marketsData/selectors';
import YourPerformanceTabsContent from './DetailInfoTab/YourPerformanceTabsContent';

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
    <div className="flex min-w-0 items-center justify-between gap-4 text-xs">
      <div className="text-t-270 shrink-0">
        {tooltip ? (
          <DottedTooltip content={tooltip}>{label}</DottedTooltip>
        ) : (
          label
        )}
      </div>
      <div className="text-t-1100 min-w-0 truncate text-right">{value}</div>
    </div>
  );
}

const formatVaultSupply = (value?: string) => {
  const parsed = parseRawValue(value);
  if (parsed === undefined) return '--';
  return `${formatAmount(parsed, 18, 2, true)} ${HZV_NAME}`;
};

const formatUsdRaw = (value: string | undefined, decimals: number) => {
  const parsed = parseRawValue(value);
  if (parsed === undefined) return '--';
  return unitFormat(
    calc(parsed.toString(10)).div(calc(10).pow(30)).toString(),
    decimals,
    {
      style: 'currency',
      currency: 'USD',
      showMinDecimalValue: true,
      stripTrailingZeros: true,
    },
  );
};

function resolveVaultDescription(
  description: VaultLocalizedText | undefined,
  locale: string,
) {
  if (typeof description === 'string') {
    return description.trim();
  }

  if (!description) return undefined;

  const localized = description[locale]?.trim();
  if (localized) return localized;

  const fallback = description.en?.trim();
  if (fallback) return fallback;

  return Object.values(description)
    .find((value) => value?.trim())
    ?.trim();
}

export function VaultAboutPerformance({
  vaultAddress,
}: {
  vaultAddress: string;
}) {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const hzSdk = useHzSdk();
  const usdDecimals = useGlobalStore((state) => state.usdAmountDisplayDecimal);
  const vaultDetailQuery = useVaultDetail(vaultAddress);
  const vault = vaultDetailQuery.data?.data;
  const { data: fees30dChartData } = useVaultFeesChart({
    vaultAddress,
    period: APY_PERIOD['30D'],
    enabled: !!vaultAddress,
  });
  const fees30dUsd = vault?.fees_30d;
  const performanceFeeRate = fees30dChartData?.performance_fee_rate;
  const performanceFee = performanceFeeRate
    ? percentFormat(performanceFeeRate, 2)
    : '--';
  const checksumAddress = (() => {
    try {
      return getAddress(vaultAddress);
    } catch {
      return vaultAddress;
    }
  })();
  const explorerHost = hzSdk
    ? (getViemChain(hzSdk.config.chainId).blockExplorers?.default.url ?? '')
    : '';
  const description = resolveVaultDescription(vault?.description, locale);

  const about = (
    <div className="space-y-2">
      <div className="space-y-2">
        <Row label={t`Curator`} value={vault?.curator ?? '--'} />
        <Row
          label={t`Contract`}
          value={
            explorerHost ? (
              <a
                href={`${explorerHost}/address/${checksumAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {`${checksumAddress.slice(0, 6)}...${checksumAddress.slice(-4)}`}
              </a>
            ) : (
              `${checksumAddress.slice(0, 6)}...${checksumAddress.slice(-4)}`
            )
          }
        />
        <Row
          label={t`Yield source`}
          value={t`Trading fees + net trader losses`}
          tooltip={t`Vault yield comes from trading fees and net trader losses across underlying pools.`}
        />
        <Row
          label={t`Performance Fee`}
          value={performanceFee}
          tooltip={t`Net APY = Fee APY x (1 + Performance Fee).`}
        />
      </div>
      {description ? <p className="text-t-350 text-xs">{description}</p> : null}
      <div className="bg-bg-2 grid grid-cols-2 gap-3 rounded-2xl p-3">
        <div>
          <div className="text-t-270 text-xs">{t`Supply`}</div>
          <div className="text-t-1100 mt-1 text-base font-medium">
            {formatVaultSupply(vault?.supply)}
          </div>
        </div>
        <div>
          <div className="text-t-270 text-xs">{t`Fees 30d`}</div>
          <div className="text-t-1100 mt-1 text-base font-medium">
            {formatUsdRaw(fees30dUsd, usdDecimals)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-md:bg-bg-2 max-md:rounded-2xl max-md:p-3 md:h-full">
      <AboutPerformanceTabs
        about={about}
        performance={<YourPerformanceTabsContent vaultAddress={vaultAddress} />}
        defaultValue="about"
        contentWrapClassName="mt-2"
      />
    </div>
  );
}
