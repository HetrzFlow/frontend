'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import SlotCounter from 'react-slot-counter';

type SlotCounterValueProps = {
  value: string;
  className?: string;
  disabledFormat?: boolean;
};

function buildStartValue(prev: string, next: string) {
  if (!next) return next;
  if (!prev) return next.replace(/[0-9]/g, '0');
  const prevChars = prev.split('');
  const nextChars = next.split('');
  return nextChars
    .map((ch, i) => {
      if (/[0-9]/.test(ch)) {
        const prevCh = prevChars[i];
        return prevCh && /[0-9]/.test(prevCh) ? prevCh : '0';
      }
      return ch;
    })
    .join('');
}

function formatNumberPart(value: number, disabledFormat: boolean, fractionDigits: number) {
  if (disabledFormat) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : fractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDisplayValue(rawValue: string, disabledFormat: boolean) {
  if (!rawValue) return rawValue;

  const match = rawValue.match(/^([^0-9-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return rawValue;

  const prefix = match[1] ?? '';
  const numericPart = match[2];
  const suffix = match[3] ?? '';
  if (!numericPart) return rawValue;
  if (/[a-z]/i.test(suffix)) return rawValue;

  const sanitizedNumericPart = numericPart.replace(/,/g, '');
  const parsedValue = Number(sanitizedNumericPart);
  if (!Number.isFinite(parsedValue)) return rawValue;

  const fractionDigits = (sanitizedNumericPart.split('.')[1] ?? '').length;
  const formattedNumber = formatNumberPart(
    parsedValue,
    disabledFormat,
    fractionDigits,
  );

  return `${prefix}${formattedNumber}${suffix}`;
}

export function SlotCounterValue({
  value,
  className,
  disabledFormat = false,
}: SlotCounterValueProps) {
  const normalizedValue = useMemo(
    () => formatDisplayValue(value ?? '', disabledFormat),
    [disabledFormat, value],
  );
  const lastValueRef = useRef<string>(normalizedValue.replace(/[0-9]/g, '0'));
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [isRenderable, setIsRenderable] = useState(true);
  const startValue = useMemo(
    () => buildStartValue(lastValueRef.current, normalizedValue),
    [normalizedValue],
  );
  const isNumericValue = /^[0-9.,-]+$/.test(normalizedValue);

  useEffect(() => {
    lastValueRef.current = normalizedValue;
  }, [normalizedValue]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const computeRenderable = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      return true;
    };

    setIsRenderable(computeRenderable());

    const onVisibility = () => setIsRenderable(computeRenderable());
    document.addEventListener('visibilitychange', onVisibility);

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsRenderable(entry.isIntersecting && computeRenderable());
      });
      io.observe(el);
    }

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => setIsRenderable(computeRenderable()));
      ro.observe(el);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
      ro?.disconnect();
    };
  }, []);

  if (!normalizedValue) return <span className={className}>{normalizedValue}</span>;

  return (
    <span className={className} ref={containerRef}>
      {isRenderable ? (
        <SlotCounter
          value={normalizedValue}
          startValue={startValue}
          duration={0.5}
          speed={1.5}
          dummyCharacterCount={0}
          debounceDelay={0}
          sequentialAnimationMode={isNumericValue}
          startFromLastDigit={isNumericValue}
          useMonospaceWidth
          containerClassName="inline-flex items-center max-md:transform-gpu"
          charClassName="text-current"
          separatorClassName="text-current"
          valueClassName="text-current"
          numberClassName="text-current"
          animateUnchanged={false}
          isSeparatorCharacter={(v) =>
            typeof v === 'string' ? /[^0-9]/.test(v) : true
          }
        />
      ) : (
        normalizedValue
      )}
    </span>
  );
}
