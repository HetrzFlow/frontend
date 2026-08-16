'use client';

import { useId, useMemo, useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { calc, truncate } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import {
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
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@repo/ui';

interface SlippageProps {
  value: string;
  options?: [string, string, string];
  type?: 'button' | 'text';
  onValueChange?: (value: string) => void;
  className?: string;
  warningSlippage?: string;
}

const Slippage: React.FC<SlippageProps> = ({
  value,
  type = 'button',
  onValueChange,
  options = ['0.01', '0.02', '0.03'],
  className,
  warningSlippage = '0.01',
}) => {
  const { t } = useLingui();

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

  const [showError, showWarning, warningTab] = useMemo(() => {
    const finalValue =
      tabValue === 'custom'
        ? inputSlippage
          ? truncate(calc(inputSlippage).div(100), 4)
          : inputSlippage
        : tabSlippage;
    const _showError =
      finalValue !== '' && (+finalValue < 0.0001 || +finalValue > 0.05);
    const _showWarning =
      !_showError && finalValue !== '' && +finalValue < +warningSlippage;

    return [
      _showError,
      _showWarning,
      _showWarning ? (inputSlippage ? 'custom' : tabSlippage) : '',
    ];
  }, [inputSlippage, warningSlippage, tabValue, tabSlippage]);

  const tooltipSlippageText = useMemo(() => {
    return percentFormat(warningSlippage, 2, { stripTrailingZeros: true });
  }, [warningSlippage]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setTabSlippage(value);
          setInputSlippage(truncate(calc(value).times(100), 2));
        }
      }}
    >
      <DialogTrigger>
        {type === 'text' ? (
          <div
            className={cn(
              'font-plex group flex cursor-pointer items-center gap-1',
              className,
            )}
          >
            <span className={showWarning ? 'text-warning' : ''}>
              {percentFormat(value)}
            </span>
            <PencilLineIcon
              className="text-t-270 group-hover:text-t-1100"
              size={14}
            />
          </div>
        ) : (
          <div
            className={cn(
              'bg-bg-3 text-t-270 hover:text-t-1100 flex cursor-pointer items-center justify-between gap-1 rounded-full px-3 py-1',
              className,
            )}
          >
            <SegmentedNavIcon size={16} />
            <span className="flex items-center gap-1 text-xs leading-normal">
              <span>{t`Slippage`}:</span>
              <span
                className={cn('font-plex', showWarning ? 'text-warning' : '')}
              >
                {percentFormat(value)}
              </span>
            </span>
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="w-[440px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t`Slippage setting`}</DialogTitle>
        </DialogHeader>
        <Tabs
          value={tabValue}
          onValueChange={(v) => {
            setTabSlippage(v);
            setInputSlippage('');
          }}
        >
          <TabsList className="flex w-full">
            <TabsTrigger
              className={cn(
                'data-[state=active]:border-accent font-plex text-foreground border-ring h-[54px] rounded-l-lg rounded-r-none border border-r-0 p-4 text-base font-normal focus-visible:border focus-visible:border-r-0 data-[state=active]:bg-transparent',
                warningTab === options[0]
                  ? 'data-[state=active]:border-warning'
                  : '',
              )}
              value={options[0]}
            >
              {percentFormat(options[0], 2, { stripTrailingZeros: true })}
            </TabsTrigger>
            <Separator
              className={
                options[0] === tabValue || options[1] === tabValue
                  ? warningTab === tabValue
                    ? 'bg-warning'
                    : 'bg-accent'
                  : 'bg-ring'
              }
              orientation="vertical"
            />
            <TabsTrigger
              className={cn(
                'data-[state=active]:border-accent font-plex text-foreground border-ring h-[54px] rounded-none border border-x-0 p-4 text-base font-normal focus-visible:border focus-visible:border-x-0 data-[state=active]:bg-transparent',
                warningTab === options[1]
                  ? 'data-[state=active]:border-warning'
                  : '',
              )}
              value={options[1]}
            >
              {percentFormat(options[1], 2, { stripTrailingZeros: true })}
            </TabsTrigger>
            <Separator
              className={
                options[1] === tabValue || options[2] === tabValue
                  ? warningTab === tabValue
                    ? 'bg-warning'
                    : 'bg-accent'
                  : 'bg-ring'
              }
              orientation="vertical"
            />
            <TabsTrigger
              className={cn(
                'data-[state=active]:border-accent font-plex text-foreground border-ring h-[54px] rounded-none border border-x-0 p-4 text-base font-normal focus-visible:border focus-visible:border-x-0 data-[state=active]:bg-transparent',
                warningTab === options[2]
                  ? 'data-[state=active]:border-warning'
                  : '',
              )}
              value={options[2]}
            >
              {percentFormat(options[2], 2, { stripTrailingZeros: true })}
            </TabsTrigger>
            <Separator
              className={
                options[2] === tabValue || 'custom' === tabValue
                  ? showError
                    ? 'bg-destructive'
                    : warningTab === tabValue
                      ? 'bg-warning'
                      : 'bg-accent'
                  : 'bg-ring'
              }
              orientation="vertical"
            />
            <TabsTrigger
              className={cn(
                'data-[state=active]:border-accent text-foreground border-ring h-[54px] rounded-none rounded-r-lg border border-l-0 p-4 text-base font-normal focus-visible:border focus-visible:border-l-0 data-[state=active]:bg-transparent',
                showError
                  ? 'data-[state=active]:border-destructive'
                  : warningTab === 'custom'
                    ? 'data-[state=active]:border-warning'
                    : '',
              )}
              value="custom"
            >
              <Label
                htmlFor={inputId}
                className="cursor-pointer text-sm"
              >{t`Custom`}</Label>
              <NumberInput
                id={inputId}
                className="ml-2 w-[60px] rounded-sm border-0 bg-transparent px-1 shadow-none focus-within:ring-0 focus-visible:border-0"
                inputClassName="h-[18px] text-right font-normal text-base font-plex"
                suffixClassName="pl-1"
                placeholder="0.00"
                value={tabValue === 'custom' ? inputSlippage : ''}
                suffix="%"
                decimal={2}
                min={0}
                max={5}
                maxLength={4}
                onValueChange={(value) => {
                  setInputSlippage(value);
                }}
              />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {showError && (
          <span className="text-destructive text-center text-sm">
            {t`Slippage value must be within 0.01% to 5%`}
          </span>
        )}
        {showWarning && (
          <span className="text-warning text-center text-sm">
            {t`Slippage below ${tooltipSlippageText} in versatile markets may cause failed execution and gas loss.`}
          </span>
        )}
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-bg-3 w-full"
              type="button"
              disabled={showError || (tabValue === 'custom' && !inputSlippage)}
              onClick={() =>
                onValueChange &&
                onValueChange(
                  tabValue === 'custom'
                    ? truncate(calc(inputSlippage).div(100), 4)
                    : tabSlippage,
                )
              }
            >
              {t`Save Setting`}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Slippage;
