import { FC, useCallback, useRef, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { calc, truncate } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import { cn, NumberInput } from '@repo/ui';
import { useGlobalStore } from '@/common';

const QuickActions: FC<{
  className?: string;
  onValueClick: (value: number) => void;
}> = ({ className, onValueClick }) => {
  return (
    <div className={cn('flex gap-1', className)}>
      {[0.1, 0.25, 0.5, 0.75].map((value) => (
        <span
          key={value}
          className="bg-primary font-plex hover:text-primary-foreground cursor-pointer rounded-sm px-2 py-1 text-xs"
          onClick={() => onValueClick(value)}
        >
          {percentFormat(value, 0)}
        </span>
      ))}
    </div>
  );
};

const CloseSizeInput: FC<{
  className?: string;
  value: string;
  onChange: (value: string) => void;
  maxCloseSize: string;
}> = ({ className, value, onChange, maxCloseSize }) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [showQuickActions, setShowQuickActions] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePercentClick = useCallback(
    (val: string) => {
      onChange(calc(maxCloseSize).lt(val) ? maxCloseSize : val);
    },
    [maxCloseSize, onChange],
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <NumberInput
        className="bg-bg-4 p-3"
        variant="ghost"
        label={
          <div className="text-secondary-foreground flex w-full items-center text-sm">
            <span>{t`Close Size`}</span>
            <span className="ml-auto">
              {t`Max`}:{' '}
              <span className="text-t-1100">
                {truncateFormat(maxCloseSize, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  showMinDecimalValue: true,
                })}
              </span>
            </span>
            <span
              className="bg-bg-5 font-plex hover:text-primary-foreground ml-1.5 cursor-pointer rounded-sm px-2 py-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                if (+maxCloseSize) {
                  handlePercentClick(maxCloseSize);
                }
              }}
            >
              {t`Max`}
            </span>
          </div>
        }
        inputWrapClassName="h-[52px]"
        inputClassName="font-plex text-2xl h-[28px]"
        labelClassName="text-muted-foreground text-sm font-normal"
        suffix={
          <div className="flex items-center gap-2 text-2xl font-medium">
            {'USD'}
          </div>
        }
        max={10 ** 10}
        value={value}
        innerExtraClassName={showQuickActions ? 'mt-1' : 'mt-0'}
        innerExtra={
          <QuickActions
            className={cn(
              'overflow-hidden transition-[height] duration-300',
              showQuickActions ? 'visible h-5' : 'invisible h-0',
            )}
            onValueClick={(v) => {
              const result = truncate(
                calc(maxCloseSize).times(v),
                usdAmountDisplayDecimal,
              );
              if (+result) {
                handlePercentClick(result);
              }
            }}
          />
        }
        onValueChange={onChange}
        onFocus={() => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          setShowQuickActions(true);
        }}
        onBlur={() => {
          timerRef.current = setTimeout(() => {
            setShowQuickActions(false);
          }, 200);
        }}
        decimal={usdAmountDisplayDecimal}
        locale={locale}
        placeholder={'0.00'}
      />
    </div>
  );
};

export default CloseSizeInput;
