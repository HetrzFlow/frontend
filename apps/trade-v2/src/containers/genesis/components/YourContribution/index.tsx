'use client';

import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { CoinIcon } from '@repo/common/components';
import { percentFormat, thoFormat, unitFormat } from '@repo/lib/format';
import { ArrowRightIcon, Button } from '@repo/ui';
import type {
  GenesisUserPosition,
  GenesisVaultConfig,
} from '@/services/rest/genesis';
import {
  GENESIS_INTEGER_FORMAT_OPTIONS,
  GENESIS_USD_FORMAT_OPTIONS,
} from '../../lib/constants';
import {
  getGenesisAssetVisual,
  getGenesisVaultDisplayName,
} from '../../lib/genesisAssetVisuals';
import {
  findGenesisUserAsset,
  getGenesisVaultKey,
} from '../../lib/genesisVaultIdentity';
import { GenesisMetricLabel } from '../GenesisMetricLabel';

interface YourContributionProps {
  config?: GenesisVaultConfig;
  position?: GenesisUserPosition;
  onOpenVault: (vaultKey: string) => void;
}

export const YourContribution = ({
  config,
  position,
  onOpenVault,
}: YourContributionProps) => {
  const { t } = useLingui();
  const assets = config?.assets ?? [];
  const formattedMaturityDays = thoFormat(
    config?.maturityDays ?? 0,
    GENESIS_INTEGER_FORMAT_OPTIONS,
  );
  const formattedBoostMultiplier = thoFormat(
    config?.boostMultiplier ?? 0,
    GENESIS_INTEGER_FORMAT_OPTIONS,
  );
  return (
    <section className="w-full">
      <h2 className="text-t-1100 mb-3 text-xl font-medium max-md:mb-4 max-md:text-base">
        {t`Your Contribution`}
      </h2>
      <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1 max-md:gap-3">
        {assets.map((asset) => {
          const cap = Number(asset.capToken);
          const filled =
            cap > 0
              ? Math.min((Number(asset.depositedToken) / cap) * 100, 100)
              : 0;
          const vaultKey = getGenesisVaultKey(asset);
          const userAsset = findGenesisUserAsset(position, asset);
          const assetVisual = getGenesisAssetVisual(asset.symbol);
          const vaultDisplayName = getGenesisVaultDisplayName(asset);

          return (
            <div
              key={vaultKey}
              className="relative h-[242px] rounded-2xl border p-4"
            >
              <Image
                src={assetVisual.background}
                alt=""
                aria-hidden="true"
                quality={100}
                width={144}
                height={144}
                className="pointer-events-none absolute -top-[59px] right-0 size-36 max-w-none select-none"
              />

              <div className="relative flex h-6 items-center gap-2">
                <CoinIcon
                  src={assetVisual.icon}
                  alt={asset.symbol}
                  size={24}
                  className="shrink-0"
                />
                <span className="text-t-1100 text-base font-medium">
                  {vaultDisplayName}
                </span>
              </div>

              <div className="relative mt-3">
                <p className="text-t-350 text-xs">{t`Filled`}</p>
                <p className="text-t-1100 text-4xl font-medium">
                  {percentFormat(filled / 100, 2, {
                    showMinDecimalValue: true,
                    stripTrailingZeros: true,
                  })}
                </p>
              </div>

              <div className="relative mt-3 h-[46px] overflow-hidden rounded-full bg-white/10">
                <div
                  className="to-accent h-full bg-gradient-to-r from-white"
                  style={{ width: `${filled}%` }}
                />
              </div>

              <div className="relative mt-4 grid grid-cols-[1fr_40px] gap-3">
                <div>
                  <GenesisMetricLabel
                    label={t`Matured / Total Deposits`}
                    tooltip={t`Matured / Total deposits. A deposit matures at ${formattedMaturityDays} continuous days — only then is its ${formattedBoostMultiplier}× boost locked in.`}
                  />
                  <p className="text-t-1100 mt-1 text-lg font-semibold">
                    <span className="text-t-430 text-xs font-normal">
                      {unitFormat(
                        userAsset?.maturedDeposits ?? '0',
                        2,
                        GENESIS_USD_FORMAT_OPTIONS,
                      )}
                    </span>
                    <span className="text-t-430 text-xs font-normal"> / </span>
                    {unitFormat(
                      userAsset?.deposited ?? '0',
                      2,
                      GENESIS_USD_FORMAT_OPTIONS,
                    )}
                  </p>
                </div>
                <Button
                  variant="accent"
                  size="icon"
                  onClick={() => onOpenVault(vaultKey)}
                  aria-label={`${t`Open Vault`}: ${vaultDisplayName}`}
                  className="bg-accent grid size-10 place-items-center rounded-full text-lg text-black transition-colors hover:bg-[#25f3ff]"
                >
                  <ArrowRightIcon size={16} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
