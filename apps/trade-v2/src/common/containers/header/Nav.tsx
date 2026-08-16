'use client';

import {
  FC,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { usePathname, useRouter } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { useNavItems } from '@repo/common/hooks';
import {
  Button,
  ChevronDownIcon,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  GroupIcon,
  GuardIcon,
  CreditIcon,
  MoreIcon,
  PieChartIcon,
  PointsIcon,
  TrophyIcon,
  ServerIcon,
  TabsActiveBar,
  TradeIcon,
  SwapNavIcon,
} from '@repo/ui';
import {
  LiquidGlassFilterDefs,
  LiquidGlassIndicatorFilterDefs,
  LiquidGlassTabs,
  liquidGlassTabIndicatorStyle,
  liquidGlassTabsStyle,
} from '@/common/components';
import { ENABLE_MERITS, ENABLE_SWAP } from '@/constants/common';
import { scheduleIdleTask } from '@/lib/runtime/scheduleIdleTask';
import NavItem from './NavItem';

interface NavProps {
  activeItem?: string;
  className?: string;
  mobileSwapOpen?: boolean;
  onMobileSwapClose?: () => void;
  onMobileSwapOpen?: () => void;
}

type PrefetchPriority = 'intent' | 'visible' | 'overflow';

type NavPrefetchTask = {
  href: string;
  priority: PrefetchPriority;
};

const BACKGROUND_NAV_PREFETCH_DELAY_MS = 8000;
const BACKGROUND_NAV_PREFETCH_INTERVAL_MS = 2500;
const MAX_BACKGROUND_NAV_PREFETCHES = 4;
const BACKGROUND_NAV_PREFETCH_KEYS = new Set([
  'pools',
  'vaults',
  'merits',
  'referral',
  'dashboard',
]);

const PREFETCH_PRIORITY_ORDER: Record<PrefetchPriority, number> = {
  intent: 0,
  visible: 1,
  overflow: 2,
};

type RouterPrefetchOptions = NonNullable<
  Parameters<ReturnType<typeof useRouter>['prefetch']>[1]
>;

const getInstIdFromCookie = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)INST_ID=([^;]*)/);
  return match ? match[1] || '' : '';
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    downlink?: number;
    effectiveType?: string;
    saveData?: boolean;
  };
};

const shouldSkipBackgroundNavPrefetch = () => {
  if (
    typeof document !== 'undefined' &&
    document.visibilityState !== 'visible'
  ) {
    return true;
  }

  if (typeof navigator === 'undefined') return false;

  const connection = (navigator as NavigatorWithConnection).connection;
  if (!connection) return false;

  if (connection.saveData) return true;

  const effectiveType = connection.effectiveType?.toLowerCase();
  if (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g'
  ) {
    return true;
  }

  return typeof connection.downlink === 'number' && connection.downlink < 1.5;
};

