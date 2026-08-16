'use client';

import { FC, ReactNode, useId, useMemo, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { calc, truncate } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import {
  Alert,
  AlertDescription,
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  NumberInput,
  PencilLineIcon,
  SegmentedNavIcon,
} from '@repo/ui';

import {
  clampSlippageValue,
  DEFAULT_SLIPPAGE_OPTIONS,
  getSlippageState,
} from './slippageState';

interface SlippageProps {
  value: string;
  options?: readonly [string, string, string];
  type?: 'button' | 'text';
  onValueChange?: (value: string) => void;
  className?: string;
  warningSlippage?: string;
  triggerLabel?: ReactNode;
  riskWarning?: {
    lowThreshold: string;
    highThreshold: string;
    lowMessage: ReactNode;
    highMessage: ReactNode;
  };
}

const Slippage: FC<SlippageProps> = ({
  value,
  type = 'button',
  onValueChange,
  options = DEFAULT_SLIPPAGE_OPTIONS,
  className,
  warningSlippage = '0.01',
  triggerLabel,
  riskWarning,
}) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();

  const [tabSlippage, setTabSlippage] = useState<string>(value);

  const [inputSlippage, setInputSlippage] = useState<string | number>(
    +value * 100,
  );
  const inputId = useId();

  const tabValue = useMemo(() => {
    if (options.includes(tabSlippage)) {
      return tabSlippage;
    }
    return 'custom';
  }, [tabSlippage, options]);

  const { showError, showWarning, warningTab, slippageState } = useMemo(() => {
    const finalValue =
      tabValue === 'custom'
        ? inputSlippage
          ? truncate(calc(inputSlippage).div(100), 4)
          : inputSlippage
        : tabSlippage;

    if (!riskWarning) {
      const _showError =
        finalValue !== '' && (+finalValue < 0.0001 || +finalValue > 0.05);
      const _showWarning =
        !_showError && finalValue !== '' && +finalValue < +warningSlippage;

      return {
        showError: _showError,
        showWarning: _showWarning,
        warningTab: _showWarning
          ? inputSlippage
            ? 'custom'
            : tabSlippage
          : '',
        slippageState: 'normal',
      };
    }

    const state = getSlippageState(
      finalValue,
      riskWarning.lowThreshold,
      riskWarning.highThreshold,
    );

    return {
      showError: state === 'invalid',
      showWarning: state === 'low' || state === 'high',
      warningTab:
        state === 'low' || state === 'high'
          ? inputSlippage
            ? 'custom'
            : tabSlippage
          : '',
      slippageState: state,
    };
  }, [inputSlippage, riskWarning, warningSlippage, tabValue, tabSlippage]);

  const tooltipSlippageText = useMemo(() => {
    return percentFormat(warningSlippage, 2, { stripTrailingZeros: true });
  }, [warningSlippage]);
  const triggerState = getSlippageState(
    value,
    riskWarning?.lowThreshold ?? warningSlippage,
    riskWarning?.highThreshold,
  );
  const showTriggerWarning = riskWarning
    ? triggerState === 'low' || triggerState === 'high'
    : showWarning;
  const selectCustom = () => {
    if (tabValue !== 'custom') {
      setInputSlippage('');
    }
    setTabSlippage('custom');
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if ((riskWarning && open) || (!riskWarning && !open)) {
          setTabSlippage(value);
          setInputSlippage(truncate(calc(value).times(100), 2));
        }
      }}
    >
      <DialogTrigger asChild>
        {type === 'text' ? (
          <button
            type="button"
            className={cn(
              'font-plex group flex cursor-pointer items-center gap-1',
              className,
            )}
          >
            <span
              className={
                triggerLabel ? '' : showTriggerWarning ? 'text-warning' : ''
              }
            >
              {triggerLabel ?? percentFormat(value)}
            </span>
            <PencilLineIcon
              className="text-t-270 group-hover:text-t-1100"
              size={14}
            />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              'bg-bg-3 text-t-270 hover:text-t-1100 flex cursor-pointer items-center justify-between gap-1 rounded-xl px-3 py-1',
              className,
            )}
          >
            <SegmentedNavIcon size={16} />
            <span className="flex items-center gap-1 text-xs leading-normal">
              <span>{t`Slippage`}:</span>
              <span
                className={cn(
                  'font-plex',
                  showTriggerWarning ? 'text-warning' : '',
                )}
              >
                {percentFormat(value)}
              </span>
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent
        data-swap-launcher-child-layer
        position="center"
        closeClassName="top-3 right-3 flex size-6 items-center justify-center"
        className="bg-bg-3 !w-[360px] gap-4 rounded-2xl p-3"
        aria-describedby={undefined}
      >
        <DialogHeader className="h-6 justify-center">
          <DialogTitle>
            {t({ message: 'Max Slippage', context: 'Swap' })}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    'bg-bg-4 h-8 rounded-xl border px-3 text-xs font-medium focus-visible:outline-none',
                    tabValue === option
                      ? !riskWarning && warningTab === option
                        ? 'border-warning text-warning'
                        : 'border-accent text-accent'
                      : 'border-transparent text-white',
                  )}
                  onClick={() => {
                    setTabSlippage(option);
                    setInputSlippage('');
                  }}
                >
                  {riskWarning
                    ? percentFormat(option, 1, { stripTrailingZeros: false })
                    : percentFormat(option, 2, { stripTrailingZeros: true })}
                </button>
              ))}
            </div>
            <div
              className={cn(
                'bg-bg-4 flex h-8 items-center rounded-xl border px-3 text-xs font-medium',
                tabValue === 'custom'
                  ? showError
                    ? 'border-destructive'
                    : !riskWarning && warningTab === 'custom'
                      ? 'border-warning'
                      : 'border-accent'
                  : 'border-transparent',
              )}
              onClick={selectCustom}
            >
              <Label htmlFor={inputId} className="shrink-0 cursor-pointer">
                {riskWarning
                  ? t({ message: 'Custom', context: 'Swap' })
                  : t`Custom`}
              </Label>
              <NumberInput
                id={inputId}
                className={cn(
                  'min-w-0 flex-1 border-0 bg-transparent p-0',
                  tabValue === 'custom' &&
                    showError &&
                    'focus-within:border-transparent',
                )}
                inputWrapClassName="h-full"
                inputClassName="font-plex ml-3 h-full text-left text-xs font-medium text-white"
                placeholder="0.00"
                value={tabValue === 'custom' ? inputSlippage : ''}
                variant="ghost"
                decimal={2}
                locale={locale}
                min={0}
                max={5}
                maxLength={4}
                onFocus={selectCustom}
                onValueChange={(value) => {
                  setTabSlippage('custom');
                  setInputSlippage(value);
                }}
              />
              <span className="shrink-0">%</span>
            </div>
          </div>
          <div
            className={cn(
              'transition-[margin] duration-300 ease-in-out motion-reduce:duration-[1ms]',
              showError || showWarning ? 'mt-4' : 'mt-0',
            )}
            aria-live="polite"
          >
            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:duration-[1ms]',
                showError
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0',
              )}
              aria-hidden={!showError}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="text-destructive text-center text-sm">
                  {t`Slippage value must be within 0.01% to 5%`}
                </p>
              </div>
            </div>
            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:duration-[1ms]',
                showWarning
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0',
              )}
              aria-hidden={!showWarning}
            >
              <div className="min-h-0 overflow-hidden">
                {riskWarning ? (
                  <Alert
                    showClose={false}
                    className="items-start gap-x-1 p-2 text-xs has-[>svg]:grid-cols-[14px_1fr_0] [&>svg]:size-[14px]"
                  >
                    <AlertDescription className="gap-0 text-xs">
                      {slippageState === 'high'
                        ? riskWarning.highMessage
                        : riskWarning.lowMessage}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-warning text-center text-sm">
                    {t`Slippage below ${tooltipSlippageText} in versatile markets may cause failed execution and gas loss.`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="accent"
              className="disabled:bg-bg-4 disabled:hover:bg-bg-4 w-full"
              type="button"
              disabled={showError || (tabValue === 'custom' && !inputSlippage)}
              onClick={() =>
                onValueChange &&
                onValueChange(
                  tabValue === 'custom'
                    ? riskWarning
                      ? `${clampSlippageValue(
                          truncate(calc(inputSlippage).div(100), 4),
                        )}`
                      : truncate(calc(inputSlippage).div(100), 4)
                    : tabSlippage,
                )
              }
            >
              {t({ message: 'Done', context: 'Swap' })}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Slippage;
