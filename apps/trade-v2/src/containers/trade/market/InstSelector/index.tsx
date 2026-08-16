import { FC, memo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { CoinIcon } from '@repo/common/components';
import {
  ChevronDownIcon,
  cn,
  CreditIcon,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Loading,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from '@repo/ui';
import { useInstStore } from '@/common';

import { useHydrated } from '@/common/hooks/useHydrated';
import StatusMarker from '@/components/StatusMarker';
import { isCreditCategory } from '@/lib/credit/creditMarkets';
import { scheduleIdleTask } from '@/lib/runtime/scheduleIdleTask';
import { useTradeGlobalStore } from '@/stores/trade/global';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[min(calc(100dvh-170px),760px)]" />,
});

interface InstSelectorProps {
  type?: 'popover' | 'dialog';
}

const InstSelector: FC<InstSelectorProps> = ({ type = 'popover' }) => {
  const { t } = useLingui();
  const instId = useTradeGlobalStore(useShallow((state) => state.instId));

  const inst = useInstStore((state) => state.getInst(state, instId));
  const [open, setOpen] = useState(false);

  const hasHydrated = useHydrated();
  const isCreditMarket = isCreditCategory(inst?.category);

  useEffect(() => {
    return scheduleIdleTask(() => {
      void import('./Content');
    });
  }, []);

  if (!hasHydrated || !inst)
    return <Skeleton className="h-8 w-35 rounded-xl" />;

  return type === 'popover' ? (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        aria-label="select instrument"
        className="bg-bg-3 max-md:bg-bg-3-h5 flex h-8 shrink-0 items-center gap-0.5 rounded-xl px-4 text-sm font-semibold max-md:h-[40px] max-md:px-3"
      >
        <CoinIcon src={inst?.icon} alt={inst?.name} size={24} />
        <span className="ml-1 flex items-center gap-0.5 max-md:ml-1.5">
          <span className="max-md:text-lg">{inst?.name}</span>
          {isCreditMarket && (
            <CreditIcon size={14} className="text-accent shrink-0" />
          )}
        </span>
        <StatusMarker
          className={'ml-1 max-md:ml-1.5'}
          inst={inst}
          collisionBoundary={
            typeof window !== 'undefined'
              ? document.querySelector('.marketContainer')
              : undefined
          }
          collisionPadding={0}
        />
        <ChevronDownIcon
          className={cn(
            'ml--1 transition-transform duration-300 max-md:ml-1.5',
            open ? '-rotate-180' : '',
          )}
          size={16}
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="bg-bg-3 w-[880px] max-w-screen p-2"
      >
        <Content onOpenChange={setOpen} />
      </PopoverContent>
    </Popover>
  ) : (
    <Dialog open={open} onOpenChange={setOpen} modal>
      <DialogTrigger
        aria-label="select instrument"
        className="bg-bg-3 flex h-8 shrink-0 items-center gap-0.5 rounded-xl px-2 text-sm font-semibold max-md:h-[40px] max-md:px-3"
      >
        <CoinIcon src={inst?.icon} alt={inst?.name} size={24} />
        <span className="ml-1 flex items-center gap-0.5 max-md:ml-1.5">
          <span className="max-md:text-lg">{inst?.name}</span>
          {isCreditMarket && (
            <CreditIcon size={14} className="text-accent shrink-0" />
          )}
        </span>
        <StatusMarker
          className={'ml-1 max-md:ml-1.5'}
          inst={inst}
          collisionBoundary={
            typeof window !== 'undefined'
              ? document.querySelector('.marketContainer')
              : undefined
          }
        />
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-300 max-md:ml-1.5',
            open ? '-rotate-180' : '',
          )}
          size={16}
        />
      </DialogTrigger>

      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogTitle>{t`Select Market`}</DialogTitle>
        <Content onOpenChange={setOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default memo(InstSelector);
