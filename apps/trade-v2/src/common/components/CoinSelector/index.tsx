'use client';

import { FC, ReactNode, useEffect, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { CoinIcon } from '@repo/common/components';
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
import Content from './Content';

interface CoinSelectorProps {
  value: string;
  className?: string;
  excludeHzlp?: boolean;
  onSelect?: (value: string) => void;
  children?: ReactNode;
  disabled?: boolean;
}

export const COIN_SELECTOR_TRIGGER_CLASS_NAME =
  'border flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold';

export const COIN_SELECTOR_TRIGGER_ICON_SIZE = 24;

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const coins = useInstStore((state) => state.getCoins());
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  if (disabled) {
    return (
      <div
        role="button"
        className={cn(
          COIN_SELECTOR_TRIGGER_CLASS_NAME,
          'cursor-not-allowed',
          className,
        )}
      >
        <CoinIcon
          src={coins[value]?.icon}
          alt={coins[value]?.symbol}
          size={COIN_SELECTOR_TRIGGER_ICON_SIZE}
        />
        {mounted ? coins[value]?.symbol : null}
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
              COIN_SELECTOR_TRIGGER_CLASS_NAME,
              className,
              disabled ? 'pointer-events-none' : 'cursor-pointer',
            )}
          >
            <CoinIcon
              src={coins[value]?.icon}
              alt={coins[value]?.symbol}
              size={COIN_SELECTOR_TRIGGER_ICON_SIZE}
            />
            {mounted ? coins[value]?.symbol : null}
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
