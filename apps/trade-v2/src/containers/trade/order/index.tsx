import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { thoFormat } from '@repo/lib/format';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Label,
  cn,
  TabsActiveBar,
} from '@repo/ui';
import { useIsConnect, useOpenOrders, usePositions } from '@/common';
import WalletConnectEmptyState from '@/common/components/WalletConnectEmptyState';

import { ENABLE_SWAP } from '@/constants/common';
import { ORDER_TAB_VALUE } from '@/constants/enum';
import { scheduleIdleTask } from '@/lib/runtime/scheduleIdleTask';
import { hasInactiveTpSlOrders as resolveHasInactiveTpSlOrders } from '@/lib/trade/order';

import { useKlineStore } from '@/stores/trade/kline';
import RefreshBtn from './components/RefreshBtn';
import { useHandleOrderEvents } from './hooks';
import { useOrdersStore } from './store';

const loadClaim = () => import('./Claim');
const loadHistoryRecords = () => import('./historyRecords');
const loadOpenOrders = () => import('./openOrders');
const loadPositions = () => import('./positions');
const loadSwapHistory = () =>
  import('@/components/SwapHistory/SwapHistoryTable');

const Claim = dynamic(loadClaim, {
  ssr: false,
});
const ClaimCountBadge = dynamic(() => import('./Claim/ClaimCountBadge'), {
  ssr: false,
});
const HistoryRecords = dynamic(loadHistoryRecords, {
  ssr: false,
});
const OpenOrders = dynamic(loadOpenOrders, {
  ssr: false,
});
const Positions = dynamic(loadPositions, {
  ssr: false,
});
const SwapHistory = dynamic(loadSwapHistory, {
  ssr: false,
});

const ORDER_TAB_VALUES = Object.values(ORDER_TAB_VALUE).filter(
  (value) => ENABLE_SWAP || value !== ORDER_TAB_VALUE.SWAP,
);

const resolveOrderTab = (orderTab: string | null) =>
  ORDER_TAB_VALUES.includes(orderTab as ORDER_TAB_VALUE)
    ? (orderTab as ORDER_TAB_VALUE)
    : ORDER_TAB_VALUE.POSITION;