const isNonProductionVercelDeployment =
  process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const Nav: FC<NavProps> = ({
  activeItem = '',
  className,
  mobileSwapOpen,
  onMobileSwapClose,
  onMobileSwapOpen,
}) => {
  const { t } = useLingui();
  const router = useRouter();
  const desktopTabRef = useRef<Record<string, HTMLElement | null>>({});
  const mobileTabRef = useRef<Record<string, HTMLElement | null>>({});
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const desktopItemMeasureRef = useRef<Record<string, HTMLDivElement | null>>(
    {},
  );
  const desktopMoreMeasureRef = useRef<HTMLDivElement | null>(null);
  const desktopMoreRef = useRef<(HTMLButtonElement & HTMLDivElement) | null>(
    null,
  );
  const [desktopActiveEle, setDesktopActiveEle] = useState<
    HTMLElement | null | undefined
  >(null);
  const [hasDesktopActiveBarEle, setHasDesktopActiveBarEle] = useState(false);
  const [mobileActiveEle, setMobileActiveEle] = useState<
    HTMLElement | null | undefined
  >(null);
  const [clickItem, setClickItem] = useState(activeItem || '');
  const navItems = useNavItems();
  const pathname = usePathname();
  const isVaultDetailPage = useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const vaultsIndex = pathSegments.indexOf('vaults');

    return vaultsIndex >= 0 && pathSegments.length > vaultsIndex + 1;
  }, [pathname]);
  const hasNoiseBackground =
    activeItem === 'dashboard' ||
    activeItem === 'leaderboard' ||
    activeItem === 'referral' ||
    activeItem === 'merits' ||
    (activeItem === 'vaults' && !isVaultDetailPage);
  const [instId, setInstId] = useState('');
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [desktopVisibleCount, setDesktopVisibleCount] = useState<number | null>(
    null,
  );
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const invalidatedRoutesRef = useRef<Set<string>>(new Set());
  const queuedRoutesRef = useRef<Map<string, NavPrefetchTask>>(new Map());
  const drainCancelRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    // Delay fetching INST_ID to ensure cookies are set
    const timeoutId = setTimeout(() => {
      setInstId(getInstIdFromCookie());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    if (!mobileSwapOpen) setClickItem(activeItem);
  }, [activeItem, mobileSwapOpen]);

  const drainPrefetchQueue = useCallback(() => {
    if (drainCancelRef.current) return;

    drainCancelRef.current = scheduleIdleTask(() => {
      drainCancelRef.current = null;

      const nextTask = [...queuedRoutesRef.current.values()].sort(
        (left, right) =>
          PREFETCH_PRIORITY_ORDER[left.priority] -
          PREFETCH_PRIORITY_ORDER[right.priority],
      )[0];

      if (!nextTask) return;

      queuedRoutesRef.current.delete(nextTask.href);

      if (
        prefetchedRoutesRef.current.has(nextTask.href) ||
        nextTask.href === pathname
      ) {
        drainPrefetchQueue();
        return;
      }

      invalidatedRoutesRef.current.delete(nextTask.href);
      prefetchedRoutesRef.current.add(nextTask.href);
      router.prefetch(nextTask.href, {
        kind: 'auto' as RouterPrefetchOptions['kind'],
        onInvalidate: () => {
          prefetchedRoutesRef.current.delete(nextTask.href);
          invalidatedRoutesRef.current.add(nextTask.href);
        },
      });
      drainPrefetchQueue();
    }, 150);
  }, [pathname, router]);

  const queuePrefetch = useCallback(
    (href: string, priority: PrefetchPriority) => {
      if (!href || href === pathname || prefetchedRoutesRef.current.has(href)) {
        return;
      }

      const currentTask = queuedRoutesRef.current.get(href);
      if (
        currentTask &&
        PREFETCH_PRIORITY_ORDER[currentTask.priority] <=
          PREFETCH_PRIORITY_ORDER[priority]
      ) {
        return;
      }

      queuedRoutesRef.current.set(href, { href, priority });
      drainPrefetchQueue();
    },
    [drainPrefetchQueue, pathname],
  );

  const tradeLink = instId
    ? `${navItems.trade.link}/${instId}`
    : navItems.trade.link;

  const allItems = useMemo(
    () => [
      {
        key: 'trade',
        link: tradeLink,
        title: navItems.trade.label,
        icon: <TradeIcon size={20} className="md:hidden" />,
        isInternalLink: true,
        prefetchStrategy: 'intent' as const,
      },
      {
        key: 'pools',
        link: navItems.pools.link,
        title: navItems.pools.label,
        icon: <ServerIcon size={20} className="md:hidden" />,
        isInternalLink: true,
        prefetchStrategy: 'intent' as const,
      },
      {
        key: 'vaults',
        link: navItems.vaults.link,
        title: navItems.vaults.label,
        icon: <GuardIcon size={20} className="md:hidden" />,
        isInternalLink: true,
        prefetchStrategy: 'intent' as const,
      },
      {
        key: 'dashboard',
        link: navItems.dashboard.link,
        title: navItems.dashboard.label,
        icon: <PieChartIcon size={20} className="md:hidden" />,
        isInternalLink: true,
        prefetchStrategy: 'intent' as const,
      },
      ...(ENABLE_MERITS
        ? [
            {
              key: 'merits',
              link: navItems.merits.link,
              title: navItems.merits.label,
              icon: <PointsIcon size={20} className="md:hidden" />,
              isInternalLink: true,
              prefetchStrategy: 'intent' as const,
            },
          ]
        : []),
      {
        key: 'referral',
        link: navItems.referral.link,
        title: navItems.referral.label,
        icon: <GroupIcon size={20} className="md:hidden" />,
        isInternalLink: true,
        prefetchStrategy: 'intent' as const,
      },
      ...(isNonProductionVercelDeployment
        ? [
            {
              key: 'credit',
              link: navItems.credit.link,
              title: navItems.credit.label,
              icon: <CreditIcon size={20} className="md:hidden" />,
              isInternalLink: true,
              prefetchStrategy: 'intent' as const,
            },
          ]
        : []),
      {
        key: 'leaderboard',
        link: navItems.leaderboard.link,
        title: navItems.leaderboard.label,
        icon: <TrophyIcon size={20} className="md:hidden" />,
        isInternalLink: true,
        prefetchStrategy: 'intent' as const,
      },
    ],
    [
      navItems.dashboard.label,
      navItems.dashboard.link,
      navItems.merits.label,
      navItems.merits.link,
      navItems.pools.label,
      navItems.pools.link,
      navItems.trade.label,
      navItems.vaults.label,
      navItems.vaults.link,
      navItems.referral.label,
      navItems.referral.link,
      navItems.credit.label,
      navItems.credit.link,
      navItems.leaderboard.label,
      navItems.leaderboard.link,
      tradeLink,
    ],
  );

  const desktopVisibleItems = useMemo(
    () => allItems.slice(0, desktopVisibleCount ?? allItems.length),
    [allItems, desktopVisibleCount],
  );
  const desktopOverflowItems = useMemo(
    () => allItems.slice(desktopVisibleCount ?? allItems.length),
    [allItems, desktopVisibleCount],
  );
  const hasDesktopMore = desktopOverflowItems.length > 0;
  const mobileItems = useMemo(
    () =>
      ENABLE_SWAP
        ? [
            ...allItems.slice(0, 3),
            {
              key: 'swap',
              link: pathname,
              title: t`Swap`,
              icon: <SwapNavIcon size={20} className="md:hidden" />,
              isInternalLink: true,
              prefetchStrategy: 'intent' as const,
            },
            ...allItems.slice(3),
          ]
        : allItems,
    [allItems, pathname, t],
  );
  const hasMobileMore = mobileItems.length > 4;
  const mobileVisibleItems = hasMobileMore
    ? mobileItems.slice(0, 3)
    : mobileItems;
  const mobileOverflowItems = useMemo(
    () => (hasMobileMore ? mobileItems.slice(3) : []),
    [hasMobileMore, mobileItems],
  );

  const effectiveMobileActiveItem = mobileSwapOpen ? 'swap' : activeItem;
  const isMobileMoreActive = mobileOverflowItems.some(
    (item) => item.key === effectiveMobileActiveItem,
  );

  useLayoutEffect(() => {
    const navEle = desktopNavRef.current;
    if (!navEle) return;

    const getGap = () => {
      const styles = window.getComputedStyle(navEle);
      return parseFloat(styles.columnGap || styles.gap || '0') || 0;
    };

    const updateVisibleCount = () => {
      const availableWidth = navEle.clientWidth;
      const itemWidths = allItems.map(
        (item) => desktopItemMeasureRef.current[item.key]?.offsetWidth ?? 0,
      );
      const moreWidth = desktopMoreMeasureRef.current?.offsetWidth ?? 0;
      const gap = getGap();

      const fullWidth =
        itemWidths.reduce((total, width) => total + width, 0) +
        Math.max(0, itemWidths.length - 1) * gap;

      if (fullWidth <= availableWidth) {
        setDesktopVisibleCount(allItems.length);
        return;
      }

      let usedWidth = moreWidth;
      let nextVisibleCount = 0;

      for (const itemWidth of itemWidths) {
        const nextWidth = usedWidth + gap + itemWidth;
        if (nextWidth > availableWidth) break;
        usedWidth = nextWidth;
        nextVisibleCount += 1;
      }

      setDesktopVisibleCount(Math.max(0, nextVisibleCount));
    };

    updateVisibleCount();

    const resizeObserver = new ResizeObserver(updateVisibleCount);
    resizeObserver.observe(navEle);

    return () => {
      resizeObserver.disconnect();
    };
  }, [allItems]);

  useEffect(() => {
    return () => {
      drainCancelRef.current?.();
      drainCancelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isDevelopment) return;
    if (shouldSkipBackgroundNavPrefetch()) return;

    const itemsToPrefetch = allItems
      .filter((item) => {
        if (!BACKGROUND_NAV_PREFETCH_KEYS.has(item.key)) return false;
        if (!item.isInternalLink || item.link === pathname) return false;
        if (item.key === 'trade' && !instId) return false;
        return true;
      })
      .slice(0, MAX_BACKGROUND_NAV_PREFETCHES);

    const timers = itemsToPrefetch.map((item, index) =>
      window.setTimeout(
        () => {
          if (shouldSkipBackgroundNavPrefetch()) return;
          queuePrefetch(item.link, 'visible');
        },
        BACKGROUND_NAV_PREFETCH_DELAY_MS +
          index * BACKGROUND_NAV_PREFETCH_INTERVAL_MS,
      ),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [allItems, instId, pathname, queuePrefetch]);

  useEffect(() => {
    prefetchedRoutesRef.current.delete(pathname);
  }, [pathname]);

  useEffect(() => {
    const queueInvalidatedPrefetches = () => {
      if (document.visibilityState !== 'visible') return;

      const itemsToPrefetch = allItems
        .filter((item) => BACKGROUND_NAV_PREFETCH_KEYS.has(item.key))
        .slice(0, MAX_BACKGROUND_NAV_PREFETCHES);

      for (const item of itemsToPrefetch) {
        if (!item.isInternalLink || item.link === pathname) continue;
        if (item.key === 'trade' && !instId) continue;
        if (!invalidatedRoutesRef.current.has(item.link)) continue;

        invalidatedRoutesRef.current.delete(item.link);
        queuePrefetch(item.link, 'visible');
      }
    };

    const handleVisibilityChange = () => {
      queueInvalidatedPrefetches();
      window.setTimeout(queueInvalidatedPrefetches, 0);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [allItems, instId, pathname, queuePrefetch]);

  const isClickMobileOverflowItem = useMemo(
    () => mobileOverflowItems.some((item) => item.key === clickItem),
    [mobileOverflowItems, clickItem],
  );
  const isClickDesktopOverflowItem = useMemo(
    () => desktopOverflowItems.some((item) => item.key === clickItem),
    [desktopOverflowItems, clickItem],
  );
  const shouldHideDesktopActiveBar =
    clickItem === 'more' || isClickDesktopOverflowItem;
  const desktopActiveBarEle = shouldHideDesktopActiveBar
    ? desktopMoreRef.current
    : desktopActiveEle;

  useEffect(() => {
    if (clickItem === 'more') {
      setDesktopActiveEle(desktopMoreRef.current);
      setHasDesktopActiveBarEle(!!desktopMoreRef.current);
    } else if (!isClickDesktopOverflowItem) {
      setDesktopActiveEle(desktopTabRef.current[clickItem]);
      setHasDesktopActiveBarEle(!!desktopTabRef.current[clickItem]);
    }
    if (!isClickMobileOverflowItem) {
      setMobileActiveEle(mobileTabRef.current[clickItem]);
    }
  }, [clickItem, isClickDesktopOverflowItem, isClickMobileOverflowItem]);

  return (
    <>
      <LiquidGlassFilterDefs />
      <LiquidGlassIndicatorFilterDefs />
      <div
        className={cn(
          'left-0 flex max-md:fixed max-md:top-[calc(100dvh-88px)] max-md:z-40 md:mt-0 md:-ml-0.5 md:min-w-0 md:flex-1 md:overflow-hidden',
          className,
        )}
      >
        <div className="text-t-1100 relative z-1 flex h-8 w-screen shrink-0 grow-0 items-center justify-between gap-2 px-1 font-medium max-md:z-10 max-md:m-4 max-md:my-[16px] max-md:h-[56px] max-md:w-[calc(100vw-var(--spacing)*8)] max-md:gap-2 max-md:rounded-full max-md:px-1 max-md:py-0 max-md:opacity-100 md:w-full md:min-w-0 md:flex-1 md:shrink md:grow md:justify-start md:overflow-hidden">
          <div className="pointer-events-none invisible absolute top-0 left-0 flex h-8 gap-1 overflow-hidden whitespace-nowrap md:flex">
            {allItems.map((item) => (
              <div
                key={item.key}
                ref={(el) => {
                  desktopItemMeasureRef.current[item.key] = el;
                }}
                className="flex h-8 items-center justify-center rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-1">{item.title}</div>
              </div>
            ))}
            <div
              ref={desktopMoreMeasureRef}
              className="flex h-8 items-center justify-center gap-1 rounded-xl px-3 py-2"
            >
              <span>{t`More`}</span>
              <ChevronDownIcon size={16} />
            </div>
          </div>
          <nav
            ref={desktopNavRef}
            className="mx-4 hidden min-w-0 flex-1 gap-1 overflow-hidden max-md:mx-0 md:flex"
          >
            {desktopVisibleItems.map((item) => (
              <NavItem
                key={item.key}
                ref={(el) => {
                  desktopTabRef.current[item.key] = el;
                  if (clickItem === item.key) {
                    setDesktopActiveEle(el);
                    setHasDesktopActiveBarEle(!!el);
                  }
                }}
                hideActiveBg={hasDesktopActiveBarEle}
                activeBgClassName={
                  hasNoiseBackground ? 'bg-white/10' : undefined
                }
                link={item.link}
                title={item.title}
                icon={item.icon}
                active={clickItem === item.key}
                isInternalLink={item.isInternalLink}
                prefetchStrategy={item.prefetchStrategy}
                onIntent={() => queuePrefetch(item.link, 'intent')}
                onClick={() => {
                  if (clickItem === item.key) return;
                  setClickItem(item.key);
                  setDesktopActiveEle(desktopTabRef.current[item.key]);
                  setHasDesktopActiveBarEle(!!desktopTabRef.current[item.key]);
                }}
              />
            ))}
            {hasDesktopMore && (
              <DropdownMenu
                open={desktopMoreOpen}
                onOpenChange={(open) => {
                  setDesktopMoreOpen(open);
                  if (open) {
                    desktopOverflowItems.forEach((item) => {
                      if (item.isInternalLink) {
                        queuePrefetch(item.link, 'intent');
                      }
                    });
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={(el) => {
                      desktopMoreRef.current = el as HTMLButtonElement &
                        HTMLDivElement;
                      desktopTabRef.current.more = desktopMoreRef.current;
                    }}
                    className={cn(
                      'text-t-270 hover:text-t-1100 data-[state=open]:text-t-1100 relative flex h-8 items-center justify-center gap-1 rounded-xl bg-transparent px-3 py-2 text-xs duration-300 [-webkit-tap-highlight-color:transparent] hover:bg-transparent hover:transition-[color] data-[state=open]:bg-transparent',
                      isClickDesktopOverflowItem ? 'text-t-1100' : '',
                    )}
                    onClick={() => {
                      setClickItem('more');
                      setDesktopActiveEle(desktopMoreRef.current);
                    }}
                  >
                    <span>{t`More`}</span>
                    <ChevronDownIcon size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  className="w-37 overflow-hidden max-md:hidden"
                >
                  <div className="flex flex-col gap-1 font-medium">
                    {desktopOverflowItems.map((item) => (
                      <NavItem
                        key={item.key}
                        link={item.link}
                        title={item.title}
                        icon={item.icon}
                        active={activeItem === item.key}
                        activeStyle={liquidGlassTabIndicatorStyle}
                        className={
                          activeItem === item.key
                            ? 'bg-transparent text-[#e1e1e1]'
                            : 'text-[#d5dbe2]'
                        }
                        isInternalLink={item.isInternalLink}
                        prefetchStrategy={item.prefetchStrategy}
                        onIntent={() => queuePrefetch(item.link, 'intent')}
                        variant="menu"
                        onClick={() => {
                          setDesktopMoreOpen(false);
                          setClickItem(item.key);
                        }}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <TabsActiveBar
              className={cn(
                hasNoiseBackground ? 'bg-white/10' : 'bg-bg-2',
                '-z-1 h-8 rounded-xl transition-[width,transform,opacity]',
                clickItem &&
                  !shouldHideDesktopActiveBar &&
                  hasDesktopActiveBarEle
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
              activeTabEle={desktopActiveBarEle as HTMLButtonElement | null}
            />
          </nav>
          <LiquidGlassTabs className="hidden w-full max-md:z-40 max-md:flex max-md:h-[56px] max-md:p-1">
            <nav className="relative flex h-full w-full justify-between">
              {mobileVisibleItems.map((item) => (
                <NavItem
                  key={item.key}
                  ref={(el) => {
                    mobileTabRef.current[item.key] = el;
                    if (clickItem === item.key) {
                      setMobileActiveEle(el);
                    }
                  }}
                  hideActiveBg={!!mobileActiveEle}
                  className={cn(
                    'max-md:z-10 max-md:h-[48px] max-md:[&_svg]:text-current',
                    clickItem === item.key
                      ? 'max-md:text-[#e1e1e1]'
                      : 'max-md:text-[#d5dbe2]',
                  )}
                  link={item.link}
                  title={item.title}
                  icon={item.icon}
                  active={clickItem === item.key}
                  isInternalLink={item.isInternalLink}
                  prefetchStrategy={item.prefetchStrategy}
                  onIntent={() => queuePrefetch(item.link, 'intent')}
                  onClick={(event) => {
                    if (item.key === 'swap') {
                      event.preventDefault();
                      setClickItem('swap');
                      onMobileSwapOpen?.();
                      return;
                    }
                    if (clickItem === item.key) return;
                    onMobileSwapClose?.();
                    setClickItem(item.key);
                    setMobileActiveEle(mobileTabRef.current[item.key]);
                  }}
                />
              ))}
              {hasMobileMore && (
                <DropdownMenu
                  open={mobileMoreOpen}
                  onOpenChange={(open) => {
                    setMobileMoreOpen(open);
                    if (open) {
                      mobileOverflowItems.forEach((item) => {
                        if (item.isInternalLink) {
                          queuePrefetch(item.link, 'intent');
                        }
                      });
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      ref={(el) => {
                        mobileTabRef.current.more = el as HTMLButtonElement &
                          HTMLDivElement;
                        if (isMobileMoreActive) {
                          setMobileActiveEle(
                            el as HTMLButtonElement & HTMLDivElement,
                          );
                        }
                      }}
                      className={cn(
                        'relative z-10 flex h-[48px] flex-1 items-center justify-center rounded-full bg-transparent p-0 px-px [-webkit-tap-highlight-color:transparent] hover:bg-transparent focus-visible:ring-0 data-[state=open]:bg-transparent',
                        clickItem === 'more' || isMobileMoreActive
                          ? 'text-[#e1e1e1]'
                          : 'text-[#d5dbe2]',
                      )}
                      onClick={() => {
                        setClickItem('more');
                        setMobileActiveEle(mobileTabRef.current.more);
                      }}
                    >
                      <div
                        className={
                          'flex h-[48px] w-full flex-col items-center justify-center gap-1 rounded-full'
                        }
                      >
                        <MoreIcon size={20} />
                        <span>{t`More`}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    style={liquidGlassTabsStyle}
                    align="end"
                    side="top"
                    sideOffset={12}
                    className="w-50 overflow-hidden md:hidden"
                  >
                    <div className="flex flex-col gap-1 font-medium">
                      {mobileOverflowItems.map((item) => (
                        <NavItem
                          key={item.key}
                          link={item.link}
                          title={item.title}
                          icon={item.icon}
                          active={effectiveMobileActiveItem === item.key}
                          activeStyle={liquidGlassTabIndicatorStyle}
                          className={
                            effectiveMobileActiveItem === item.key
                              ? 'bg-transparent text-[#e1e1e1]'
                              : 'text-[#d5dbe2]'
                          }
                          isInternalLink={item.isInternalLink}
                          prefetchStrategy={item.prefetchStrategy}
                          onIntent={() => queuePrefetch(item.link, 'intent')}
                          variant="menu"
                          onClick={(event) => {
                            if (item.key === 'swap') {
                              event.preventDefault();
                              setMobileMoreOpen(false);
                              setClickItem('swap');
                              onMobileSwapOpen?.();
                              return;
                            }
                            if (clickItem === item.key) {
                              setMobileMoreOpen(false);
                              return;
                            }
                            onMobileSwapClose?.();
                            setMobileMoreOpen(false);
                            setClickItem(item.key);
                          }}
                        />
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <TabsActiveBar
                style={liquidGlassTabIndicatorStyle}
                className={cn(
                  'z-0 h-8 rounded-xl max-md:bottom-0 max-md:h-full max-md:rounded-full',
                  !isClickMobileOverflowItem ? 'visible' : 'invisible',
                )}
                activeTabEle={
                  mobileActiveEle as HTMLButtonElement | null | undefined
                }
              />
            </nav>
          </LiquidGlassTabs>
        </div>
      </div>
    </>
  );
};

export default memo(Nav);
