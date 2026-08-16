'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { percentFormat, thoFormat } from '@repo/lib/format';
import { ArrowRightIcon, Button, XIcon } from '@repo/ui';
import { GENESIS_INTEGER_FORMAT_OPTIONS } from '@/containers/genesis/lib/constants';
import { useGenesisVaultConfig } from '@/queries/bsc/genesis';

interface MobileGenesisEntryProps {
  href: string;
}

export const MobileGenesisEntry = ({ href }: MobileGenesisEntryProps) => {
  const { t } = useLingui();
  const { data: genesisConfig } = useGenesisVaultConfig();
  const [dismissed, setDismissed] = useState(false);
  const apyLabel = genesisConfig
    ? percentFormat(genesisConfig.apr / 100, 2, {
        stripTrailingZeros: true,
      })
    : '--';
  const boostLabel = genesisConfig
    ? `${thoFormat(
        genesisConfig.boostMultiplier,
        GENESIS_INTEGER_FORMAT_OPTIONS,
      )}x`
    : '--';

  if (dismissed) return null;

  return (
    <aside className="hiddenIn404 fixed inset-x-4 bottom-[80px] z-[60] h-[60px] overflow-hidden rounded-xl md:hidden">
      <Image
        src="/trade-static/genesis/mobile-entry.webp"
        alt=""
        aria-hidden="true"
        fill
        sizes="calc(100vw - 32px)"
        className="pointer-events-none object-cover select-none"
      />

      <a
        href={href}
        aria-label={t`Genesis Vault`}
        className="absolute inset-0 z-10 flex items-center px-3 pr-12 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none focus-visible:ring-inset"
      >
        <span className="min-w-0">
          <span className="text-accent block text-base font-medium tracking-[-0.64px]">
            {t`Genesis Vault`}
          </span>
          <span className="text-t-270 mt-1 block truncate text-[8px] tracking-[-0.32px]">
            {t`Deposit to earn ~${apyLabel} APY rewards and a ${boostLabel} Merits boost.`}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="bg-accent absolute top-1/2 right-[26px] grid size-6 -translate-y-1/2 place-items-center rounded-full text-black"
        >
          <ArrowRightIcon size={14} />
        </span>
      </a>

      <Button
        variant="ghost"
        size="icon"
        aria-label={t`Close`}
        onClick={() => setDismissed(true)}
        className="absolute top-0 right-0 z-20 size-6 bg-transparent p-0 text-white hover:bg-transparent hover:text-white"
      >
        <XIcon size={14} />
      </Button>
    </aside>
  );
};