const Order = ({ className }: { className?: string }) => {
  const { t } = useLingui();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConnected = useIsConnect();
  const [showPositions, setShowPositions] = useKlineStore(
    useShallow((state) => [state.showPositions, state.setShowPositions]),
  );
  const [
    onlyShowCurrentInst,
    setOnlyShowCurrentInst,
    resetListFilters,
  ] = useOrdersStore(
    useShallow((state) => [
      state.onlyShowCurrentInst,
      state.setOnlyShowCurrentInst,
      state.resetListFilters,
    ]),
  );

  const { data: positions } = usePositions();
  const { data: ordersData } = useOpenOrders();
  const hasInactiveTpSlOrders = useMemo(
    () => resolveHasInactiveTpSlOrders(ordersData, positions),
    [ordersData, positions],
  );
  const orderTab = searchParams.get('orderTab');
  const [tabValue, setTabValue] = useState(() => resolveOrderTab(orderTab));
  const showMarketFilters =
    tabValue !== ORDER_TAB_VALUE.CLAIM &&
    tabValue !== ORDER_TAB_VALUE.SWAP;
  const tabValueRef = useRef(tabValue);
  const tabListRef = useRef<HTMLDivElement>(null);
  const ignoreNextOrderTabChangeRef = useRef(false);

  const [refetchMark, setRefetchMark] = useState(0);

  useEffect(() => {
    if (ignoreNextOrderTabChangeRef.current) {
      ignoreNextOrderTabChangeRef.current = false;
      return;
    }

    const nextTabValue = resolveOrderTab(orderTab);
    if (tabValueRef.current === nextTabValue) return;

    tabValueRef.current = nextTabValue;
    resetListFilters();
    setTabValue(nextTabValue);
  }, [orderTab, resetListFilters]);

  const handleTabChange = (value: string) => {
    if (!ORDER_TAB_VALUES.includes(value as ORDER_TAB_VALUE)) return;

    const nextTabValue = value as ORDER_TAB_VALUE;
    if (tabValueRef.current !== nextTabValue) {
      tabValueRef.current = nextTabValue;
      resetListFilters();
      setTabValue(nextTabValue);
    }

    if (
      !searchParams.has('orderTab') &&
      !searchParams.has('claimTab') &&
      !searchParams.has('claimFocus') &&
      !searchParams.has('positionFocus') &&
      !searchParams.has('orderFocus')
    ) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete('orderTab');
    nextSearchParams.delete('claimTab');
    nextSearchParams.delete('claimFocus');
    nextSearchParams.delete('positionFocus');
    nextSearchParams.delete('orderFocus');
    const query = nextSearchParams.toString();

    ignoreNextOrderTabChangeRef.current = orderTab !== null;
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  // handle order events
  useHandleOrderEvents();

  useEffect(() => {
    return scheduleIdleTask(() => {
      void Promise.all([
        loadPositions(),
        loadOpenOrders(),
        loadHistoryRecords(),
        ...(ENABLE_SWAP ? [loadSwapHistory()] : []),
        loadClaim(),
      ]);
    });
  }, []);

  // handle tab animation
  const [activeTabEle, setActiveTabEle] = useState<
    HTMLButtonElement | null | undefined
  >();
  const activeTabRef = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    setActiveTabEle(activeTabRef.current[tabValue]);
  }, [tabValue]);

  const activeTabContent = useMemo(() => {
    switch (tabValue) {
      case ORDER_TAB_VALUE.POSITION:
        return <Positions refetchMark={refetchMark} />;
      case ORDER_TAB_VALUE.ORDER:
        return <OpenOrders refetchMark={refetchMark} />;
      case ORDER_TAB_VALUE.HISTORY:
        return <HistoryRecords refetchMark={refetchMark} />;
      case ORDER_TAB_VALUE.SWAP:
        return <SwapHistory refetchMark={refetchMark} />;
      case ORDER_TAB_VALUE.CLAIM:
        return <Claim refetchMark={refetchMark} />;
      default:
        return null;
    }
  }, [refetchMark, tabValue]);

  return (
    <>
      <h2 className="sr-only">{t`Positions and Orders`}</h2>
      <Tabs
        value={tabValue}
        className={cn('w-full gap-0 md:h-full', className)}
        onValueChange={handleTabChange}
      >
        <div className="max-md:bg-bg-1-h5 flex items-center justify-between gap-2 max-md:sticky max-md:-top-px max-md:z-10 max-md:h-[48px] max-md:shrink-0 max-md:overflow-x-auto max-md:px-4 max-md:pt-3">
          <TabsList className="flex gap-2" ref={tabListRef}>
            <TabsTrigger
              className="text-t-270 data-[state=active]:text-t-1100 z-2 flex grow-0 gap-1.5 px-4 py-2 font-medium data-[state=active]:bg-transparent"
              ref={(el) => {
                activeTabRef.current[ORDER_TAB_VALUE.POSITION] = el;
              }}
              onFocus={() => void loadPositions()}
              onPointerEnter={() => void loadPositions()}
              value={ORDER_TAB_VALUE.POSITION}
            >
              {t`Positions`}{' '}
              {!!positions?.length && (
                <span className="bg-bg-4 font-plex min-w-5 rounded-sm p-0.5 align-middle">
                  {thoFormat(positions.length)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              className="text-t-270 data-[state=active]:text-t-1100 z-2 flex grow-0 gap-1.5 px-4 py-2 font-medium data-[state=active]:bg-transparent"
              ref={(el) => {
                activeTabRef.current[ORDER_TAB_VALUE.ORDER] = el;
              }}
              onFocus={() => void loadOpenOrders()}
              onPointerEnter={() => void loadOpenOrders()}
              value={ORDER_TAB_VALUE.ORDER}
            >
              {t`Orders`}
              {!!ordersData?.length && (
                <span className="relative inline-flex">
                  <span className="bg-bg-4 font-plex min-w-5 rounded-sm p-0.5 align-middle">
                    {thoFormat(ordersData?.length)}
                  </span>
                  {hasInactiveTpSlOrders ? (
                    <span className="bg-warning absolute top-0 right-0 size-[5px] rounded-full" />
                  ) : null}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              className="text-t-270 data-[state=active]:text-t-1100 z-2 grow-0 px-4 py-2 font-medium data-[state=active]:bg-transparent"
              ref={(el) => {
                activeTabRef.current[ORDER_TAB_VALUE.HISTORY] = el;
              }}
              onFocus={() => void loadHistoryRecords()}
              onPointerEnter={() => void loadHistoryRecords()}
              value={ORDER_TAB_VALUE.HISTORY}
            >
              {t({ message: 'Trades', context: 'Swap history' })}
            </TabsTrigger>
            {ENABLE_SWAP ? (
              <TabsTrigger
                className="text-t-270 data-[state=active]:text-t-1100 z-2 grow-0 px-4 py-2 font-medium data-[state=active]:bg-transparent"
                ref={(el) => {
                  activeTabRef.current[ORDER_TAB_VALUE.SWAP] = el;
                }}
                onFocus={() => void loadSwapHistory()}
                onPointerEnter={() => void loadSwapHistory()}
                value={ORDER_TAB_VALUE.SWAP}
              >
                {t({ message: 'Swaps', context: 'Swap history' })}
              </TabsTrigger>
            ) : null}
            <TabsTrigger
              className="text-t-270 data-[state=active]:text-t-1100 z-2 flex grow-0 gap-1.5 px-4 py-2 font-medium data-[state=active]:bg-transparent"
              ref={(el) => {
                activeTabRef.current[ORDER_TAB_VALUE.CLAIM] = el;
              }}
              onFocus={() => void loadClaim()}
              onPointerEnter={() => void loadClaim()}
              value={ORDER_TAB_VALUE.CLAIM}
            >
              {t`Claim`}
              <ClaimCountBadge />
            </TabsTrigger>

            <TabsActiveBar
              className={cn(
                'bg-bg-3 z-1 h-full rounded-xl px-4 py-2 transition-[width,transform]',
              )}
              activeTabEle={activeTabEle}
              observerEle={tabListRef.current}
            />
          </TabsList>
          <div className="scrollbar-none ml-auto flex gap-2 overflow-x-auto max-md:min-w-min">
            {showMarketFilters ? (
              <>
                <Label className="text-t-270 hover:text-t-1100 z-1 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-normal hover:transition-[color] max-md:hidden">
                  {t`Chart Positions`}
                  <Switch
                    aria-label={t`Chart Positions`}
                    checked={showPositions}
                    onCheckedChange={(checked) => setShowPositions(checked)}
                  />
                </Label>
                <Label className="text-t-270 hover:text-t-1100 z-1 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-normal hover:transition-[color] max-md:hidden">
                  {t`Hide Others`}
                  <Switch
                    aria-label={t`Hide Others`}
                    checked={onlyShowCurrentInst}
                    onCheckedChange={(checked) =>
                      setOnlyShowCurrentInst(checked)
                    }
                  />
                </Label>
              </>
            ) : null}
            <RefreshBtn
              onClick={() => {
                setRefetchMark(1 - refetchMark);
              }}
            />
          </div>
        </div>
        <div className="z-1 md:h-[calc(100%-28px)] md:overflow-hidden">
          {isConnected ? (
            <TabsContent className="h-full" value={tabValue}>
              {activeTabContent}
            </TabsContent>
          ) : (
            <WalletConnectEmptyState />
          )}
        </div>
      </Tabs>
    </>
  );
};

export default Order;
