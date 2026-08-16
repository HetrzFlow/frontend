'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetContent,
  PowerIcon,
  SheetFooter,
  Button,
  useMediaQuery,
  MEDIA_SIZES,
  toast,
  cn,
} from '@repo/ui';
import { usePrivy } from '@/common/chainClient';

import TradeTabs from '../../../components/TradeTabs';
import AccountSelect from './AccountSelect';
import Activity, {
  ActivityTabLabel,
  type ActivityView,
} from './Activity';
import ActivityPrefetch from './Activity/Prefetch';
import Balance from './Balance';
import Portfolia from './Portfolio';

const Content: React.FC = () => {
  const { t } = useLingui();
  const { logout } = usePrivy();
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

  const handleDisconnect = useCallback(async () => {
    toast.loading(t`Disconnecting`, { id: 'account-logout' });
    await logout();
    toast.info(t`Disconnected`, { id: 'account-logout' });
  }, [logout, t]);

  const [tabValue, setTabValue] = useState('portfolia');
  const [activityView, setActivityView] = useState<ActivityView>('trade');
  const options = useMemo(() => {
    return [
      {
        value: 'portfolia',
        label: t`Portfolio`,
        labelClassName: 'data-[state=active]:text-foreground pt-[4px] pb-[8px]',
        content: <Portfolia />,
      },
      {
        value: 'activity',
        label: (
          <ActivityTabLabel
            value={activityView}
            onChange={setActivityView}
            onOpen={() => setTabValue('activity')}
          />
        ),
        labelClassName: 'data-[state=active]:text-foreground pt-[4px] pb-[8px]',
        onTriggerClick: () => setActivityView('trade'),
        content: <Activity view={activityView} />,
      },
    ];
  }, [activityView, t]);

  const mediaSz = useMediaQuery();

  useEffect(() => {
    const isMobile = mediaSz === MEDIA_SIZES.SM;
    const root = scrollEl;

    if (!isMobile) {
      setIsTabsSticky(false);
    }

    if (!sentinelEl || !root || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const rootTop = entry.rootBounds?.top ?? 0;
        setIsTabsSticky(entry.boundingClientRect.top < rootTop);
      },
      {
        root,
        threshold: [0, 1],
      },
    );

    observer.observe(sentinelEl);

    return () => {
      observer.disconnect();
    };
  }, [mediaSz, scrollEl, sentinelEl]);

  return (
    <SheetContent
      side={mediaSz === MEDIA_SIZES.SM ? 'bottom' : 'right'}
      className="accountDrawerContainer gap-0 rounded-2xl max-md:h-[calc(100dvh-60px)] md:w-[360px]"
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
      }}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <SheetHeader className="p-4">
        <SheetTitle className="flex h-[32px] items-center justify-between gap-4 font-medium">
          <span className="text-2xl font-semibold md:hidden">{t`Overview`}</span>
          <AccountSelect className="max-md:hidden" />
          <div
            className="hover:text-t-270 bg-t-1100/10 mr-9.5 size-8 cursor-pointer rounded-xl max-md:hidden"
            title={t`Disconnect Wallet`}
            onClick={handleDisconnect}
          >
            <PowerIcon className="mx-auto mt-1" />
          </div>
        </SheetTitle>
        <SheetDescription className="sr-only">
          {t`Account overview drawer with portfolio and activity information.`}
        </SheetDescription>
      </SheetHeader>
      <div
        ref={setScrollEl}
        className="max-md:scrollbar-none flex min-h-0 flex-1 flex-col max-md:overflow-y-auto"
      >
        <Balance />
        <div className="mt-4" />
        {tabValue === 'portfolia' ? <ActivityPrefetch /> : null}
        <div ref={setSentinelEl} className="h-px shrink-0" aria-hidden />
        <TradeTabs
          value={tabValue}
          options={options}
          className="gap-3"
          listWrapClassName={cn(
            'max-md:!sticky max-md:top-0 max-md:z-10',
            isTabsSticky && 'max-md:bg-[#1b2c2f] max-md:-top-px',
          )}
          listClassName="grid-cols-2 mx-4 px-0 border-border rounded-none border-b-1 w-[calc(100%-32px)]"
          activeBarClassName="-z-1 top-7.5 rounded-none h-0.5 bg-white"
          onValueChange={setTabValue}
        />
      </div>
      <SheetFooter className="md:hidden">
        <AccountSelect className="bg-bg-3 rounded-lg px-4 py-[10px]" />
        <Button variant="accent" className="text-sm" onClick={handleDisconnect}>
          {t`Disconnect`}
        </Button>
      </SheetFooter>
    </SheetContent>
  );
};

export default Content;
