import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import {
  HyperLevIcon,
  InfoCircleIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from '@repo/ui';
import { Leverage as BasicLeverage } from '@/common';
import { useInstStore } from '@/common/stores';
import { ORDER_TYPE } from '@/constants/enum';
import { NORMAL_LEVERAGE_MIN } from '@/constants/trade';
import { useHasZFP } from '@/hooks/trade/useHasZFP';
import {
  useMarketMaxLeverage,
  useHyperLeverageRange,
} from '@/hooks/useMarketsStats';
import { useTradeGlobalStore } from '@/stores/trade/global';
import {
  usePreferenceStore,
  type LeverageMode,
} from '@/stores/trade/preference';
import { useTradeStore } from '../../../store';
import ContainerBg from './ContainerBg';
import HyperRiskDialog from './HyperRiskDialog';

interface LeverageProps {
  onChange: (value: string) => void;
  className?: string;
  isLong: boolean;
}

function getLeverageAnchors(min: number, max: number): number[] {
  const range = max - min;

  const unit = range <= 10 ? 1 : range <= 100 ? 5 : range <= 200 ? 10 : 50;

  const step = Math.max(unit, Math.round(range / 4 / unit) * unit);
  const roundToUnit = (value: number) => Math.round(value / unit) * unit;

  const anchors = new Set<number>([min]);
  for (let i = 1; i <= 3; i++) {
    const value = roundToUnit(min + step * i);
    if (value > min && value < max) anchors.add(value);
  }
  anchors.add(max);

  return [...anchors];
}

const Leverage: FC<LeverageProps> = ({ className, isLong, onChange }) => {
  const { t } = useLingui();
  const [lever, setLever, smDialogOpen, orderType] = useTradeStore(
    useShallow((state) => [
      state.lever,
      state.setLever,
      state.smDialogOpen,
      state.orderType,
    ]),
  );
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const [hyperRiskDialogOpen, setHyperRiskDialogOpen] = useState(false);

  // Leverage mode state
  const [
    leverageMode,
    setLeverageMode,
    hideHyperRiskDialog,
    hideHyperRiskDialogPersist,
    setPerferenceState,
  ] = usePreferenceStore(
    useShallow((state) => [
      state.leverageMode,
      state.setLeverageMode,
      state.hideHyperRiskDialog,
      state.hideHyperRiskDialogPersist,
      state.setState,
    ]),
  );

  const handleChange = useCallback(
    (lever: string) => {
      setLever(lever);
      onChange(lever);
    },
    [onChange, setLever],
  );
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const leverRef = useRef(lever);
  leverRef.current = lever;

  const maxNormalLeverage = useMarketMaxLeverage(inst);
  const supportsHyper = useHasZFP(inst);
  const hyperLeverageRange = useHyperLeverageRange(inst);

  // Effective mode: only use hyper if the market supports it
  const effectiveMode =
    leverageMode === 'hyper' && supportsHyper ? 'hyper' : 'normal';

  // Calculate leverage bounds based on mode
  const leverageBounds = useMemo(() => {
    if (effectiveMode === 'hyper') {
      return {
        min: hyperLeverageRange.min,
        max: hyperLeverageRange.max,
      };
    }
    return {
      min: NORMAL_LEVERAGE_MIN,
      max: maxNormalLeverage,
    };
  }, [effectiveMode, maxNormalLeverage, hyperLeverageRange]);

  // Reset leverage to the active mode's minimum when mode or minimum bound changes.
  useEffect(() => {
    const newLever = `${leverageBounds.min}`;
    setLever(newLever);
    onChangeRef.current(newLever);
  }, [effectiveMode, leverageBounds.min, setLever]);

  // Keep the stored leverage valid when switching to a market with tighter bounds.
  const resetKeyRef = useRef({
    effectiveMode,
    min: leverageBounds.min,
    max: leverageBounds.max,
  });
  useEffect(() => {
    const resetKeyChanged =
      resetKeyRef.current.effectiveMode !== effectiveMode ||
      resetKeyRef.current.min !== leverageBounds.min ||
      resetKeyRef.current.max !== leverageBounds.max;

    const modeOrMinChanged =
      resetKeyRef.current.effectiveMode !== effectiveMode ||
      resetKeyRef.current.min !== leverageBounds.min;

    resetKeyRef.current = {
      effectiveMode,
      min: leverageBounds.min,
      max: leverageBounds.max,
    };

    if (!resetKeyChanged || modeOrMinChanged) return;

    const lever = leverRef.current;
    if (lever.trim() === '') return;

    const leverValue = Number(lever);
    if (!Number.isFinite(leverValue)) return;

    const clampedLever = Math.min(
      Math.max(leverValue, leverageBounds.min),
      leverageBounds.max,
    );
    if (clampedLever === leverValue) return;

    const newLever = `${clampedLever}`;
    setLever(newLever);
    onChangeRef.current(newLever);
  }, [effectiveMode, leverageBounds.min, leverageBounds.max, setLever]);

  // Calculate quick input positions based on mode
  const scalePositions = useMemo(() => {
    const { min, max } = leverageBounds;
    const anchors = getLeverageAnchors(min, max);

    return anchors.map((value, index) => ({
      value,
      label: `${value}x`,
      className:
        index === 0
          ? 'translate-x-0'
          : index === anchors.length - 1
            ? '-translate-x-full'
            : undefined,
    }));
  }, [leverageBounds]);

  const handleModeChange = useCallback(
    (mode: LeverageMode) => {
      if (mode === leverageMode) return;
      setLeverageMode(mode);
      if (
        mode === 'hyper' &&
        !hideHyperRiskDialogPersist &&
        !hideHyperRiskDialog
      ) {
        setHyperRiskDialogOpen(true);
      }
    },
    [
      leverageMode,
      setLeverageMode,
      hideHyperRiskDialog,
      hideHyperRiskDialogPersist,
    ],
  );

  const handleHyperRiskClose = useCallback(() => {
    setHyperRiskDialogOpen(false);
  }, []);

  const handleHyperRiskAcknowledge = useCallback(() => {
    setPerferenceState({ hideHyperRiskDialog: true });
    setHyperRiskDialogOpen(false);
  }, [setPerferenceState]);

  const handleDoNotShowAgain = useCallback(() => {
    setPerferenceState({
      hideHyperRiskDialogPersist: true,
      hideHyperRiskDialog: true,
    });
    setHyperRiskDialogOpen(false);
  }, [setPerferenceState]);

  const isHyper = effectiveMode === 'hyper';
  const isLimit = orderType === ORDER_TYPE.limit;

  return (
    <>
      <div className={cn('relative flex flex-col gap-2 rounded-xl border p-3')}>
        {/* Gradient background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-xl">
          {<ContainerBg isHyper={isHyper} isLong={isLong} />}
        </div>

        {/* Mode Selector header row */}
        {
          <div className="relative flex items-center justify-between">
            {/* Left: "Mode" label + info icon */}
            <div className="flex items-center gap-1">
              <span className="text-t-270 text-xs">{t`Mode`}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-t-270 hover:text-t-1100 inline-flex cursor-pointer">
                    <InfoCircleIcon size={14} />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  className="max-w-[320px]"
                  inDialog={smDialogOpen}
                  collisionBoundary={document.querySelector(
                    '.tradingContainer',
                  )}
                  collisionPadding={smDialogOpen ? 16 : 8}
                >
                  <div className="">
                    <p className="mb-3 font-medium">
                      {t`Hyper Lev: 0% Fee. Conditional profit sharing.`}
                      <br />
                      {t`Normal Lev: Standard fees. Conditional loss rebates.`}
                    </p>
                    <p className="">
                      {t`Note: Collateral withdrawal and limit orders are disabled in hyper mode.`}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Right: Normal / Hyper toggle pills */}
            <div className="flex items-center gap-1 rounded-full">
              <button
                type="button"
                className={cn(
                  'text-t-1100 hover:bg-t-1100/10 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                  !isHyper ? 'bg-t-1100/10' : '',
                )}
                onClick={() => handleModeChange('normal')}
              >
                {t`Normal`}
              </button>
              {supportsHyper && !isLimit && (
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                    isHyper
                      ? 'bg-t-1100/10 text-hyper-lev'
                      : 'text-t-1100 hover:bg-t-1100/10',
                  )}
                  onClick={() => handleModeChange('hyper')}
                >
                  <HyperLevIcon size={14} />
                  {t`Hyper`}
                </button>
              )}
            </div>
          </div>
        }

        {/* Leverage slider */}
        <BasicLeverage
          isHyper={isHyper}
          inDialog={false}
          className={className}
          value={lever}
          onChange={handleChange}
          isLong={isLong}
          inputClassName="bg-t-1100/10"
          maxLever={leverageBounds.max}
          minLever={leverageBounds.min}
          sliderProps={{
            min: leverageBounds.min,
            max: leverageBounds.max,
            step: 0.1,
            scalePositions,
            tooltipContentProps: {
              collisionBoundary:
                typeof window !== 'undefined'
                  ? document.querySelector('.tradingContainer')
                  : undefined,
            },
          }}
        />
      </div>
      <HyperRiskDialog
        open={hyperRiskDialogOpen}
        onAcknowledge={handleHyperRiskAcknowledge}
        onDoNotShowAgain={handleDoNotShowAgain}
        onClose={handleHyperRiskClose}
      />
    </>
  );
};

export default Leverage;
