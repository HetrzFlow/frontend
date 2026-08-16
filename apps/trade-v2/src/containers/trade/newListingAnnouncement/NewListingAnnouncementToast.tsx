'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trans } from '@lingui/react/macro';
import { CoinIcon } from '@repo/common/components';
import { RocketLaunchIcon, Separator, XIcon } from '@repo/ui';
import { useInstStore } from '@/common';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';
import { useTradeGlobalStore } from '@/stores/trade/global';
import type { AnnouncementMarketView } from './mapper';

interface NewListingAnnouncementToastProps {
  totalMarkets: number;
  overflowCount: number;
  markets: AnnouncementMarketView[];
  tradeLink: string;
  onClose: () => void;
}

const NewListingAnnouncementToast = ({
  totalMarkets,
  overflowCount,
  markets,
  tradeLink,
  onClose,
}: NewListingAnnouncementToastProps) => {
  const router = useRouter();
  const insts = useInstStore((state) => state.getInsts());
  const setInst = useTradeGlobalStore((state) => state.setInst);
  return (
    <div className="bg-border text-t-1100 w-[332px] rounded-2xl border px-4 py-3 shadow-[0px_10px_40px_0_rgba(0,0,0,0.1)] backdrop-blur-[20px] max-md:w-[calc(100vw-var(--spacing)*8)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RocketLaunchIcon size={20} className="text-t-1100" />
          <span>
            <Trans>New Listings</Trans>
          </span>
        </div>
        <button
          type="button"
          aria-label="Close announcement"
          className="text-t-1100 hover:text-t-270 transition-colors"
          onClick={onClose}
        >
          <XIcon size={20} />
        </button>
      </div>
      <Separator className="my-2" />
      <p className="text-t-270 text-xs">
        <Trans>Up to {totalMarkets} new markets, now live on HertzFlow:</Trans>
      </p>
      <div className="mt-2 grid grid-cols-2 gap-y-2">
        {markets.map((market) => {
          const href = `${tradeLink}/${buildTradeRouteInstIdByCategory(
            market.name,
            market.category,
          )}`;

          return (
            <Link
              key={market.address}
              href={href}
              prefetch={false}
              onMouseEnter={() => router.prefetch(href)}
              onPointerDown={() => router.prefetch(href)}
              onClick={() => {
                const inst = insts[market.address];
                if (inst) setInst(inst);
              }}
              className="flex items-center gap-1.5 text-left"
            >
              <CoinIcon src={market.icon} alt={market.name} size={20} />
              <span className="text-t-1100 truncate text-sm font-medium">
                {market.name}
              </span>
            </Link>
          );
        })}
      </div>
      {overflowCount > 0 ? (
        <div className="text-t-1100 -mt-5 flex justify-end text-sm leading-5 font-medium">
          +{overflowCount}
        </div>
      ) : null}
    </div>
  );
};

export default NewListingAnnouncementToast;
