'use client';

import { FC, ReactNode, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  ChevronDownIcon,
  cn,
  useMediaQuery,
  MEDIA_SIZES,
} from '@repo/ui';

import { useInstStore } from '../../stores/instStore';
import CoinIcon from '../CoinIcon';
import Content from './Content';

interface CoinSelectorProps {
  value: string;
  className?: string;
  excludeHzlp?: boolean;
  onSelect?: (value: string) => void;
  children?: ReactNode;
  disabled?: boolean;
}

const CoinSelector: FC<CoinSelectorProps> = ({
  value,
  className,
  children,
  excludeHzlp,
  onSelect,
  disabled,
}) => {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const coins = useInstStore((state) => state.getCoins());
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  if (disabled) {
    return (
      <div
        role="button"
        className={cn(
          'bg-bg-7 hover:bg-bg-7/90 flex h-10 cursor-not-allowed items-center gap-1.5 rounded-full px-2 text-sm font-semibold',
          className,
        )}
      >
        <CoinIcon
          src={coins[value]?.icon}
          alt={coins[value]?.symbol}
          size={24}
        />
        {coins[value]?.symbol}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <div
            role="button"
            className={cn(
              'bg-bg-7 hover:bg-bg-7/90 flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold',
              className,
              disabled ? 'pointer-events-none' : 'cursor-pointer',
            )}
          >
            <CoinIcon
              src={coins[value]?.icon}
              alt={coins[value]?.symbol}
              size={24}
            />
            {coins[value]?.symbol}
            {!disabled && <ChevronDownIcon className="ml-0.5" size={16} />}
          </div>
        )}
      </DialogTrigger>
      <DialogContent
        className="w-[440px]"
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => isMobile && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t`Coin list`}</DialogTitle>
        </DialogHeader>
        <Content
          excludeHzlp={excludeHzlp}
          onSelect={(v) => {
            if (onSelect) {
              onSelect(v);
            }
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CoinSelector;
