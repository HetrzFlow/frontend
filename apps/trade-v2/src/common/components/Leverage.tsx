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
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  isLong?: boolean;
  isHyper?: boolean;
  maxLever?: number | string;
  minLever?: number | string;
  sliderProps: React.ComponentProps<typeof Slider>;
  inDialog?: boolean;
  inputClassName?: string;
}

interface ContentProps {
  value: string;
  isLong?: boolean;
  isHyper?: boolean;
  maxLever: number | string;
  minLever?: number | string;
  sliderProps: React.ComponentProps<typeof Slider>;
  onValueChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  locale?: Intl.LocalesArgument;
}

const Content: FC<ContentProps> = ({
  value,
  onValueChange,
  isLong,
  isHyper,
  maxLever,
  minLever,
  sliderProps,
  className,
  inputClassName,
  locale,
}) => {
  const { tooltipContentProps, ...otherSliderProps } = sliderProps;
  const inputId = useId();
  const numericValue = Number(value);
  const sliderValue =
    value === '' || !Number.isFinite(numericValue)
      ? Number(minLever ?? 0)
      : numericValue;

  return (
    <div className={cn('mt-4 flex items-center gap-3.5', className)}>
      <NumberInput
        id={inputId}
        variant="ghost"
        className={cn('w-20 px-3 py-1', inputClassName)}
        inputClassName={cn(
          'h-[24px] text-center text-xs font-plex',
          isHyper ? 'text-hyper-lev' : isLong ? 'text-up' : 'text-down',
        )}
        suffixClassName="pl-1"
        value={value}
        innerSuffix="x"
        decimal={1}
        locale={locale}
        min={minLever}
        max={maxLever}
        maxLength={5}
        onValueChange={(value) => {
          onValueChange(value);
        }}
        onBlur={() => {
          if (value === '' && minLever) {
            onValueChange(`${minLever}`);
          }
        }}
      />
      <Slider
        className="me-1 mt-1 h-3"
        trackClassName="!h-px"
        rangeClassName="!h-3 !-top-[5.5px] !rounded-l-sm"
        stickClassName="!w-px !rounded-none"
        thumbWrapClassName={cn(
          'size-3 z-10 rounded-sm',
          isHyper ? 'bg-hyper-lev' : isLong ? 'bg-up' : 'bg-down',
        )}
        thumbClassName="!rounded-xs"
        innerThumbClassName={cn('size-2 rounded-xs bg-bg-2')}
        thumbDotClassName="hidden"
        animationDisabled
        showStick
        rangeColorClassName={
          isLong === undefined
            ? ''
            : isHyper
              ? isLong
                ? 'from-up to-hyper-lev'
                : 'from-down to-hyper-lev'
              : isLong
                ? 'from-bg-2 to-up'
                : 'from-bg-2 to-down'
        }
        scaleEvenly
        value={[sliderValue]}
        formatValue={(value) => (value === undefined ? '--' : `${value}x`)}
        onValueChange={(value) =>
          value[0] !== undefined && onValueChange(`${value[0]}`)
        }
        tooltipContentProps={{
          className:
            isLong === undefined
              ? 'bg-accent text-accent-foreground'
              : isHyper
                ? ' bg-hyper-lev text-accent-foreground'
                : isLong
                  ? 'bg-up text-accent-foreground'
                  : 'bg-down text-accent-foreground',
          arrowClassName:
            isLong === undefined
              ? 'bg-accent fill-accent'
              : isHyper
                ? 'bg-hyper-lev fill-hyper-lev'
                : isLong
                  ? 'bg-up fill-up'
                  : 'bg-down fill-down',
          ...tooltipContentProps,
        }}
        {...otherSliderProps}
      />
    </div>
  );
};

const Leverage: FC<LeverageProps> = ({
  value,
  maxLever = 100,
  minLever,
  onChange,
  className,
  sliderProps,
  isLong,
  isHyper,
  inDialog = true,
  inputClassName,
}) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const [innerValue, setInnerValue] = useState(value);

  if (!inDialog) {
    return (
      <Content
        className="mt-0 flex-row-reverse items-start"
        inputClassName={inputClassName}
        value={value}
        onValueChange={onChange}
        isLong={isLong}
        isHyper={isHyper}
        maxLever={maxLever}
        minLever={minLever}
        sliderProps={sliderProps}
        locale={locale}
      />
    );
  }

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
          <Content
            value={innerValue}
            onValueChange={setInnerValue}
            isLong={isLong}
            isHyper={isHyper}
            maxLever={maxLever}
            minLever={minLever}
            sliderProps={sliderProps}
            inputClassName={inputClassName}
            locale={locale}
          />
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
