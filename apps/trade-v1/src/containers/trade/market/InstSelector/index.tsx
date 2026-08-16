import { FC, memo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import {
  ChevronDownIcon,
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui';
import { CoinIcon, useInstStore } from '@/common';

import { useGlobalStore } from '@/stores/trade/global';
import Content from './Content';

interface InstSelectorProps {
  type?: 'popover' | 'dialog';
}

const InstSelector: FC<InstSelectorProps> = ({ type = 'popover' }) => {
  const { t } = useLingui();
  const instId = useGlobalStore(useShallow((state) => state.instId));

  const inst = useInstStore((state) => state.getInst(state, instId));
  const [open, setOpen] = useState(false);

  return type === 'popover' ? (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        aria-label="select instrument"
        className="bg-bg-5 max-md:bg-bg-3-h5 flex h-8 shrink-0 items-center gap-0.5 rounded-full px-2 text-sm font-semibold max-md:h-[40px] max-md:px-3"
      >
        <CoinIcon src={inst?.icon} alt={inst?.name} size={24} />
        <span className="ml-1 max-md:ml-1.5 max-md:text-lg">{inst?.name}</span>
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-300 max-md:ml-1.5',
            open ? '-rotate-180' : '',
          )}
          size={16}
        />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-[300px] p-0">
        <Content onOpenChange={setOpen} />
      </PopoverContent>
    </Popover>
  ) : (
    <Dialog open={open} onOpenChange={setOpen} modal>
      <DialogTrigger
        aria-label="select instrument"
        className="bg-bg-5 max-md:bg-bg-3-h5 flex h-8 shrink-0 items-center gap-0.5 rounded-full px-2 text-sm font-semibold max-md:h-[40px] max-md:px-3"
      >
        <CoinIcon src={inst?.icon} alt={inst?.name} size={24} />
        <span className="ml-1 max-md:ml-1.5 max-md:text-lg">{inst?.name}</span>
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-300 max-md:ml-1.5',
            open ? '-rotate-180' : '',
          )}
          size={16}
        />
      </DialogTrigger>

      <DialogContent className="">
        <DialogTitle>{t`Select Market`}</DialogTitle>
        <Content onOpenChange={setOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default memo(InstSelector);
