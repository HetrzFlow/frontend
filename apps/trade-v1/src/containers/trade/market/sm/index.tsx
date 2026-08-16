import { FC, memo, useState } from 'react';

import {
  ChevronDownIcon,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui';

import InstSelector from '../InstSelector';
import Liq from '../Liq';
import Price from '../Price';
import Ticker from '../Ticker';

const Market: FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      className="marketSm px-4 pt-[12px] pb-0"
      open={open}
      onOpenChange={setOpen}
    >
      <div className="mb-[12px] flex items-center justify-between gap-4 overflow-hidden select-none">
        <InstSelector type="dialog" />
        <CollapsibleTrigger className="text-t-1100 flex items-center justify-end gap-2 text-left text-sm">
          <Price />
          <ChevronDownIcon
            size={16}
            className={cn(
              'transition-transform duration-300',
              open ? '-rotate-180' : '',
            )}
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent
        className={cn(
          'scrollbar-none mb-[12px] grid grid-cols-[3fr_2fr_2fr] gap-3 !overflow-x-auto font-medium whitespace-nowrap',
        )}
      >
        <Ticker />
        <Liq />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default memo(Market);
