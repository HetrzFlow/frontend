import {
  FC,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLingui } from '@lingui/react/macro';
import { useListCallbackRef } from 'react-window';
import { CircleXIcon, cn, Input, SearchIcon, useShowBShadow } from '@repo/ui';
import { useInstStore, usePriceStore, type TickerType } from '@/common';
import { useTickers } from '@/common/services';
import InstCategories from '@/components/InstCategories';
import { useMarketsStats } from '@/hooks/useMarketsStats';

import { isCreditCategory } from '@/lib/credit/creditMarkets';
import { isCreditFeatureEnabled } from '@/lib/credit/creditTrade';
import { CATEGORY } from '@/services/rest/pools';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePreferenceStore } from '@/stores/trade/preference';
import { SORT_KEY } from './const';
import List from './List';
import ListHeader from './ListHeader';
import { getMarketSearchRank, normalizeMarketSearch, sortFn } from './utils';

interface ContentProps {
  onOpenChange: (open: boolean) => void;
}

const Content: FC<ContentProps> = ({ onOpenChange }) => {
  const { t } = useLingui();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLaunchable, setShowLaunchable] = useState(true);
  const insts = useInstStore((state) => state.getViewInstsArr());
  const creditFeatureOn = isCreditFeatureEnabled(insts);
  const { tickersByMarketAddress, tickersBySymbol } = useTickers();
  const favorites = usePreferenceStore((state) => state.favorites);
  const toggleFavorite = usePreferenceStore((state) => state.toggleFavorite);
  const setInst = useTradeGlobalStore((state) => state.setInst);

  const marketsStats = useMarketsStats();

  const availableCategories = useMemo(() => {
    const categories = new Set<CATEGORY>([CATEGORY.all, CATEGORY.favorites]);

    insts.forEach((inst) => {
      categories.add(inst.category);
    });

    return categories;
  }, [insts]);

  useEffect(() => {
    if (availableCategories.has(selectedCategory as CATEGORY)) {
      return;
    }

    setSelectedCategory(CATEGORY.all);
  }, [availableCategories, selectedCategory]);

  const [sortKey, setSortKey] = useState<'' | SORT_KEY>('');
  const [sorts, setSorts] = useState<Record<string, string>>({});

  const [searchText, setSearchText] = useState<string>('');
  const deferredSearchText = useDeferredValue(searchText);
  const hasEnter = !!deferredSearchText;
  const searchKey = useMemo(
    () => normalizeMarketSearch(deferredSearchText),
    [deferredSearchText],
  );

  const filterInsts = useMemo(() => {
    return [...insts].filter((v) => {
      const name = normalizeMarketSearch(v.name);

      return (
        (selectedCategory === 'all' ||
          v.category === selectedCategory ||
          (selectedCategory === CATEGORY.credit &&
            isCreditCategory(v.category)) ||
          (selectedCategory === CATEGORY.favorites &&
            favorites.get(v.marketTokenAddress))) &&
        (!searchKey
          ? !hasEnter
          : name === searchKey ||
            name.includes(searchKey) ||
            v.marketTokenAddress.toLocaleLowerCase() === searchKey)
      );
    });
  }, [insts, searchKey, selectedCategory, favorites, hasEnter]);

  const sortedInsts = useMemo(() => {
    const tickersMap: Record<string, TickerType> = {
      ...tickersBySymbol,
      ...tickersByMarketAddress,
    };

    filterInsts.forEach((inst) => {
      const tickerData =
        tickersMap[inst.marketTokenAddress] || tickersMap[inst.symbol];

      // Override current_price with WS realtime price to match Item display
      const wsTicker = usePriceStore.getState().priceTickers[inst.symbol];
      if (wsTicker?.[0]?.p && tickerData) {
        if (tickersMap[inst.marketTokenAddress]) {
          tickersMap[inst.marketTokenAddress] = {
            ...tickerData,
            current_price: wsTicker[0].p,
          } as TickerType;
        } else {
          tickersMap[inst.symbol] = {
            ...tickerData,
            current_price: wsTicker[0].p,
          } as TickerType;
        }
      }
    });

    return [...filterInsts].sort((a, b) => {
      const searchRankDifference =
        getMarketSearchRank(b.name, searchKey) -
        getMarketSearchRank(a.name, searchKey);
      if (searchRankDifference) {
        return searchRankDifference;
      }

      return sortFn(a, b, {
        tickersMap,
        marketsStats,
        sortKey,
        sorts,
        favorites,
      });
    });
  }, [
    tickersByMarketAddress,
    tickersBySymbol,
    sortKey,
    sorts,
    filterInsts,
    marketsStats,
    favorites,
    searchKey,
  ]);

  const handleItemClick = useCallback(
    (inst: (typeof insts)[number]) => {
      setInst(inst);
      onOpenChange(false);
    },
    [onOpenChange, setInst],
  );
  const [scrollBox, setScrollBox] = useListCallbackRef();
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingFavoriteScrollRef = useRef<string | null>(null);
  const { showBShadow, handleScroll, updateBShadow } = useShowBShadow(
    scrollBox?.element ?? undefined,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(updateBShadow);
    return () => cancelAnimationFrame(frame);
  }, [sortedInsts.length, updateBShadow]);

  const handleFavoriteToggle = useCallback(
    (marketAddress: string) => {
      const nextIsFavorite = !usePreferenceStore
        .getState()
        .isFavorite(marketAddress);
      pendingFavoriteScrollRef.current = nextIsFavorite ? marketAddress : null;
      toggleFavorite(marketAddress);
    },
    [toggleFavorite],
  );

  useEffect(() => {
    const marketAddress = pendingFavoriteScrollRef.current;
    if (!marketAddress) {
      return;
    }

    const index = sortedInsts.findIndex(
      (inst) => inst.marketTokenAddress === marketAddress,
    );
    if (index < 0) {
      pendingFavoriteScrollRef.current = null;
      return;
    }

    pendingFavoriteScrollRef.current = null;
    requestAnimationFrame(() => {
      scrollBox?.scrollToRow({
        index,
        align: 'start',
        behavior: 'smooth',
      });
    });
  }, [sortedInsts, scrollBox]);

  return (
    <div
      ref={containerRef}
      className="scrollbar-none instSelectorContainer flex flex-col overflow-x-auto text-xs"
    >
      <div className="">
        <Input
          className="md:bg-bg-4 mb-2"
          inputClassName="text-xs font-normal"
          variant="ghost"
          value={deferredSearchText}
          maxLength={42}
          prefix={<SearchIcon size={20} />}
          suffix={
            <span
              className="text-t-430 cursor-pointer"
              onClick={() => setSearchText('')}
            >
              {deferredSearchText && <CircleXIcon size={20} />}
            </span>
          }
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t`Search Market`}
        />
        <InstCategories
          value={selectedCategory}
          onChange={setSelectedCategory}
          hideNewListed
          showCredit={creditFeatureOn}
          availableCategories={availableCategories}
          showLaunchable={showLaunchable}
          onSwitchShowLaunchable={setShowLaunchable}
        />
        <ListHeader
          sorts={sorts}
          onSortChange={(key) => {
            setSortKey(key);
            setSorts((prev) => {
              return {
                [key]: !prev[key] ? 'desc' : prev[key] === 'desc' ? 'asc' : '',
              };
            });
          }}
        />
        <div className="relative h-[min(calc(100dvh-280px),660px)] min-h-45 overflow-hidden max-md:h-[min(calc(100dvh-210px),660px)]">
          {sortedInsts.length ? (
            <List
              data={sortedInsts}
              listRef={setScrollBox}
              marketsStats={marketsStats}
              collisionBoundary={containerRef.current}
              onClick={handleItemClick}
              onFavoriteToggle={handleFavoriteToggle}
              onScroll={handleScroll}
            />
          ) : (
            <div className="text-t-350 mt-6 h-20 text-center text-sm">
              {t`No matching results found.`}
            </div>
          )}
          {showBShadow && (
            <div
              className={cn(
                'to-bg-3 max-md:to-bg-1 pointer-events-none absolute bottom-0 h-15 w-full bg-gradient-to-b from-transparent',
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Content;
