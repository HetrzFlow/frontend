import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import {
  Checkbox,
  cn,
  Collapsible,
  CollapsibleContent,
  InfoCircleIcon,
  Label,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { useInstStore } from '@/common';
import { HYPER_SL_LOSS_CEIL, MAX_LOSS_RATE } from '@/constants/trade';
import { useMaxProfitRate } from '@/hooks/useMarketsStats';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { useTradeStore } from '../../../store';
import { useIsZFP } from '../hooks/useIsZFP';
import { isTpSlValueSet } from '../tpSlUtils';
import InputGroup from './InputGroup';

type TpSlFormType = {
  open: boolean;
  tpPx: string;
  slPx: string;
};

interface TpSlProps {
  isLong: boolean;
  value: TpSlFormType;
  isPending?: boolean;
  onChange: (value: TpSlFormType) => void;
}

const TpSl: FC<TpSlProps> = ({ isLong, isPending, value, onChange }) => {
  const { t } = useLingui();
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const isZFP = useIsZFP();
  const maxProfitRate = useMaxProfitRate(inst);
  const [tpPnlPercent, setTpPnlPercent] = useState('');
  const [slPnlPercent, setSlPnlPercent] = useState('');

  // SL clamp bounds (as ratio): upper = MAX_LOSS_RATE, lower = HYPER_SL_LOSS_CEIL (hyper only)
  const slFloor = isZFP ? HYPER_SL_LOSS_CEIL : 0;
  const slCeil = MAX_LOSS_RATE;

  const pnlDisplay = useMemo(() => {
    const fmtOpt = { signDisplay: 'always' as const };
    const defaultSlRate = MAX_LOSS_RATE;
    const hasTpPx = isTpSlValueSet(value.tpPx);
    const hasSlPx = isTpSlValueSet(value.slPx);

    if (!value.open) {
      return {
        tp: percentFormat(maxProfitRate, 0, fmtOpt),
        sl: t`N/A`,
        tpColor: 'text-up',
        slColor: 'text-t-1100',
      };
    }

    // No input: show max TP% | max SL%
    if (!hasTpPx && !hasSlPx) {
      return {
        tp: percentFormat(maxProfitRate, 0, fmtOpt),
        sl: percentFormat(-defaultSlRate, 0, fmtOpt),
        tpColor: 'text-up',
        slColor: 'text-down',
      };
    }

    // Has input: use calculated pnlPercent from InputGroup
    const tpClamped = hasTpPx && isTpSlValueSet(tpPnlPercent)
      ? calc.max(0, calc.min(tpPnlPercent, maxProfitRate * 100)).div(100)
      : undefined;
    const slClamped = hasSlPx && isTpSlValueSet(slPnlPercent)
      ? calc.max(slFloor * 100, calc.min(slPnlPercent, slCeil * 100)).div(100)
      : undefined;

    return {
      tp:
        tpClamped != null
          ? percentFormat(tpClamped.toFixed(), 2, fmtOpt)
          : percentFormat(maxProfitRate, 0, fmtOpt),
      sl:
        slClamped != null
          ? percentFormat(slClamped.times(-1).toFixed(), 2, fmtOpt)
          : percentFormat(-defaultSlRate, 0, fmtOpt),
      tpColor: 'text-up',
      slColor: 'text-down',
    };
  }, [
    value.tpPx,
    value.slPx,
    tpPnlPercent,
    slPnlPercent,
    maxProfitRate,
    slFloor,
    slCeil,
    value.open,
    t,
  ]);

  const handleChangeRef = useRef(onChange);
  handleChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  // Clear TP/SL inputs when instrument changes
  useEffect(() => {
    handleChangeRef.current({
      ...valueRef.current,
      tpPx: '',
      slPx: '',
    });
  }, [instId]);

  const smDialogOpen = useTradeStore((state) => state.smDialogOpen);

  return (
    <Collapsible className="overflow-hidden pb-0" open={value.open}>
      <div className="flex min-w-0 items-center">
        <Label className="text-t-270 hover:text-t-1100 flex shrink-0 cursor-pointer items-center gap-2 text-xs hover:transition-[color]">
          <Checkbox
            className={cn(
              'm-0.5 size-4 rounded-full',
              isLong
                ? 'data-[state=checked]:border-up data-[state=checked]:bg-up'
                : 'data-[state=checked]:border-down data-[state=checked]:bg-down',
            )}
            checked={value.open}
            onCheckedChange={(checked) =>
              onChange({ ...value, open: checked as boolean })
            }
          />
          <span className="h-3.5">{t`TP/SL`}</span>
          <Tooltip>
            <TooltipTrigger>
              <InfoCircleIcon size={14} className="text-t-350" />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="w-66"
              inDialog={smDialogOpen}
              collisionBoundary={document.querySelector('.tradingContainer')}
              collisionPadding={smDialogOpen ? 16 : 8}
            >
              <p>
                {t`Full size trigger orders subject to caps for LP protection and guaranteed execution`}
                :
              </p>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span>{t`Max Gain%`}:</span>
                <span className="text-up">
                  {percentFormat(maxProfitRate, 0, {
                    signDisplay: 'always',
                  })}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>{t`Max Loss%`}:</span>
                <span className="text-down">
                  {percentFormat(-MAX_LOSS_RATE, 0, {
                    signDisplay: 'always',
                  })}
                </span>
              </div>
              {isZFP && (
                <>
                  <div className="mt-1 flex justify-between">
                    <span>{t`Min Loss% (Hyper Only)`}:</span>
                    <span className="text-down">
                      {percentFormat(-HYPER_SL_LOSS_CEIL, 0, {
                        signDisplay: 'always',
                      })}
                    </span>
                  </div>
                </>
              )}
              <Separator className="my-2" />
              <p className="">
                {t`Note: Full Size only. For advanced partial close settings, use the position list TP/SL edit.`}
              </p>
            </TooltipContent>
          </Tooltip>
        </Label>
        <span className="ml-auto flex min-w-0 items-center gap-1 text-xs">
          <span className={cn('truncate', pnlDisplay.tpColor)}>
            {pnlDisplay.tp}
          </span>
          <span className="text-t-430 shrink-0">|</span>
          <span className={cn('truncate', pnlDisplay.slColor)}>
            {pnlDisplay.sl}
          </span>
        </span>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col gap-2 pt-2 text-xs">
          <InputGroup
            value={value.tpPx}
            isPending={isPending}
            isTp
            isLong={isLong}
            onChange={(tpPx) => {
              valueRef.current = { ...valueRef.current, tpPx };
              onChange(valueRef.current);
            }}
            onPnlPercentChange={setTpPnlPercent}
          />
          <InputGroup
            value={value.slPx}
            isPending={isPending}
            isTp={false}
            isLong={isLong}
            onChange={(slPx) => {
              valueRef.current = { ...valueRef.current, slPx };
              onChange(valueRef.current);
            }}
            onPnlPercentChange={setSlPnlPercent}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TpSl;
