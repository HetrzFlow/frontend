import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const SliderScale = ({
  scalePositions,
  onValueChange,
}: {
  scalePositions: {
    value: number;
    label: string;
    offset: number;
    className?: string;
  }[]; // Percentage positions (1-100)
  onValueChange?: (value: number[], action?: 'drag' | 'click') => void;
}) => {
  return (
    <div className="relative mt-4 justify-between">
      {scalePositions.map(({ value, label, offset, className }, i) => (
        <button
          key={i}
          type="button"
          className={cn(
            'text-t-270 hover:text-primary-foreground absolute bottom-0 -translate-x-1/2 cursor-pointer text-xs transition-colors',
            className,
          )}
          style={{
            left: `${offset * 100}%`,
          }}
          onClick={() => onValueChange && onValueChange([value], 'click')}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showStick,
  scalePositions, // Changed from scaleStep to specific positions
  scaleEvenly,
  trackColorClassName,
  rangeColorClassName,
  thumbClassName,
  innerThumbClassName,
  thumbWrapClassName,
  thumbDotClassName,
  animationDisabled,
  animatoinClassName,
  tooltipContentProps,
  formatValue,
  trackClassName,
  rangeClassName,
  stickClassName,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof SliderPrimitive.Root>, 'onValueChange'> & {
  onValueChange?: (value: number[], action?: 'drag' | 'click') => void;
  formatValue?: (value?: number) => string;
  showStick?: boolean;
  trackColorClassName?: string;
  rangeColorClassName?: string;
  thumbClassName?: string;
  innerThumbClassName?: string;
  thumbWrapClassName?: string;
  thumbDotClassName?: string;
  animationDisabled?: boolean;
  animatoinClassName?: string;
  tooltipContentProps?: React.ComponentProps<typeof TooltipContent>;
  scalePositions?: { value: number; label: string; className?: string }[];
  scaleEvenly?: boolean;
  trackClassName?: string;
  rangeClassName?: string;
  stickClassName?: string;
}) {
  const shouldScaleEvenly = !!scaleEvenly && !!scalePositions?.length;
  const externalValues = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );
  const scaleValues = React.useMemo(
    () => scalePositions?.map((v) => v.value) ?? [],
    [scalePositions],
  );
  const sliderValue = React.useMemo(
    () =>
      Array.isArray(value)
        ? shouldScaleEvenly
          ? value.map((v) => valueToScaleIndex(v, scaleValues))
          : value
        : undefined,
    [scaleValues, shouldScaleEvenly, value],
  );
  const sliderDefaultValue = React.useMemo(
    () =>
      shouldScaleEvenly && Array.isArray(defaultValue)
        ? defaultValue.map((v) => valueToScaleIndex(v, scaleValues))
        : defaultValue,
    [defaultValue, scaleValues, shouldScaleEvenly],
  );
  const sliderStep = React.useMemo(() => {
    if (!shouldScaleEvenly) return props.step;
    return getScaleIndexStep(scaleValues, props.step);
  }, [props.step, scaleValues, shouldScaleEvenly]);
  const handleValueChange = React.useCallback(
    (nextValue: number[], action?: 'drag' | 'click') => {
      if (!onValueChange) return;

      if (!shouldScaleEvenly) {
        onValueChange(nextValue, action);
        return;
      }

      onValueChange(
        nextValue.map((v) =>
          roundToStep(scaleIndexToValue(v, scaleValues), props.step),
        ),
        action,
      );
    },
    [onValueChange, props.step, scaleValues, shouldScaleEvenly],
  );

  const [opens, setOpens] = React.useState<boolean[]>(
    new Array(externalValues.length).fill(false),
  );

  const _scalePositions = React.useMemo(() => {
    const length = max - min;
    return scalePositions?.map((v, index) => {
      return {
        ...v,
        offset:
          scaleEvenly && scalePositions.length > 1
            ? index / (scalePositions.length - 1)
            : (v.value - min) / length,
      };
    });
  }, [min, max, scaleEvenly, scalePositions]);

  const sliderRef = React.useRef<HTMLDivElement>(null);

  const tooltipRef = React.useRef(null);

  return (
    <div className={cn('flex h-9 w-full flex-col', className)}>
      <SliderPrimitive.Root
        {...props}
        ref={sliderRef}
        data-slot="slider"
        defaultValue={sliderDefaultValue}
        value={sliderValue}
        min={shouldScaleEvenly ? 0 : min}
        max={shouldScaleEvenly ? scaleValues.length - 1 : max}
        step={sliderStep}
        className={
          'relative flex w-full touch-none items-center pt-1 pb-2 select-none data-[disabled]:cursor-not-allowed data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col'
        }
        onValueChange={handleValueChange}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            'bg-primary relative grow overflow-hidden overflow-visible rounded-full data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1',
            props.disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            trackColorClassName,
            trackClassName,
          )}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={cn(
              'to-accent absolute rounded-s-full bg-gradient-to-r from-transparent data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
              rangeColorClassName,
              externalValues[0] &&
                (externalValues[0] < (max - min) / 4 + min
                  ? '-mr-[5px]'
                  : externalValues[0] > ((max - min) / 4) * 3 + min
                    ? 'mr-[5px]'
                    : ''),
              rangeClassName,
            )}
          />

          {_scalePositions?.map(({ offset, value }, index) => {
            const compareValues =
              externalValues.length === 1
                ? [-Infinity, externalValues[0]]
                : externalValues;

            const inRange =
              value >= compareValues[0]! &&
              value <= (compareValues[1] ?? Infinity);
            return (
              <div
                key={index}
                className={cn(
                  'absolute -top-1 flex h-2.5 -translate-x-1/2 cursor-pointer px-1',
                )}
                style={{
                  left: `${offset * 100}%`,
                }}
                onPointerDown={() => {
                  if (handleValueChange) {
                    requestAnimationFrame(() => {
                      handleValueChange(
                        [
                          shouldScaleEvenly
                            ? valueToScaleIndex(value, scaleValues)
                            : value,
                        ],
                        'click',
                      );
                    });
                  }
                }}
              >
                <span
                  className={cn(
                    'inline-block h-full w-1 rounded-full',
                    inRange ? rangeColorClassName || 'bg-accent' : 'bg-primary',
                    showStick ? '' : 'bg-transparent',
                    stickClassName,
                  )}
                />
              </div>
            );
          })}
        </SliderPrimitive.Track>
        {Array.from({ length: externalValues.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            aria-label={props['aria-label'] || 'slider'}
            key={index}
            ref={tooltipRef}
            className={cn(
              'group flex size-2.5 shrink-0 items-center justify-center focus-visible:outline-hidden data-[disabled]:cursor-not-allowed',
              thumbWrapClassName,
            )}
            onFocus={() => {
              setOpens((prev) => {
                const newOpens = [...prev];
                newOpens[index] = true;
                return newOpens;
              });
            }}
            onMouseEnter={() => {
              setOpens((prev) => {
                const newOpens = [...prev];
                newOpens[index] = true;
                return newOpens;
              });
            }}
            onMouseLeave={() => {
              setOpens((prev) => {
                const newOpens = [...prev];
                newOpens[index] = false;
                return newOpens;
              });
            }}
            onTouchStart={() => {
              setOpens((prev) => {
                const newOpens = [...prev];
                newOpens[index] = true;
                return newOpens;
              });
            }}
            onTouchEnd={() => {
              setOpens((prev) => {
                const newOpens = [...prev];
                newOpens[index] = false;
                return newOpens;
              });
            }}
          >
            <Tooltip open={opens[index]}>
              <TooltipTrigger asChild disabled={props.disabled}>
                <span
                  className={cn(
                    'ring-ring/50 border-bg-4 shrink-0 rounded-full border-0 disabled:pointer-events-none',
                    thumbClassName,
                  )}
                >
                  <span
                    className={cn(
                      'bg-accent group relative box-content block flex size-2.5 items-center justify-center rounded-full transition-[color,box-shadow]',
                      props.disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                      innerThumbClassName,
                      rangeColorClassName,
                    )}
                  >
                    {!animationDisabled && (
                      <>
                        <div
                          className={cn(
                            'group-focus-visible:animate-ripple group-hover:animate-ripple bg-accent/50 absolute top-1/2 left-1/2 h-full w-full -translate-1/2 rounded-full',
                            animatoinClassName,
                          )}
                        />
                        <div
                          className={cn(
                            'group-focus-visible:animate-ripple group-hover:animate-ripple bg-accent/50 absolute top-1/2 left-1/2 h-full w-full -translate-1/2 rounded-full group-hover:delay-800 group-focus-visible:delay-800',
                            animatoinClassName,
                          )}
                        />
                      </>
                    )}

                    <span
                      className={cn(
                        'bg-bg-4 z-1 size-1.5 rounded-full',
                        thumbDotClassName,
                      )}
                    ></span>
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent
                container={tooltipRef.current}
                sideOffset={1}
                collisionPadding={0}
                {...(tooltipContentProps || {})}
                onPointerDownOutside={(e) => e.preventDefault()}
              >
                {formatValue
                  ? formatValue(externalValues[index])
                  : externalValues[index]}
              </TooltipContent>
            </Tooltip>
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
      {_scalePositions?.length && (
        <SliderScale
          scalePositions={_scalePositions}
          onValueChange={(nextValue, action) =>
            handleValueChange(
              shouldScaleEvenly
                ? nextValue.map((v) => valueToScaleIndex(v, scaleValues))
                : nextValue,
              action,
            )
          }
        />
      )}
    </div>
  );
}

function valueToScaleIndex(value: number, scaleValues: number[]) {
  if (scaleValues.length <= 1) return 0;
  if (value <= scaleValues[0]!) return 0;

  const lastIndex = scaleValues.length - 1;
  if (value >= scaleValues[lastIndex]!) return lastIndex;

  for (let i = 0; i < lastIndex; i += 1) {
    const start = scaleValues[i]!;
    const end = scaleValues[i + 1]!;
    if (value < start || value > end) continue;

    const length = end - start;
    return length ? i + (value - start) / length : i;
  }

  return 0;
}

function scaleIndexToValue(index: number, scaleValues: number[]) {
  if (scaleValues.length <= 1) return scaleValues[0] ?? 0;

  const lastIndex = scaleValues.length - 1;
  const clampedIndex = Math.min(Math.max(index, 0), lastIndex);
  const startIndex = Math.floor(clampedIndex);
  const endIndex = Math.min(startIndex + 1, lastIndex);
  const start = scaleValues[startIndex]!;
  const end = scaleValues[endIndex]!;

  return start + (end - start) * (clampedIndex - startIndex);
}

function getScaleIndexStep(scaleValues: number[], step?: number) {
  if (!step || scaleValues.length <= 1) return step;

  const maxSegmentLength = scaleValues.reduce((maxLength, value, index) => {
    const nextValue = scaleValues[index + 1];
    if (nextValue === undefined) return maxLength;
    return Math.max(maxLength, Math.abs(nextValue - value));
  }, 0);

  return maxSegmentLength ? step / maxSegmentLength : step;
}

function roundToStep(value: number, step?: number) {
  if (!step) return value;

  const precision = getDecimalPrecision(step);
  return Number((Math.round(value / step) * step).toFixed(precision));
}

function getDecimalPrecision(value: number) {
  const [, decimal = ''] = value.toString().split('.');
  return decimal.length;
}

export { Slider };
