import { FC, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  ChevronDownIcon,
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui';
import Trades from '..';

export interface TradesSmProps {
  className?: string;
}

const TradesSm: FC<TradesSmProps> = ({ className }) => {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen} modal>
      <DialogTrigger
        aria-label="select instrument"
        className={cn(
          'text-t-270 flex items-center justify-between text-xs font-medium',
          className,
        )}
      >
        <span>{t`Recent Trades`}</span>
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-300 max-md:ml-1.5',
            open ? '-rotate-180' : '',
          )}
          size={16}
        />
      </DialogTrigger>

      <DialogContent
        className="tradingContainer text-xs"
        closeClassName="hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="hidden">{t`Recent Trades`}</DialogTitle>
        <Trades className="h-[80dvh]" />
      </DialogContent>
    </Dialog>
  );
};

export default TradesSm;
