import type { Inst } from '@/common';
import { toChecksumAddress } from '@/lib/address';

export interface AnnouncementApiItem {
  created_at: string;
  expire_at: string;
  markets: { address: string }[];
}

export interface AnnouncementMarketView {
  address: string;
  name: string;
  symbol: string;
  category?: string;
  icon: string;
}

export interface AnnouncementToastView {
  toastId: string;
  createdAt: string;
  expireAt: string;
  totalMarkets: number;
  visibleMarkets: AnnouncementMarketView[];
  overflowCount: number;
}

const MAX_VISIBLE_MARKETS = 4;

export function mapVisibleAnnouncements({
  announcements,
  dismissedCreatedAts,
  instMap,
  now,
}: {
  announcements: AnnouncementApiItem[];
  dismissedCreatedAts: string[];
  instMap: Record<string, Inst>;
  now: number;
}): AnnouncementToastView[] {
  const dismissedSet = new Set(dismissedCreatedAts);

  return announcements
    .filter(
      (item) =>
        typeof item?.created_at === 'string' &&
        item.created_at.length > 0 &&
        Number.isFinite(Date.parse(item.created_at)) &&
        !dismissedSet.has(item.created_at),
    )
    .filter(
      (item) =>
        typeof item.expire_at === 'string' &&
        Number.isFinite(Date.parse(item.expire_at)) &&
        Date.parse(item.expire_at) > now,
    )
    .filter((item) => Array.isArray(item.markets))
    .map((item) => {
      const resolvedMarkets = item.markets
        .map((market) => {
          if (
            typeof market?.address !== 'string' ||
            market.address.length === 0
          ) {
            return null;
          }

          const address = toChecksumAddress(market.address);
          const inst = instMap[address] ?? instMap[market.address];
          if (!inst) {
            return null;
          }

          const view: AnnouncementMarketView = {
            address,
            name: inst.name,
            symbol: inst.symbol,
            category: inst.category,
            icon: inst.icon,
          };

          return view;
        })
        .filter((market): market is AnnouncementMarketView => market !== null);

      return {
        toastId: `new-listing-${item.created_at}`,
        createdAt: item.created_at,
        expireAt: item.expire_at,
        totalMarkets: resolvedMarkets.length,
        visibleMarkets: resolvedMarkets.slice(0, MAX_VISIBLE_MARKETS),
        overflowCount: Math.max(
          resolvedMarkets.length - MAX_VISIBLE_MARKETS,
          0,
        ),
      } satisfies AnnouncementToastView;
    })
    .filter((item) => item.totalMarkets > 0)
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
}
