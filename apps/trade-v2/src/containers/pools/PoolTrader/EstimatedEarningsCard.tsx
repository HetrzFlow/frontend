'use client';

import { useEffect, useMemo, useReducer } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Separator } from '@repo/ui';

const DISPLAY_DELAY_MS = 300;
const FADE_DURATION_MS = 300;

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type EstimatedEarningsCardProps = {
  inputValue: string;
  apy?: string | number | null;
  variant?: 'card' | 'inline';
};

type Earnings = {
  annual: number;
  monthly: number;
  daily: number;
};

type EarningsDisplayState = {
  debouncedAmount: number | null;
  displayedEarnings: Earnings | null;
  isVisible: boolean;
};

type EarningsDisplayAction =
  | { type: 'debouncedAmount'; amount: number | null }
  | { type: 'show'; earnings: Earnings }
  | { type: 'visible'; visible: boolean }
  | { type: 'clearDisplayed' };

const initialEarningsDisplayState: EarningsDisplayState = {
  debouncedAmount: null,
  displayedEarnings: null,
  isVisible: false,
};

function earningsDisplayReducer(
  state: EarningsDisplayState,
  action: EarningsDisplayAction,
): EarningsDisplayState {
  switch (action.type) {
    case 'debouncedAmount':
      return { ...state, debouncedAmount: action.amount };
    case 'show':
      return { ...state, displayedEarnings: action.earnings };
    case 'visible':
      return { ...state, isVisible: action.visible };
    case 'clearDisplayed':
      return { ...state, displayedEarnings: null };
    default:
      return state;
  }
}

function formatUsd(value: number) {
  return usdFormatter.format(value);
}

function normalizeApy(netApy?: string | number | null) {
  const apy = Number(netApy);
  if (!Number.isFinite(apy) || apy <= 0) return null;
  return apy;
}

export default function EstimatedEarningsCard({
  inputValue,
  apy,
  variant = 'card',
}: EstimatedEarningsCardProps) {
  const { t } = useLingui();
  const [displayState, dispatchDisplayState] = useReducer(
    earningsDisplayReducer,
    initialEarningsDisplayState,
  );
  const { debouncedAmount, displayedEarnings, isVisible } = displayState;

  const parsedInputAmount = useMemo(() => {
    const amount = Number(inputValue.trim());
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return amount;
  }, [inputValue]);

  useEffect(() => {
    if (parsedInputAmount === null) {
      dispatchDisplayState({ type: 'debouncedAmount', amount: null });
      return;
    }

    const timer = setTimeout(() => {
      dispatchDisplayState({
        type: 'debouncedAmount',
        amount: parsedInputAmount,
      });
    }, DISPLAY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [parsedInputAmount]);

  const earnings = useMemo<Earnings | null>(() => {
    const apyRatio = normalizeApy(apy);
    if (debouncedAmount === null || apyRatio === null) return null;

    const annual = debouncedAmount * apyRatio;
    const monthly = annual / 12;
    const daily = annual / 365;

    return { annual, monthly, daily };
  }, [apy, debouncedAmount]);

  const isInline = variant === 'inline';
  const contentClassName = isInline
    ? 'flex flex-col gap-2 py-2 transition-[opacity,transform] duration-300'
    : 'bg-card flex flex-col gap-1 rounded-2xl p-3 transition-[opacity,transform] duration-300';
  const detailClassName = 'text-t-270 text-xs';

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let raf: number | undefined;

    if (earnings) {
      dispatchDisplayState({ type: 'show', earnings });
      raf = window.requestAnimationFrame(() => {
        dispatchDisplayState({ type: 'visible', visible: true });
      });
    } else if (displayedEarnings) {
      dispatchDisplayState({ type: 'visible', visible: false });
      timer = setTimeout(() => {
        dispatchDisplayState({ type: 'clearDisplayed' });
      }, FADE_DURATION_MS);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [displayedEarnings, earnings]);

  return (
    <div
      className={`overflow-hidden transition-[max-height] duration-300 ease-out ${displayedEarnings && isVisible ? 'max-h-24' : 'max-h-0'}`}
    >
      {isInline && <Separator className="max-md:bg-border" />}
      <div
        className={`${contentClassName} ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}
      >
        <div className={detailClassName}>
          {t`Estimated Annual Earnings (at current APY)`}
        </div>
        <div className="font-plex text-up text-[20px]/tight font-medium">
          +{formatUsd(displayedEarnings?.annual ?? 0)}
        </div>
        <div className={detailClassName}>
          ≈ {formatUsd(displayedEarnings?.monthly ?? 0)}/month ·{' '}
          {formatUsd(displayedEarnings?.daily ?? 0)}/day
        </div>
      </div>
    </div>
  );
}
