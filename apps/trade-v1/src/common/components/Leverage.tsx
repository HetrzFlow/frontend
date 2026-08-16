'use client';

import { useId, FC, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { thoFormat } from '@repo/lib/format';
import {
  ActivityIcon,
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  NumberInput,
  Slider,
} from '@repo/ui';

interface LeverageProps {
  value: string;
  open?: boolean;
  onChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  isLong?: boolean;
  maxLever?: number;
  sliderProps: React.ComponentProps<typeof Slider>;
}

const Leverage: FC<LeverageProps> = ({
  value,
  maxLever = 100,
  onChange,
  className,
  sliderProps,
  isLong,
}) => {
  const { t } = useLingui();
  const inputId = useId();
  const [innerValue, setInnerValue] = useState(value);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setInnerValue(value);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className={cn(
            'hover:bg-bg-3 border-bg-3 w-full border bg-transparent hover:border-transparent',
            isLong === undefined
              ? 'text-accent'
              : isLong
                ? 'text-up'
                : 'text-down',
            className,
          )}
        >
          {t`Leverage`} {`${thoFormat(value)}x`}
          <ActivityIcon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[440px]"
        closeClassName="-z-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogHeader className="mr-10">
          <DialogTitle>{t`Adjust Leverage`}</DialogTitle>
        </DialogHeader>

        <div>
          <div className={'mt-4 flex items-center gap-3.5'}>
            <NumberInput
              id={inputId}
              variant="ghost"
              className="w-24 px-3 py-1"
              inputClassName="h-[28px] text-center text-base font-plex"
              suffixClassName="pl-1"
              value={innerValue}
              innerSuffix="x"
              decimal={1}
              min={0}
              max={maxLever}
              maxLength={5}
              onValueChange={(value) => {
                setInnerValue(value);
              }}
            />
            <Slider
              className="me-1 h-8"
              rangeColorClassName={
                isLong === undefined ? '' : isLong ? 'to-up' : 'to-down'
              }
              innerThumbClassName={
                isLong === undefined ? '' : isLong ? 'bg-up' : 'bg-down'
              }
              animatoinClassName={
                isLong === undefined ? '' : isLong ? 'bg-up/50' : 'bg-down/50'
              }
              value={[+innerValue]}
              formatValue={(value) =>
                value === undefined ? '--' : `${value}x`
              }
              onValueChange={(value) =>
                value[0] !== undefined && setInnerValue(`${value[0]}`)
              }
              tooltipContentProps={{
                className:
                  isLong === undefined
                    ? 'bg-accent text-accent-foreground'
                    : isLong
                      ? 'bg-up text-accent-foreground'
                      : 'bg-down text-accent-foreground',
                arrowClassName:
                  isLong === undefined
                    ? 'bg-accent fill-accent'
                    : isLong
                      ? 'bg-up fill-up'
                      : 'bg-down fill-down',
              }}
              {...sliderProps}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button
              disabled={+innerValue < 1.1}
              className={cn(
                'text-accent-foreground disabled:bg-bg-3 w-full',
                isLong === undefined
                  ? 'bg-accent hover:bg-accent/90'
                  : isLong
                    ? 'bg-up hover:bg-up/90'
                    : 'bg-down hover:bg-down/90',
              )}
              type="button"
              onClick={() => onChange && onChange(innerValue)}
            >
              {+innerValue < 1.1
                ? t`Minimum leverage 1.1x`
                : t`Change Leverage`}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Leverage;
